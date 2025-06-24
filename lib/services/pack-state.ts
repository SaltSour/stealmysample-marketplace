import { prisma } from "@/lib/prisma"
import { validateForPublishing } from "@/lib/validations/sample-pack"

export type PackState = "draft" | "published" | "archived"

interface StateTransition {
  from: PackState
  to: PackState
  validate: (packId: number) => Promise<{ success: boolean; error?: string }>
  execute: (packId: number) => Promise<void>
}

export class PackStateManager {
  private transitions: StateTransition[] = [
    // Draft to Published
    {
      from: "draft",
      to: "published",
      validate: async (packId) => {
        const pack = await prisma.samplePack.findUnique({
          where: { id: packId },
          include: { samples: true }
        })
        if (!pack) return { success: false, error: "Pack not found" }
        return validateForPublishing(pack)
      },
      execute: async (packId) => {
        await prisma.samplePack.update({
          where: { id: packId },
          data: {
            published: true,
            publishedAt: new Date()
          }
        })
      }
    },
    // Published to Draft (unpublish)
    {
      from: "published",
      to: "draft",
      validate: async (packId) => {
        const pack = await prisma.samplePack.findUnique({
          where: { id: packId }
        })
        if (!pack) return { success: false, error: "Pack not found" }
        return { success: true }
      },
      execute: async (packId) => {
        await prisma.samplePack.update({
          where: { id: packId },
          data: {
            published: false,
            publishedAt: null
          }
        })
      }
    },
    // Published to Archived
    {
      from: "published",
      to: "archived",
      validate: async (packId) => {
        const pack = await prisma.samplePack.findUnique({
          where: { id: packId }
        })
        if (!pack) return { success: false, error: "Pack not found" }
        return { success: true }
      },
      execute: async (packId) => {
        await prisma.samplePack.update({
          where: { id: packId },
          data: {
            published: false,
            archived: true,
            archivedAt: new Date()
          }
        })
      }
    }
  ]

  async transition(packId: number, from: PackState, to: PackState): Promise<{ success: boolean; error?: string }> {
    const transition = this.transitions.find(t => t.from === from && t.to === to)
    
    if (!transition) {
      return { 
        success: false, 
        error: `Invalid state transition from ${from} to ${to}` 
      }
    }

    try {
      // Validate the transition
      const validation = await transition.validate(packId)
      if (!validation.success) {
        return validation
      }

      // Execute the transition
      await transition.execute(packId)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Transition failed" 
      }
    }
  }

  async getCurrentState(packId: number): Promise<PackState> {
    const pack = await prisma.samplePack.findUnique({
      where: { id: packId },
      select: { published: true, archived: true }
    })

    if (!pack) throw new Error("Pack not found")
    
    if (pack.archived) return "archived"
    if (pack.published) return "published"
    return "draft"
  }
} 