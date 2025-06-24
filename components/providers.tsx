import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientProviders from "./client-providers";

export default async function Providers({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    return (
        <ClientProviders session={session}>
            {children}
        </ClientProviders>
    );
} 