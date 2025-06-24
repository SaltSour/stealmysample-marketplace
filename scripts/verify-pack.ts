import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const packId = process.argv[2]
  if (!packId) {
    console.error('Please provide a pack ID')
    process.exit(1)
  }

  try {
    // Get the pack with all its details
    const pack = await prisma.samplePack.findUnique({
      where: { id: parseInt(packId) },
      include: {
        samples: true,
        creator: true
      }
    })

    if (!pack) {
      console.error('Pack not found')
      process.exit(1)
    }

    console.log('Pack Details:')
    console.log('-------------')
    console.log('Title:', pack.title)
    console.log('Description:', pack.description)
    console.log('Cover Image:', pack.coverImage ? 'Yes' : 'No')
    console.log('Price:', pack.price)
    console.log('Number of Samples:', pack.samples.length)
    console.log('Published:', pack.published)
    
    // Check for validation issues
    const issues = []
    if (!pack.title || pack.title.trim().length === 0) {
      issues.push('Missing title')
    }
    if (!pack.description || pack.description.trim().length === 0) {
      issues.push('Missing description')
    }
    if (!pack.coverImage) {
      issues.push('Missing cover image')
    }
    if (!pack.samples || pack.samples.length === 0) {
      issues.push('No samples found')
    }
    if (pack.price <= 0) {
      issues.push('Price must be greater than 0')
    }

    if (issues.length > 0) {
      console.log('\nValidation Issues:')
      console.log('------------------')
      issues.forEach(issue => console.log('- ' + issue))
    } else {
      console.log('\nNo validation issues found. Pack should be ready to publish.')
    }

    // List all samples
    if (pack.samples.length > 0) {
      console.log('\nSamples:')
      console.log('--------')
      pack.samples.forEach(sample => {
        console.log(`- ${sample.title} (ID: ${sample.id})`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 