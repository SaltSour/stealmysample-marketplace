export const SITE_NAME = "StealMySample"
export const SITE_DESCRIPTION = "Discover, buy, and sell high-quality music samples and loops."

// Brand colors updated to match the official logo colors
export const BRAND_COLORS = {
  primary: "#D12F25", // Red from the logo - primary color
  secondary: "#000000", // Black - secondary color
  accent: "#FFFFFF", // White - accent color
  success: "#10B981", // Green - success messages
  warning: "#F59E0B", // Amber - warning messages
  error: "#EF4444", // Red - error messages
  info: "#3B82F6", // Blue - info messages
  
  // Background gradients
  gradients: {
    primary: "linear-gradient(to right, #D12F25, #FF4A6E)",
    secondary: "linear-gradient(to right, #000000, #333333)",
    dark: "linear-gradient(to right, #111827, #1F2937)"
  }
}

// Navigation links
export const NAV_LINKS = [
  { label: "Sample Packs", href: "/packs" },
  { label: "Samples", href: "/samples" },
  { label: "Creators", href: "/creators" },
  { label: "Pricing", href: "/pricing" }
]

// Footer links
export const FOOTER_LINKS = {
  company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blog", href: "/blog" },
  ],
  resources: [
    { label: "Help Center", href: "/help" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  social: [
    { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
    { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
    { label: "YouTube", href: "https://youtube.com", icon: "youtube" },
    { label: "Discord", href: "https://discord.com", icon: "discord" },
  ]
} 