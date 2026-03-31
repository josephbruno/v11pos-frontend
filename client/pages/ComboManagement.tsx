import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChefHat,
  Check,
  CheckCircle2,
  Edit,
  Minus,
  Package,
  Plus,
  Save,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  createCombo,
  getComboItems,
  getMyRestaurants,
  updateCombo,
  upsertComboItems,
} from "@/lib/apiServices";
import { useProducts } from "@/hooks/useProducts";
import { useCategories, generateSlug } from "@/hooks/useCategories";
import { useCombos } from "@/hooks/useCombos";
import type { Combo, ComboItemInput, Product } from "@/shared/api";

type ComboItemDraft = {
  productId: string;
  quantity: number;
  substituteOptions: string[];
};

function buildComboFormData(payload: Record<string, any>, imageFile?: File | null) {
  const formData = new FormData();

  const appendValue = (key: string, value: any) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value) || typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  };

  Object.entries(payload).forEach(([key, value]) => appendValue(key, value));

  if (imageFile) {
    formData.append("image", imageFile);
  }

  return formData;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Classic Burger",
    description: "Beef patty with lettuce, tomato, and our special sauce",
    price: 12.99,
    category: "main-course",
    stock: 25,
    minStock: 5,
    available: true,
    featured: true,
    cost: 5.5,
    margin: 57,
    tags: ["burger", "beef"],
    modifiers: ["cooking-level", "sauce-choice"],
    department: "kitchen",
    printerTag: "grill",
  },
  {
    id: "2",
    name: "French Fries",
    description: "Crispy golden fries seasoned with salt",
    price: 4.99,
    category: "sides",
    stock: 50,
    minStock: 10,
    available: true,
    featured: false,
    cost: 1.2,
    margin: 76,
    tags: ["fries", "potato", "crispy"],
    modifiers: ["size", "seasoning"],
    department: "kitchen",
    printerTag: "fryer",
  },
];

const mockCombos: Combo[] = [];

function toComboDraftItems(items?: ComboItemInput[]): ComboItemDraft[] {
  return (items || [])
    .filter((i) => i?.product_id)
    .map((i) => ({
      productId: String(i.product_id),
      quantity: Number(i.quantity || 1),
      substituteOptions: i.choices ?? i.substitute_options ?? [],
    }));
}

function toComboApiItems(items: ComboItemDraft[]): ComboItemInput[] {
  return items
    .filter((i) => i?.productId && i.quantity > 0)
    .map((i, index) => ({
      product_id: i.productId,
      quantity: i.quantity,
      required: true,
      choice_group: "default",
      choices: i.substituteOptions || [],
      sort_order: index,
    }));
}

function normalizeTags(tagsText: string): string[] {
  const tags = tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

function ComboForm({
  combo,
  onSave,
  onCancel,
  errorMessage,
  isSubmitting,
  onClearError,
  categories,
  restaurantOptions,
  selectedRestaurantId,
  onRestaurantChange,
  isSuperAdmin,
  currentRestaurantName,
}: {
  combo?: Combo | null;
  onSave: (payload: any) => void;
  onCancel: () => void;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onClearError?: () => void;
  categories: { id: string; name: string }[];
  restaurantOptions: { id: string; name: string }[];
  selectedRestaurantId: string;
  onRestaurantChange: (value: string) => void;
  isSuperAdmin: boolean;
  currentRestaurantName: string;
}) {
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState(() => ({
    name: combo?.name || "",
    slug: combo?.slug || "",
    description: combo?.description || "",
    price: combo?.price ?? "",
    categoryId: combo?.category_id || "",
    available: combo?.available ?? true,
    featured: combo?.featured ?? false,
    tagsText: (combo?.tags || []).join(", "),
    validFrom: combo?.valid_from ? combo.valid_from.slice(0, 16) : "",
    validUntil: combo?.valid_until ? combo.valid_until.slice(0, 16) : "",
    maxQuantityPerOrder: combo?.max_quantity_per_order ?? "",
  }));

  useEffect(() => {
    if (slugTouched) return;
    const generated = generateSlug(form.name);
    setForm((prev) => {
      if (!generated || prev.slug === generated) return prev;
      return { ...prev, slug: generated };
    });
  }, [form.name, slugTouched]);

  const effectiveRestaurantId = (combo?.restaurant_id || selectedRestaurantId || "").trim();
  const canSubmit =
    Boolean(effectiveRestaurantId) &&
    Boolean(form.categoryId) &&
    Boolean(form.name.trim()) &&
    Boolean((form.slug || generateSlug(form.name)).trim()) &&
    String(form.price).trim().length > 0;

  const handleSubmit = () => {
    onClearError?.();
    const slugValue = (form.slug || generateSlug(form.name)).trim();
    const priceValue = Number(form.price);
    const payload: Record<string, any> = {
      restaurant_id: effectiveRestaurantId,
      category_id: form.categoryId,
      name: form.name.trim(),
      slug: slugValue,
      description: form.description.trim(),
      price: Number.isFinite(priceValue) ? priceValue : 0,
      available: form.available,
      featured: form.featured,
      tags: normalizeTags(form.tagsText),
      valid_from: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
      valid_until: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
      max_quantity_per_order:
        form.maxQuantityPerOrder === "" || form.maxQuantityPerOrder === null
          ? undefined
          : Number(form.maxQuantityPerOrder),
    };

    if (!payload.description) delete payload.description;

    if (imageFile) {
      onSave(buildComboFormData(payload, imageFile));
      return;
    }

    onSave(payload);
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start justify-between gap-3">
          <div className="min-w-0">{errorMessage}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive"
            onClick={() => onClearError?.()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Restaurant</Label>
            {isSuperAdmin ? (
              <Select
                value={effectiveRestaurantId || "none"}
                onValueChange={(value) => {
                  if (combo) return;
                  onRestaurantChange(value === "none" ? "" : value);
                }}
              >
                <SelectTrigger
                  className="bg-background border-border text-foreground"
                  disabled={Boolean(combo)}
                >
                  <SelectValue placeholder="Select Restaurant" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">Select Restaurant</SelectItem>
                  {restaurantOptions.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={currentRestaurantName || "Current Restaurant"} disabled />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Category</Label>
            <Select
              value={form.categoryId || "none"}
              onValueChange={(value) =>
                setForm((p) => ({ ...p, categoryId: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="none">Select Category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="combo-name" className="text-foreground">
              Name
            </Label>
            <Input
              id="combo-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-background border-border text-foreground"
              placeholder="Enter combo name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="combo-slug" className="text-foreground">
              Slug
            </Label>
            <Input
              id="combo-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
              className="bg-background border-border text-foreground"
              placeholder="combo-slug"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="combo-description" className="text-foreground">
            Description
          </Label>
          <Textarea
            id="combo-description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="Describe the combo"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="combo-price" className="text-foreground">
              Price
            </Label>
            <Input
              id="combo-price"
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  price: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              className="bg-background border-border text-foreground"
              placeholder="0"
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="combo-image" className="text-foreground">
              Image (Upload)
            </Label>
            <Input
              id="combo-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="bg-background border-border text-foreground"
            />
            <div className="text-xs text-muted-foreground">
              {imageFile?.name ||
                combo?.image ||
                "No image selected"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="combo-tags" className="text-foreground">
              Tags (comma separated)
            </Label>
            <Input
              id="combo-tags"
              value={form.tagsText}
              onChange={(e) => setForm((p) => ({ ...p, tagsText: e.target.value }))}
              className="bg-background border-border text-foreground"
              placeholder="combo, meal, lunch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="combo-max" className="text-foreground">
              Max quantity per order
            </Label>
            <Input
              id="combo-max"
              type="number"
              value={form.maxQuantityPerOrder}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  maxQuantityPerOrder: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              className="bg-background border-border text-foreground"
              placeholder="10"
              min={1}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="combo-valid-from" className="text-foreground">
              Valid from
            </Label>
            <Input
              id="combo-valid-from"
              type="datetime-local"
              value={form.validFrom}
              onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="combo-valid-until" className="text-foreground">
              Valid until
            </Label>
            <Input
              id="combo-valid-until"
              type="datetime-local"
              value={form.validUntil}
              onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-foreground">Available</div>
            <div className="text-xs text-muted-foreground">Show this combo in POS/menu</div>
          </div>
          <Switch
            checked={form.available}
            onCheckedChange={(checked) => setForm((p) => ({ ...p, available: checked }))}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-foreground">Featured</div>
            <div className="text-xs text-muted-foreground">Highlight this combo</div>
          </div>
          <Switch
            checked={form.featured}
            onCheckedChange={(checked) => setForm((p) => ({ ...p, featured: checked }))}
          />
        </div>
      </div>

      <Separator />

      <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
        Create the combo first. You can add combo items after the combo is created.
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || Boolean(isSubmitting)}>
          <Save className="mr-2 h-4 w-4" />
          {combo ? "Update Combo" : "Create Combo"}
        </Button>
      </div>
    </div>
  );
}

function ComboItemsBuilder({
  combo,
  onSaveItems,
  onCancel,
  errorMessage,
  isSubmitting,
  onClearError,
  products,
  categories,
}: {
  combo: Combo;
  onSaveItems: (items: ComboItemDraft[]) => void;
  onCancel: () => void;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onClearError?: () => void;
  products: Product[];
  categories: { id: string; name: string }[];
}) {
  const [items, setItems] = useState<ComboItemDraft[]>(() =>
    toComboDraftItems(combo.items),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.category_id === selectedCategory ||
      product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.available;
  });

  const addItem = (product: Product) => {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: String(product.id),
        quantity: 1,
        substituteOptions: [],
      },
    ]);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start justify-between gap-3">
          <div className="min-w-0">{errorMessage}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive"
            onClick={() => onClearError?.()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <div className="space-y-1">
        <div className="text-lg font-semibold text-foreground">
          Add Items: {combo.name}
        </div>
        <div className="text-sm text-muted-foreground">
          Save items after the combo exists.
        </div>
      </div>

      <Separator />

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              Selected Items
            </div>
            <div className="text-sm text-muted-foreground">
              {items.length} items
            </div>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {items.map((item) => {
              const product = products.find(
                (p) => String(p.id) === item.productId,
              );
              if (!product) return null;
              return (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="text-foreground font-medium truncate">
                      {product.name}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      ₹{product.price} each
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-foreground w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border text-foreground"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-56 bg-background border-border text-foreground">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-3 bg-background border border-border rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-medium truncate">
                    {product.name}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    ₹{product.price}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(product)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={() => {
            onClearError?.();
            onSaveItems(items);
          }}
          disabled={Boolean(isSubmitting)}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Items
        </Button>
      </div>
    </div>
  );
}

export default function ComboManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const isSuperAdmin = ["super_admin", "superadmin"].includes(
    String(user?.role || "").toLowerCase().trim(),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [isAddingCombo, setIsAddingCombo] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [editingItemsCombo, setEditingItemsCombo] = useState<Combo | null>(null);
  const [combos, setCombos] = useState<Combo[]>(mockCombos);
  const [comboFormError, setComboFormError] = useState<string | null>(null);
  const [itemsFormError, setItemsFormError] = useState<string | null>(null);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");

  const restaurantsQuery = useQuery({
    queryKey: ["my-restaurants"],
    queryFn: () => getMyRestaurants(),
    enabled: Boolean(isSuperAdmin),
  });

  const productsQuery = useProducts(undefined, selectedRestaurantId);
  const categoriesQuery = useCategories({ active: true, page_size: 200 }, selectedRestaurantId);
  const combosQuery = useCombos(undefined, selectedRestaurantId);

  const apiProducts = useMemo(() => {
    const payload = productsQuery.data as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.products ??
      payload?.data ??
      payload;
    return Array.isArray(source) ? source : [];
  }, [productsQuery.data]);

  const apiCategories = useMemo(() => {
    const payload = categoriesQuery.data as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.categories ??
      payload?.data ??
      payload;
    return Array.isArray(source) ? source : [];
  }, [categoriesQuery.data]);

  const apiCombos = useMemo(() => {
    const payload = combosQuery.data as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.combos ??
      payload?.data ??
      payload;
    return Array.isArray(source) ? source : [];
  }, [combosQuery.data]);

  const productsDataSource = (apiProducts.length ? apiProducts : mockProducts) as Product[];
  const categoryOptions = apiCategories.map((cat: any) => ({
    id: String(cat.id),
    name: String(cat.name || cat.title || ""),
  }));

  useEffect(() => {
    if (!apiCombos.length) {
      setCombos([]);
      return;
    }

    const mapped = apiCombos.map((raw: any) => ({
      id: String(raw.id || raw.combo_id || ""),
      name: String(raw.name || ""),
      slug: String(raw.slug || generateSlug(String(raw.name || ""))),
      description: raw.description ? String(raw.description) : undefined,
      price: Number(raw.price ?? 0),
      category_id: String(raw.category_id || ""),
      image: raw.image ? String(raw.image) : undefined,
      available: raw.available ?? true,
      featured: raw.featured ?? false,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      valid_from: raw.valid_from,
      valid_until: raw.valid_until,
      max_quantity_per_order: raw.max_quantity_per_order,
      restaurant_id: String(raw.restaurant_id || selectedRestaurantId || ""),
      items: Array.isArray(raw.items) ? raw.items : undefined,
    })) as Combo[];

    setCombos(mapped);
  }, [apiCombos, selectedRestaurantId]);

  useEffect(() => {
    if (!apiCombos.length) return;

    let isCancelled = false;

    const extractItemsArray = (payload: any) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.data?.data)) return payload.data.data;
      return null;
    };

    (async () => {
      const ids = apiCombos
        .map((raw: any) => String(raw?.id || raw?.combo_id || ""))
        .filter(Boolean);

      const results = await Promise.all(
        ids.map(async (comboId: string) => {
          try {
            const response = await getComboItems(comboId);
            const items = extractItemsArray(response);
            return { comboId, items };
          } catch {
            return { comboId, items: null };
          }
        }),
      );

      if (isCancelled) return;

      setCombos((prev) =>
        prev.map((combo) => {
          const found = results.find((r) => String(r.comboId) === String(combo.id));
          if (!found || !Array.isArray(found.items)) return combo;
          return { ...combo, items: found.items } as Combo;
        }),
      );
    })();

    return () => {
      isCancelled = true;
    };
  }, [apiCombos]);

  const restaurantOptions = useMemo(() => {
    const payload = restaurantsQuery.data as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.restaurants ??
      payload?.data ??
      payload;
    const restaurants = Array.isArray(source)
      ? source
      : Array.isArray(source?.items)
        ? source.items
        : Array.isArray(source?.restaurants)
          ? source.restaurants
          : [];

    return Array.from(
      new Map(
        restaurants
          .filter(
            (restaurant: any) =>
              restaurant?.id && (restaurant?.name || restaurant?.business_name),
          )
          .map((restaurant: any) => [
            String(restaurant.id),
            {
              id: String(restaurant.id),
              name: String(restaurant.name || restaurant.business_name),
            },
          ]),
      ).values(),
    ) as { id: string; name: string }[];
  }, [restaurantsQuery.data]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedRestaurantId(user?.branchId || "");
    }
  }, [isSuperAdmin, user?.branchId]);

  useEffect(() => {
    if (isSuperAdmin && !selectedRestaurantId && restaurantOptions.length > 0) {
      setSelectedRestaurantId(restaurantOptions[0].id);
    }
  }, [isSuperAdmin, selectedRestaurantId, restaurantOptions]);

  const createComboMutation = useMutation({
    mutationFn: createCombo,
    onSuccess: (response: any) => {
      setComboFormError(null);
      const payload = response?.data?.data ?? response?.data ?? response ?? null;
      const mapped: Combo = {
        id: String(payload?.id || `combo-${Date.now()}`),
        name: String(payload?.name || ""),
        slug: String(payload?.slug || generateSlug(String(payload?.name || ""))),
        description: payload?.description ? String(payload.description) : undefined,
        price: Number(payload?.price ?? 0),
        category_id: String(payload?.category_id || ""),
        image: payload?.image ? String(payload.image) : undefined,
        available: payload?.available ?? true,
        featured: payload?.featured ?? false,
        tags: Array.isArray(payload?.tags) ? payload.tags : [],
        valid_from: payload?.valid_from,
        valid_until: payload?.valid_until,
        max_quantity_per_order: payload?.max_quantity_per_order,
        restaurant_id: String(payload?.restaurant_id || selectedRestaurantId || ""),
        items: Array.isArray(payload?.items) ? payload.items : undefined,
      };
      setCombos((prev) => [mapped, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["combos"] });
      addToast({
        type: "success",
        title: "Combo Created",
        description: "Combo has been created successfully",
      });
      setIsAddingCombo(false);
    },
    onError: (error: any) => {
      setComboFormError(
        error?.message || error?.data?.message || "Failed to create combo.",
      );
    },
  });

  const updateComboMutation = useMutation({
    mutationFn: ({ comboId, comboData }: { comboId: string; comboData: any }) =>
      updateCombo(comboId, comboData),
    onSuccess: (response: any, variables) => {
      setComboFormError(null);
      setItemsFormError(null);
      const payload = response?.data?.data ?? response?.data ?? response ?? null;
      setCombos((prev) =>
        prev.map((c) => {
          if (String(c.id) !== String(variables.comboId)) return c;
          if (!payload) return c;
          return {
            ...c,
            name: payload.name ?? c.name,
            slug: payload.slug ?? c.slug,
            description: payload.description ?? c.description,
            price: payload.price ?? c.price,
            category_id: payload.category_id ?? c.category_id,
            image: payload.image ?? c.image,
            available: payload.available ?? c.available,
            featured: payload.featured ?? c.featured,
            tags: Array.isArray(payload.tags) ? payload.tags : c.tags,
            valid_from: payload.valid_from ?? c.valid_from,
            valid_until: payload.valid_until ?? c.valid_until,
            max_quantity_per_order:
              payload.max_quantity_per_order ?? c.max_quantity_per_order,
            restaurant_id: payload.restaurant_id ?? c.restaurant_id,
            items: Array.isArray(payload.items) ? payload.items : c.items,
          } as Combo;
        }),
      );

      addToast({
        type: "success",
        title: "Combo Updated",
        description: "Combo has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["combos"] });
      setEditingCombo(null);
      setEditingItemsCombo(null);
    },
    onError: (error: any) => {
      const message =
        error?.message || error?.data?.message || "Failed to update combo.";
      if (editingItemsCombo) {
        setItemsFormError(message);
        return;
      }
      setComboFormError(message);
    },
  });

  const upsertComboItemsMutation = useMutation({
    mutationFn: ({
      comboId,
      items,
    }: {
      comboId: string;
      items: ComboItemInput[];
    }) => upsertComboItems(comboId, { items }),
    onSuccess: (response: any, variables) => {
      setItemsFormError(null);
      const payload = response?.data?.data ?? response?.data ?? response ?? null;
      const updatedItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : null;

      if (Array.isArray(updatedItems)) {
        setCombos((prev) =>
          prev.map((c) =>
            String(c.id) === String(variables.comboId)
              ? ({ ...c, items: updatedItems } as Combo)
              : c,
          ),
        );
        setEditingItemsCombo((prev) =>
          prev && String(prev.id) === String(variables.comboId)
            ? ({ ...prev, items: updatedItems } as Combo)
            : prev,
        );
      }
      addToast({
        type: "success",
        title: "Items Saved",
        description: "Combo items saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["combos"] });
      setEditingItemsCombo(null);
    },
    onError: (error: any) => {
      const message =
        error?.message || error?.data?.message || "Failed to save combo items.";
      setItemsFormError(message);
    },
  });

  const filteredCombos = combos.filter((combo) => {
    const matchesSearch = String(combo.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? combo.available
          : !combo.available;
    const matchesAvailability =
      availabilityFilter === "all"
        ? true
        : availabilityFilter === "available"
          ? combo.available
          : !combo.available;
    return matchesSearch && matchesStatus && matchesAvailability;
  });

  const readPayloadField = (payload: any, key: string): string => {
    if (!payload) return "";
    if (typeof payload === "object" && "get" in payload && typeof payload.get === "function") {
      const value = payload.get(key);
      return value === null || value === undefined ? "" : String(value);
    }
    return payload?.[key] === undefined || payload?.[key] === null ? "" : String(payload[key]);
  };

  const handleSaveCombo = (payload: any) => {
    setComboFormError(null);
    const restaurantIdValue = readPayloadField(payload, "restaurant_id");
    const categoryIdValue = readPayloadField(payload, "category_id");
    const nameValue = readPayloadField(payload, "name");
    const slugValue = readPayloadField(payload, "slug");

    if (!restaurantIdValue.trim()) {
      setComboFormError("Please select a restaurant before creating a combo.");
      return;
    }
    if (!categoryIdValue.trim()) {
      setComboFormError("Please select a category before creating a combo.");
      return;
    }
    if (!nameValue.trim()) {
      setComboFormError("Please enter a combo name.");
      return;
    }
    if (!slugValue.trim()) {
      setComboFormError("Please enter a valid slug.");
      return;
    }

    if (editingCombo) {
      updateComboMutation.mutate({ comboId: editingCombo.id, comboData: payload });
      return;
    }

    createComboMutation.mutate(payload);
  };

  const handleSaveItems = (combo: Combo, items: ComboItemDraft[]) => {
    setItemsFormError(null);
    if (!items.length) {
      setItemsFormError("Please add at least one item before saving.");
      return;
    }
    upsertComboItemsMutation.mutate({
      comboId: combo.id,
      items: toComboApiItems(items),
    });
  };

  const deleteCombo = (comboId: string) => {
    setCombos((prev) => prev.filter((c) => c.id !== comboId));
  };

  const setComboAvailability = (combo: Combo, available: boolean) => {
    const previousAvailable = combo.available;

    const updatePayload = {
      restaurant_id: combo.restaurant_id,
      category_id: combo.category_id,
      name: combo.name,
      slug: combo.slug,
      description: combo.description,
      price: combo.price,
      image: combo.image,
      available,
      is_available: available,
      active: available,
      is_active: available,
      featured: combo.featured,
      tags: combo.tags,
      valid_from: combo.valid_from,
      valid_until: combo.valid_until,
      max_quantity_per_order: combo.max_quantity_per_order,
    };

    setCombos((prev) =>
      prev.map((c) =>
        String(c.id) === String(combo.id) ? ({ ...c, available } as Combo) : c,
      ),
    );
    setEditingCombo((prev) =>
      prev && String(prev.id) === String(combo.id) && !available ? null : prev,
    );
    setEditingItemsCombo((prev) =>
      prev && String(prev.id) === String(combo.id) && !available ? null : prev,
    );
    if (!available) {
      setComboFormError(null);
      setItemsFormError(null);
    }

    updateComboMutation.mutate(
      {
        comboId: combo.id,
        comboData: updatePayload,
      },
      {
        onError: (error: any) => {
          setCombos((prev) =>
            prev.map((c) =>
              String(c.id) === String(combo.id)
                ? ({ ...c, available: previousAvailable } as Combo)
                : c,
            ),
          );
          addToast({
            type: "error",
            title: "Failed to Update Status",
            description:
              [
                error?.data?.message || error?.message || "Unable to update combo status.",
                typeof error?.status === "number" ? `(${error.status})` : "",
              ]
                .filter(Boolean)
                .join(" "),
          });
        },
      },
    );
  };

  const currentRestaurantName =
    restaurantOptions.find((r) => r.id === selectedRestaurantId)?.name || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Combo Management</h1>
          <p className="text-muted-foreground mt-1">
            Create combos first, then add combo items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Select
              value={selectedRestaurantId || "none"}
              onValueChange={(value) =>
                setSelectedRestaurantId(value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="w-56 bg-background border-border text-foreground">
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="none">Select Restaurant</SelectItem>
                {restaurantOptions.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog
            open={isAddingCombo}
            onOpenChange={(open) => {
              setComboFormError(null);
              setIsAddingCombo(open);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <ChefHat className="mr-2 h-4 w-4" />
                Create Combo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  Create New Combo
                </DialogTitle>
              </DialogHeader>
              <ComboForm
                combo={null}
                onSave={handleSaveCombo}
                onCancel={() => {
                  setComboFormError(null);
                  setIsAddingCombo(false);
                }}
                errorMessage={comboFormError}
                isSubmitting={createComboMutation.isPending}
                onClearError={() => setComboFormError(null)}
                categories={categoryOptions}
                restaurantOptions={restaurantOptions}
                selectedRestaurantId={selectedRestaurantId}
                onRestaurantChange={setSelectedRestaurantId}
                isSuperAdmin={isSuperAdmin}
                currentRestaurantName={currentRestaurantName}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 overflow-x-auto">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search combos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value === "all" || value === "active" || value === "inactive") {
                  setStatusFilter(value);
                }
              }}
            >
              <SelectTrigger className="w-full md:w-56 bg-background border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={availabilityFilter}
              onValueChange={(value) => {
                if (value === "all" || value === "available" || value === "unavailable") {
                  setAvailabilityFilter(value);
                }
              }}
            >
              <SelectTrigger className="w-full md:w-56 bg-background border-border text-foreground">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredCombos.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-10 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No combos found</h3>
            <p className="text-muted-foreground mt-1">
              Create a combo to start adding combo items.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => (
            <Card key={combo.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-card-foreground truncate">
                      {combo.name}
                    </CardTitle>
                    {combo.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {combo.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {combo.available ? "Active" : "Inactive"}
                      </span>
                      {combo.available ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Active" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" aria-label="Inactive" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          combo.available
                            ? "text-sm font-medium text-green-600"
                            : "text-sm font-medium text-destructive"
                        }
                      >
                        {combo.available ? "Available" : "Unavailable"}
                      </span>
                      <Switch
                        checked={combo.available}
                        onCheckedChange={(checked) => setComboAvailability(combo, checked)}
                        aria-label={combo.available ? "Mark unavailable" : "Mark available"}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={combo.available ? "space-y-4" : "space-y-4 opacity-80"}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-foreground font-medium">
                    ₹{Number(combo.price || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="text-foreground font-medium">
                    {Array.isArray(combo.items) ? combo.items.length : 0}
                  </span>
                </div>
                {Array.isArray(combo.items) && combo.items.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">Includes</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {combo.items.slice(0, 4).map((item: any) => {
                        const product = productsDataSource.find(
                          (p) => String(p.id) === String(item.product_id),
                        );
                        return (
                          <div
                            key={String(item.id || item.product_id)}
                            className="truncate text-muted-foreground"
                            title={String(product?.name || item.product_id)}
                          >
                            {Number(item.quantity || 1)}x {String(product?.name || item.product_id)}
                          </div>
                        );
                      })}
                      {combo.items.length > 4 ? (
                        <div className="col-span-2 text-xs text-muted-foreground">
                          +{combo.items.length - 4} more
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {combo.tags?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {combo.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {combo.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{combo.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                ) : null}

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Dialog
                    open={editingItemsCombo?.id === combo.id}
                    onOpenChange={(open) =>
                      setEditingItemsCombo(() => {
                        setItemsFormError(null);
                        return open ? combo : null;
                      })
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={!combo.available}
                        title={
                          combo.available
                            ? "Add Items"
                            : "Inactive combo (activate to edit)"
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Items
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-card-foreground">
                          Manage Combo Items
                        </DialogTitle>
                      </DialogHeader>
                      {editingItemsCombo && (
                        <ComboItemsBuilder
                          combo={editingItemsCombo}
                          onCancel={() => {
                            setItemsFormError(null);
                            setEditingItemsCombo(null);
                          }}
                          onSaveItems={(items) => handleSaveItems(combo, items)}
                          errorMessage={itemsFormError}
                          isSubmitting={upsertComboItemsMutation.isPending}
                          onClearError={() => setItemsFormError(null)}
                          products={productsDataSource}
                          categories={categoryOptions}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={editingCombo?.id === combo.id}
                    onOpenChange={(open) => {
                      setComboFormError(null);
                      setEditingCombo(open ? combo : null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={!combo.available}
                        title={
                          combo.available ? "Edit" : "Inactive combo (activate to edit)"
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-card-foreground">
                          Edit Combo
                        </DialogTitle>
                      </DialogHeader>
                      {editingCombo && (
                        <ComboForm
                          combo={editingCombo}
                          onSave={handleSaveCombo}
                          onCancel={() => {
                            setComboFormError(null);
                            setEditingCombo(null);
                          }}
                          errorMessage={comboFormError}
                          isSubmitting={updateComboMutation.isPending}
                          onClearError={() => setComboFormError(null)}
                          categories={categoryOptions}
                          restaurantOptions={restaurantOptions}
                          selectedRestaurantId={selectedRestaurantId}
                          onRestaurantChange={setSelectedRestaurantId}
                          isSuperAdmin={isSuperAdmin}
                          currentRestaurantName={
                            restaurantOptions.find(
                              (r) =>
                                String(r.id) ===
                                String(editingCombo.restaurant_id || selectedRestaurantId),
                            )?.name || currentRestaurantName
                          }
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-muted/30 hover:bg-muted/50"
                    onClick={() => setComboAvailability(combo, !combo.available)}
                    title={combo.available ? "Mark Inactive" : "Mark Active"}
                    aria-label={combo.available ? "Mark Inactive" : "Mark Active"}
                  >
                    {combo.available ? (
                      <X className="h-5 w-5 text-destructive" />
                    ) : (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
