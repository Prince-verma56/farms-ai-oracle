"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCropImage } from "@/lib/asset-mapping";
import { DashboardSkeleton } from "@/components/sidebar/dashboard-skeleton";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Package } from "lucide-react";
import { ClientAnimationWrapper } from "@/components/ui/preloader/ClientAnimationWrapper";

export default function InventoryPage() {
  const { user, isLoaded } = useUser();
  
  const convexUser = useQuery(api.users.getRoleByClerkId, 
    isLoaded && user?.id ? { clerkId: user.id } : "skip"
  );

  const listings = useQuery(api.listings.listByFarmer, 
    convexUser?.id ? { farmerId: convexUser.id } : "skip"
  );

  if (!isLoaded || listings === undefined) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Inventory</h1>
          <p className="text-muted-foreground">Manage your listed crops and AI price insights.</p>
        </div>
      </div>

      <ClientAnimationWrapper>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <motion.div
              key={listing._id}
              layoutId={listing._id}
              className="group"
            >
              <Card className="overflow-hidden bg-card/50 backdrop-blur-md border border-primary/10 hover:border-primary/20 transition-all shadow-sm hover:shadow-md">
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img 
                    src={listing.imageUrl || getCropImage(listing.cropName)} 
                    alt={listing.cropName}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={listing.status === "available" ? "default" : "secondary"}>
                      {listing.status === "available" ? "In Stock" : "Sold Out"}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {listing.cropName}
                    <span className="text-primary font-bold">₹{listing.pricePerKg}/kg</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Package className="size-3" />
                    {listing.quantity} available
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground line-clamp-2 h-10">
                  {listing.description}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                    <Link href={`/admin/ai-oracle?commodity=${listing.cropName}&city=${listing.location}`}>
                      <Sparkles className="size-3.5 text-primary" />
                      Check AI Price
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
          
          {listings.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Package className="size-12 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">No crops listed yet</h3>
              <p className="text-muted-foreground">List your first crop to start using the AI Oracle.</p>
            </div>
          )}
        </div>
      </ClientAnimationWrapper>
    </div>
  );
}
