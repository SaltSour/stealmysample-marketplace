'use server'

import { z } from "zod"
import { hash, compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authSchema, signUpSchema } from "@/lib/validations/auth"

// Define a result type for authentication operations
interface AuthResult {
  success: boolean
  message: string
  user?: any
}

export async function signUp(values: z.infer<typeof signUpSchema>): Promise<AuthResult> {
  try {
    const validatedFields = signUpSchema.parse(values)

    // Check if user already exists (email or username)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedFields.email },
          { username: validatedFields.username }
        ]
      },
    })

    if (existingUser) {
      if (existingUser.email === validatedFields.email) {
        return { 
          success: false, 
          message: "An account with this email already exists" 
        }
      }
      return { 
        success: false, 
        message: "This username is already taken" 
      }
    }

    // Hash the password
    const hashedPassword = await hash(validatedFields.password, 10)

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: validatedFields.email,
        username: validatedFields.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isCreator: true,
      }
    })

    return {
      success: true,
      message: "Account created successfully",
      user
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message
      }
    }
    
    // Generic error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : "An unexpected error occurred";
      
    return {
      success: false,
      message: errorMessage
    }
  }
}

export async function authenticate(
  values: z.infer<typeof authSchema>
): Promise<AuthResult> {
  try {
    const validatedFields = authSchema.parse(values)

    const user = await prisma.user.findUnique({
      where: { email: validatedFields.email },
    })

    if (!user || !user.password) {
      return {
        success: false,
        message: "Invalid credentials"
      }
    }

    const passwordMatch = await compare(
      validatedFields.password,
      user.password
    )

    if (!passwordMatch) {
      return {
        success: false,
        message: "Invalid credentials"
      }
    }

    return {
      success: true,
      message: "Authentication successful",
      user
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message
      }
    }
    
    return {
      success: false,
      message: "Authentication failed"
    }
  }
} 