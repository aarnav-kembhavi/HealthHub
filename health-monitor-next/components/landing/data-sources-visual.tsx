"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Spline from '@splinetool/react-spline/next';
import { Application } from '@splinetool/runtime';
import { 
  Database, FileText, Activity, Brain, 
  Dna, Network, Cpu, Search,
  Microscope, Wand2 
} from "lucide-react";

const dataSources = [
  {
    title: "Real-time Sensor Data",
    icon: Activity,
    items: [
      "Continuous Health Monitoring",
      "Vital Signs Analysis",
      "Sleep Patterns",
      "Activity Metrics"
    ],
    delay: 0.2
  },
  {
    title: "Medical Records",
    icon: FileText,
    items: [
      "Clinical Documents",
      "Lab Results",
      "Treatment History",
      "Diagnostic Reports"
    ],
    delay: 0.3
  },
  {
    title: "Vector Database",
    icon: Database,
    items: [
      "Semantic Search",
      "Document Embeddings",
      "Similarity Matching",
      "Context Retrieval"
    ],
    delay: 0.4
  },
  {
    title: "ML Models",
    icon: Brain,
    items: [
      "Disease Prediction",
      "Risk Assessment",
      "Pattern Recognition",
      "Anomaly Detection"
    ],
    delay: 0.5
  }
];

export const DataSourcesVisual = () => {
  const handleSplineLoad = (spline: Application) => {
    spline.setZoom(2);
  };

  return (
    <section className="w-full py-20 lg:py-20 relative">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex gap-4 flex-col items-start mb-24">
          <Badge variant="outline" className="text-sm py-1">Data Integration</Badge>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
              Comprehensive Data Analysis
            </h2>
            <p className="text-lg max-w-xl lg:max-w-2xl leading-relaxed tracking-tight text-muted-foreground text-left">
              Our AI integrates multiple data sources to provide comprehensive health insights and personalized recommendations.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="relative max-w-7xl mx-auto">
          {/* Content Grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
            {/* Left Column */}
            <div className="space-y-6 md:pr-8">
              {dataSources.slice(0, 2).map((source, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: source.delay }}
                >
                  <div className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                                border border-black/[0.1] dark:border-white/[0.1] 
                                shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]
                                hover:bg-white/[0.3] dark:hover:bg-black/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <source.icon className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">{source.title}</span>
                    </div>
                    <div className="space-y-2">
                      {source.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Center Column - Empty for Brain */}
            <div className="hidden md:block" />

            {/* Right Column */}
            <div className="space-y-6 md:pl-8">
              {dataSources.slice(2, 4).map((source, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: source.delay }}
                >
                  <div className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                                border border-black/[0.1] dark:border-white/[0.1] 
                                shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]
                                hover:bg-white/[0.3] dark:hover:bg-black/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <source.icon className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">{source.title}</span>
                    </div>
                    <div className="space-y-2">
                      {source.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Brain Visualization - Adjusted positioning */}
          <div className="absolute inset-0 top-[10%] -z-10">
            <Spline
              scene="https://prod.spline.design/pR7rqRA4ipglAXo5/scene.splinecode"
              className="w-full h-full"
              onLoad={handleSplineLoad}
            />
          </div>

          {/* Bottom RAG Pipeline Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="relative z-10 mt-12"
          >
            <div className="bg-white/[0.2] dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 
                          border border-black/[0.1] dark:border-white/[0.1]
                          shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">RAG Pipeline Processing</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary/10">Semantic Search</Badge>
                <Badge variant="secondary" className="bg-primary/10">Context Retrieval</Badge>
                <Badge variant="secondary" className="bg-primary/10">Knowledge Integration</Badge>
                <Badge variant="secondary" className="bg-primary/10">ML Inference</Badge>
                <Badge variant="secondary" className="bg-primary/10">Real-time Analysis</Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 
