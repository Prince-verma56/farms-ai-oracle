"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import Map, {
  FullscreenControl,
  GeolocateControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  type LayerProps,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl from "mapbox-gl";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleSwitcher } from "@/components/navigation/role-switcher";

type Role = "farmer" | "buyer";
type MapMode = "streets" | "satellite" | "hybrid";
type ListingPoint = {
  id: string;
  cropName: string;
  pricePerKg: number;
  farmerName: string;
  approxLat: number;
  approxLng: number;
  distanceKm: number;
};
type DemandSpot = {
  id: string;
  lat: number;
  lng: number;
  count: number;
};

const indiaFallback = { lat: 22.9734, lng: 78.6569 };

const heatLayer: LayerProps = {
  id: "demand-heat",
  type: "heatmap",
  paint: {
    "heatmap-weight": ["get", "count"],
    "heatmap-intensity": 1,
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(16,185,129,0)",
      0.2,
      "#10B981",
      0.5,
      "#F59E0B",
      0.8,
      "#EF4444",
    ],
    "heatmap-radius": 25,
    "heatmap-opacity": 0.75,
  },
};

const buildingsLayer: LayerProps = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 14,
  paint: {
    "fill-extrusion-color": "#9ca3af",
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["get", "min_height"],
    "fill-extrusion-opacity": 0.45,
  },
};

function getBriefSystemPrompt(role: Role) {
  if (role === "farmer") {
    return "You are a local agricultural market analyst for Indian farmers. Generate a 2-sentence market brief. Be specific with numbers. Sound like Bloomberg but for farmers. Return plain text only, no markdown.";
  }
  return "You are a farm-fresh produce advisor. Generate a 2-sentence brief on best buys near the user. Mention specific crops and prices. Return plain text only.";
}

export default function HubPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<Role | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [cityLabel, setCityLabel] = useState("Local area");
  const [selectedListing, setSelectedListing] = useState<ListingPoint | null>(null);
  const [selectedDemandSpot, setSelectedDemandSpot] = useState<DemandSpot | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefText, setBriefText] = useState("");
  const [typedBrief, setTypedBrief] = useState("");
  const [greetingText, setGreetingText] = useState("");
  const [greetingLoading, setGreetingLoading] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("streets");
  const [is3D, setIs3D] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const hasValidMapToken = mapToken.startsWith("pk.") && !mapToken.includes("your_token_here");
  const mapRef = useRef<MapRef | null>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);
  const roleFromMetadata = user?.publicMetadata?.role;
  const clerkId = user?.id;

  const userRecord = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const updateUserLocation = useMutation(api.users.updateUserLocation);

  const nearbyListings = useQuery(
    api.listings.getListingsNearby,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 50, limit: 100 } : "skip"
  );
  const nearbyUsers = useQuery(
    api.users.getUsersNearby,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 50 } : "skip"
  );
  const crossRoleSummary = useQuery(
    api.orders.getCrossRoleSummary,
    clerkId ? { clerkId } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (roleFromMetadata === "farmer" || roleFromMetadata === "buyer") {
      setRole(roleFromMetadata);
      return;
    }
    if (userRecord?.success && (userRecord.data?.role === "farmer" || userRecord.data?.role === "buyer")) {
      setRole(userRecord.data.role);
      return;
    }
    setRole(null);
  }, [isLoaded, user, roleFromMetadata, userRecord]);

  useEffect(() => {
    if (!userRecord?.success || !userRecord.data) return;
    if (typeof userRecord.data.lat === "number" && typeof userRecord.data.lng === "number") {
      setLocation({ lat: userRecord.data.lat, lng: userRecord.data.lng });
    }
  }, [userRecord]);

  useEffect(() => {
    if (location || locationDenied || !isLoaded || !user) return;
    if (!("geolocation" in navigator)) {
      setLocationDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(2));
        const lng = Number(position.coords.longitude.toFixed(2));
        setLocation({ lat, lng });
        const result = await updateUserLocation({ lat, lng });
        if (!result.success) toast.error(result.error || "Failed to save location");
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [location, locationDenied, isLoaded, user, updateUserLocation]);

  useEffect(() => {
    if (!location || !mapToken) return;
    const controller = new AbortController();
    const run = async () => {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json?access_token=${mapToken}`;
      const res = await fetch(url, { signal: controller.signal });
      const json = (await res.json()) as {
        features?: Array<{ place_name?: string }>;
      };
      const place = json.features?.[0]?.place_name || "Local area";
      setCityLabel(place);
      toast.success(`Location detected: ${place}`);
    };
    run().catch(() => null);
    return () => controller.abort();
  }, [location, mapToken]);

  useEffect(() => {
    if (!location || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 11,
      duration: 2000,
    });
  }, [location]);

  useEffect(() => {
    if (!mapLoaded || !hasValidMapToken || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (geocoderRef.current) return;

    const geocoder = new MapboxGeocoder({
      accessToken: mapToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      countries: "in",
      placeholder: "Search city, mandi, or area...",
      flyTo: false,
    });

    geocoder.on("result", async (event: { result?: { center?: [number, number]; place_name?: string } }) => {
      const center = event.result?.center;
      if (!center) return;
      const lng = Number(center[0].toFixed(2));
      const lat = Number(center[1].toFixed(2));
      setLocation({ lat, lng });
      setCityLabel(event.result?.place_name || "Selected location");
      map.flyTo({ center: [lng, lat], zoom: 11, duration: 1200 });
      const result = await updateUserLocation({ lat, lng });
      if (!result.success) toast.error(result.error || "Failed to save location");
    });

    map.addControl(geocoder as unknown as mapboxgl.IControl, "top-left");
    geocoderRef.current = geocoder;

    return () => {
      if (geocoderRef.current) {
        map.removeControl(geocoderRef.current as unknown as mapboxgl.IControl);
        geocoderRef.current = null;
      }
    };
  }, [mapLoaded, hasValidMapToken, mapToken, updateUserLocation]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (is3D) {
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.25 });
      map.easeTo({ pitch: 60, bearing: 20, duration: 900 });
      return;
    }
    map.setTerrain(null);
    map.easeTo({ pitch: 0, bearing: 0, duration: 700 });
  }, [is3D, mapLoaded, mapMode]);

  const listingData = nearbyListings?.success ? nearbyListings.data : [];
  const listingPoints = useMemo<ListingPoint[]>(
    () =>
      listingData.map((item) => ({
        id: item.id,
        cropName: item.cropName,
        pricePerKg: item.pricePerKg,
        farmerName: item.farmerName,
        approxLat: item.approxLat,
        approxLng: item.approxLng,
        distanceKm: item.distanceKm,
      })),
    [listingData]
  );

  const demandGeojson = useMemo(() => {
    const points = (nearbyUsers?.success ? nearbyUsers.data : []).map((item, idx) => ({
      type: "Feature",
      properties: { count: item.count, id: String(idx) },
      geometry: { type: "Point", coordinates: [item.lng, item.lat] as [number, number] },
    }));
    return { type: "FeatureCollection", features: points } as const;
  }, [nearbyUsers]);
  const demandSpots = useMemo<DemandSpot[]>(
    () =>
      (nearbyUsers?.success ? nearbyUsers.data : []).map((item, idx) => ({
        id: String(idx),
        lat: item.lat,
        lng: item.lng,
        count: item.count,
      })),
    [nearbyUsers]
  );

  const quickStats = useMemo(() => {
    const avgPrice =
      listingPoints.length > 0
        ? listingPoints.reduce((sum, listing) => sum + listing.pricePerKg, 0) / listingPoints.length
        : 0;
    if (role === "farmer") {
      return [
        { label: "Listings Nearby", value: String(listingPoints.length) },
        { label: "Avg Wheat Price", value: `₹${avgPrice.toFixed(2)}/kg` },
        { label: "Active Buyers", value: String((nearbyUsers?.data || []).length) },
      ];
    }
    const mandiBaseline = avgPrice > 0 ? avgPrice * 1.08 : 0;
    const savings = mandiBaseline > 0 ? ((mandiBaseline - avgPrice) / mandiBaseline) * 100 : 0;
    return [
      { label: "Fresh Listings Today", value: String(listingPoints.length) },
      { label: "Avg Savings vs Mandi", value: `${Math.max(0, savings).toFixed(1)}%` },
      { label: "Farmers within 50km", value: String(new Set(listingPoints.map((l) => l.farmerName)).size) },
    ];
  }, [role, listingPoints, nearbyUsers]);

  useEffect(() => {
    if (!location || listingPoints.length === 0 || !isLoaded || !user || !role) return;
    const run = async () => {
      setBriefLoading(true);
      setTypedBrief("");
      try {
        const avgByCrop: Record<string, number> = {};
        for (const item of listingPoints.slice(0, 20)) {
          if (!avgByCrop[item.cropName]) avgByCrop[item.cropName] = 0;
          avgByCrop[item.cropName] += item.pricePerKg;
        }
        const context = {
          role,
          nearbyListingsCount: listingPoints.length,
          avgPricePerCrop: avgByCrop,
          activeBuyersNearby: (nearbyUsers?.data || []).length,
          topCropInDemand: listingPoints[0]?.cropName || "Wheat",
          userDistrict: cityLabel,
        };
        const response = await fetch("/api/openrouter/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              { role: "system", content: getBriefSystemPrompt(role) },
              { role: "user", content: JSON.stringify(context) },
            ],
          }),
        });
        const json = (await response.json()) as { reply?: string; error?: string };
        if (!response.ok || !json.reply) throw new Error(json.error || "Unable to generate market brief");
        setBriefText(json.reply);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to generate market brief";
        setBriefText(message);
      } finally {
        setBriefLoading(false);
      }
    };
    run().catch(() => null);
  }, [location, listingPoints, role, cityLabel, nearbyUsers, isLoaded, user]);

  useEffect(() => {
    if (!briefText) return;
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTypedBrief(briefText.slice(0, index));
      if (index >= briefText.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [briefText]);

  useEffect(() => {
    if (!isLoaded || !user || !clerkId || !crossRoleSummary?.success) return;

    const run = async () => {
      setGreetingLoading(true);
      try {
        const payload = {
          name: user.firstName || "there",
          pendingDeliveriesAsFarmer: crossRoleSummary.data.pendingFarmerDeliveries,
          activePurchasesAsBuyer: crossRoleSummary.data.activeBuyerPurchases,
        };

        const response = await fetch("/api/openrouter/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              {
                role: "system",
                content:
                  "Generate exactly one plain-text greeting sentence for FarmDirect hub. Include farmer pending deliveries and buyer active purchases from input. No markdown.",
              },
              { role: "user", content: JSON.stringify(payload) },
            ],
          }),
        });

        const json = (await response.json()) as { reply?: string };
        const fallback = `Welcome back ${payload.name}. You have ${payload.pendingDeliveriesAsFarmer} pending deliveries as a Farmer and ${payload.activePurchasesAsBuyer} active purchase${payload.activePurchasesAsBuyer === 1 ? "" : "s"} as a Buyer.`;
        setGreetingText(json.reply?.trim() || fallback);
      } catch {
        const pending = crossRoleSummary.data.pendingFarmerDeliveries;
        const active = crossRoleSummary.data.activeBuyerPurchases;
        setGreetingText(
          `Welcome back ${user.firstName || "there"}. You have ${pending} pending deliveries as a Farmer and ${active} active purchase${active === 1 ? "" : "s"} as a Buyer.`
        );
      } finally {
        setGreetingLoading(false);
      }
    };

    run().catch(() => null);
  }, [isLoaded, user, clerkId, crossRoleSummary]);

  const onManualCitySearch = async () => {
    if (!manualCity.trim() || !mapToken) return;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      manualCity.trim()
    )}.json?access_token=${mapToken}&limit=1`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      features?: Array<{ center?: [number, number]; place_name?: string }>;
    };
    const center = json.features?.[0]?.center;
    if (!center) {
      toast.error("City not found");
      return;
    }
    const lng = Number(center[0].toFixed(2));
    const lat = Number(center[1].toFixed(2));
    setLocation({ lat, lng });
    setCityLabel(json.features?.[0]?.place_name || manualCity.trim());
    const result = await updateUserLocation({ lat, lng });
    if (!result.success) toast.error(result.error || "Failed to save location");
  };

  const listingGeoJson = useMemo(
    () => ({
      type: "FeatureCollection",
      features: listingPoints.map((listing) => ({
        type: "Feature",
        properties: {
          id: listing.id,
          cropName: listing.cropName,
          pricePerKg: listing.pricePerKg,
          farmerName: listing.farmerName,
          distanceKm: listing.distanceKm,
        },
        geometry: { type: "Point", coordinates: [listing.approxLng, listing.approxLat] as [number, number] },
      })),
    }),
    [listingPoints]
  );

  const ctaHref = role === "farmer" ? "/admin" : role === "buyer" ? "/marketplace" : "/onboarding";
  const ctaLabel = role === "farmer" ? "Open Farm Console" : role === "buyer" ? "Explore Marketplace" : "Set Role";
  const mapStyle = useMemo(() => {
    if (mapMode === "satellite") return "mapbox://styles/mapbox/satellite-v9";
    if (mapMode === "hybrid") return "mapbox://styles/mapbox/satellite-streets-v12";
    return resolvedTheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";
  }, [mapMode, resolvedTheme]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-4rem)] p-3 md:p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 md:mb-4">
        <div>
          <p className="text-xs text-muted-foreground">FarmDirect Hub</p>
          <h1 className="text-lg font-black md:text-2xl">Good morning {user?.firstName || "there"}</h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {greetingLoading ? "Syncing dual-identity summary..." : greetingText || "Preparing your workspace insight..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleSwitcher role={role} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[55%_45%]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative h-[40vh] w-full md:h-[55vh] lg:h-[78vh]">
              {!hasValidMapToken ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Invalid or missing NEXT_PUBLIC_MAPBOX_TOKEN. Add a real Mapbox public token in .env.local.
                </div>
              ) : (
                <Map
                  ref={mapRef}
                  onLoad={() => setMapLoaded(true)}
                  mapboxAccessToken={mapToken}
                  style={{ width: "100%", height: "100%" }}
                  initialViewState={{
                    latitude: location?.lat ?? indiaFallback.lat,
                    longitude: location?.lng ?? indiaFallback.lng,
                    zoom: 11,
                  }}
                  mapStyle={mapStyle}
                >
                  <Source
                    id="mapbox-dem"
                    type="raster-dem"
                    url="mapbox://mapbox.mapbox-terrain-dem-v1"
                    tileSize={512}
                    maxzoom={14}
                  />
                  <NavigationControl position="top-right" />
                  <GeolocateControl position="top-right" />
                  <FullscreenControl position="top-right" />
                  <ScaleControl position="bottom-right" />

                  {role === "buyer" ? (
                    <>
                      <Source id="nearby-listings" type="geojson" data={listingGeoJson as GeoJSON.FeatureCollection}>
                        {listingPoints.map((listing) => (
                          <Marker
                            key={listing.id}
                            latitude={listing.approxLat}
                            longitude={listing.approxLng}
                            color="#10B981"
                            onClick={(event) => {
                              event.originalEvent.stopPropagation();
                              setSelectedListing(listing);
                            }}
                          />
                        ))}
                      </Source>
                      {selectedListing ? (
                        <Popup
                          latitude={selectedListing.approxLat}
                          longitude={selectedListing.approxLng}
                          closeOnClick={false}
                          onClose={() => setSelectedListing(null)}
                        >
                          <div className="space-y-1">
                            <p className="font-semibold">{selectedListing.cropName}</p>
                            <p className="text-xs">₹{selectedListing.pricePerKg.toFixed(2)}/kg</p>
                            <p className="text-xs">{selectedListing.farmerName}</p>
                            <Button
                              size="sm"
                              className="mt-1 w-full"
                              onClick={() => router.push(`/marketplace?listingId=${selectedListing.id}`)}
                            >
                              View Listing
                            </Button>
                          </div>
                        </Popup>
                      ) : null}
                      {is3D && mapMode !== "satellite" ? <Layer {...buildingsLayer} /> : null}
                    </>
                  ) : role === "farmer" ? (
                    <>
                      <Source id="demand-source" type="geojson" data={demandGeojson as GeoJSON.FeatureCollection}>
                        <Layer {...heatLayer} />
                      </Source>
                      {demandSpots.map((spot) => (
                        <Marker key={spot.id} latitude={spot.lat} longitude={spot.lng}>
                          <button
                            type="button"
                            onMouseEnter={() => setSelectedDemandSpot(spot)}
                            onClick={() => {
                              setSelectedDemandSpot(spot);
                              mapRef.current?.flyTo({
                                center: [spot.lng, spot.lat],
                                zoom: 12,
                                duration: 800,
                              });
                            }}
                            className="relative rounded-full border-2 border-white bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-md"
                          >
                            {spot.count}
                            <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-400 ring-2 ring-white" />
                          </button>
                        </Marker>
                      ))}
                      {selectedDemandSpot ? (
                        <Popup
                          latitude={selectedDemandSpot.lat}
                          longitude={selectedDemandSpot.lng}
                          closeOnClick={false}
                          onClose={() => setSelectedDemandSpot(null)}
                        >
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold">Buyer Search Activity</p>
                            <p>{selectedDemandSpot.count} buyers active in this area</p>
                            <p className="text-muted-foreground">
                              {selectedDemandSpot.lat.toFixed(2)}, {selectedDemandSpot.lng.toFixed(2)}
                            </p>
                          </div>
                        </Popup>
                      ) : null}
                      {is3D && mapMode !== "satellite" ? <Layer {...buildingsLayer} /> : null}
                    </>
                  ) : null}
                </Map>
              )}
              {hasValidMapToken ? (
                <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 rounded-lg border bg-background/90 p-2 backdrop-blur">
                  <Button
                    size="sm"
                    variant={mapMode === "streets" ? "default" : "outline"}
                    onClick={() => setMapMode("streets")}
                  >
                    Streets
                  </Button>
                  <Button
                    size="sm"
                    variant={mapMode === "satellite" ? "default" : "outline"}
                    onClick={() => setMapMode("satellite")}
                  >
                    Satellite
                  </Button>
                  <Button
                    size="sm"
                    variant={mapMode === "hybrid" ? "default" : "outline"}
                    onClick={() => setMapMode("hybrid")}
                  >
                    Hybrid
                  </Button>
                  <Button size="sm" variant={is3D ? "default" : "outline"} onClick={() => setIs3D((v) => !v)}>
                    {is3D ? "2D" : "3D"}
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Local Market Brief</CardTitle>
              <CardDescription>{cityLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {briefLoading ? <Skeleton className="h-16 w-full" /> : <p className="text-sm leading-6">{typedBrief}</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-1">
            {quickStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-xl font-black">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" onClick={() => router.push(ctaHref)}>
                {ctaLabel}
              </Button>
            </CardContent>
          </Card>

          {locationDenied ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location access denied</CardTitle>
                <CardDescription>Set your city manually to continue localized discovery.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input value={manualCity} onChange={(e) => setManualCity(e.target.value)} placeholder="Search city" />
                <Button variant="outline" onClick={onManualCitySearch}>
                  Set
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Nearby listings scanned: {listingPoints.length}</p>
              <p>Role mode: {role ?? "resolving"}</p>
              <p>Location context: {cityLabel}</p>
              {role === "farmer" ? <p>Buyer search hotspots: {demandSpots.length}</p> : null}
            </CardContent>
          </Card>

          {role === "farmer" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buyer Search Signals</CardTitle>
                <CardDescription>
                  Search any state/city in map bar to update this region and inspect recent buyer demand.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {demandSpots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No buyer hotspot activity in this region yet.</p>
                ) : (
                  demandSpots.slice(0, 5).map((spot) => (
                    <button
                      type="button"
                      key={spot.id}
                      onClick={() => {
                        setSelectedDemandSpot(spot);
                        mapRef.current?.flyTo({ center: [spot.lng, spot.lat], zoom: 12, duration: 700 });
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-2 text-left hover:bg-accent"
                    >
                      <div>
                        <p className="text-xs font-semibold">Hotspot #{Number(spot.id) + 1}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {spot.lat.toFixed(2)}, {spot.lng.toFixed(2)}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                        {spot.count} buyers
                      </span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </motion.main>
  );
}
