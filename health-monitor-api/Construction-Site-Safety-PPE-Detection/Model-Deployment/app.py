from flask import Flask, render_template, Response, jsonify, request, send_file
from flask_socketio import SocketIO, emit
import cv2
import base64
import numpy as np
from ultralytics import YOLO
import sqlite3
from datetime import datetime, timedelta
import os
import threading
import time
from PIL import Image
from detection_logic import (
    InstanceDetector,
    ComplianceChecker,
    SnapshotManager,
    evaluate_ppe_from_detections,
)
from database import Database
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'N/A'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')


@app.after_request
def _ppe_stream_cors_headers(response):
    """MJPEG is shown via <img> from HealthHub on another origin/port (e.g. localhost:3002)."""
    if request.path == "/video_feed":
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        response.headers["Access-Control-Allow-Origin"] = "*"
    return response


ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}

model = None
camera = None
streaming = False
stream_lock = threading.Lock()
dev_mode = False
db = Database()
instance_detector = InstanceDetector()
compliance_checker = ComplianceChecker()
snapshot_manager = SnapshotManager()

SETTINGS_FILE = 'settings.json'
DEFAULT_SETTINGS = {
    'required_ppe': {
        'helmet': True,
        'vest': True,
        'mask': False
    },
    'non_compliance_delay': 3,
    'instance_reset_timeout': 5,
    'detection_mode': 'single'  # 'single' or 'multi'
}

def load_settings():
    """Load settings from file or return defaults"""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading settings: {e}")
    return DEFAULT_SETTINGS.copy()

def save_settings_to_file(settings):
    """Save settings to file"""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False

current_settings = load_settings()

def load_model():
    """Load YOLO model"""
    global model
    model_path = '../Model-Training/Outputs/runs/detect/yolov8s_ppe_css_80_epochs/weights/best.pt'
    if os.path.exists(model_path):
        model = YOLO(model_path)
    else:
        model = YOLO('yolov8n.pt')


def ensure_stream_running():
    """Open camera and set streaming (embeds hit GET /video_feed without POST /start_stream)."""
    global camera, streaming, model
    if model is None:
        load_model()
    with stream_lock:
        if camera is None or not camera.isOpened():
            camera = cv2.VideoCapture(0)
            camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    streaming = True


def _detections_from_results(results, yolo_model):
    """Build detection dict list from YOLO results (same shape as stream path)."""
    all_detections = []
    for result in results:
        boxes = result.boxes
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            class_name = yolo_model.names[cls]
            all_detections.append({
                'class': class_name,
                'confidence': conf,
                'bbox': [int(x1), int(y1), int(x2), int(y2)],
            })
    return all_detections


def generate_frames():
    """Generate video frames with instance detection"""
    global camera, streaming, model, current_settings
    
    last_alert_time = 0
    ALERT_COOLDOWN = current_settings['non_compliance_delay']
    last_snapshot_time = 0
    SNAPSHOT_INTERVAL = current_settings['instance_reset_timeout']
    
    while streaming:
        try:
            with stream_lock:
                if camera is None or not camera.isOpened():
                    break
                
                success, frame = camera.read()
            
            if not success or frame is None:
                time.sleep(0.1)
                continue
            
            results = model(frame)
            all_detections = _detections_from_results(results, model)
            
            instance_result = instance_detector.process_detection(all_detections, dev_mode, current_settings)
            is_compliant = compliance_checker.check_compliance(instance_result, dev_mode)
            
            annotated_frame = results[0].plot()
            
            current_time = time.time()
            
            if instance_result['should_capture'] and (current_time - last_snapshot_time) >= SNAPSHOT_INTERVAL:
                snapshot_filename = instance_detector.get_next_snapshot_filename()
                if snapshot_filename:
                    snapshot_path = snapshot_manager.save_snapshot(frame, snapshot_filename)
                    
                    if snapshot_path:
                        db.log_instance_snapshot(
                            instance_id=instance_result['instance_id'],
                            missing_ppe=instance_result['missing_ppe'],
                            detected_ppe=instance_result['detected_ppe'],
                            snapshot_path=snapshot_path
                        )
                        last_snapshot_time = current_time
            
            if not is_compliant and instance_result['has_person']:
                overlay = annotated_frame.copy()
                cv2.rectangle(overlay, (0, 0), (annotated_frame.shape[1], annotated_frame.shape[0]), 
                             (0, 0, 255), 20)
                annotated_frame = cv2.addWeighted(annotated_frame, 0.8, overlay, 0.2, 0)
                
                alert_text = "DEV MODE - TESTING" if dev_mode else "NON-COMPLIANT DETECTED"
                cv2.putText(annotated_frame, alert_text, 
                           (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                
                if current_time - last_alert_time > ALERT_COOLDOWN:
                    db.log_alert("NON_COMPLIANCE", "PPE non-compliance detected", None)
                    
                    socketio.emit('alert', {
                        'timestamp': datetime.now().isoformat(),
                        'type': 'NON_COMPLIANCE',
                        'description': 'PPE non-compliance detected',
                        'dev_mode': dev_mode
                    })
                    last_alert_time = current_time
            
            socketio.emit('detection_update', {
                'timestamp': datetime.now().isoformat(),
                'is_compliant': is_compliant,
                'detection_details': instance_result,
                'dev_mode': dev_mode
            })
            
            ret, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        except GeneratorExit:
            break
        except Exception as e:
            print(f"Error in generate_frames: {e}")
            break

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/review')
def review():
    """Review page for instances and snapshots"""
    return render_template('review.html')

@app.route('/settings')
def settings():
    """Settings page"""
    return render_template('settings.html')

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get current settings"""
    return jsonify(current_settings)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings"""
    global current_settings
    try:
        new_settings = request.json
        current_settings = new_settings
        
        instance_detector.update_settings(new_settings)
        
        if save_settings_to_file(new_settings):
            return jsonify({'status': 'success', 'message': 'Settings saved'})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to save settings to file'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/settings/reset', methods=['POST'])
def reset_settings():
    """Reset settings to defaults"""
    global current_settings
    try:
        current_settings = DEFAULT_SETTINGS.copy()
        instance_detector.update_settings(current_settings)
        
        if save_settings_to_file(current_settings):
            return jsonify({'status': 'success', 'message': 'Settings reset to defaults', 'settings': current_settings})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to save settings to file'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    try:
        ensure_stream_running()
        return Response(generate_frames(),
                        mimetype='multipart/x-mixed-replace; boundary=frame')
    except Exception as e:
        print(f"Error in video_feed: {e}")
        return '', 500

@app.route('/start_stream', methods=['POST'])
def start_stream():
    """Start video streaming"""
    try:
        ensure_stream_running()
        return jsonify({'status': 'success', 'message': 'Stream started'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/stop_stream', methods=['POST'])
def stop_stream():
    """Stop video streaming"""
    global camera, streaming
    
    try:
        streaming = False
        time.sleep(0.3)
        
        with stream_lock:
            if camera is not None:
                camera.release()
                camera = None
        
        return jsonify({'status': 'success', 'message': 'Stream stopped'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/analyze_image', methods=['POST'])
def analyze_image():
    """Run PPE detection on an uploaded image (no camera)."""
    global model
    try:
        if 'image' not in request.files:
            return jsonify({'ok': False, 'error': 'No image file (use field name "image").'}), 400

        file = request.files['image']
        if not file or not file.filename:
            return jsonify({'ok': False, 'error': 'Empty file.'}), 400

        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            return jsonify({
                'ok': False,
                'error': f'Unsupported type. Allowed: {", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))}',
            }), 400

        raw = file.read()
        if not raw:
            return jsonify({'ok': False, 'error': 'Empty upload.'}), 400

        arr = np.frombuffer(raw, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None or frame.size == 0:
            return jsonify({'ok': False, 'error': 'Could not decode image. Use a valid image file.'}), 400

        if model is None:
            load_model()

        results = model(frame)
        all_detections = _detections_from_results(results, model)

        rp = current_settings.get('required_ppe', DEFAULT_SETTINGS['required_ppe'])
        mode = current_settings.get('detection_mode', 'single')
        eval_result = evaluate_ppe_from_detections(all_detections, rp, mode)

        annotated_frame = results[0].plot()
        is_compliant = compliance_checker.check_compliance(
            {
                'has_person': eval_result['has_person'],
                'is_compliant': eval_result['is_compliant'],
            },
            dev_mode,
        )

        if not is_compliant and eval_result['has_person']:
            overlay = annotated_frame.copy()
            cv2.rectangle(
                overlay,
                (0, 0),
                (annotated_frame.shape[1], annotated_frame.shape[0]),
                (0, 0, 255),
                20,
            )
            annotated_frame = cv2.addWeighted(annotated_frame, 0.8, overlay, 0.2, 0)
            label = 'DEV MODE - TESTING' if dev_mode else 'NON-COMPLIANT'
            cv2.putText(
                annotated_frame,
                label,
                (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                3,
            )

        ok_enc, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 88])
        if not ok_enc:
            return jsonify({'ok': False, 'error': 'Failed to encode result image.'}), 500

        b64 = base64.b64encode(buffer.tobytes()).decode('ascii')

        serializable = []
        for d in all_detections:
            serializable.append({
                'class': d['class'],
                'confidence': round(d['confidence'], 4),
                'bbox': d['bbox'],
            })

        return jsonify({
            'ok': True,
            'image_base64': b64,
            'mime': 'image/jpeg',
            'is_compliant': eval_result['is_compliant'],
            'has_person': eval_result['has_person'],
            'missing_ppe': eval_result['missing_ppe'],
            'detected_ppe': eval_result['detected_ppe'],
            'detections': serializable,
        })
    except Exception as e:
        print(f"Error in analyze_image: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/toggle_dev_mode', methods=['POST'])
def toggle_dev_mode():
    """Toggle dev/testing mode"""
    global dev_mode
    dev_mode = not dev_mode
    return jsonify({'status': 'success', 'dev_mode': dev_mode, 
                   'message': f'Dev mode {"enabled" if dev_mode else "disabled"}'})

@app.route('/stats')
def get_stats():
    """Get detection statistics"""
    stats = db.get_statistics()
    stats['dev_mode'] = dev_mode
    return jsonify(stats)

@app.route('/api/instances')
def get_instances():
    """Get all detection instances"""
    try:
        sort_by = request.args.get('sort', 'first_detected')
        sort_order = request.args.get('order', 'desc')
        
        instances = db.get_all_instances(sort_by, sort_order)
        return jsonify(instances)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instance/<instance_id>/snapshots')
def get_instance_snapshots(instance_id):
    """Get all snapshots for a specific instance"""
    try:
        data = db.get_instance_snapshots(instance_id)
        if data:
            return jsonify(data)
        return jsonify({'error': 'Instance not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_snapshot/<path:filename>')
def download_snapshot(filename):
    """Download snapshot"""
    try:
        filepath = filename if os.path.isabs(filename) else os.path.join('snapshots', filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/snapshots/<path:filename>')
def serve_snapshot(filename):
    """Serve snapshot for viewing"""
    try:
        filepath = os.path.join('snapshots', filename)
        if os.path.exists(filepath):
            return send_file(filepath, mimetype='image/jpeg')
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete_instance/<instance_id>', methods=['DELETE'])
def delete_instance(instance_id):
    """Delete an instance and its snapshot"""
    try:
        success = db.delete_instance(instance_id)
        if success:
            return jsonify({'status': 'success', 'message': 'Instance deleted'})
        return jsonify({'error': 'Failed to delete instance'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        db.init_db()
        load_model()
        instance_detector.update_settings(current_settings)
        socketio.run(app, debug=True, host='127.0.0.1', port=5000)
    except Exception as e:
        print(f"Fatal error starting app: {e}")
