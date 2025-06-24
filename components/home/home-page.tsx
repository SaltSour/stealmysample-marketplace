"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Diamond, Zap, Gem, FileAudio, Music2, FileCode, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 relative overflow-hidden">
      {/* Enhanced background pattern */}
      <div 
        className="absolute inset-0 pattern-grid pattern-gray-800/5 pattern-size-16 pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse at center, white 20%, transparent 80%)' }}
      />
      
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10 flex flex-col items-center">
        {/* Enhanced Hero section with Logo */}
        <div className="max-w-3xl mx-auto text-center mb-20 sm:mb-32">
          <div className="flex justify-center mb-10 relative">
            {/* Logo SVG blanc avec effet de glow */}
            <div className="relative w-[280px] sm:w-[400px] md:w-[500px] mx-auto">
              {/* Plusieurs couches d'effets de glow pour un effet plus profond */}
              <div className="absolute -inset-10 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="absolute -inset-6 bg-primary/15 rounded-full blur-2xl -z-10 animate-pulse duration-[3s]"></div>
              <div className="absolute -inset-3 bg-primary/20 rounded-full blur-xl -z-10 animate-pulse duration-[2s]"></div>
              <Image 
                src="/images/_STEAL MY SAMPLE Logo blanc.svg" 
                alt="STEAL MY SAMPLE" 
                width={500}
                height={300}
                className="w-full h-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                priority
              />
              {/* Effet de glow supplémentaire pour le rectangle rouge dans le logo */}
              <div className="absolute bottom-[35%] right-[32%] w-[5%] h-[10%] bg-red-600/30 blur-lg -z-10 animate-pulse"></div>
            </div>
          </div>
          
          {/* Séparateur stylisé */}
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-6 mx-auto"></div>
          
          <p className="text-xl sm:text-2xl text-zinc-300 mb-12 font-medium leading-relaxed italic tracking-wide">
            "Every sound is a gem. Fill your bag & run."
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/samples">
              <Button 
                size="lg" 
                className="red-button px-10 h-14 rounded-full text-lg group transition-transform duration-200 ease-out hover:scale-[1.03]"
              >
                <span>Browse Samples</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Link href="/packs">
              <Button 
                size="lg" 
                variant="outline" 
                className="px-10 h-14 rounded-full text-lg border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                <span>Explore Packs</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Features section using Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mb-24 sm:mb-32">
          <FeatureCard
            icon={Diamond}
            title="Hand-Cut Gems"
            description="Crafted by the best samplemakers. No process. No fluff."
          />
          <FeatureCard
            icon={Zap}
            title="Grab & Go"
            description="Listen. Buy. Drop it in your DAW. Instant inspiration."
          />
          <FeatureCard
            icon={Gem}
            title="Steal the Deal"
            description="You're practically robbing us. And we're cool with it."
          />
        </div>

        {/* Pricing section Card */}
        <div className="max-w-xl mx-auto">
          <Card className="overflow-hidden border-border/30 shadow-sm bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-center">Simple Pricing</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <PricingRow icon={FileAudio} label=".wav file" price="$2.95 / €2.50" />
                <PricingRow icon={Music2} label=".wav stems" price="$4.95 / €4.45" />
                <PricingRow icon={FileCode} label="+ .midi file" price="+ $1.00 / €1.00" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper component for Feature Cards
const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <Card className="text-center group transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
    <CardHeader className="items-center">
      <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 mb-4 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/30">
        <Icon className="h-6 w-6" />
      </div>
      <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">{description}</p>
    </CardContent>
  </Card>
)

// Helper component for Pricing Rows
const PricingRow = ({ icon: Icon, label, price }: { icon: React.ElementType, label: string, price: string }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/20">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary flex-shrink-0" />
      <span className="font-medium text-foreground/90">{label}</span>
    </div>
    <span className="font-semibold text-foreground text-sm sm:text-base">{price}</span>
  </div>
) 