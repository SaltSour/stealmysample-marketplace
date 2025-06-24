import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import S3Demo from "@/components/s3-demo"

export const metadata = {
  title: "S3 Secure Audio Demo",
  description: "Demo of secure audio storage and playback using S3",
}

export default async function S3DemoPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/s3-demo")
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">S3 Secure Audio Demo</h1>
          <p className="text-muted-foreground">
            This page demonstrates the secure audio storage and playback system using S3.
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <S3Demo userId={session.user.id} />
        </div>
      </div>
    </div>
  )
} 