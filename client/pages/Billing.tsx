import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Check,
  CreditCard,
  Crown,
  FileText,
  IndianRupee,
  Package,
  RefreshCw,
  Shield,
  ShoppingCart,
  Sparkles,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
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
  UsageLimitMetric,
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

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadgeVariant(status?: string) {
  if (status === "active" || status === "paid") return "default" as const;
  if (status === "expired" || status === "failed") return "destructive" as const;
  return "secondary" as const;
}

function usageBarColor(percentage: number) {
  if (percentage >= 90) return "bg-destructive";
  if (percentage >= 70) return "bg-amber-500";
  return "bg-pos-accent";
}

const USAGE_META = {
  users: { label: "Staff users", icon: Users },
  products: { label: "Products", icon: Package },
  orders: { label: "Orders this month", icon: ShoppingCart },
} as const;

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: "success" | "warning" | "error" | "default";
}) {
  const accentClass =
    accent === "success"
      ? "text-pos-success"
      : accent === "warning"
        ? "text-amber-500"
        : accent === "error"
          ? "text-destructive"
          : "text-pos-accent";

  return (
    <Card className="bg-pos-surface border-pos-secondary/60 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-pos-text-muted uppercase tracking-wide">{title}</p>
            <p className={cn("text-xl font-bold mt-1 truncate", accentClass)}>{value}</p>
            {sub && <p className="text-xs text-pos-text-muted mt-0.5">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-pos-accent/10 flex items-center justify-center shrink-0">
            <Icon className={cn("h-5 w-5", accentClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageMeter({ metricKey, metric }: { metricKey: keyof typeof USAGE_META; metric: UsageLimitMetric }) {
  const { label, icon: Icon } = USAGE_META[metricKey];
  const pct = Math.min(100, metric.percentage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-pos-text-muted" />
          <span className="text-pos-text">{label}</span>
        </div>
        <span className="text-sm font-semibold text-pos-text tabular-nums">
          {metric.current}
          <span className="text-pos-text-muted font-normal"> / {metric.max}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", usageBarColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 90 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Approaching plan limit</p>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  billingCycle,
  isCurrent,
  isPending,
  onSubscribe,
}: {
  plan: SubscriptionPlan;
  billingCycle: "monthly" | "yearly";
  isCurrent: boolean;
  isPending: boolean;
  onSubscribe: () => void;
}) {
  const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
  const period = billingCycle === "monthly" ? "mo" : "yr";
  const yearlySavings =
    billingCycle === "yearly" && plan.price_monthly > 0
      ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
      : plan.discount_yearly;

  const defaultFeatures = [
    `${plan.max_users} staff users`,
    `${plan.max_products} products`,
    `${plan.max_orders_per_month.toLocaleString()} orders/month`,
    `${plan.max_locations} location${plan.max_locations === 1 ? "" : "s"}`,
    `${plan.max_storage_gb} GB storage`,
  ];
  const features = plan.features?.length ? plan.features : defaultFeatures;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full flex flex-col relative overflow-hidden transition-shadow",
          plan.is_featured && "border-pos-accent shadow-lg shadow-pos-accent/10",
          isCurrent && "ring-2 ring-pos-accent/50",
        )}
      >
        {plan.is_featured && (
          <div className="absolute top-0 right-0">
            <div className="bg-pos-accent text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {plan.badge ?? "Popular"}
            </div>
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {plan.name === "enterprise" ? (
              <Crown className="h-5 w-5 text-amber-500" />
            ) : (
              <Zap className="h-5 w-5 text-pos-accent" />
            )}
            <CardTitle className="text-lg text-pos-text">{plan.display_name}</CardTitle>
          </div>
          {plan.tagline && (
            <CardDescription className="text-pos-text-muted">{plan.tagline}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex flex-col flex-1 space-y-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-pos-text">{formatInr(price)}</span>
              <span className="text-sm text-pos-text-muted">/{period}</span>
            </div>
            {billingCycle === "yearly" && yearlySavings > 0 && (
              <Badge variant="secondary" className="mt-2 bg-pos-accent/10 text-pos-accent border-0">
                Save {yearlySavings}% vs monthly
              </Badge>
            )}
          </div>

          {plan.description && (
            <p className="text-sm text-pos-text-muted leading-relaxed">{plan.description}</p>
          )}

          <ul className="space-y-2 flex-1">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-pos-text-muted">
                <Check className="h-4 w-4 text-pos-accent shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className={cn(
              "w-full",
              plan.is_featured && !isCurrent && "bg-pos-accent hover:bg-pos-accent/90",
            )}
            variant={isCurrent ? "secondary" : plan.is_featured ? "default" : "outline"}
            onClick={onSubscribe}
            disabled={isPending || isCurrent}
          >
            {isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : isCurrent ? (
              <Check className="h-4 w-4 mr-2" />
            ) : null}
            {isCurrent ? "Current plan" : "Subscribe"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
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
  const restaurantName = restaurants.find((r) => r.id === restaurantId)?.name;

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["usage-limits", restaurantId],
    queryFn: async () => {
      const res: any = await getUsageLimits(restaurantId);
      return (res?.data ?? res) as UsageLimits;
    },
    enabled: !!restaurantId,
  });

  const { data: subscriptionData, isLoading: subLoading } = useQuery({
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

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const res: any = await getSubscriptionPlans();
      return ((res?.data ?? res ?? []) as SubscriptionPlan[])
        .filter((p) => p.name !== "trial" && p.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
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
  const isExpired = !usage?.is_operational && usage?.subscription_status === "expired";

  if (!restaurantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <CreditCard className="h-8 w-8 text-pos-text-muted" />
        </div>
        <div>
          <p className="font-semibold text-pos-text">No restaurant linked</p>
          <p className="text-sm text-pos-text-muted mt-1">Contact support to link your account.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 w-full"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-pos-secondary/60 bg-gradient-to-br from-pos-accent/10 via-pos-surface to-pos-surface p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pos-accent/15 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-pos-accent" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-pos-text">Billing & Subscription</h1>
                  {restaurantName && (
                    <p className="text-sm text-pos-text-muted mt-0.5">{restaurantName}</p>
                  )}
                </div>
              </div>
              <p className="text-pos-text-muted mt-3 max-w-lg">
                Manage your plan, track usage limits, and view payment history.
              </p>
            </div>
            {usage && (
              <Badge
                variant={statusBadgeVariant(usage.subscription_status)}
                className="self-start md:self-center text-sm px-3 py-1 capitalize"
              >
                {usage.subscription_status ?? "active"}
              </Badge>
            )}
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-pos-accent/5 blur-2xl pointer-events-none" />
      </div>

      {/* Alerts */}
      {showTrialBanner && (
        <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-transparent">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-pos-text">Trial period active</p>
                <p className="text-sm text-pos-text-muted mt-0.5">
                  {trialDays === 0
                    ? "Your trial ends today. Subscribe to keep uninterrupted access."
                    : `${trialDays} day${trialDays === 1 ? "" : "s"} remaining — choose a plan before it ends.`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
              onClick={() =>
                document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View plans
            </Button>
          </CardContent>
        </Card>
      )}

      {isExpired && (
        <Card className="border-destructive/40 bg-gradient-to-r from-destructive/10 to-transparent">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">Subscription inactive</p>
                <p className="text-sm text-pos-text-muted mt-0.5">
                  Your restaurant is limited until you subscribe. Pick a plan below to restore full access.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="shrink-0"
              onClick={() =>
                document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Restore access
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {usageLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Current plan"
              value={usage?.subscription_plan ? usage.subscription_plan.charAt(0).toUpperCase() + usage.subscription_plan.slice(1) : "Trial"}
              sub={subscription?.plan_name}
              icon={Zap}
            />
            <StatCard
              title="Status"
              value={usage?.subscription_status ?? "Active"}
              sub={usage?.is_operational ? "Fully operational" : "Limited access"}
              icon={Shield}
              accent={usage?.is_operational ? "success" : "warning"}
            />
            <StatCard
              title="Renews on"
              value={formatDate(subscription?.current_period_end ?? usage?.trial_ends_at)}
              sub={subscription?.billing_cycle ? `Billed ${subscription.billing_cycle}` : undefined}
              icon={Calendar}
            />
            <StatCard
              title="Trial"
              value={
                trialDays != null && trialDays >= 0
                  ? `${trialDays} day${trialDays === 1 ? "" : "s"} left`
                  : "—"
              }
              sub={usage?.trial_ends_at ? `Ends ${formatDate(usage.trial_ends_at)}` : "No active trial"}
              icon={Sparkles}
              accent={trialDays != null && trialDays <= 3 ? "warning" : "default"}
            />
          </>
        )}
      </div>

      {/* Plan + Usage */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 bg-pos-surface border-pos-secondary/60">
          <CardHeader>
            <CardTitle className="text-pos-text flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-pos-accent" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active billing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-36" />
              </div>
            ) : subscription ? (
              <>
                <div>
                  <p className="text-2xl font-bold text-pos-text">{subscription.plan_name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant={statusBadgeVariant(subscription.status)} className="capitalize">
                      {subscription.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {subscription.billing_cycle}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <dl className="space-y-3 text-sm">
                  {subscription.current_period_end && (
                    <div className="flex justify-between">
                      <dt className="text-pos-text-muted">Next renewal</dt>
                      <dd className="font-medium text-pos-text">{formatDate(subscription.current_period_end)}</dd>
                    </div>
                  )}
                  {subscription.payment_method && (
                    <div className="flex justify-between">
                      <dt className="text-pos-text-muted">Payment method</dt>
                      <dd className="font-medium text-pos-text capitalize">{subscription.payment_method}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-pos-text-muted">Price</dt>
                    <dd className="font-medium text-pos-text">
                      {formatInr(
                        subscription.billing_cycle === "yearly"
                          ? subscription.price_per_year
                          : subscription.price_per_month,
                      )}
                      <span className="text-pos-text-muted font-normal">
                        /{subscription.billing_cycle === "yearly" ? "yr" : "mo"}
                      </span>
                    </dd>
                  </div>
                </dl>

                {subscription.cancel_at_period_end && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                    Cancels at end of billing period
                  </div>
                )}

                {subscription.status === "active" && !subscription.cancel_at_period_end && (
                  <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
                    Cancel subscription
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 text-pos-text-muted" />
                </div>
                <p className="font-medium text-pos-text">No paid subscription</p>
                <p className="text-sm text-pos-text-muted mt-1">
                  You&apos;re on a free trial or admin-assigned plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-pos-surface border-pos-secondary/60">
          <CardHeader>
            <CardTitle className="text-pos-text">Usage This Period</CardTitle>
            <CardDescription>How much of your plan limits you&apos;ve used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usageLoading || !usage ? (
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              (["users", "products", "orders"] as const).map((key) => (
                <UsageMeter key={key} metricKey={key} metric={usage[key]} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      <Card id="plans-section" className="bg-pos-surface border-pos-secondary/60 scroll-mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-pos-text">Choose Your Plan</CardTitle>
              <CardDescription>
                Secure checkout via Razorpay — UPI, cards &amp; netbanking accepted
              </CardDescription>
            </div>
            <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50 self-start">
              {(["monthly", "yearly"] as const).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                    billingCycle === cycle
                      ? "bg-pos-accent text-white shadow-sm"
                      : "text-pos-text-muted hover:text-pos-text",
                  )}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <p className="text-center text-pos-text-muted py-8">No plans available at the moment.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  isCurrent={usage?.subscription_plan === plan.name}
                  isPending={checkoutMutation.isPending}
                  onSubscribe={() => checkoutMutation.mutate(plan.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="bg-pos-surface border-pos-secondary/60">
        <CardHeader>
          <CardTitle className="text-pos-text flex items-center gap-2">
            <FileText className="h-5 w-5 text-pos-accent" />
            Invoice History
          </CardTitle>
          <CardDescription>All subscription payments and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-pos-text-muted" />
              </div>
              <p className="font-medium text-pos-text">No invoices yet</p>
              <p className="text-sm text-pos-text-muted mt-1 max-w-sm">
                Invoices will appear here after your first subscription payment.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold">Invoice</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell className="text-pos-text-muted">{formatDate(inv.invoice_date)}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatInr(inv.total)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(inv.status)} className="capitalize">
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until{" "}
              {formatDate(subscription?.current_period_end)}. After that, your restaurant will lose
              paid features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cancel plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
