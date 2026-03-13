"use client";

import { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Database, FileText, Brain, Cpu } from "lucide-react";
import OrbitingCircles from "@/components/ui/orbiting-circles";

export const RAGPipeline = () => {
  const [shouldRenderAnimation, setShouldRenderAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRenderAnimation(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <div className="flex gap-4 flex-col items-start">
            <div>
              <Badge>RAG Pipeline</Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
                Hybrid RAG Architecture
              </h2>
              <p className="text-lg lg:max-w-2xl leading-relaxed tracking-tight text-muted-foreground text-left">
                Our advanced RAG pipeline combines structured sensor data from our SQL database with unstructured medical records to provide comprehensive health insights.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex gap-4 p-6 border rounded-lg hover:border-primary/50 transition-colors"
              >
                <Database className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Structured Data Retrieval</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time sensor data and health metrics are stored in our SQL database, enabling precise temporal queries and trend analysis.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex gap-4 p-6 border rounded-lg hover:border-primary/50 transition-colors"
              >
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Unstructured Data Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Medical records, doctor&apos;s notes, and health documents are processed using advanced NLP techniques for semantic understanding.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex gap-4 p-6 border rounded-lg hover:border-primary/50 transition-colors"
              >
                <Brain className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Intelligent Synthesis</h3>
                  <p className="text-sm text-muted-foreground">
                    Our LLM combines insights from both structured and unstructured data to generate comprehensive health reports and answer queries.
                  </p>
                </div>
              </motion.div>
            </div>

            {shouldRenderAnimation && (
              <motion.div
                className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-r from-[#9c40ff] to-[#ffaa40] bg-clip-text text-center text-8xl font-semibold leading-none text-transparent">
                  RAG
                </span>

                <OrbitingCircles
                  className="size-[30px] border-none bg-transparent"
                  duration={20}
                  delay={20}
                  radius={80}
                >
                  <Database className="text-primary w-6 h-6" />
                </OrbitingCircles>
                <OrbitingCircles
                  className="size-[30px] border-none bg-transparent"
                  duration={20}
                  delay={10}
                  radius={80}
                >
                  <FileText className="text-primary w-6 h-6" />
                </OrbitingCircles>

                <OrbitingCircles
                  className="size-[50px] border-none bg-transparent"
                  radius={190}
                  duration={20}
                  reverse
                >
                  <Brain className="text-primary w-8 h-8" />
                </OrbitingCircles>
                <OrbitingCircles
                  className="size-[50px] border-none bg-transparent"
                  radius={190}
                  duration={20}
                  delay={20}
                  reverse
                >
                  <Cpu className="text-primary w-8 h-8" />
                </OrbitingCircles>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}; 