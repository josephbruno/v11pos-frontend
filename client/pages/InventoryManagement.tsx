import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, History, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  createIngredient,
  getIngredients,
  getLowStockAlerts,
  getStockTransactions,
  getSuppliers,
  recordStockTransaction,
  resolveLowStockAlert,
} from "@/lib/apiServices";
import { formatISTDateTime } from "@/lib/istDate";

function unwrapList(res: unknown): any[] {
  const r = res as { data?: unknown };
  const src = r?.data ?? res;
  if (Array.isArray(src)) return src;
  if (src && typeof src === "object") {
    const obj = src as Record<string, unknown>;
    for (const key of ["ingredients", "alerts", "transactions", "suppliers", "items", "data"]) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
}

export default function InventoryManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";
  const [open, setOpen] = useState(false);
  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    unit: "kg",
    current_stock: "0",
    minimum_stock: "0",
  });

  const { data: ingredientsRaw, isLoading } = useQuery({
    queryKey: ["ingredients", restaurantId],
    queryFn: () => getIngredients(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: alertsRaw } = useQuery({
    queryKey: ["lowStockAlerts", restaurantId],
    queryFn: () => getLowStockAlerts(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: transactionsRaw } = useQuery({
    queryKey: ["stockTransactions", restaurantId],
    queryFn: () => getStockTransactions(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: suppliersRaw } = useQuery({
    queryKey: ["suppliers", restaurantId],
    queryFn: () => getSuppliers(restaurantId),
    enabled: !!restaurantId,
  });

  const ingredients = useMemo(() => unwrapList(ingredientsRaw), [ingredientsRaw]);
  const alerts = useMemo(() => unwrapList(alertsRaw), [alertsRaw]);
  const transactions = useMemo(() => unwrapList(transactionsRaw), [transactionsRaw]);
  const suppliers = useMemo(() => unwrapList(suppliersRaw), [suppliersRaw]);

  const createMutation = useMutation({
    mutationFn: () =>
      createIngredient({
        restaurant_id: restaurantId,
        name: ingredientForm.name,
        unit: ingredientForm.unit,
        current_stock: parseFloat(ingredientForm.current_stock) || 0,
        minimum_stock: parseFloat(ingredientForm.minimum_stock) || 0,
      }),
    onSuccess: () => {
      addToast({ title: "Ingredient created", type: "success" });
      setOpen(false);
      setIngredientForm({ name: "", unit: "kg", current_stock: "0", minimum_stock: "0" });
      queryClient.invalidateQueries({ queryKey: ["ingredients", restaurantId] });
    },
    onError: (err: Error) => addToast({ title: err.message, type: "error" }),
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => resolveLowStockAlert(alertId),
    onSuccess: () => {
      addToast({ title: "Alert resolved", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["lowStockAlerts", restaurantId] });
    },
    onError: (err: Error) => addToast({ title: err.message, type: "error" }),
  });

  const restockMutation = useMutation({
    mutationFn: (ingredientId: string) =>
      recordStockTransaction({
        restaurant_id: restaurantId,
        ingredient_id: ingredientId,
        transaction_type: "purchase",
        quantity: 10,
        unit: "kg",
        notes: "Quick restock from inventory UI",
      }),
    onSuccess: () => {
      addToast({ title: "Stock updated", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["ingredients", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["stockTransactions", restaurantId] });
    },
    onError: (err: Error) => addToast({ title: err.message, type: "error" }),
  });

  if (!restaurantId) {
    return <div className="p-6 text-muted-foreground">No restaurant selected.</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 sm:h-7 w-6 sm:w-7" />
            Inventory
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Ingredients, alerts, and stock history</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add ingredient</span>
              <span className="inline sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">New ingredient</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={ingredientForm.name} onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={ingredientForm.unit} onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <Label>Current stock</Label>
                  <Input type="number" value={ingredientForm.current_stock} onChange={(e) => setIngredientForm({ ...ingredientForm, current_stock: e.target.value })} />
                </div>
                <div>
                  <Label>Minimum stock</Label>
                  <Input type="number" value={ingredientForm.minimum_stock} onChange={(e) => setIngredientForm({ ...ingredientForm, minimum_stock: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="ingredients">
        <TabsList>
          <TabsTrigger value="ingredients">Ingredients ({ingredients.length})</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 md:grid-cols-2">
          {isLoading && <p className="text-muted-foreground">Loading...</p>}
          {ingredients.map((ing: any) => {
            const current = ing.current_stock ?? ing.quantity ?? 0;
            const minimum = ing.minimum_stock ?? ing.min_quantity ?? 0;
            const low = current <= minimum;
            return (
              <Card key={ing.id}>
                <CardContent className="p-4 flex justify-between items-center gap-2">
                  <div>
                    <p className="font-medium">{ing.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {current} {ing.unit ?? "units"} (min {minimum})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {low && <Badge variant="destructive">Low</Badge>}
                    <Button size="sm" variant="outline" onClick={() => restockMutation.mutate(ing.id)}>
                      +10
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-2">
          {alerts.map((alert: any) => (
            <Card key={alert.id} className="border-amber-500/50">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>{alert.ingredient_name ?? alert.message ?? `Alert ${alert.id?.slice(-6)}`}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(alert.id)}>
                  Resolve
                </Button>
              </CardContent>
            </Card>
          ))}
          {alerts.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No low-stock alerts.</p>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-2">
          {transactions.map((tx: any) => (
            <Card key={tx.id}>
              <CardContent className="p-4 flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  {tx.transaction_type ?? tx.type}
                </span>
                <span>
                  {tx.quantity} {tx.unit ?? ""}
                </span>
                <span className="text-muted-foreground">
                  {tx.created_at ? formatISTDateTime(tx.created_at) : ""}
                </span>
              </CardContent>
            </Card>
          ))}
          {transactions.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 md:grid-cols-2">
          {suppliers.map((s: any) => (
            <Card key={s.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-base">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {s.phone ?? s.email ?? s.contact_person ?? "—"}
              </CardContent>
            </Card>
          ))}
          {suppliers.length === 0 && (
            <p className="text-muted-foreground text-center py-8 col-span-full">No suppliers.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
