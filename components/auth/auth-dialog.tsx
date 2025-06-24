"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authSchema, signUpSchema } from "@/lib/validations/auth"
import { signUp } from "@/lib/actions/auth"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"

interface AuthDialogProps {
  children?: React.ReactNode
  isOpen?: boolean
  onCloseAction?: () => void
}

export function AuthDialog({ children, isOpen: propIsOpen, onCloseAction }: AuthDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Determine if the dialog is open based on props or internal state
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen
  
  // Handle dialog close
  const handleClose = () => {
    if (onCloseAction) {
      onCloseAction()
    } else {
      setInternalOpen(false)
    }
  }

  // Initialize form with Zod validation
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(mode === "signin" ? authSchema : signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  })

  // Reset form state and clear any errors
  const resetForm = () => {
    form.reset()
    form.clearErrors()
  }

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    setIsLoading(true)

    try {
      if (mode === "signin") {
        // Handle sign in
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        })

        if (result?.error) {
          toast.error(result.error)
          return
        }

        // Success - reload the page
        router.refresh()
        handleClose()
        toast.success("Signed in successfully")
      } else {
        // Handle sign up
        const result = await signUp(values)
        
        if (!result.success) {
          toast.error(result.message)
          return
        }
        
        // After signup, immediately sign in
        const signInResult = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        })
        
        if (signInResult?.error) {
          toast.error("Sign up successful, but could not sign in automatically")
          return
        }
        
        router.refresh()
        handleClose()
        toast.success("Account created and signed in successfully")
      }
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {children && (
        <>{children}</>
      )}
    
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {mode === "signup" && (
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            autoComplete="username"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="you@example.com"
                          type="email"
                          autoComplete="email"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete={
                              mode === "signin"
                                ? "current-password"
                                : "new-password"
                            }
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {mode === "signin" ? "Signing In..." : "Creating Account..."}
                    </>
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="text-center text-sm">
                  {mode === "signin" ? (
                    <p>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          setMode("signup")
                          resetForm()
                        }}
                      >
                        Create one
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          setMode("signin")
                          resetForm()
                        }}
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 