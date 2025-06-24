"use client"

import { useSession } from "next-auth/react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardContainer } from "@/components/dashboard/dashboard-container"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, User, Bell, Shield, CreditCard, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("account")
  
  if (!session) return null

  return (
    <div className="space-y-4">
      <DashboardHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />
      
      <Tabs defaultValue="account" className="space-y-4" onValueChange={setActiveTab}>
        <DashboardContainer className="p-0 overflow-x-auto">
          <TabsList className="bg-transparent border-b border-zinc-800/60 p-0 h-auto w-full justify-start rounded-none">
            <div className="flex space-x-1 p-1">
              <TabsTrigger 
                value="account" 
                className={`rounded-md px-3 py-2 text-sm ${activeTab === 'account' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'}`}
              >
                Account
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className={`rounded-md px-3 py-2 text-sm ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'}`}
              >
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className={`rounded-md px-3 py-2 text-sm ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'}`}
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className={`rounded-md px-3 py-2 text-sm ${activeTab === 'billing' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'}`}
              >
                Billing
              </TabsTrigger>
            </div>
          </TabsList>
        </DashboardContainer>
        
        <TabsContent value="account" className="space-y-4 m-0">
          <DashboardContainer>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Account Information</h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={session.user?.email || ""} 
                    className="bg-black/40 border-zinc-800/60" 
                    readOnly 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    defaultValue={session.user?.name || ""} 
                    className="bg-black/40 border-zinc-800/60" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="default" size="sm">
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DashboardContainer>
          
          <DashboardContainer>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Security</h2>
              
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  className="bg-black/40 border-zinc-800/60 max-w-md" 
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    className="bg-black/40 border-zinc-800/60" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    className="bg-black/40 border-zinc-800/60" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="default" size="sm">
                  <Shield className="mr-1.5 h-3.5 w-3.5" />
                  Update Password
                </Button>
              </div>
            </div>
          </DashboardContainer>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4 m-0">
          <DashboardContainer>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Profile Information</h2>
              
              <div className="flex items-center gap-4 pb-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarImage src={session.user?.image || ""} />
                  <AvatarFallback>
                    <User className="h-8 w-8 text-zinc-400" />
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <Button variant="outline" size="sm" className="relative">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Change Avatar
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*" 
                    />
                  </Button>
                </div>
              </div>
              
              <Separator className="bg-zinc-800/60" />
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input 
                    id="display-name" 
                    defaultValue={session.user?.name || ""} 
                    className="bg-black/40 border-zinc-800/60" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio" 
                    rows={4} 
                    className="w-full px-3 py-2 bg-black/40 border border-zinc-800/60 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="default" size="sm">
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Profile
                </Button>
              </div>
            </div>
          </DashboardContainer>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4 m-0">
          <DashboardContainer>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-zinc-400">Receive updates via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator className="bg-zinc-800/60" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-zinc-400">Receive marketing and promotional emails</p>
                  </div>
                  <Switch />
                </div>
                
                <Separator className="bg-zinc-800/60" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New Sample Alerts</h3>
                    <p className="text-sm text-zinc-400">Get notified when new samples are available</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="default" size="sm">
                  <Bell className="mr-1.5 h-3.5 w-3.5" />
                  Save Preferences
                </Button>
              </div>
            </div>
          </DashboardContainer>
        </TabsContent>
        
        <TabsContent value="billing" className="space-y-4 m-0">
          <DashboardContainer>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Payment Methods</h2>
              
              <div className="p-4 border border-zinc-800/60 rounded-md bg-black/40">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-800/60 rounded-md flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium">No payment methods</p>
                      <p className="text-sm text-zinc-400">Add a payment method to purchase samples</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Add Method
                  </Button>
                </div>
              </div>
              
              <h2 className="text-lg font-semibold pt-4">Billing History</h2>
              
              <div className="p-6 border border-zinc-800/60 rounded-md bg-black/40 text-center">
                <p className="text-zinc-400">No billing history available</p>
              </div>
            </div>
          </DashboardContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
} 