import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <Card className="bg-card/50 backdrop-blur-md border border-primary/10">
      <CardHeader>
        <CardTitle>Orders Received</CardTitle>
        <CardDescription>Orders Received module is ready for Convex-driven workflows.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">This route is active and accessible from the Farmer sidebar.</p>
      </CardContent>
    </Card>
  );
}
