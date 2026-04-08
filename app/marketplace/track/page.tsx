"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Package, CheckCircle2, Phone, Mail, Clock, ShieldCheck, Search, Navigation, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClientAnimationWrapper } from "@/components/ui/preloader/ClientAnimationWrapper";
import { DashboardSkeleton } from "@/components/sidebar/dashboard-skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TrackShipmentsPage() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const [searchId, setSearchId] = React.useState("");

  const order = useQuery(api.orders.getOrderDetails, 
    orderIdParam ? { orderId: orderIdParam as any } : "skip"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
       window.location.href = `/marketplace/track?orderId=${searchId.trim()}`;
    }
  };

  if (!orderIdParam) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6 px-4">
        <div className="size-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Truck className="size-10 text-zinc-300 dark:text-zinc-600" />
        </div>
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white mt-2">No Order Selected</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-xs mx-auto font-medium">Select an order from your history or search directly by ID below.</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full max-w-md group mt-8">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
           <Input 
             placeholder="Paste Order ID here... (e.g. j57...)" 
             value={searchId}
             onChange={(e) => setSearchId(e.target.value)}
             className="h-14 pl-12 pr-4 rounded-[1.25rem] bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-2xl shadow-emerald-900/5 focus:ring-emerald-600/20 text-lg font-bold"
           />
           <Button type="submit" className="absolute right-2 top-2 bottom-2 bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 text-white rounded-xl px-4 font-black transition-all">
              Track
           </Button>
        </form>

        <div className="pt-8">
            <Button asChild variant="ghost" className="text-zinc-400 hover:text-zinc-500 font-bold">
              <Link href="/marketplace/orders">Browse Purchase History</Link>
            </Button>
        </div>
      </div>
    );
  }

  if (order === undefined) {
    return <DashboardSkeleton />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4 px-4">
        <XCircle className="size-16 text-red-200 dark:text-red-900/30" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Order Not Found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-center">We couldn't find a shipment with ID "{orderIdParam}". Please check the ID and try again.</p>
        <Button asChild className="mt-4 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl h-12 px-8 font-bold">
           <Link href="/marketplace/track">Back to Search</Link>
        </Button>
      </div>
    );
  }

  const getStatusStep = (currentStatus: string) => {
    const sequence = ["placed", "shipped", "delivered"];
    const currentIndex = sequence.indexOf(currentStatus);
    
    return [
      { 
        title: "Order Placed", 
        date: new Date(order._creationTime).toLocaleDateString(), 
        status: currentIndex >= 0 ? "completed" : "pending", 
        icon: <Package className="size-4" /> 
      },
      { 
        title: "Quality Verified", 
        date: "AI Verified at Farmgate", 
        status: currentIndex >= 0 ? "completed" : "pending", 
        icon: <ShieldCheck className="size-4" /> 
      },
      { 
        title: "In Transit", 
        date: order.orderStatus === "shipped" ? "Moving to Hub" : "Shipment Ready", 
        status: order.orderStatus === "shipped" ? "active" : currentIndex > 1 ? "completed" : "pending", 
        icon: <Truck className="size-4" /> 
      },
      { 
        title: "Delivered", 
        date: order.orderStatus === "delivered" ? new Date().toLocaleDateString() : "Expected shortly", 
        status: order.orderStatus === "delivered" ? "completed" : "pending", 
        icon: <MapPin className="size-4" /> 
      },
    ];
  };

  const steps = getStatusStep(order.orderStatus);

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 font-bold px-3 uppercase tracking-tighter text-[10px]">Live Tracking</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mt-2">Logistics Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">Order #{order._id.slice(-8)} • {order.cropName} ({order.quantity})</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-80 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
           <Input 
             placeholder="Track by Order ID..." 
             value={searchId}
             onChange={(e) => setSearchId(e.target.value)}
             className="h-12 pl-11 pr-4 rounded-2xl bg-white border-zinc-100 shadow-xl shadow-emerald-900/5 focus:ring-emerald-600/20"
           />
        </form>
      </div>

      <ClientAnimationWrapper>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-none bg-white/80 backdrop-blur-3xl shadow-2xl shadow-emerald-900/5 rounded-[3rem] overflow-hidden border border-emerald-50/50">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black">Shipment Progress</CardTitle>
                  <CardDescription className="font-medium text-emerald-600 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3" />
                      {order.location} → <span className="text-zinc-500">
                      {order.deliveryAddress 
                        ? (typeof order.deliveryAddress === 'object' 
                            ? [order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode].filter(Boolean).join(", ")
                            : order.deliveryAddress)
                        : "Destination Address Pending"}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <Badge className={cn(
                  "px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest border-none shadow-lg",
                  order.orderStatus === "delivered" ? "bg-emerald-500 text-white" : "bg-blue-600 text-white animate-pulse"
                )}>
                  {order.orderStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-1 bottom-1 w-[2px] bg-zinc-100" />
                
                <div className="space-y-10 relative">
                  {steps.map((step, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative flex items-start gap-10 pl-1"
                    >
                      <div className={cn(
                        "size-12 rounded-full flex items-center justify-center z-10 shadow-xl transition-all duration-700",
                        step.status === "completed" ? "bg-emerald-500 text-white scale-110 shadow-emerald-200" : 
                        step.status === "active" ? "bg-blue-600 text-white animate-pulse scale-110 shadow-blue-200" : 
                        "bg-white border-2 border-zinc-100 text-zinc-300"
                      )}>
                        {step.status === "completed" ? <CheckCircle2 className="size-5" /> : step.icon}
                      </div>
                      <div className="space-y-1 pt-2">
                        <h3 className={cn(
                          "font-black text-lg transition-colors duration-500",
                          step.status === "pending" ? "text-zinc-300" : "text-zinc-900"
                        )}>
                          {step.title}
                        </h3>
                        <p className="text-sm font-bold text-zinc-400">{step.date}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Farmer Intelligence</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/5 shadow-inner">
                      <User className="size-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-black text-xl">{order.farmerName}</p>
                      <p className="text-zinc-400 text-sm font-medium">Verified Direct Producer</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors cursor-pointer group/item">
                       <div className="size-9 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:bg-emerald-500/20 transition-colors">
                        <Mail className="size-4" />
                       </div>
                       <span className="text-sm font-medium">{order.farmerEmail}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors cursor-pointer group/item">
                       <div className="size-9 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:bg-emerald-500/20 transition-colors">
                        <Phone className="size-4" />
                       </div>
                       <span className="text-sm font-medium">+91 ••••• ••{order._id.slice(-2)}</span>
                    </div>
                  </div>

                  <Button className="w-full h-14 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl transition-all active:scale-95 shadow-xl mt-4">
                    Contact Provider
                  </Button>
               </div>
            </Card>

            <Card className="border-none bg-emerald-50/50 rounded-[2rem] p-6 border border-emerald-100/50">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Clock className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950">Shipment Integrity</h4>
                    <p className="text-xs font-medium text-emerald-700/70">Transit insured by FarmDirect</p>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </ClientAnimationWrapper>
    </div>
  );
}

function User({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
