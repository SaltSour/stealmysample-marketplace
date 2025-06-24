import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const packId = process.argv[2]
  if (!packId) {
    console.error('Please provide a pack ID')
    process.exit(1)
  }

  try {
    // Get the pack
    const pack = await prisma.samplePack.findUnique({
      where: { id: parseInt(packId) },
      include: {
        samples: true
      }
    })

    if (!pack) {
      console.error('Pack not found')
      process.exit(1)
    }

    console.log('Current pack state:')
    console.log('Price:', pack.price)
    console.log('Number of samples:', pack.samples.length)

    // Update the pack with a valid price
    const updatedPack = await prisma.samplePack.update({
      where: { id: parseInt(packId) },
      data: {
        price: 4.99 // Setting a default price
      }
    })

    console.log('\nUpdated pack:')
    console.log('Price:', updatedPack.price)

    // Check for orphaned samples
    const orphanedSamples = await prisma.sample.findMany({
      where: {
        samplePackId: parseInt(packId)
      }
    })

    if (orphanedSamples.length > 0) {
      console.log('\nFound samples:', orphanedSamples.length)
      console.log('Sample details:')
      orphanedSamples.forEach(sample => {
        console.log(`- ${sample.title} (ID: ${sample.id})`)
      })
    } else {
      console.log('\nNo samples found for this pack')
      console.log('Please upload samples through the UI')
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 