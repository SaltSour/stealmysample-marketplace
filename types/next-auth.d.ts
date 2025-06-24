import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string | null
      role: string
      isCreator: boolean
    } & DefaultSession["user"]
  }

  interface User {
    username?: string | null
    role: string
    isCreator: boolean
  }
} 