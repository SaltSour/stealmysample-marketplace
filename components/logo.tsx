import { cn } from "@/lib/utils"
import { SITE_NAME } from "@/lib/constants"
import Image from "next/image"

interface LogoProps {
  className?: string
  variant?: "full" | "icon" | "typography" | "sms"
  color?: "white" | "black" | "red"
  size?: "xs" | "sm" | "md" | "lg"
}

export function Logo({ 
  className, 
  variant = "full",
  color = "white",
  size = "md"
}: LogoProps) {
  // Map variants and colors to file paths
  const getLogoPath = () => {
    // Base paths for each variant
    const paths = {
      full: {
        white: "/images/_STEAL MY SAMPLE Blanc.svg",
        black: "/images/_STEAL MY SAMPLE Noir.svg",
        red: "/images/_STEAL MY SAMPLE Blanc.svg" // Default to white as fallback if red not available
      },
      icon: {
        white: "/images/_STEAL MY SAMPLE Logo blanc.svg",
        black: "/images/_STEAL MY SAMPLE Logo noir.svg",
        red: "/images/_STEAL MY SAMPLE Logo rouge.svg"
      },
      typography: {
        white: "/images/_STEAL MY SAMPLE Typo blanche.svg",
        black: "/images/_STEAL MY SAMPLE Typo noir.svg",
        red: "/images/_STEAL MY SAMPLE Typo rouge.svg"
      },
      sms: {
        white: "/images/_STEAL MY SAMPLE sms blanc.svg",
        black: "/images/_STEAL MY SAMPLE sms noir.svg",
        red: "/images/_STEAL MY SAMPLE sms rouge.svg"
      }
    };

    return paths[variant][color];
  };
  
  // Size mappings for the logo
  const sizeMappings = {
    xs: {
      width: 80,
      height: 24
    },
    sm: {
      width: 120,
      height: 36
    },
    md: {
      width: 160,
      height: 48
    },
    lg: {
      width: 200,
      height: 60
    }
  };
  
  // Adjust aspect ratio based on variant
  const getAspectRatio = () => {
    switch(variant) {
      case 'icon':
        return { width: sizeMappings[size].height, height: sizeMappings[size].height };
      case 'typography':
        return { width: sizeMappings[size].width, height: sizeMappings[size].height / 1.5 };
      case 'sms':
        return { width: sizeMappings[size].width / 1.5, height: sizeMappings[size].height };
      case 'full':
      default:
        return { width: sizeMappings[size].width, height: sizeMappings[size].height };
    }
  };

  const dimensions = getAspectRatio();
  const logoPath = getLogoPath();

  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src={logoPath}
        alt={SITE_NAME}
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        priority
      />
    </div>
  );
} 