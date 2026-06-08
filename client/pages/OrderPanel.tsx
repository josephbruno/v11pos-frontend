import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  CreditCard,
  Printer,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  getProducts,
  getCategories,
  getTables,
  createOrder,
  updateOrderPayment,
  routeOrderToKds,
  printKot,
  getKdsDisplaysByStation,
  getKdsStations,
  updateOrderStatus,
} from "@/lib/apiServices";

interface CartLine {
  id: string;
  name: string;
  pricePaise: number;
  quantity: number;
}

function unwrapList(res: unknown): any[] {
  const r = res as { data?: unknown };
  const src = r?.data ?? res;
  if (Array.isArray(src)) return src;
  if (src && typeof src === "object") {
    const obj = src as Record<string, unknown>;
    for (const key of ["products", "categories", "tables", "data", "items"]) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
}

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderPanel() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";

  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const { data: productsRaw, isLoading: productsLoading } = useQuery({
    queryKey: ["orderPanelProducts", restaurantId],
    queryFn: () => getProducts(restaurantId, { active: true }),
    enabled: !!restaurantId,
  });

  const { data: categoriesRaw } = useQuery({
    queryKey: ["orderPanelCategories", restaurantId],
    queryFn: () => getCategories(restaurantId, { active: true }),
    enabled: !!restaurantId,
  });

  const { data: tablesRaw } = useQuery({
    queryKey: ["orderPanelTables", restaurantId],
    queryFn: () => getTables(restaurantId),
    enabled: !!restaurantId,
  });

  const categories = useMemo(() => {
    const fromApi = unwrapList(categoriesRaw).map((c: any) => ({
      id: String(c.id),
      name: c.name ?? "Category",
    }));
    if (fromApi.length > 0) return fromApi;
    const names = new Set<string>();
    unwrapList(productsRaw).forEach((p: any) => {
      const name = p.category_name ?? p.category?.name ?? "Other";
      if (name) names.add(name);
    });
    return [...names].map((name) => ({ id: name, name }));
  }, [categoriesRaw, productsRaw]);

  const products = useMemo(() => {
    return unwrapList(productsRaw).map((p: any) => ({
      id: String(p.id),
      name: p.name ?? "Product",
      pricePaise: Number(p.price ?? 0),
      category:
        p.category_name ??
        p.category?.name ??
        categories.find((c) => c.id === String(p.category_id))?.name ??
        "Other",
      available: p.is_available !== false && (p.stock ?? p.stock_quantity ?? 1) > 0,
      image: p.image_url ?? p.image,
    }));
  }, [productsRaw, categories]);

  const tables = useMemo(() => {
    return unwrapList(tablesRaw).map((t: any) => ({
      id: String(t.id ?? t.table_id),
      label:
        t.table_name?.trim() ||
        (t.table_number ? `Table ${t.table_number}` : `Table ${String(t.id).slice(-4)}`),
    }));
  }, [tablesRaw]);

  const selectedTableLabel =
    tables.find((t) => t.id === selectedTableId)?.label ?? "Select table";

  const categoryNames = useMemo(
    () => ["All", ...categories.map((c) => c.name)],
    [categories],
  );

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotalPaise = cart.reduce(
    (total, item) => total + item.pricePaise * item.quantity,
    0,
  );
  const taxPaise = Math.round(subtotalPaise * 0.08);
  const totalPaise = subtotalPaise + taxPaise;
  const totalItems = cart.reduce((n, item) => n + item.quantity, 0);

  const addToCart = (product: (typeof products)[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          pricePaise: product.pricePaise,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + change } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) throw new Error("No restaurant selected");
      if (!selectedTableId) throw new Error("Select a table");
      if (cart.length === 0) throw new Error("Cart is empty");

      const items = cart.map((item) => {
        const lineSubtotal = item.pricePaise * item.quantity;
        const lineTax = Math.round(lineSubtotal * 0.08);
        return {
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.pricePaise,
          modifiers_price: 0,
          discount_amount: 0,
          tax_amount: lineTax,
        };
      });

      const orderRes = await createOrder({
        restaurant_id: restaurantId,
        order_type: "dine_in",
        table_id: selectedTableId,
        items,
      } as any);
      const order = (orderRes as any)?.data ?? orderRes;
      const orderId = order?.id;
      if (!orderId) throw new Error("Order creation failed");

      setLastOrderId(orderId);

      await updateOrderPayment(orderId, {
        payment_status: "paid",
        payment_method: paymentMethod,
      });
      return order;
    },
    onSuccess: () => {
      setCart([]);
      addToast({ title: "Order created and payment recorded", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["activeOrders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["orderStatistics", restaurantId] });
    },
    onError: (err: Error) => {
      addToast({ title: err.message || "Failed to process order", type: "error" });
    },
  });

  const handleProcessPayment = async () => {
    setIsSubmitting(true);
    try {
      await paymentMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildOrderItems = () =>
    cart.map((item) => {
      const lineSubtotal = item.pricePaise * item.quantity;
      const lineTax = Math.round(lineSubtotal * 0.08);
      return {
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.pricePaise,
        modifiers_price: 0,
        discount_amount: 0,
        tax_amount: lineTax,
      };
    });

  const handleHoldOrder = async () => {
    if (!restaurantId || !selectedTableId || cart.length === 0) {
      addToast({ title: "Select a table and add items first", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const orderRes = await createOrder({
        restaurant_id: restaurantId,
        table_id: selectedTableId,
        items: buildOrderItems(),
      } as any);
      const order = (orderRes as any)?.data ?? orderRes;
      if (order?.id) {
        setLastOrderId(order.id);
        await updateOrderStatus(order.id, "on_hold");
      }
      setCart([]);
      addToast({ title: "Order placed on hold", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["activeOrders", restaurantId] });
    } catch (err: any) {
      addToast({ title: err.message || "Failed to hold order", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintKot = async () => {
    if (cart.length > 0) {
      addToast({ title: "Process or hold the order before printing KOT", type: "error" });
      return;
    }
    if (!lastOrderId) {
      addToast({ title: "No recent order to print", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      await routeOrderToKds(lastOrderId);
      const stationsRes = await getKdsStations(restaurantId);
      const stations = unwrapList(stationsRes);
      if (stations.length === 0) throw new Error("No KDS stations configured");
      const displaysRes = await getKdsDisplaysByStation(String(stations[0].id));
      const displays = unwrapList(displaysRes);
      const display = displays.find(
        (d: any) => d.order_id === lastOrderId || d.order_number,
      ) ?? displays[0];
      if (!display?.id) throw new Error("No KDS display for this order");
      await printKot(display.id, "text");
      addToast({ title: "KOT sent to kitchen printer", type: "success" });
    } catch (err: any) {
      addToast({ title: err.message || "Failed to print KOT", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!restaurantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Select a restaurant branch to use the order terminal.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-1.5rem)] flex">
      <div className="flex-1 pr-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pos-text">Order Terminal</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-pos-accent" />
                <span className="text-pos-text font-medium">{selectedTableLabel}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-pos-text-muted" />
                <span className="text-pos-text-muted">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <Select value={selectedTableId} onValueChange={setSelectedTableId}>
            <SelectTrigger className="w-48 border-pos-secondary">
              <User className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Change table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="bg-muted border-border flex-wrap h-auto">
            {categoryNames.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
          {productsLoading && (
            <p className="text-pos-text-muted col-span-full">Loading menu...</p>
          )}
          {!productsLoading && filteredProducts.length === 0 && (
            <p className="text-pos-text-muted col-span-full">No products found.</p>
          )}
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`bg-card border-border cursor-pointer transition-all hover:border-primary ${
                !product.available ? "opacity-50" : ""
              }`}
              onClick={() => product.available && addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-pos-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-pos-text-muted text-xs">No image</span>
                  )}
                </div>
                <h3 className="font-medium text-pos-text text-sm truncate">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-pos-accent font-bold">
                    {formatInr(product.pricePaise)}
                  </span>
                  {!product.available && (
                    <Badge variant="destructive" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-96 bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Current Order</h2>
          <Badge className="bg-primary text-primary-foreground">{totalItems} items</Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-pos-text-muted mx-auto mb-3" />
              <p className="text-pos-text-muted">No items in order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-pos-text text-sm">{item.name}</h4>
                  <p className="text-pos-accent text-sm font-medium">
                    {formatInr(item.pricePaise)} each
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-pos-text font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <>
            <div className="border-t border-pos-secondary pt-4 space-y-2">
              <div className="flex justify-between text-pos-text-muted">
                <span>Subtotal</span>
                <span>{formatInr(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-pos-text-muted">
                <span>Tax (8%)</span>
                <span>{formatInr(taxPaise)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-pos-text border-t border-pos-secondary pt-2">
                <span>Total</span>
                <span>{formatInr(totalPaise)}</span>
              </div>
            </div>

            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="digital_wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting || paymentMutation.isPending}
                onClick={handleProcessPayment}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isSubmitting ? "Processing..." : "Process Payment"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="border-pos-secondary"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handleHoldOrder}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Hold Order
                </Button>
                <Button
                  variant="outline"
                  className="border-pos-secondary"
                  disabled={isSubmitting || !lastOrderId}
                  onClick={handlePrintKot}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print KOT
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full border-pos-secondary"
                onClick={() => setCart([])}
              >
                Clear Order
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
