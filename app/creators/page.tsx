import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import type { Creator } from "@/types"

async function getCreators(): Promise<Creator[]> {
  const creators = await prisma.creator.findMany({
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      samplePacks: {
        where: {
          published: true,
        },
        select: {
          id: true,
        },
      },
    },
  })

  return creators as Creator[]
}

export default async function CreatorsPage() {
  const creators = await getCreators()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Creators</h1>
          <p className="text-muted-foreground mt-2">
            Discover talented producers from around the world
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {creators.map((creator) => (
          <Link key={creator.id} href={`/creators/${creator.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                {/* Creator Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-accent">
                    {creator.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={creator.user.image}
                        alt={creator.user.name || "Creator"}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                        {(creator.user.name || "C")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <CardTitle>{creator.user.name || "Anonymous Creator"}</CardTitle>
              </CardHeader>

              <CardContent className="text-center">
                <div className="text-sm text-muted-foreground">
                  {creator.samplePacks.length} Sample Packs
                </div>
                {creator.bio && (
                  <p className="mt-2 text-sm line-clamp-2">{creator.bio}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}

        {creators.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No creators available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
} 
