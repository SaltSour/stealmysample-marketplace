import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Please provide an email address')
    process.exit(1)
  }

  try {
    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // If user doesn't exist, create one with a default password
      const hashedPassword = await hash('password123', 12)
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: email.split('@')[0], // Use part of email as name
          role: UserRole.CREATOR,
          isCreator: true,
        }
      })
      console.log('Created new user:', user.email)
    } else {
      // Update existing user to be a creator
      user = await prisma.user.update({
        where: { email },
        data: {
          role: UserRole.CREATOR,
          isCreator: true,
        }
      })
      console.log('Updated existing user:', user.email)
    }

    // Create creator profile if it doesn't exist
    const existingCreator = await prisma.creator.findUnique({
      where: { userId: user.id }
    })

    if (!existingCreator) {
      const creator = await prisma.creator.create({
        data: {
          userId: user.id,
          bio: 'New Creator',
          isVerified: true, // Set to true by default
          payoutEnabled: true, // Set to true by default
        }
      })
      console.log('Created creator profile:', creator.id)
    } else {
      console.log('Creator profile already exists:', existingCreator.id)
    }

    console.log('Successfully set up creator access!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 