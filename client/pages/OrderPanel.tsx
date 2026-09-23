import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  CreditCard,
  Printer,
  Clock,
  UtensilsCrossed,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  createOrder,
  updateOrderPayment,
  routeOrderToKds,
  printKot,
  getKdsDisplaysByStation,
  getKdsStations,
  updateOrderStatus,
  getActivePrinter,
} from "@/lib/apiServices";
import { printReceiptForOrder } from "@/lib/printBridge";
import { formatISTDateLong } from "@/lib/istDate";

interface CartLine {
  id: string;
  name: string;
  priceRs: number;
  quantity: number;
}

type OrderType = "dine_in" | "takeaway";

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

function formatInr(rs: number) {
  return `₹${rs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ORDER_PAGE_SIZE = 24;

function extractProductItems(res: unknown): any[] {
  const payload = res as any;
  const source =
    payload?.data?.items ??
    payload?.data?.products ??
    payload?.items ??
    payload?.data ??
    payload;
  if (Array.isArray(source)) return source;
  return unwrapList(res);
}

function extractProductPagination(res: unknown) {
  const payload = res as any;
  return payload?.data?.pagination ?? payload?.pagination ?? null;
}

export default function OrderPanel() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";

  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ORDER_PAGE_SIZE);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categoriesRaw } = useQuery({
    queryKey: ["orderPanelCategories", restaurantId],
    queryFn: () => getCategories(restaurantId, { active: true, page_size: 500 }),
    enabled: !!restaurantId,
  });

  const categories = useMemo(() => {
    return unwrapList(categoriesRaw).map((c: any) => ({
      id: String(c.id),
      name: c.name ?? "Category",
    }));
  }, [categoriesRaw]);

  const selectedCategoryId = useMemo(() => {
    if (selectedCategory === "All") return undefined;
    return categories.find((category) => category.name === selectedCategory)?.id;
  }, [selectedCategory, categories]);

  const { data: productsRaw, isLoading: productsLoading } = useQuery({
    queryKey: [
      "orderPanelProducts",
      restaurantId,
      currentPage,
      pageSize,
      debouncedSearch,
      selectedCategoryId,
    ],
    queryFn: () =>
      getProducts(restaurantId, {
        page: currentPage,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        category_id: selectedCategoryId,
        available_only: true,
      }),
    enabled: !!restaurantId,
  });

  const pagination = extractProductPagination(productsRaw);

  const products = useMemo(() => {
    return extractProductItems(productsRaw).map((p: any) => ({
      id: String(p.id),
      name: p.name ?? "Product",
      priceRs: Number(p.price ?? 0),
      category:
        p.category_name ??
        p.category?.name ??
        categories.find((c) => c.id === String(p.category_id))?.name ??
        "Other",
      available: p.is_available !== false && p.available !== false,
      image: p.image_url ?? p.image,
    }));
  }, [productsRaw, categories]);

  const categoryNames = useMemo(
    () => ["All", ...categories.map((c) => c.name)],
    [categories],
  );

  const totalItems = pagination?.total_items ?? products.length;
  const totalPages = pagination?.total_pages ?? 1;
  const pageStart =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, totalItems);

  const subtotalRs = cart.reduce(
    (total, item) => total + item.priceRs * item.quantity,
    0,
  );
  const taxRs = Math.round(subtotalRs * 0.08);
  const totalRs = subtotalRs + taxRs;
  const cartItemCount = cart.reduce((n, item) => n + item.quantity, 0);

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
          priceRs: product.priceRs,
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

  const buildOrderItems = () =>
    cart.map((item) => {
      const lineSubtotal = item.priceRs * item.quantity;
      const lineTax = Math.round(lineSubtotal * 0.08);
      return {
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.priceRs,
        modifiers_price: 0,
        discount_amount: 0,
        tax_amount: lineTax,
      };
    });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) throw new Error("No restaurant selected");
      if (cart.length === 0) throw new Error("Cart is empty");

      const orderRes = await createOrder({
        restaurant_id: restaurantId,
        order_type: orderType,
        source: "pos",
        items: buildOrderItems(),
      } as any);
      const order = (orderRes as any)?.data ?? orderRes;
      const orderId = order?.id;
      if (!orderId) throw new Error("Order creation failed");

      setLastOrderId(orderId);

      await updateOrderPayment(orderId, {
        payment_status: "paid",
        payment_method: paymentMethod,
      });
      await updateOrderStatus(orderId, "completed");
      return order;
    },
    onSuccess: (order: any) => {
      setCart([]);
      addToast({ title: "Order created and payment recorded", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["activeOrders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["orderStatistics", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["adminOrders", restaurantId] });

      const orderId = order?.id;
      if (orderId && restaurantId) {
        getActivePrinter(restaurantId, "bill")
          .then((res: any) => {
            const printer = res?.data ?? res;
            if (printer?.auto_print) {
              return printReceiptForOrder(orderId, restaurantId);
            }
          })
          .catch(() => {
            // No active bill printer configured - auto-print is opt-in, so stay silent.
          });
      }
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

  const handleHoldOrder = async () => {
    if (!restaurantId || cart.length === 0) {
      addToast({ title: "Add items to the order first", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const orderRes = await createOrder({
        restaurant_id: restaurantId,
        order_type: orderType,
        source: "pos",
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

  const handlePrintReceipt = async () => {
    if (!lastOrderId) {
      addToast({ title: "No recent order to print", type: "error" });
      return;
    }
    if (!restaurantId) return;
    setIsSubmitting(true);
    try {
      const { method } = await printReceiptForOrder(lastOrderId, restaurantId);
      addToast({
        title: method === "bridge" ? "Bill sent to printer" : "Opened bill for printing",
        type: "success",
      });
    } catch (err: any) {
      addToast({ title: err.message || "Failed to print bill", type: "error" });
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
      {/* Left — menu */}
      <div className="flex-1 min-w-0 pr-6 space-y-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pos-text">Order Terminal</h1>
            <p className="text-pos-text-muted text-sm mt-0.5">
              {formatISTDateLong()}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>

        <div className="min-w-0 overflow-x-auto pb-1">
          <div className="flex w-max gap-2 pr-2">
            {categoryNames.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                    isSelected
                      ? "bg-pos-accent text-white border-pos-accent shadow-md ring-2 ring-pos-accent/40"
                      : "bg-card text-foreground border-border hover:bg-muted hover:border-pos-accent/30"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto flex-1 min-h-0 content-start items-start auto-rows-min">
          {productsLoading && (
            <p className="text-pos-text-muted col-span-full">Loading menu...</p>
          )}
          {!productsLoading && products.length === 0 && (
            <p className="text-pos-text-muted col-span-full">No products found.</p>
          )}
          {products.map((product) => (
            <Card
              key={product.id}
              className="bg-card border-border cursor-pointer transition-all hover:border-pos-accent hover:shadow-md self-start w-full"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-3">
                <div className="h-28 w-full bg-pos-secondary rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UtensilsCrossed className="h-8 w-8 text-pos-text-muted" />
                  )}
                </div>
                <h3 className="font-medium text-pos-text text-sm line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                <div className="mt-1">
                  <span className="text-pos-accent font-bold text-sm">
                    {formatInr(product.priceRs)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {totalItems === 0
              ? "No items"
              : `Showing ${pageStart}-${pageEnd} of ${totalItems} items`}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-28 h-8 bg-background border-border text-foreground">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="12">12 / page</SelectItem>
                <SelectItem value="24">24 / page</SelectItem>
                <SelectItem value="48">48 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={productsLoading || currentPage <= 1 || pagination?.has_previous === false}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground min-w-[88px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={
                productsLoading ||
                currentPage >= totalPages ||
                pagination?.has_next === false
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Right — cart */}
      <div className="w-96 bg-card border border-border rounded-lg p-6 space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Current Order</h2>
          <Badge className="bg-primary text-primary-foreground">{cartItemCount} items</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-pos-text-muted uppercase tracking-wide">
            Order type
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType("dine_in")}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                orderType === "dine_in"
                  ? "border-pos-accent bg-pos-accent text-white shadow-sm"
                  : "border-border bg-muted/50 text-pos-text-muted hover:bg-muted hover:text-foreground"
              }`}
            >
              <UtensilsCrossed className="h-4 w-4 shrink-0" />
              Dine-In
            </button>
            <button
              type="button"
              onClick={() => setOrderType("takeaway")}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                orderType === "takeaway"
                  ? "border-pos-accent bg-pos-accent text-white shadow-sm"
                  : "border-border bg-muted/50 text-pos-text-muted hover:bg-muted hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              Take Away
            </button>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-pos-text-muted mx-auto mb-3" />
              <p className="text-pos-text-muted">No items in order</p>
              <p className="text-pos-text-muted text-xs mt-1">Tap a menu item to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-pos-text text-sm truncate">{item.name}</h4>
                  <p className="text-pos-accent text-sm font-medium">
                    {formatInr(item.priceRs)} each
                  </p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-7 text-center text-pos-text font-medium text-sm">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
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
          <div className="space-y-4 border-t border-pos-secondary pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-pos-text-muted text-sm">
                <span>Subtotal</span>
                <span>{formatInr(subtotalRs)}</span>
              </div>
              <div className="flex justify-between text-pos-text-muted text-sm">
                <span>Tax (8%)</span>
                <span>{formatInr(taxRs)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-pos-text border-t border-pos-secondary pt-2">
                <span>Total</span>
                <span>{formatInr(totalRs)}</span>
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
              <div className="grid grid-cols-3 gap-2">
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
                <Button
                  variant="outline"
                  className="border-pos-secondary"
                  disabled={isSubmitting || !lastOrderId}
                  onClick={handlePrintReceipt}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Bill
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setCart([])}
              >
                Clear Order
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
