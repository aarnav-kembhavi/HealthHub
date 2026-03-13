"use client";

import { Code2, Brain, Database, Server, Cpu, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import IconCloud from "@/components/ui/icon-cloud";

const slugs = [
  "typescript",
  "nextdotjs",
  "react",
  "prisma",
  "postgresql",
  "supabase",
  "tailwindcss",
  "framer",
  "vercel",
  "git",
  "github",
  "visualstudiocode",
  "figma",
];

const technologies = [
  {
    icon: Brain,
    title: "Advanced RAG Pipeline",
    description: "Advanced retrieval-augmented generation using LangChain and LangGraph"
  },
  {
    icon: Database,
    title: "Secure Data Storage",
    description: "SOC 2 compliant medical data storage with Supabase"
  },
  {
    icon: Code2,
    title: "Next.js 14",
    description: "Built with Next.js 14, TypeScript, and TailwindCSS"
  },
  {
    icon: Server,
    title: "Real-time Processing",
    description: "Real-time sensor data processing and visualization"
  },
  {
    icon: Cpu,
    title: "Unstructured + Structured RAG",
    description: "Unstructured data retrieval with LangChain and structured data retrieval with LangGraph"
  },
  {
    icon: Gauge,
    title: "Smooth Animations",
    description: "Beautiful, responsive UI with Framer Motion animations"
  }
];

export const TechStack = () => (
  <div className="w-full py-20 lg:py-40">
    <div className="container mx-auto">
      <motion.div 
        className="flex flex-col gap-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex gap-4 flex-col items-start">
          <div>
            <Badge>Tech Stack</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
              Our Tech Stack
            </h2>
            <p className="text-lg lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
              Our platform uses Next.js 14, TypeScript, and TailwindCSS for the frontend. The backend is built with Supabase and LangChain, with a custom RAG pipeline running on a FastAPI server.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                className="flex gap-4 flex-col justify-between p-6 border rounded-md hover:border-primary/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <tech.icon className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{tech.title}</h3>
                  <p className="text-sm text-muted-foreground">{tech.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <IconCloud iconSlugs={slugs} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
); 