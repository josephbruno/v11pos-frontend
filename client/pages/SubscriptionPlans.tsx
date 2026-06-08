import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Pencil, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createSubscriptionPlan,
  getAllSubscriptionPlansAdmin,
  updateSubscriptionPlan,
  updateSubscriptionPlanStatus,
} from "@/lib/apiServices";
import { SubscriptionPlan } from "@shared/api";
import { useToast } from "@/contexts/ToastContext";

function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

const emptyPlan: Partial<SubscriptionPlan> = {
  name: "",
  display_name: "",
  description: "",
  tagline: "",
  price_monthly: 0,
  price_yearly: 0,
  max_users: 5,
  max_products: 100,
  max_orders_per_month: 1000,
  max_locations: 1,
  max_storage_gb: 1,
  trial_days: 0,
  features: [],
  is_active: true,
  is_public: true,
};

export default function SubscriptionPlans() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<Partial<SubscriptionPlan>>(emptyPlan);
  const [featuresText, setFeaturesText] = useState("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription-plans-admin"],
    queryFn: async () => {
      const res: any = await getAllSubscriptionPlansAdmin();
      return (res?.data ?? res ?? []) as SubscriptionPlan[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        price_monthly: Number(form.price_monthly ?? 0),
        price_yearly: Number(form.price_yearly ?? 0),
        max_users: Number(form.max_users ?? 5),
        max_products: Number(form.max_products ?? 100),
        max_orders_per_month: Number(form.max_orders_per_month ?? 1000),
        features: featuresText
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      };
      if (editing) {
        return updateSubscriptionPlan(editing.id, payload);
      }
      return createSubscriptionPlan(payload);
    },
    onSuccess: () => {
      addToast({ title: editing ? "Plan updated" : "Plan created", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans-admin"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyPlan);
      setFeaturesText("");
    },
    onError: (err: Error) => {
      addToast({ title: "Failed to save plan", description: err.message, type: "error" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateSubscriptionPlanStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans-admin"] });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyPlan);
    setFeaturesText("");
    setDialogOpen(true);
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan);
    setForm(plan);
    setFeaturesText((plan.features ?? []).join(", "));
    setDialogOpen(true);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-pos-accent" />
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage SaaS plans synced to Razorpay when credentials are configured.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Pricing in INR (stored as paise on the backend).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading plans...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Razorpay</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.display_name}</div>
                      <div className="text-xs text-muted-foreground">{plan.name}</div>
                      {plan.badge && <Badge className="mt-1">{plan.badge}</Badge>}
                    </TableCell>
                    <TableCell>{formatInr(plan.price_monthly)}</TableCell>
                    <TableCell>{formatInr(plan.price_yearly)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plan.max_users} users · {plan.max_products} products ·{" "}
                      {plan.max_orders_per_month} orders/mo
                    </TableCell>
                    <TableCell className="text-xs">
                      {plan.razorpay_plan_id_monthly ? "M ✓" : "M —"}{" "}
                      {plan.razorpay_plan_id_yearly ? "Y ✓" : "Y —"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: plan.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Create Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editing && (
              <div>
                <Label>Internal name (trial, basic, pro, enterprise)</Label>
                <Input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label>Display name</Label>
              <Input
                value={form.display_name ?? ""}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={form.tagline ?? ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monthly price (paise)</Label>
                <Input
                  type="number"
                  value={form.price_monthly ?? 0}
                  onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Yearly price (paise)</Label>
                <Input
                  type="number"
                  value={form.price_yearly ?? 0}
                  onChange={(e) => setForm({ ...form, price_yearly: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Max users</Label>
                <Input
                  type="number"
                  value={form.max_users ?? 5}
                  onChange={(e) => setForm({ ...form, max_users: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Max products</Label>
                <Input
                  type="number"
                  value={form.max_products ?? 100}
                  onChange={(e) => setForm({ ...form, max_products: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Orders / month</Label>
                <Input
                  type="number"
                  value={form.max_orders_per_month ?? 1000}
                  onChange={(e) =>
                    setForm({ ...form, max_orders_per_month: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Features (comma-separated)</Label>
              <Input value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
