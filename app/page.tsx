"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { FileUpload } from "@/components/modules/uploads/FileUploads";
import { LoadingButton } from "@/components/LoadingButton";
import { RazorpayPayButton } from "@/components/modules/payments/razorpay-pay-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartPreloader } from "@/components/ui/preloader/SmartPreloader";
import { ClientAnimationWrapper } from "@/components/ui/preloader/ClientAnimationWrapper";
import { usePreloader } from "@/lib/use-preloader";

async function saveData() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export default function HomePage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { startLoading, runId } = usePreloader();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Prince");
  const [role, setRole] = useState("Buyer");
  const [sendingMail, setSendingMail] = useState(false);
  const [mailStatus, setMailStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useLayoutEffect(() => {
    const preloaderKey = "home-preloader-seen";
    const hasSeenPreloader = window.sessionStorage.getItem(preloaderKey);
    if (!hasSeenPreloader) {
      startLoading();
      window.sessionStorage.setItem(preloaderKey, "true");
    }
  }, [startLoading]);

  useLayoutEffect(() => {
    if (isSignedIn) {
      router.replace("/role-redirect");
    }
  }, [isSignedIn, router]);

  const handleSendDemoEmail = async () => {
    if (!email.trim()) {
      setMailStatus({ type: "error", text: "Please enter a receiver email." });
      return;
    }

    try {
      setSendingMail(true);
      setMailStatus(null);

      const response = await fetch("/api/demo/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });

      const data = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send test email.");
      }

      setMailStatus({ type: "success", text: data.message || "Test email sent successfully." });
    } catch (error) {
      setMailStatus({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong while sending email.",
      });
    } finally {
      setSendingMail(false);
    }
  };

  return (
    <>
      <SmartPreloader key={runId} type="ui" />
      <ClientAnimationWrapper>
        <main className="p-6 md:p-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Demo (Resend)</CardTitle>
                <CardDescription>Send a welcome email directly from home page to test setup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-email">Receiver Email</Label>
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demo-name">Name</Label>
                    <Input id="demo-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-role">Role</Label>
                    <Input id="demo-role" value={role} onChange={(e) => setRole(e.target.value)} />
                  </div>
                </div>

                <Button type="button" onClick={handleSendDemoEmail} disabled={sendingMail}>
                  {sendingMail ? "Sending..." : "Send Test Welcome Email"}
                </Button>

                {mailStatus && (
                  <p className={mailStatus.type === "success" ? "text-sm text-green-600" : "text-sm text-red-600"}>
                    {mailStatus.text}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Asset Upload</CardTitle>
                <CardDescription>Upload an image or media file for this listing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload
                  value={imageUrl}
                  onChange={(url) => {
                    console.log("New Image URL:", url);
                    setImageUrl(url);
                  }}
                  onRemove={() => setImageUrl("")}
                />

                {imageUrl && (
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs font-mono break-all text-muted-foreground">Stored URL: {imageUrl}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <Button onClick={() => alert(`Saving URL to Database: ${imageUrl}`)}>Save to Database</Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => setImageUrl("")}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <LoadingButton
                action={saveData}
                variant="default"
                loadingText="Saving..."
                showSuccessToast
                successMessage="Saved successfully"
              >
                Ordered
              </LoadingButton>

              <RazorpayPayButton
                amountInRupees={499}
                description="Payment for Wheat"
                customer={{ name: "Prince", email: "p@example.com" }}
                onSuccess={async () => {
                  // update Convex
                }}
              >
                Pay Now
              </RazorpayPayButton>
            </div>
          </div>
        </main>
      </ClientAnimationWrapper>
    </>
  );
}
