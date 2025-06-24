"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ResendEmailButtonProps {
  orderId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
}

export function ResendEmailButton({
  orderId,
  variant = "outline",
  size = "sm",
  className,
}: ResendEmailButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/emails/purchase-confirmation/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to resend email");
      }

      setSent(true);
      toast({
        title: "Email Sent",
        description: "Purchase confirmation email sent successfully.",
        duration: 5000,
      });

      // Reset the sent state after 3 seconds
      setTimeout(() => {
        setSent(false);
      }, 3000);
    } catch (error) {
      console.error("Error resending email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend email",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Sending...
      </Button>
    );
  }

  if (sent) {
    return (
      <Button variant="outline" size={size} className={className} disabled>
        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
        Email Sent
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick}>
      <Mail className="h-4 w-4 mr-2" />
      Resend Email
    </Button>
  );
} 