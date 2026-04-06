"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/sidebar/dashboard-skeleton";
import { motion } from "framer-motion";
import { Package, Calendar, User, IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { ClientAnimationWrapper } from "@/components/ui/preloader/ClientAnimationWrapper";
import { cn } from "@/lib/utils";

export default function SalesTrackingPage() {
  const { user, isLoaded } = useUser();
  
  const convexUser = useQuery(api.users.getRoleByClerkId, 
    isLoaded && user?.id ? { clerkId: user.id } : "skip"
  );

  const orders = useQuery(api.crud.list, 
    { table: "orders" }
  );

  const sales = React.useMemo(() => {
    if (!orders || !convexUser?.id) return [];
    return orders.filter((o: any) => o.farmerId === convexUser.id);
  }, [orders, convexUser]);

  if (!isLoaded || orders === undefined) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Sales Tracking</h1>
        <p className="text-muted-foreground font-medium">Tuesday, April 7, 2026 • Monitor your incoming farm orders</p>
      </div>

      <ClientAnimationWrapper>
        <div className="grid gap-4">
          {sales.map((order: any, index: number) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-none bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={cn(
                  "h-1 w-full",
                  order.paymentStatus === "paid" ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
                        <Package className="size-6 text-zinc-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Order #{order._id.slice(-6)}</span>
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter h-5">
                            {order.orderStatus}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                          Direct Sale
                          <span className="text-zinc-300 font-normal">/</span>
                          <span className="text-primary">Wheat</span>
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 md:justify-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</p>
                        <p className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                          <User className="size-3" />
                          Verified Buyer
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</p>
                        <p className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                          <Calendar className="size-3" />
                          {new Date(order._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Revenue</p>
                        <p className="text-xl font-black text-zinc-900 flex items-center justify-end gap-0.5">
                          <IndianRupee className="size-4" />
                          {order.totalAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.paymentStatus === "paid" ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold">
                          <CheckCircle2 className="size-3.5" />
                          Paid
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold">
                          <Clock className="size-3.5" />
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {sales.length === 0 && (
            <div className="py-20 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
              <Package className="size-12 mx-auto text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-zinc-900">No sales yet</h3>
              <p className="text-zinc-500">When buyers purchase your crops, they will appear here.</p>
            </div>
          )}
        </div>
      </ClientAnimationWrapper>
    </div>
  );
}
