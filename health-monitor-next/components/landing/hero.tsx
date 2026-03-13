"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/link";
import Link from "next/link";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { motion } from "framer-motion";
import ShineBorder from "@/components/ui/shine-border";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";
export const Hero = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const imageSrc = isDark ? "/landing/hm-chat-dark-new.jpg" : "/landing/hm-chat-light-new.jpg";
  return (
    <motion.section 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-4 md:py-8 lg:py-8">
        <div className="text-center space-y-6 md:space-y-8 max-w-3xl">
          <Badge variant="outline" className="text-sm py-2 px-4">
            <span className="mr-2 text-primary">
              <Badge>New</Badge>
            </span>
            <span className="hidden sm:inline">Health Assistant Now Available!</span>
            <span className="sm:hidden">AI Assistant Live!</span>
          </Badge>

          <div className="text-center text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
            <h1 className="leading-tight">
              Your Complete{' '}
              <span className="text-transparent bg-gradient-to-r from-[#9c40ff] to-[#ffaa40] bg-clip-text whitespace-nowrap">
                Health Hub
              </span>
              {' '}for Better Living
            </h1>
          </div>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Empowering you with real-time health tracking, personalized insights, and comprehensive wellness management. Take control of your health journey today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <RainbowButton >
                View Dashboard
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </RainbowButton>
            </Link>

            <Button
              asChild
              variant="secondary"
              className="w-full sm:w-auto font-bold"
            >
              <Link href="/chat" target="_blank">
                Try Health Assistant
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative group mt-8 md:mt-14 w-full">
          <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-gradient-to-r from-[#9c40ff]/50 to-[#ffaa40]/50 rounded-full blur-3xl"></div>

          <ShineBorder
            color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          >
            {/* <img
              className="w-full md:w-[1200px] mx-auto rounded-lg relative leading-none flex items-center border border-t-2 border-secondary"
              src={"/health-monitor-chat.jpg"}
              alt="Health Dashboard"
            /> */}
            <HeroVideoDialog
              className=""
              animationStyle="top-in-bottom-out"
              videoSrc="https://www.youtube.com/embed/hRlfrEtWPrc?si=mmr_KejR77wJif8S"
              thumbnailSrc={imageSrc}
              thumbnailAlt="Hero Video"
          />
          </ShineBorder>

          <div className="absolute bottom-0 left-0 w-full h-16 sm:h-20 md:h-28 bg-gradient-to-b from-background/0 via-background/50 to-background rounded-lg"></div>
        </div>
      </div>
    </motion.section>
  );
};
