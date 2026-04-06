"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Package, CheckCircle2 } from "lucide-react";
import { ClientAnimationWrapper } from "@/components/ui/preloader/ClientAnimationWrapper";

export default function TrackShipmentsPage() {
  const steps = [
    { title: "Order Placed", date: "April 5, 2026", status: "completed", icon: <Package className="size-4" /> },
    { title: "Quality Verified", date: "April 6, 2026", status: "completed", icon: <CheckCircle2 className="size-4" /> },
    { title: "In Transit", date: "April 7, 2026", status: "active", icon: <Truck className="size-4" /> },
    { title: "Delivered", date: "Expected April 9", status: "pending", icon: <MapPin className="size-4" /> },
  ];

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Live Tracking</h1>
        <p className="text-zinc-500 font-medium">Tracking Order #FDP-99281 • Wheat (120 quintal)</p>
      </div>

      <ClientAnimationWrapper>
        <Card className="border-none bg-white/70 backdrop-blur-xl shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <CardTitle>Shipment Progress</CardTitle>
                <CardDescription>Ludhiana, Punjab → Jaipur, Rajasthan</CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold px-4 py-1 rounded-full">
                In Transit
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-zinc-100" />
              
              <div className="space-y-12">
                {steps.map((step, i) => (
                  <div key={i} className="relative flex items-start gap-8 pl-2">
                    <div className={`size-10 rounded-full flex items-center justify-center z-10 shadow-sm transition-colors duration-500 ${
                      step.status === "completed" ? "bg-emerald-500 text-white" : 
                      step.status === "active" ? "bg-blue-500 text-white animate-pulse" : 
                      "bg-zinc-100 text-zinc-400"
                    }`}>
                      {step.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className={`font-bold ${step.status === "pending" ? "text-zinc-400" : "text-zinc-900"}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-zinc-500">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-zinc-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Truck className="size-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Carrier Details</p>
                  <p className="font-bold">FarmDirect Logistics • GJ-01-XX-9921</p>
                </div>
              </div>
              <button className="w-full md:w-auto bg-white text-zinc-900 font-bold px-8 py-3 rounded-2xl hover:bg-zinc-200 transition-colors">
                Contact Driver
              </button>
            </div>
          </CardContent>
        </Card>
      </ClientAnimationWrapper>
    </div>
  );
}
