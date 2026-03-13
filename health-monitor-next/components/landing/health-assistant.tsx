"use client";

import { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Spline from '@splinetool/react-spline/next';
import { Application } from '@splinetool/runtime';
import { Mic, Database, FileText, MessageSquare, Wand2, Activity, Brain, HeartPulse, Apple } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useTheme } from "next-themes";

const mockChat = [
  {
    user: true,
    message: "How has my heart rate been trending this week?",
  },
  {
    user: false,
    message: "Based on your sensor data, your average heart rate has decreased by 5 BPM this week, indicating improved cardiovascular fitness. Your medical records also show this aligns with your fitness goals.",
  },
  {
    user: true,
    message: "What's my current stress level?",
  },
  {
    user: false,
    message: "Your HRV readings suggest moderate stress levels. I recommend a short breathing exercise based on your previous positive responses to mindfulness activities.",
  },
];

// Enhanced real-time data with multiple metrics
const realtimeData = Array(20).fill(0).map((_, i) => ({
  heartRate: 65 + Math.random() * 10 + (Math.sin(i / 2) * 5),
  spo2: 96 + Math.random() * 2,
  ecg: 50 + Math.random() * 30 + (Math.cos(i) * 10),
}));

const predictionCards = [
  {
    title: "Cardiovascular Health",
    risk: "Low Risk",
    confidence: "92%",
    icon: HeartPulse,
  },
  {
    title: "Stress Levels",
    risk: "Moderate",
    confidence: "88%",
    icon: Activity,
  },
  {
    title: "Nutrition Status",
    risk: "Good",
    confidence: "95%",
    icon: Apple,
  }
];

export const HealthAssistant = () => {
  const [shouldRenderSpline, setShouldRenderSpline] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRenderSpline(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSplineLoad = (spline: Application) => {
    spline.setZoom(1.2);
  };

  return (
    <section className="w-full py-20 lg:py-40 relative">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="flex gap-4 flex-col items-start mb-16">
          <Badge variant="outline" className="text-sm py-1">AI Assistant</Badge>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
              Meet Your Health Assistant
            </h2>
            <p className="text-lg max-w-xl lg:max-w-2xl leading-relaxed tracking-tight text-muted-foreground text-left">
              Your personal AI-powered health companion, available 24/7 to answer questions and provide insights about your health.
            </p>
          </div>
        </div>

        {/* Main Layout Container */}
        <div className="relative max-w-7xl mx-auto">
          {/* Content Grid */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 pt-[100px]">
            {/* Left Column */}
            <div className="space-y-6 md:pr-8 relative z-20">
              {/* Real-time Health Monitoring */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1] 
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]
                          hover:bg-white/[0.3] dark:hover:bg-black/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">Real-time Health Monitoring</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Heart Rate</span>
                      <span className="text-sm text-primary">72 BPM</span>
                    </div>
                    <div className="h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={realtimeData}>
                          <YAxis hide domain={[50, 100]} />
                          <Line
                            type="monotone"
                            dataKey="heartRate"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">SpO2</span>
                      <span className="text-sm text-primary">98%</span>
                    </div>
                    <div className="h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={realtimeData}>
                          <YAxis hide domain={[90, 100]} />
                          <Line
                            type="monotone"
                            dataKey="spo2"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Voice Assistant */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1]
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Mic className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-primary font-medium">Voice Assistant</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                `Hey Assistant, can you check my thyroid levels from my blood test from last month?`
                </div>
                <div className="border-t border-primary/10 pt-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary">Powered by Hybrid RAG</span>
                  </div>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">Sensor Data</Badge>
                    <Badge variant="secondary" className="text-xs">Medical Records</Badge>
                  </div>
                </div>
              </motion.div>

              {/* Activity Tracking */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1]
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">Activity Tracking</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-primary/5">
                    <div className="text-xs text-muted-foreground">Steps Today</div>
                    <div className="text-primary font-medium">8,432</div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/5">
                    <div className="text-xs text-muted-foreground">Active Minutes</div>
                    <div className="text-primary font-medium">45 min</div>
                  </div>
                </div>
              </motion.div>

              {/* Nutrition Overview */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1]
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Apple className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">Nutrition Overview</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-primary/5">
                    <div className="text-xs text-muted-foreground">Calories</div>
                    <div className="text-primary font-medium">1,840</div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/5">
                    <div className="text-xs text-muted-foreground">Protein</div>
                    <div className="text-primary font-medium">75g</div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/5">
                    <div className="text-xs text-muted-foreground">Water</div>
                    <div className="text-primary font-medium">2.1L</div>
                  </div>
                </div>
              </motion.div>

              {/* RAG Pipeline */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1]
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">Hybrid RAG Pipeline</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    Sensor Data
                  </div>
                  <span>+</span>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Medical Records
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Center Column - Empty space for robot visibility */}
            <div className="hidden md:block relative z-10" />

            {/* Right Column */}
            <div className="space-y-6 md:pl-8 relative z-20">
              {/* Chat Interface */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1]
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">Live Chat</span>
                </div>
                <div className="space-y-4">
                  {mockChat.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + (index * 0.2) }}
                      className={`flex ${msg.user ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-xl ${
                        msg.user 
                          ? 'bg-primary/30 dark:bg-primary/40 text-primary-foreground dark:text-primary-foreground font-medium ml-auto backdrop-blur-sm' 
                          : 'bg-black/10 dark:bg-white/10 text-foreground backdrop-blur-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Health Predictions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1]
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">Health Predictions</span>
                </div>
                <div className="space-y-3">
                  {predictionCards.map((card, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg 
                                              bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 
                                              transition-colors">
                      <div className="flex items-center gap-2">
                        <card.icon className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">{card.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-primary">{card.risk}</span>
                        <Badge variant="secondary" className="text-xs bg-black/10 dark:bg-white/10">
                          {card.confidence}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Spline Scene Container - Move it after the content */}
          <div className="absolute inset-0 h-[900px] w-full z-10 pointer-events-none">
            {shouldRenderSpline && (
              <Spline
                scene={theme === 'light' 
                  ? "https://prod.spline.design/HTYCUpT6dJ4ebiXf/scene.splinecode"
                  : "https://prod.spline.design/HHdKBycvfu77wPea/scene.splinecode"
                }
                className="w-full h-full pointer-events-auto"
                onLoad={handleSplineLoad}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}; 