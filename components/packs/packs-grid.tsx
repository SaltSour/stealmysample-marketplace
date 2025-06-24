"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { 
  Package, 
  Music2,
  Star
} from "lucide-react"

interface SamplePack {
  id: number
  title: string
  description: string
  coverImage: string
  slug: string
  price: number
  samples: { id: string }[]
  creator: {
    user: {
      name: string
    }
  }
}

interface PacksGridProps {
  packs: SamplePack[]
}

const FeaturedPackCard = ({ pack }: { pack: SamplePack }) => {
  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-primary/20 hover:shadow-xl">
      <div className="relative aspect-[2/1] overflow-hidden rounded-xl">
        {pack.coverImage ? (
          <>
            <Image
              src={pack.coverImage}
              alt={pack.title}
              fill
              className="object-cover brightness-[0.85] transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-zinc-900 to-black">
            <Package className="h-20 w-20 text-white/20" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-black/50 backdrop-blur-md text-white border-none px-3 py-1 rounded-full">
            {pack.samples.length} samples
          </Badge>
        </div>
        <div className="absolute left-0 right-0 bottom-0 p-6">
          <h2 className="text-2xl font-bold text-white mb-2 line-clamp-1">
            {pack.title}
          </h2>
          <p className="text-white/80 text-sm mb-4 line-clamp-2">
            {pack.description}
          </p>
          <div className="flex justify-between items-center">
            <p className="text-sm text-white/70">
              By {pack.creator.user.name || "Unknown Creator"}
            </p>
            <div className="text-xl font-bold text-white bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full">
              ${pack.price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PacksGrid({ packs }: PacksGridProps) {
  const featuredPacks = packs.slice(0, 3)
  const regularPacks = packs.slice(3)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950">
      {/* Hero section */}
      <div className="mb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-40 -right-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="w-full max-w-[1400px] mx-auto pt-20 pb-16 px-6 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Image 
              src="/images/_STEAL MY SAMPLE Logo blanc.svg" 
              alt="STEAL MY SAMPLE" 
              width={200}
              height={100}
              className="w-[220px] h-auto mx-auto mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              priority
            />
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mb-10"></div>
            <h1 className="text-5xl md:text-6xl font-bold mb-8 text-white tracking-tight">
              Premium Sample Packs
            </h1>
            <p className="text-xl text-zinc-400 mb-0 leading-relaxed italic">
              Explore our curated collection of high-quality audio samples
            </p>
          </div>

          {/* Featured packs */}
          {featuredPacks.length > 0 && (
            <div className="mb-24">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2 px-4 py-2 bg-zinc-900/50 backdrop-blur-sm rounded-full inline-block">
                  <Star className="h-5 w-5 text-primary" />
                  <span>Featured Packs</span>
                </h2>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {featuredPacks.map((pack) => (
                  <Link key={pack.id} href={`/packs/${pack.id}`}>
                    <FeaturedPackCard pack={pack} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All packs */}
      <div className="w-full max-w-[1400px] mx-auto px-6 mb-16">
        <h2 className="text-2xl font-semibold mb-10 px-4 py-2 bg-zinc-900/50 backdrop-blur-sm rounded-full inline-block">All Sample Packs</h2>

        {/* Pack grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {regularPacks.map((pack) => (
            <div key={pack.id}>
              <Link href={`/packs/${pack.id}`}>
                <Card className="h-full overflow-hidden bg-zinc-900/30 backdrop-blur-sm border-zinc-800/50 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:border-zinc-700/50">
                  <div className="aspect-video relative bg-black overflow-hidden rounded-t-xl">
                    {pack.coverImage ? (
                      <Image
                        src={pack.coverImage}
                        alt={pack.title}
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-zinc-900 to-black">
                        <Package className="h-16 w-16 text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/50 backdrop-blur-md text-white border-none text-xs px-3 py-1 rounded-full">
                        {pack.samples.length} samples
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1 font-medium">{pack.title}</CardTitle>
                      <div className="font-bold text-lg text-white bg-primary/20 px-3 py-1 rounded-full text-sm">
                        ${pack.price.toFixed(2)}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                      <Music2 className="h-3 w-3" />
                      By {pack.creator.user.name || "Unknown Creator"}
                    </p>
                  </CardHeader>

                  <CardContent className="pb-1">
                    <p className="text-sm text-zinc-500 line-clamp-2">{pack.description}</p>
                  </CardContent>

                  <CardFooter className="pt-0 pb-4">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-white border-primary/20 text-xs rounded-full px-3">
                        WAV
                      </Badge>
                      <Badge variant="outline" className="bg-zinc-900/50 text-zinc-300 border-zinc-700/30 text-xs rounded-full px-3">
                        MP3
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </div>
          ))}
        </div>

        {packs.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
            <Package className="h-16 w-16 mx-auto text-primary/30 mb-6" />
            <h3 className="text-xl font-semibold mb-3">No sample packs available yet</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              Check back soon as we're constantly adding new premium sample packs to our collection.
            </p>
            <div className="mt-6">
              <Button 
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full"
                onClick={() => window.location.href = '/samples'}
              >
                Browse Individual Samples
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 