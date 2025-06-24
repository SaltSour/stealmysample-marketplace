import { AceSidebar } from "@/components/dashboard/ace-sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { cn } from "@/lib/utils"
import DashboardClientLayout from "./layout-client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
} 