"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Heart } from "lucide-react";

const mainLinks = [
  {
    title: "Product",
    links: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Health Monitor", href: "/monitor" },
      { name: "Activities", href: "/activities" },
      { name: "Nutrition", href: "/nutrition" },
      { name: "Health Records", href: "/health-records" },
    ],
  },
  {
    title: "Features",
    links: [
      { name: "AI Assistant", href: "/chat" },
      { name: "Real-time Tracking", href: "/monitor" },
      { name: "Reports", href: "/reports" },
      { name: "Medical Records", href: "/medical-records" },
      { name: "Data Analysis", href: "/analysis" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4 max-w-xs"
          >
            <h3 className="text-lg font-semibold">HealthHub</h3>
            <p className="text-sm text-muted-foreground">
              Advanced health monitoring and analysis platform powered by AI and real-time sensor data.
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              <Link
                href="https://github.com/CubeStar1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </motion.div>

          {mainLinks.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="space-y-4 w-full max-w-xs"
            >
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground"
        >
          <p className="flex items-center justify-center gap-1">
            Made with <Heart className="h-4 w-4 text-red-500 hover:animate-pulse" /> by{" "}
            <Link 
              href="https://github.com/CubeStar1"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              CubeStar1
            </Link>
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} HealthHub. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}; 