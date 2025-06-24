import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import { Separator } from "@/components/ui/separator"

interface LegalPageProps {
  params: {
    type: "terms-of-service" | "privacy-policy"
  }
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const title = params.type === "terms-of-service" 
    ? "Terms of Service" 
    : "Privacy Policy"

  return {
    title: `${title} - StealMySample`,
    description: `Read our ${title.toLowerCase()} to understand your rights and responsibilities.`
  }
}

export default async function LegalPage({ params }: LegalPageProps) {
  let content: string

  try {
    const filePath = path.join(process.cwd(), "legal", `${params.type}.md`)
    content = fs.readFileSync(filePath, "utf8")
  } catch (error) {
    notFound()
  }

  const title = params.type === "terms-of-service" 
    ? "Terms of Service" 
    : "Privacy Policy"

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <Separator className="my-6" />
        <div className="prose prose-invert prose-headings:font-semibold prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:underline prose-strong:text-foreground prose-ul:text-muted-foreground max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
} 