import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Save,
  X,
  ChefHat,
  ImageIcon,
  Minus,
  RotateCcw,
  Percent,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { createCombo, getMyRestaurants } from "@/lib/apiServices";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import type {
  Product,
  ComboProduct,
  ComboItem,
  ComboModifier,
} from "@/shared/api";

// Mock data for products
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
  {
    id: "3",
    name: "Coca Cola",
    description: "Classic refreshing cola drink",
    price: 2.99,
    category: "beverages",
    stock: 100,
    minStock: 20,
    available: true,
    featured: false,
    cost: 0.8,
    margin: 73,
    tags: ["beverage", "cold", "cola"],
    modifiers: ["size", "ice"],
    department: "bar",
    printerTag: "beverage_station",
  },
  {
    id: "4",
    name: "Chicken Wings",
    description: "Spicy buffalo chicken wings with ranch dip",
    price: 9.99,
    category: "appetizers",
    stock: 15,
    minStock: 3,
    available: true,
    featured: true,
    cost: 4.2,
    margin: 58,
    tags: ["chicken", "spicy", "wings"],
    modifiers: ["spice-level", "sauce-choice"],
    department: "kitchen",
    printerTag: "grill",
  },
  {
    id: "5",
    name: "Ice Cream Sundae",
    description: "Vanilla ice cream with chocolate sauce and cherry",
    price: 6.99,
    category: "desserts",
    stock: 20,
    minStock: 5,
    available: true,
    featured: false,
    cost: 2.1,
    margin: 70,
    tags: ["dessert", "cold", "sweet"],
    modifiers: ["flavor", "toppings"],
    department: "dessert",
    printerTag: "dessert_station",
  },
];

// Mock combos
const mockCombos: ComboProduct[] = [
  {
    id: "combo-1",
    name: "Classic Burger Combo",
    description: "Classic Burger + Fries + Drink",
    basePrice: 18.97,
    discountType: "fixed",
    discountValue: 2.0,
    items: [
      {
        productId: "1",
        quantity: 1,
        required: true,
        substituteOptions: [],
      },
      {
        productId: "2",
        quantity: 1,
        required: true,
        substituteOptions: [],
      },
      {
        productId: "3",
        quantity: 1,
        required: true,
        substituteOptions: [],
      },
    ],
    available: true,
    category: "combos",
    tags: ["burger", "combo", "meal"],
  },
];

interface ComboBuilderProps {
  combo?: ComboProduct;
  onSave: (combo: Partial<ComboProduct>) => void;
  onCancel: () => void;
  products: Product[];
  categories: { id: string; name: string }[];
  restaurantOptions: { id: string; name: string }[];
  selectedRestaurantId: string;
  onRestaurantChange: (value: string) => void;
  isSuperAdmin: boolean;
  currentRestaurantName: string;
}

function ComboBuilder({
  combo,
  onSave,
  onCancel,
  products,
  categories,
  restaurantOptions,
  selectedRestaurantId,
  onRestaurantChange,
  isSuperAdmin,
  currentRestaurantName,
}: ComboBuilderProps) {
  const [formData, setFormData] = useState({
    name: combo?.name || "",
    description: combo?.description || "",
    discountType: combo?.discountType || "fixed",
    discountValue: combo?.discountValue || 0,
    available: combo?.available ?? true,
    items: combo?.items || [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [maxQuantityPerOrder, setMaxQuantityPerOrder] = useState<number | "">("");

  const buildSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

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

  const addItemToCombo = (product: Product) => {
    const existingItem = formData.items.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      setFormData({
        ...formData,
        items: formData.items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            productId: product.id,
            quantity: 1,
            required: true,
            substituteOptions: [],
          },
        ],
      });
    }
  };

  const removeItemFromCombo = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.productId !== productId),
    });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCombo(productId);
      return;
    }

    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    });
  };

  const toggleItemRequired = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.productId === productId
          ? { ...item, required: !item.required }
          : item,
      ),
    });
  };

  const calculateTotalPrice = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    return itemsTotal;
  };

  const calculateComboPrice = () => {
    const total = calculateTotalPrice();
    if (formData.discountType === "fixed") {
      return Math.max(0, total - formData.discountValue);
    } else {
      return total * (1 - formData.discountValue / 100);
    }
  };

  const calculateSavings = () => {
    return calculateTotalPrice() - calculateComboPrice();
  };

  const handleSubmit = () => {
    const comboData = {
      ...formData,
      basePrice: calculateTotalPrice(),
      price: calculateComboPrice(),
      slug: buildSlug(formData.name || ""),
      image: imageFile || undefined,
      valid_from: validFrom || undefined,
      valid_until: validUntil || undefined,
      max_quantity_per_order:
        typeof maxQuantityPerOrder === "number" ? maxQuantityPerOrder : undefined,
    };
    onSave(comboData);
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Combo Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Restaurant</Label>
            {isSuperAdmin ? (
              <Select
                value={selectedRestaurantId || "none"}
                onValueChange={(value) =>
                  onRestaurantChange(value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground">
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
            <Label htmlFor="combo-name" className="text-foreground">
              Combo Name
            </Label>
            <Input
              id="combo-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border text-foreground"
              placeholder="Enter combo name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Slug</Label>
            <Input
              value={buildSlug(formData.name || "")}
              disabled
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="combo-description" className="text-foreground">
            Description
          </Label>
          <Textarea
            id="combo-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="bg-background border-border text-foreground"
            placeholder="Describe the combo"
            rows={2}
          />
        </div>

        {/* Discount Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Discount Type</Label>
            <Select
              value={formData.discountType}
              onValueChange={(value: "fixed" | "percentage") =>
                setFormData({ ...formData, discountType: value })
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">
              Discount Value ({formData.discountType === "fixed" ? "$" : "%"})
            </Label>
            <Input
              type="number"
              step={formData.discountType === "fixed" ? "0.01" : "1"}
              value={formData.discountValue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountValue: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-pos-text">Available</Label>
            <div className="flex items-center h-10">
              <Switch
                checked={formData.available}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, available: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Price</Label>
            <Input
              value={calculateComboPrice().toFixed(2)}
              disabled
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Valid From</Label>
            <Input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Valid Until</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Max Quantity Per Order</Label>
            <Input
              type="number"
              min="1"
              value={maxQuantityPerOrder}
              onChange={(e) =>
                setMaxQuantityPerOrder(e.target.value ? parseInt(e.target.value, 10) : "")
              }
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    } else {
                      setImagePreview("");
                    }
                  }}
                  className="hidden"
                  id="combo-image"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("combo-image")?.click()}
                  >
                    Choose Image
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                    {imageFile?.name || "No file selected"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Combo Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pos-text">Combo Items</h3>
          <div className="text-sm text-pos-text-muted">
            {formData.items.length} items selected
          </div>
        </div>

        {/* Selected Items */}
        {formData.items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-pos-text">
              Selected Items:
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.items.map((item) => {
                const product = products.find(
                  (p) => p.id === item.productId,
                );
                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-pos-secondary rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="text-pos-text font-medium">
                          {product.name}
                        </div>
                        <div className="text-pos-text-muted text-sm">
                          ${product.price} each
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleItemRequired(item.productId)}
                        className={`border-pos-secondary text-xs ${
                          item.required
                            ? "bg-pos-accent text-pos-text"
                            : "text-pos-text-muted"
                        }`}
                      >
                        {item.required ? "Required" : "Optional"}
                      </Button>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItemQuantity(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          className="h-8 w-8 p-0 border-pos-secondary text-pos-text-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-pos-text w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItemQuantity(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          className="h-8 w-8 p-0 border-pos-secondary text-pos-text-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItemFromCombo(item.productId)}
                        className="h-8 w-8 p-0 border-pos-secondary text-pos-error"
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

        {/* Product Search and Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-pos-text">Add Products:</h4>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pos-text-muted h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-pos-surface border-pos-secondary text-pos-text"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48 bg-pos-surface border-pos-secondary text-pos-text">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-pos-surface border-pos-secondary">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Available Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-3 bg-pos-surface border border-pos-secondary rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-pos-text font-medium">
                    {product.name}
                  </div>
                  <div className="text-pos-text-muted text-sm">
                    ${product.price}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {product.category_id || product.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {product.department}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addItemToCombo(product)}
                  className="border-pos-secondary text-pos-accent hover:bg-pos-accent hover:text-pos-text"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Pricing Summary */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-pos-text">Pricing Summary</h3>
        <div className="bg-pos-secondary rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-pos-text">
            <span>Individual Items Total:</span>
            <span>${calculateTotalPrice().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-pos-text">
            <span>
              Discount ({formData.discountType === "fixed" ? "$" : "%"}
              {formData.discountValue}):
            </span>
            <span className="text-pos-accent">
              -${calculateSavings().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold text-pos-text border-t border-pos-primary pt-2">
            <span>Combo Price:</span>
            <span>${calculateComboPrice().toFixed(2)}</span>
          </div>
          {calculateSavings() > 0 && (
            <div className="text-center text-pos-accent text-sm">
              Customer saves ${calculateSavings().toFixed(2)}!
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-pos-secondary">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={formData.items.length === 0 || !formData.name}
          className="bg-pos-accent hover:bg-pos-accent/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Combo
        </Button>
      </div>
    </div>
  );
}

export default function ComboManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isSuperAdmin = ["super_admin", "superadmin"].includes(
    String(user?.role || "").toLowerCase().trim(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingCombo, setIsAddingCombo] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboProduct | null>(null);
  const [combos, setCombos] = useState<ComboProduct[]>(mockCombos);

  const buildComboSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const calculateComboPrice = (basePrice: number, discountType: string, discountValue: number) => {
    if (discountType === "fixed") {
      return Math.max(0, basePrice - discountValue);
    }
    return basePrice * (1 - discountValue / 100);
  };
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    isSuperAdmin ? "" : (user?.branchId || ""),
  );

  const { data: restaurantsResponse } = useQuery({
    queryKey: ["my-restaurants", user?.id],
    queryFn: () => getMyRestaurants(0, 500),
    enabled: isSuperAdmin,
    staleTime: 60000,
  });

  const { data: productsResponse, isLoading: productsLoading } = useProducts({
    page: 1,
    page_size: 200,
  }, selectedRestaurantId);

  const { data: categoriesData } = useCategories({
    page_size: 200,
  }, selectedRestaurantId);

  const apiProducts = (() => {
    const payload = productsResponse as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.products ??
      payload?.data ??
      payload;
    return Array.isArray(source) ? source : [];
  })();

  const apiCategories = (() => {
    const payload = categoriesData as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.categories ??
      payload?.data ??
      payload;
    return Array.isArray(source) ? source : [];
  })();

  const productsDataSource = apiProducts.length ? apiProducts : mockProducts;
  const categoryOptions = apiCategories.map((cat: any) => ({
    id: String(cat.id),
    name: String(cat.name || cat.title || ""),
  }));

  const restaurantOptions = (() => {
    const payload = restaurantsResponse as any;
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
          .filter((restaurant: any) => restaurant?.id && (restaurant?.name || restaurant?.business_name))
          .map((restaurant: any) => [
            String(restaurant.id),
            {
              id: String(restaurant.id),
              name: String(restaurant.name || restaurant.business_name),
            },
          ]),
      ).values(),
    ) as { id: string; name: string }[];
  })();

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
      const payload = response?.data?.data ?? response?.data ?? response ?? null;
      if (payload) {
        const mappedCombo: ComboProduct = {
          id: payload.id || `combo-${Date.now()}`,
          name: payload.name || "",
          description: payload.description || "",
          basePrice: Number(payload.base_price ?? payload.basePrice ?? 0),
          discountType: payload.discount_type ?? payload.discountType ?? "fixed",
          discountValue: Number(payload.discount_value ?? payload.discountValue ?? 0),
          items: payload.items ?? [],
          available: payload.available ?? payload.is_available ?? true,
          category: payload.category ?? "combos",
          tags: payload.tags ?? [],
        };
        setCombos((prev) => [...prev, mappedCombo]);
      }
      addToast({
        type: "success",
        title: "Combo Created",
        description: "Combo has been created successfully",
      });
      setIsAddingCombo(false);
      setEditingCombo(null);
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Combo",
        description: error.message || "An error occurred while creating the combo",
      });
    },
  });

  const filteredCombos = combos.filter((combo) =>
    combo.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSaveCombo = (comboData: Partial<ComboProduct>) => {
    console.log("Saving combo payload input:", comboData);
    if (editingCombo) {
      const newCombo: ComboProduct = {
        id: editingCombo?.id || `combo-${Date.now()}`,
        name: comboData.name!,
        description: comboData.description!,
        basePrice: comboData.basePrice!,
        discountType: comboData.discountType!,
        discountValue: comboData.discountValue!,
        items: comboData.items!,
        available: comboData.available!,
        category: editingCombo?.category ?? "",
        tags: comboData.tags || [],
      };
      setCombos(combos.map((c) => (c.id === editingCombo.id ? newCombo : c)));
      setEditingCombo(null);
      return;
    }

    const restaurantId = isSuperAdmin ? selectedRestaurantId : (user?.branchId || "");
    const derivedCategoryId = (() => {
      const firstItem = (comboData.items || [])[0];
      if (!firstItem) return "";
      const product = productsDataSource.find(
        (p) => String(p.id) === String(firstItem.productId ?? firstItem.product_id),
      ) as any;
      return String(product?.category_id || product?.category || "");
    })();

    const payload = {
      restaurant_id: restaurantId,
      name: comboData.name,
      slug: buildComboSlug(String(comboData.name || "")),
      description: comboData.description,
      category_id: derivedCategoryId,
      price: calculateComboPrice(
        Number(comboData.basePrice || 0),
        String(comboData.discountType || "fixed"),
        Number(comboData.discountValue || 0),
      ),
      available: comboData.available,
      tags: comboData.tags || [],
      valid_from: (comboData as any).valid_from,
      valid_until: (comboData as any).valid_until,
      max_quantity_per_order: (comboData as any).max_quantity_per_order,
      items: (comboData.items || []).map((item: any) => ({
        product_id: item.productId ?? item.product_id,
        quantity: item.quantity,
        required: item.required,
        substitute_options: item.substituteOptions ?? item.substitute_options ?? [],
      })),
    };

    if (!payload.restaurant_id) {
      addToast({
        type: "error",
        title: "Restaurant Required",
        description: "Please select a restaurant before creating a combo.",
      });
      return;
    }
    if (!payload.category_id) {
      addToast({
        type: "error",
        title: "Category Required",
        description: "Unable to infer category from selected products.",
      });
      return;
    }

    addToast({
      type: "info",
      title: "Saving Combo",
      description: "Sending combo details to the server...",
    });
    const imageFile = (comboData as any).image as File | undefined;
    if (imageFile) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === "items") {
          formData.append(key, JSON.stringify(value));
          return;
        }
        formData.append(key, String(value));
      });
      formData.append("image", imageFile);
      createComboMutation.mutate(formData);
      return;
    }

    createComboMutation.mutate(payload);
  };

  const deleteCombo = (comboId: string) => {
    setCombos(combos.filter((c) => c.id !== comboId));
  };

  const getComboPrice = (combo: ComboProduct) => {
    const itemsTotal = combo.items.reduce((sum, item) => {
      const product = productsDataSource.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    if (combo.discountType === "fixed") {
      return Math.max(0, itemsTotal - combo.discountValue);
    } else {
      return itemsTotal * (1 - combo.discountValue / 100);
    }
  };

  const getSavings = (combo: ComboProduct) => {
    const itemsTotal = combo.items.reduce((sum, item) => {
      const product = productsDataSource.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    return itemsTotal - getComboPrice(combo);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Combo Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage combo products to increase average order value
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Select
              value={selectedRestaurantId || "none"}
              onValueChange={(value) => setSelectedRestaurantId(value === "none" ? "" : value)}
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
          <Dialog open={isAddingCombo} onOpenChange={setIsAddingCombo}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <ChefHat className="mr-2 h-4 w-4" />
                Create Combo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  Create New Combo
                </DialogTitle>
              </DialogHeader>
              <ComboBuilder
                onSave={handleSaveCombo}
                onCancel={() => setIsAddingCombo(false)}
                products={productsDataSource}
                categories={categoryOptions}
                restaurantOptions={restaurantOptions}
                selectedRestaurantId={selectedRestaurantId}
                onRestaurantChange={setSelectedRestaurantId}
                isSuperAdmin={isSuperAdmin}
                currentRestaurantName={
                  restaurantOptions.find((r) => r.id === selectedRestaurantId)?.name || ""
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search combos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCombos.map((combo) => (
          <Card key={combo.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-card-foreground">
                    {combo.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {combo.description}
                  </p>
                </div>
                <Badge
                  className={`ml-2 ${
                    combo.available
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {combo.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Combo Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  Includes:
                </h4>
                <div className="space-y-1">
                  {combo.items.map((item) => {
                    const product = productsDataSource.find(
                      (p) => p.id === item.productId,
                    );
                    if (!product) return null;

                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.quantity}x {product.name}
                        </span>
                        <span className="text-foreground">
                          ${(product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Individual Total:
                  </span>
                  <span className="text-foreground line-through">
                    ${combo.basePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">
                    Combo Price:
                  </span>
                  <span className="text-foreground font-bold text-lg">
                    ${getComboPrice(combo).toFixed(2)}
                  </span>
                </div>
                {getSavings(combo) > 0 && (
                  <div className="text-center">
                    <Badge className="bg-green-500 text-white">
                      Save ${getSavings(combo).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Discount Info */}
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                {combo.discountType === "fixed" ? (
                  <DollarSign className="h-4 w-4" />
                ) : (
                  <Percent className="h-4 w-4" />
                )}
                <span>
                  {combo.discountType === "fixed"
                    ? `$${combo.discountValue} off`
                    : `${combo.discountValue}% off`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-pos-secondary text-pos-text-muted hover:text-pos-text"
                      onClick={() => setEditingCombo(combo)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-pos-surface border-pos-secondary max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-pos-text">
                        Edit Combo
                      </DialogTitle>
                    </DialogHeader>
                    <ComboBuilder
                      combo={editingCombo || undefined}
                      onSave={handleSaveCombo}
                      onCancel={() => setEditingCombo(null)}
                      products={productsDataSource}
                      categories={categoryOptions}
                      restaurantOptions={restaurantOptions}
                      selectedRestaurantId={selectedRestaurantId}
                      onRestaurantChange={setSelectedRestaurantId}
                      isSuperAdmin={isSuperAdmin}
                      currentRestaurantName={
                        restaurantOptions.find((r) => r.id === selectedRestaurantId)?.name || ""
                      }
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteCombo(combo.id)}
                  className="border-pos-secondary text-pos-error hover:text-pos-error"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCombos.length === 0 && (
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-pos-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-pos-text mb-2">
              No combos found
            </h3>
            <p className="text-pos-text-muted mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "Create your first combo to increase average order value"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddingCombo(true)}
                className="bg-pos-accent hover:bg-pos-accent/90"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Create First Combo
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
