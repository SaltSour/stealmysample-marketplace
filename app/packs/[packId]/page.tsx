"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import { SampleList } from "@/components/sample-list"
import { notFound } from "next/navigation"
import { 
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Download, 
  Library,
  Music2,
  Clock,
  Hash,
  Heart,
  Share2,
  Star,
  Users,
  ShoppingCart,
  Play,
  Pause,
  AlertTriangle,
  LockKeyhole,
  Sparkles,
  Shield,
  Tag,
  Info,
} from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

interface Sample {
  id: string
  title: string
  fileUrl: string
  waveformData: string | null
  duration: number
  bpm: number | undefined
  key: string | undefined
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice: number | undefined
  stemsPrice: number | undefined
  midiPrice: number | undefined
  tags: string[]
}

interface SamplePack {
  id: number
  title: string
  description: string
  coverImage: string
  slug: string
  price: number
  samples: Sample[]
  creator: {
    user: {
      name: string
    }
  }
}

interface CartItem {
  type: 'PACK' | 'SAMPLE'
  id: string
  price: number
}

async function getSamplePack(packId: string) {
  const response = await fetch(`/api/packs/${packId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch pack')
  }
  return response.json()
}

export default function PackPage({ params }: { params: { packId: string } }) {
  const { data: session } = useSession()
  const { addToCart } = useCart()
  const [pack, setPack] = useState<SamplePack | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSample, setCurrentSample] = useState<Sample | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio on the client side
    audioRef.current = new Audio()

    const fetchPack = async () => {
      try {
        const response = await fetch(`/api/packs/${params.packId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch pack')
        }
        const data = await response.json()
        setPack(data)
      } catch (error) {
        console.error('Error fetching pack:', error)
        toast.error('Failed to load pack details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPack()
  }, [params.packId])

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!pack) {
    return notFound()
  }

  const handlePlaySample = (sample: Sample) => {
    if (!audioRef.current) return;

    if (currentSample?.id === sample.id) {
      setIsPlaying(!isPlaying)
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    } else {
      setCurrentSample(sample)
      setIsPlaying(true)
      audioRef.current.src = sample.fileUrl
      audioRef.current.play()
    }
  }

  const handleAddToCart = () => {
    addToCart({
      samplePackId: pack.id.toString(),
      price: pack.price,
      format: 'WAV' as const
    })
    toast.success('Added pack to cart')
  }

  // Calculate pack statistics
  const totalDuration = pack.samples.reduce((acc, sample) => acc + (sample.duration || 0), 0)
  const uniqueBPMs = Array.from(new Set(pack.samples.map(s => s.bpm).filter(Boolean)))
  const uniqueKeys = Array.from(new Set(pack.samples.map(s => s.key).filter(Boolean)))
  const uniqueTags = Array.from(new Set(pack.samples.flatMap(s => s.tags || [])))

  return (
    <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6">
      {/* Hero Section */}
      <div className="relative rounded-lg overflow-hidden mb-8">
        <div className="aspect-video relative">
          {pack.coverImage ? (
            <Image
              src={pack.coverImage}
              alt={pack.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Music2 className="h-16 w-16 text-primary/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl font-bold mb-4">{pack.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{pack.description}</p>
              <div className="flex items-center gap-4">
                <Button size="lg" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add All to Cart
                </Button>
                <Button variant="outline" size="icon" onClick={() => setIsFavorite(!isFavorite)}>
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pack Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Music2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Samples</p>
                <p className="text-2xl font-bold">{pack.samples.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">{Math.round(totalDuration / 60)}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique BPMs</p>
                <p className="text-2xl font-bold">{uniqueBPMs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tags</p>
                <p className="text-2xl font-bold">{uniqueTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Premium Quality</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              High-quality samples professionally recorded and mixed to perfection.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Royalty-Free</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Use these samples in your productions without worrying about royalties.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <LockKeyhole className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Secure Downloads</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Instant access to your purchased samples with secure download links.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Samples List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Samples</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10">
              {pack.samples.length} tracks
            </Badge>
          </div>
        </div>
        <SampleList samples={pack.samples} />
      </div>
    </div>
  )
} 
