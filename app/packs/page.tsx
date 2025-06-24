import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { PacksGrid } from "@/components/packs/packs-grid"

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

async function getSamplePacks(): Promise<SamplePack[]> {
  const packs = await prisma.samplePack.findMany({
    where: {
      published: true,
    },
    include: {
      creator: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      samples: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return packs as SamplePack[]
}

export default async function PacksPage() {
  const packs = await getSamplePacks()
  
  return <PacksGrid packs={packs} />
} 
