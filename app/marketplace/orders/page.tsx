"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCropImage } from "@/lib/asset-mapping";
import { DashboardSkeleton } from "@/components/sidebar/dashboard-skeleton";
import { motion } from "framer-motion";
import { Package, Calendar, ArrowRight, CheckCircle2, Clock, XCircle, ShoppingCart } from "lucide-react";
import { ClientAnimationWrapper } from "@/components/ui/preloader/ClientAnimationWrapper";
import { cn } from "@/lib/utils";

export default function BuyerOrdersPage() {
  const { user, isLoaded } = useUser();
  
  const convexUser = useQuery(api.users.getRoleByClerkId, 
    isLoaded && user?.id ? { clerkId: user.id } : "skip"
  );

  const orders = useQuery(api.crud.list, 
    { table: "orders" }
  );

  const myOrders = React.useMemo(() => {
    if (!orders || !convexUser?.id) return [];
    return orders.filter((o: any) => o.buyerId === convexUser.id);
  }, [orders, convexUser]);

  if (!isLoaded || orders === undefined) {
    return <DashboardSkeleton />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle2 className="size-4 text-emerald-500" />;
      case "cancelled": return <XCircle className="size-4 text-red-500" />;
      case "shipped": return <Package className="size-4 text-blue-500" />;
      default: return <Clock className="size-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Purchase History</h1>
        <p className="text-zinc-500 font-medium">Tuesday, April 7, 2026 • Tracking your farmgate orders</p>
      </div>

      <ClientAnimationWrapper>
        <div className="space-y-4">
          {myOrders.map((order: any, index: number) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group overflow-hidden border-none bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                    <div className="w-full sm:w-32 h-32 sm:h-auto aspect-video sm:aspect-square overflow-hidden">
                      <img 
                        src={getCropImage("Wheat")} // Fallback as we don't have listing join here easily without custom query
                        className="w-full h-full object-cover"
                        alt="Order Item"
                      />
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Order #{order._id.slice(-6)}</span>
                          <Badge variant="outline" className="capitalize flex items-center gap-1.5 py-0.5">
                            {getStatusIcon(order.orderStatus)}
                            {order.orderStatus}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                          Direct Farm Purchase
                          <ArrowRight className="size-4 text-zinc-300" />
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {new Date(order._creationTime).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="size-3.5" />
                            Qty: Standard
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Amount</p>
                        <p className="text-3xl font-black text-zinc-900">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                        <Badge className={cn(
                          "mt-2",
                          order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {order.paymentStatus === "paid" ? "Payment Successful" : "Payment Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {myOrders.length === 0 && (
            <div className="py-20 text-center">
              <div className="size-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="size-10 text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">No orders yet</h3>
              <p className="text-zinc-500">Your farmgate purchases will appear here.</p>
              <Button asChild className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <Link href="/marketplace">Go to Discovery Feed</Link>
              </Button>
            </div>
          )}
        </div>
      </ClientAnimationWrapper>
    </div>
  );
}
