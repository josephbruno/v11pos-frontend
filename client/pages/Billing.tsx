import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CreditCard,
  FileText,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  cancelSubscription,
  createSubscriptionCheckout,
  getMyRestaurants,
  getRestaurantInvoices,
  getRestaurantSubscription,
  getSubscriptionPlans,
  getUsageLimits,
  verifySubscriptionCheckout,
} from "@/lib/apiServices";
import { loadRazorpayScript } from "@/lib/razorpay";
import {
  Subscription,
  SubscriptionCheckoutResponse,
  SubscriptionInvoice,
  SubscriptionPlan,
  UsageLimits,
} from "@shared/api";

function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Billing() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data: restaurants = [] } = useQuery({
    queryKey: ["my-restaurants-billing"],
    queryFn: async () => {
      const res: any = await getMyRestaurants();
      return (res?.data ?? res ?? []) as { id: string; name: string }[];
    },
  });

  const restaurantId = user?.branchId || restaurants[0]?.id || "";

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["usage-limits", restaurantId],
    queryFn: async () => {
      const res: any = await getUsageLimits(restaurantId);
      return (res?.data ?? res) as UsageLimits;
    },
    enabled: !!restaurantId,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["restaurant-subscription", restaurantId],
    queryFn: async () => {
      const res: any = await getRestaurantSubscription(restaurantId);
      return res?.data ?? res;
    },
    enabled: !!restaurantId,
  });

  const subscription = (subscriptionData as Subscription)?.id
    ? (subscriptionData as Subscription)
    : null;

  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const res: any = await getSubscriptionPlans();
      return ((res?.data ?? res ?? []) as SubscriptionPlan[]).filter(
        (p) => p.name !== "trial" && p.is_active,
      );
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["restaurant-invoices", restaurantId],
    queryFn: async () => {
      const res: any = await getRestaurantInvoices(restaurantId);
      return (res?.data ?? res ?? []) as SubscriptionInvoice[];
    },
    enabled: !!restaurantId,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      await loadRazorpayScript();
      const res: any = await createSubscriptionCheckout(restaurantId, planId, billingCycle);
      const checkout = (res?.data ?? res) as SubscriptionCheckoutResponse;
      return checkout;
    },
    onSuccess: async (checkout) => {
      if (!window.Razorpay || !checkout.razorpay_key_id) {
        addToast({ title: "Razorpay not available", type: "error" });
        return;
      }
      const rzp = new window.Razorpay({
        key: checkout.razorpay_key_id,
        subscription_id: checkout.razorpay_subscription_id,
        name: "Restaurant POS",
        description: checkout.plan_name,
        prefill: checkout.prefill,
        theme: { color: "#00A19D" },
        handler: async () => {
          try {
            await verifySubscriptionCheckout(restaurantId, checkout.razorpay_subscription_id);
            addToast({ title: "Subscription activated", type: "success" });
            queryClient.invalidateQueries({ queryKey: ["restaurant-subscription", restaurantId] });
            queryClient.invalidateQueries({ queryKey: ["usage-limits", restaurantId] });
          } catch {
            addToast({
              title: "Payment received — syncing subscription",
              description: "This may take a moment via webhook.",
              type: "info",
            });
          }
        },
      });
      rzp.open();
    },
    onError: (err: Error) => {
      addToast({ title: "Checkout failed", description: err.message, type: "error" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(subscription!.id, "User requested cancellation"),
    onSuccess: () => {
      addToast({ title: "Subscription cancelled at period end", type: "success" });
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["restaurant-subscription", restaurantId] });
    },
    onError: (err: Error) => {
      addToast({ title: "Cancel failed", description: err.message, type: "error" });
    },
  });

  const trialDays = daysUntil(usage?.trial_ends_at);
  const showTrialBanner = trialDays != null && trialDays >= 0 && trialDays <= 14;

  if (!restaurantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No restaurant linked to your account. Contact support.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-pos-accent" />
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-1">Manage your plan, usage, and invoices.</p>
      </div>

      {showTrialBanner && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Trial period</p>
              <p className="text-sm text-muted-foreground">
                {trialDays === 0
                  ? "Your trial ends today. Subscribe to keep access."
                  : `${trialDays} day${trialDays === 1 ? "" : "s"} left in your trial.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!usage?.is_operational && usage?.subscription_status === "expired" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Subscription inactive</p>
              <p className="text-sm text-muted-foreground">
                Choose a plan below to restore full access to your restaurant.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {usage?.subscription_plan ?? "trial"} · {usage?.subscription_status ?? "active"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscription ? (
              <>
                <p className="text-lg font-semibold">{subscription.plan_name}</p>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {subscription.status}
                </Badge>
                {subscription.current_period_end && (
                  <p className="text-sm text-muted-foreground">
                    Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
                {subscription.status === "active" && !subscription.cancel_at_period_end && (
                  <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
                    Cancel subscription
                  </Button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                No paid subscription yet. You are on the free trial or an admin-assigned plan.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Plan limits for this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageLoading || !usage ? (
              <p className="text-muted-foreground text-sm">Loading usage...</p>
            ) : (
              (["users", "products", "orders"] as const).map((key) => {
                const m = usage[key];
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1 capitalize">
                      <span>{key}</span>
                      <span>
                        {m.current} / {m.max}
                      </span>
                    </div>
                    <Progress value={Math.min(100, m.percentage)} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Subscribe via Razorpay (UPI, cards, netbanking)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={billingCycle === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === "yearly" ? "default" : "outline"}
                size="sm"
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.is_featured ? "border-pos-accent" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    {formatInr(
                      billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly,
                    )}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{plan.max_users} staff users</li>
                    <li>{plan.max_products} products</li>
                    <li>{plan.max_orders_per_month} orders/month</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => checkoutMutation.mutate(plan.id)}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoice_number}</TableCell>
                    <TableCell>{new Date(inv.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatInr(inv.total)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of the current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep plan</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelMutation.mutate()}>Cancel plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
