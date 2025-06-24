"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Package, ShoppingCart, CreditCard, Download, ChevronDown, ChevronUp, ExternalLink, DollarSign, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ResendEmailButton } from "@/components/dashboard/resend-email-button";

interface OrderItem {
  id: string;
  price: number;
  sampleId?: string;
  samplePackId?: number;
  sample?: {
    title: string;
    id: string;
  } | null;
  samplePack?: {
    id: number;
    title: string;
    price: number;
  } | null;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [creatorOrders, setCreatorOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-orders");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const isCreator = session?.user?.isCreator;
  
  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const res = await fetch("/api/user/orders");
        if (res.ok) {
          const data = await res.json();
          console.log("User orders data:", data.orders[0]?.items);
          setUserOrders(data.orders);
          
          // Initially expand the most recent order
          if (data.orders.length > 0) {
            setExpandedOrders({ [data.orders[0].id]: true });
          }
        }
      } catch (error) {
        console.error("Error fetching user orders:", error);
      }
    };

    const fetchCreatorOrders = async () => {
      if (isCreator) {
        try {
          const res = await fetch("/api/creator/orders");
          if (res.ok) {
            const data = await res.json();
            setCreatorOrders(data.orders);
          }
        } catch (error) {
          console.error("Error fetching creator orders:", error);
        }
      }
    };

    if (session?.user) {
      Promise.all([
        fetchUserOrders(),
        fetchCreatorOrders()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [session, isCreator]);

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time to a readable string
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Toggle order expanded state
  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Get status badge color based on order status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">Completed</Badge>;
      case "PAID":
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">Paid</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors">Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Render empty state when no orders
  const EmptyState = ({ type }: { type: 'purchases' | 'sales' }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-900/40 backdrop-blur-sm rounded-xl border border-zinc-800/60 p-8">
      {type === 'purchases' ? (
        <>
          <ShoppingCart className="h-16 w-16 text-zinc-700 mb-4" />
          <h3 className="text-xl font-medium mb-2">No purchases yet</h3>
          <p className="text-zinc-400 max-w-md mb-6">
            You haven't made any purchases yet. Browse our samples and packs to find some amazing sounds!
          </p>
          <Button asChild>
            <Link href="/samples">Browse Samples</Link>
          </Button>
        </>
      ) : (
        <>
          <DollarSign className="h-16 w-16 text-zinc-700 mb-4" />
          <h3 className="text-xl font-medium mb-2">No sales yet</h3>
          <p className="text-zinc-400 max-w-md">
            You haven't made any sales yet. Keep promoting your samples and packs to attract buyers!
          </p>
        </>
      )}
    </div>
  );

  // Render loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-900/40 backdrop-blur-sm rounded-xl border border-zinc-800/60 overflow-hidden">
          <div className="p-4 bg-zinc-800/20">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="flex justify-end">
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Order History</h1>
          <p className="text-zinc-400 mt-1">View your purchase history and transactions</p>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-zinc-800 bg-zinc-900/50">
            <Receipt className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <Tabs
          defaultValue="my-orders"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="dashboard-tabs-list mb-6">
            <TabsTrigger value="my-orders" className="dashboard-tab">
              <ShoppingCart className="h-4 w-4 mr-2" />
              My Purchases
            </TabsTrigger>
            {isCreator && (
              <TabsTrigger value="sales" className="dashboard-tab">
                <DollarSign className="h-4 w-4 mr-2" />
                My Sales
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-orders">
            {userOrders.length === 0 ? (
              <EmptyState type="purchases" />
            ) : (
              <div className="space-y-6">
                {userOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className={cn(
                      "overflow-hidden border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm transition-all duration-200 group",
                      expandedOrders[order.id] && "shadow-md"
                    )}
                  >
                    <div 
                      className="p-4 bg-zinc-800/20 flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer hover:bg-zinc-800/30 transition-colors"
                      onClick={() => toggleOrderExpanded(order.id)}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            Order #{order.id.substring(0, 8)}
                          </h3>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 sm:mt-0">
                        <div className="flex flex-wrap sm:flex-nowrap sm:items-center gap-2 sm:gap-4 text-sm text-zinc-400">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                            {formatDate(order.createdAt)}
                          </div>
                          <div className="hidden sm:flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                            {formatTime(order.createdAt)}
                          </div>
                          <div>{getStatusBadge(order.status)}</div>
                        </div>
                        <div className="ml-2 sm:ml-4">
                          {expandedOrders[order.id] ? (
                            <ChevronUp className="h-5 w-5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {expandedOrders[order.id] && (
                      <>
                        <CardContent className="p-0">
                          <div className="px-4 py-5 sm:px-6">
                            <div className="bg-zinc-800/20 rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader className="bg-zinc-800/50">
                                  <TableRow className="hover:bg-zinc-800/70 border-none">
                                    <TableHead className="text-zinc-300 font-medium">Item</TableHead>
                                    <TableHead className="text-zinc-300 font-medium">Type</TableHead>
                                    <TableHead className="text-right text-zinc-300 font-medium">Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item) => {
                                    let itemName = "Unknown Item";
                                    let itemType = "Unknown";
                                    
                                    if (item.samplePack && item.samplePack.title) {
                                      itemName = item.samplePack.title;
                                      itemType = "Sample Pack";
                                    } else if (item.sample && item.sample.title) {
                                      itemName = item.sample.title;
                                      itemType = "Sample";
                                    } else if (item.samplePackId) {
                                      itemName = `Sample Pack #${item.samplePackId}`;
                                      itemType = "Sample Pack";
                                    } else if (item.sampleId) {
                                      itemName = `Sample #${item.sampleId}`;
                                      itemType = "Sample";
                                    }
                                    
                                    return (
                                    <TableRow key={item.id} className="hover:bg-zinc-800/30 border-zinc-800/40">
                                      <TableCell className="font-medium">
                                        {itemName}
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant="outline" 
                                          className="bg-zinc-800/80 border-zinc-700 text-zinc-300"
                                        >
                                          {itemType}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        ${item.price.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  )})}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="flex justify-between items-center pb-4 pt-0 px-6">
                          <div className="flex items-center text-sm">
                            <CreditCard className="h-4 w-4 mr-2 text-zinc-500" />
                            <span className="text-zinc-400">Payment method: Credit Card</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-lg">
                              Total: <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                            </div>
                            {order.status === "COMPLETED" && (
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-zinc-700 hover:bg-zinc-800"
                                  asChild
                                >
                                  <Link href={`/dashboard/library`}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Link>
                                </Button>
                                <ResendEmailButton 
                                  orderId={order.id} 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-zinc-700 hover:bg-zinc-800"
                                />
                              </div>
                            )}
                          </div>
                        </CardFooter>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {isCreator && (
            <TabsContent value="sales">
              {creatorOrders.length === 0 ? (
                <EmptyState type="sales" />
              ) : (
                <div className="space-y-6">
                  {creatorOrders.map((order) => (
                    <Card 
                      key={order.id} 
                      className={cn(
                        "overflow-hidden border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm transition-all duration-200 group",
                        expandedOrders[order.id] && "shadow-md"
                      )}
                    >
                      <div 
                        className="p-4 bg-zinc-800/20 flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer hover:bg-zinc-800/30 transition-colors"
                        onClick={() => toggleOrderExpanded(order.id)}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                            <DollarSign className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              Sale #{order.id.substring(0, 8)}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {order.user?.name || "Anonymous"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 sm:mt-0">
                          <div className="flex flex-wrap sm:flex-nowrap sm:items-center gap-2 sm:gap-4 text-sm text-zinc-400">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="hidden sm:flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                              {formatTime(order.createdAt)}
                            </div>
                            <div>{getStatusBadge(order.status)}</div>
                          </div>
                          <div className="ml-2 sm:ml-4">
                            {expandedOrders[order.id] ? (
                              <ChevronUp className="h-5 w-5 text-zinc-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-zinc-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {expandedOrders[order.id] && (
                        <>
                          <CardContent className="p-0">
                            <div className="px-4 py-5 sm:px-6">
                              <div className="bg-zinc-800/20 rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-zinc-800/50">
                                    <TableRow className="hover:bg-zinc-800/70 border-none">
                                      <TableHead className="text-zinc-300 font-medium">Item</TableHead>
                                      <TableHead className="text-right text-zinc-300 font-medium">Price</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {order.items.map((item) => {
                                      let itemName = "Unknown Item";
                                      
                                      if (item.samplePack && item.samplePack.title) {
                                        itemName = item.samplePack.title;
                                      } else if (item.sample && item.sample.title) {
                                        itemName = item.sample.title;
                                      } else if (item.samplePackId) {
                                        itemName = `Sample Pack #${item.samplePackId}`;
                                      } else if (item.sampleId) {
                                        itemName = `Sample #${item.sampleId}`;
                                      }
                                      
                                      return (
                                      <TableRow key={item.id} className="hover:bg-zinc-800/30 border-zinc-800/40">
                                        <TableCell className="font-medium">
                                          {itemName}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          ${item.price.toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    )})}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex justify-between items-center pb-4 pt-0 px-6">
                            <div className="flex items-center text-sm">
                              <CreditCard className="h-4 w-4 mr-2 text-zinc-500" />
                              <span className="text-zinc-400">Payment processed: {formatDate(order.createdAt)}</span>
                            </div>
                            
                            <div className="font-medium text-lg">
                              Total: <span className="text-green-400">${order.totalAmount.toFixed(2)}</span>
                            </div>
                          </CardFooter>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
} 