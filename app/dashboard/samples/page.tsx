import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SamplesDashboard } from "@/components/dashboard/samples-dashboard";

export const metadata = {
  title: "Sample Management",
  description: "Manage your audio samples",
};

export default async function SamplesPage() {
  // Get the session
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/samples");
  }

  // Check if the user is a creator
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: {
      samplePacks: {
        select: {
          id: true,
          title: true,
        },
        orderBy: {
          title: "asc",
        },
      },
    },
  });

  if (!creator) {
    redirect("/dashboard");
  }

  // Now that our Prisma client is regenerated, we can use the Tag model
  const tags = await (prisma as any).tag.findMany({
    orderBy: { name: "asc" },
  });

  // Return the client component with server-loaded data
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Sample Management</h1>
      
      <SamplesDashboard 
        userId={session.user.id} 
        creatorId={creator.id} 
        samplePacks={creator.samplePacks} 
        availableTags={tags}
      />
    </div>
  );
} 