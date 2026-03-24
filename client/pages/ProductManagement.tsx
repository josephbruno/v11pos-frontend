import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  DollarSign,
  AlertTriangle,
  Star,
  MoreVertical,
  ImageIcon,
  Save,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/useProducts";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  generateSlug,
} from "@/hooks/useCategories";
import {
  useModifiers,
  useCreateModifier,
  useUpdateModifier,
} from "@/hooks/useModifiers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getImageCropConfig, validateImageFile } from "@/lib/imageCropConfig";
import { useAuth } from "@/contexts/AuthContext";
import { getMyRestaurants } from "@/lib/apiServices";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Product {
  id: string;
  restaurant_id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  minStock: number;
  available: boolean;
  is_published: boolean;
  featured: boolean;
  image?: string;
  cost: number;
  margin: number;
  tags: string[];
  modifiers: string[];
  sku?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
  productCount: number;
}

interface Modifier {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface RestaurantOption {
  id: string;
  name: string;
}

function formatINR(amount: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(amount);
}

type ProductFormProps = {
  product?: Product;
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
  imagePreview: string;
  setImagePreview: (preview: string) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  isSuperAdmin: boolean;
  defaultRestaurantId: string;
  restaurantOptions: RestaurantOption[];
  userBranchId: string;
};

function ProductForm({
  product,
  onSave,
  onCancel,
  imagePreview,
  setImagePreview,
  imageFile,
  setImageFile,
  isSuperAdmin,
  defaultRestaurantId,
  restaurantOptions,
  userBranchId,
}: ProductFormProps) {
  const isEditMode = !!product;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const sanitizeProductName = (value: string) =>
    value.replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");

  const [formData, setFormData] = useState({
    restaurant_id: product?.restaurant_id || (isSuperAdmin ? "" : (defaultRestaurantId || "")),
    name: product?.name || "",
    price: product?.price || 0,
    category: product?.category || "",
    image: product?.image || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPriceFocused, setIsPriceFocused] = useState(false);

  useEffect(() => {
    if (!product && !isSuperAdmin) {
      setFormData((prev) => ({ ...prev, restaurant_id: defaultRestaurantId || "" }));
    }
  }, [defaultRestaurantId, product, isSuperAdmin]);

  const { data: formCategoriesData } = useCategories(
    { page_size: 100 },
    formData.restaurant_id,
  );

  const formCategories = (() => {
    const payload = formCategoriesData as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.categories ??
      payload?.data ??
      payload;
    return Array.isArray(source) ? source : [];
  })();

  // Get crop dimensions from config
  const imageCropConfig = getImageCropConfig("product");
  const { width: cropWidth, height: cropHeight } = imageCropConfig;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Product name must be at least 3 characters";
    } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
      newErrors.name = "Product name can contain letters and spaces only";
    }

    if (!isEditMode) {
      if (!formData.restaurant_id.trim()) {
        newErrors.restaurant_id = "Restaurant is required";
      }

      if (!formData.category) {
        newErrors.category = "Category is required";
      }
    }

    if (!Number.isInteger(formData.price) || formData.price <= 0) {
      newErrors.price = "Price is required and must be a whole number greater than 0";
    }

    if (!imagePreview && !imageFile) {
      newErrors.image = "Product image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validate file using config
      const validation = validateImageFile(file, "product");

      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, image: validation.error || "Invalid image file" }));
        return;
      }

      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });

      // Store the original file for cropping during submit
      setImageFile(file);

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      onSave(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedPriceValue = isPriceFocused && formData.price === 0 ? "" : formData.price;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="restaurant" className="text-pos-text">
            Restaurant
          </Label>
          {isSuperAdmin ? (
            <Select
              value={formData.restaurant_id || "none"}
              disabled={isEditMode}
              onValueChange={(value) => {
                const nextRestaurantId = value === "none" ? "" : value;
                setFormData({ ...formData, restaurant_id: nextRestaurantId, category: "" });
                setErrors((prev) => {
                  const next = { ...prev };
                  if (!nextRestaurantId) next.restaurant_id = "Restaurant is required";
                  else delete next.restaurant_id;
                  delete next.category;
                  return next;
                });
              }}
            >
              <SelectTrigger className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.restaurant_id ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent className="bg-pos-surface border-pos-secondary">
                <SelectItem value="none">Select Restaurant</SelectItem>
                {restaurantOptions.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="restaurant"
              value={userBranchId || "Current Restaurant"}
              disabled
              className="bg-pos-secondary border-2 border-pos-secondary text-pos-text"
            />
          )}
          {errors.restaurant_id && <p className="text-xs text-destructive">{errors.restaurant_id}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">
            Product Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: sanitizeProductName(e.target.value) });
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            className={`bg-background border-2 border-border text-foreground ${errors.name ? "border-destructive" : ""
              }`}
            placeholder="Enter product name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-pos-text">
            Category
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              setFormData({ ...formData, category: value });
              if (errors.category) setErrors({ ...errors, category: "" });
            }}
            disabled={isEditMode || !formData.restaurant_id}
          >
            <SelectTrigger className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.category ? "border-destructive" : ""
              }`}>
              <SelectValue placeholder={formData.restaurant_id ? "Select a category" : "Select restaurant first"} />
            </SelectTrigger>
            <SelectContent className="bg-pos-surface border-pos-secondary">
              {formCategories.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price" className="text-pos-text">
            Price
          </Label>
          <Input
            id="price"
            type="number"
            step="1"
            min="0"
            value={displayedPriceValue}
            onFocus={() => setIsPriceFocused(true)}
            onBlur={(e) => {
              setIsPriceFocused(false);
              if (!e.target.value) {
                setFormData((prev) => ({ ...prev, price: 0 }));
              }
            }}
            onChange={(e) => {
              const nextPrice = e.target.value ? parseInt(e.target.value, 10) || 0 : 0;
              setFormData({
                ...formData,
                price: nextPrice,
              });
              if (errors.price) setErrors({ ...errors, price: "" });
            }}
            className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.price ? "border-destructive" : ""
              }`}
            placeholder="Enter price"
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="image" className="text-foreground">
          Product Image
        </Label>
        <div className="flex items-start gap-4">
          {/* Image Preview */}
          <div className="w-32 h-32 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          {/* Upload Button */}
          <div className="flex-1 space-y-2">
            <input
              ref={imageInputRef}
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-2 border-border"
                onClick={() => imageInputRef.current?.click()}
              >
                Select Image
              </Button>
              <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                {imageFile?.name || "No file selected"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a product image (max 2MB, JPG, PNG, GIF). Image will be cropped to {cropWidth}x{cropHeight}px.
            </p>
            {imagePreview && <p className="text-xs text-green-600">âœ“ Image ready for upload</p>}
            {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-pos-secondary">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-pos-accent hover:bg-pos-accent/90"
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Product
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

type CategoryFormProps = {
  category?: any;
  onSave: (category: any) => void;
  onCancel: () => void;
  categoryImagePreview: string;
  setCategoryImagePreview: (preview: string) => void;
  categoryImageFile: File | null;
  setCategoryImageFile: (file: File | null) => void;
};

function CategoryForm({
  category,
  onSave,
  onCancel,
  categoryImagePreview,
  setCategoryImagePreview,
  categoryImageFile,
  setCategoryImageFile,
}: CategoryFormProps) {
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const sanitizeCategoryName = (value: string) => value.replace(/[^A-Za-z\s]/g, "");
  const sanitizeCategoryDescription = (value: string) => value.replace(/[^A-Za-z0-9\s]/g, "");

  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    active: category?.active ?? true,
    sort_order: category?.sort_order || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageCropConfig = getImageCropConfig("category");
  const { width: cropWidth, height: cropHeight } = imageCropConfig;

  useEffect(() => {
    if (!category && formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.name),
      }));
    }
  }, [formData.name, category]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Category name is required";
    else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
      newErrors.name = "Category name can contain letters and spaces only";
    }
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (formData.description && !/^[A-Za-z0-9\s]*$/.test(formData.description)) {
      newErrors.description = "Description cannot contain special characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, "category");
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, image: validation.error || "Invalid image file" }));
        setCategoryImageFile(null);
        return;
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
      setCategoryImageFile(file);
      setCategoryImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      onSave({ ...formData, image: categoryImageFile });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Category Image</Label>
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center overflow-hidden bg-muted">
            {categoryImagePreview ? (
              <img
                src={
                  categoryImagePreview.startsWith("/uploads")
                    ? `${BACKEND_URL}${categoryImagePreview}`
                    : categoryImagePreview
                }
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={categoryImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => categoryImageInputRef.current?.click()}
              >
                Select Image
              </Button>
              <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                {categoryImageFile?.name || "No file selected"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Max 2MB, JPG/PNG/GIF/WebP. Cropped to {cropWidth}x{cropHeight}px.
            </p>
            {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: sanitizeCategoryName(e.target.value) })}
            placeholder="Category name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label>Slug *</Label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="category-slug"
          />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: sanitizeCategoryDescription(e.target.value),
            })
          }
          rows={3}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <div className="space-y-2">
        <Label>Sort Order</Label>
        <Input
          type="number"
          min="0"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label>Active</Label>
      </div>
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ProductManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isSuperAdmin = ["super_admin", "superadmin"].includes(
    String(user?.role || "").toLowerCase().trim(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPublishFilter, setSelectedPublishFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState<"all" | "low-stock">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addProductFormKey, setAddProductFormKey] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    isSuperAdmin ? "" : (user?.branchId || ""),
  );

  // Image state at parent level to persist across dialog re-renders
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Category management state
  const tabParam = searchParams.get("tab");
  const singleViewTab =
    tabParam === "products" || tabParam === "modifiers" ? tabParam : null;
  const initialTab =
    tabParam === "products" || tabParam === "categories" || tabParam === "modifiers"
      ? tabParam
      : "products";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryDebouncedSearch, setCategoryDebouncedSearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string>("");
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);

  // Modifier management state
  const [modifierPage, setModifierPage] = useState(1);
  const [isAddingModifier, setIsAddingModifier] = useState(false);
  const [editingModifier, setEditingModifier] = useState<any>(null);
  const [selectedModifierForEdit, setSelectedModifierForEdit] = useState<string | null>(null);
  const modifierIconInputRef = useRef<HTMLInputElement>(null);
  const modifierEditImageInputRef = useRef<HTMLInputElement>(null);
  const [modifierIconFile, setModifierIconFile] = useState<File | null>(null);
  const [modifierRestaurantId, setModifierRestaurantId] = useState("");
  const [modifierFormError, setModifierFormError] = useState("");
  const [modifierEditImageFile, setModifierEditImageFile] = useState<File | null>(null);
  const [modifierEditImagePreview, setModifierEditImagePreview] = useState<string>("");
  const [modifierSearchQuery, setModifierSearchQuery] = useState("");
  const [modifierDebouncedSearch, setModifierDebouncedSearch] = useState("");
  const [modifierTypeFilter, setModifierTypeFilter] = useState<"all" | "single" | "multiple">("all");
  const [modifierRequiredFilter, setModifierRequiredFilter] = useState<"all" | "required" | "optional">("all");
  const [modifierActiveFilter, setModifierActiveFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (isAddingModifier) {
      setModifierRestaurantId(selectedRestaurantId || "");
      setModifierIconFile(null);
      setModifierFormError("");
    }
  }, [isAddingModifier, selectedRestaurantId]);

  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<null | {
    product: Product;
    fieldLabel: "Active" | "Available";
    nextValue: boolean;
    updates: Record<string, any>;
  }>(null);
  const [pendingModifierStatusUpdate, setPendingModifierStatusUpdate] = useState<null | {
    modifier: any;
    nextValue: boolean;
  }>(null);
  const [modifierActiveOverrides, setModifierActiveOverrides] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const nextTab =
      tabParam === "products" || tabParam === "categories" || tabParam === "modifiers"
        ? tabParam
        : "products";
    if (nextTab !== activeTab) setActiveTab(nextTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const buildProductSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const { data: restaurantsResponse } = useQuery({
    queryKey: ["my-restaurants", user?.id],
    queryFn: () => getMyRestaurants(0, 500),
    enabled: isSuperAdmin,
    staleTime: 60000,
  });

  const restaurantOptions: RestaurantOption[] = (() => {
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
    ) as RestaurantOption[];
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedCategory("all");
    setCurrentPage(1);
  }, [selectedRestaurantId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPublishFilter, selectedAvailabilityFilter, selectedStockFilter]);

  // Debounce category search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategoryDebouncedSearch(categorySearchQuery);
      setCategoryPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [categorySearchQuery]);

  // Debounce modifier search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setModifierDebouncedSearch(modifierSearchQuery);
      setModifierPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [modifierSearchQuery]);

  useEffect(() => {
    setModifierPage(1);
  }, [modifierTypeFilter, modifierRequiredFilter, modifierActiveFilter, selectedRestaurantId]);

  // API Hooks - Fetch categories for product dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({
    page_size: 100, // Get all categories for dropdown
  }, selectedRestaurantId);

  // API Hooks - Fetch categories for category tab with pagination
  const { data: categoryListResponse, isLoading: categoryListLoading } = useCategories({
    page: categoryPage,
    page_size: 12,
  });

  // Category mutations
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Query client for manual cache invalidation
  const queryClient = useQueryClient();

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

  // API Hooks - Fetch modifiers for modifier tab with pagination
  const modifierActiveFilterValue =
    modifierActiveFilter === "active"
      ? true
      : modifierActiveFilter === "inactive"
        ? false
        : undefined;

  const { data: modifierListResponse, isLoading: modifiersLoading } = useModifiers(
    {
      page: modifierPage,
      page_size: 12,
      active: modifierActiveFilterValue === true ? true : undefined,
    },
    selectedRestaurantId,
  );

  const modifiersPayload = modifierListResponse as any;
  const modifiersDataSource =
    modifiersPayload?.data?.data ??
    modifiersPayload?.data?.items ??
    modifiersPayload?.data?.modifiers ??
    modifiersPayload?.data ??
    modifiersPayload;
  const modifiersList = Array.isArray(modifiersDataSource) ? modifiersDataSource : [];
  const modifiersPagination =
    modifiersPayload?.pagination ??
    modifiersPayload?.data?.pagination ??
    modifiersPayload?.data?.meta?.pagination ??
    modifiersPayload?.meta?.pagination ??
    modifiersPayload?.meta ??
    null;

  useEffect(() => {
    if (!modifiersList.length) return;
    setModifierActiveOverrides((prev) => {
      const next = { ...prev };
      modifiersList.forEach((modifier) => {
        if (!modifier?.id) return;
        const hasActiveProp =
          Object.prototype.hasOwnProperty.call(modifier, "active") ||
          Object.prototype.hasOwnProperty.call(modifier, "is_active") ||
          Object.prototype.hasOwnProperty.call(modifier, "isActive");
        if (hasActiveProp) {
          const activeValue =
            modifier?.active ??
            modifier?.is_active ??
            modifier?.isActive ??
            true;
          next[String(modifier.id)] = !!activeValue;
        }
      });
      return next;
    });
  }, [modifiersList]);

  const filteredModifiers = modifiersList.filter((modifier) => {
    const name = String(modifier?.name || "").toLowerCase();
    if (modifierDebouncedSearch && !name.includes(modifierDebouncedSearch.toLowerCase())) {
      return false;
    }

    if (modifierTypeFilter !== "all" && modifier?.type !== modifierTypeFilter) {
      return false;
    }

    if (modifierRequiredFilter !== "all") {
      const isRequired = !!modifier?.required;
      if (modifierRequiredFilter === "required" && !isRequired) return false;
      if (modifierRequiredFilter === "optional" && isRequired) return false;
    }

    if (modifierActiveFilter === "inactive") {
      const overrideValue = modifier?.id ? modifierActiveOverrides[String(modifier.id)] : undefined;
      const isActive =
        overrideValue ??
        modifier?.active ??
        modifier?.is_active ??
        modifier?.isActive ??
        modifier?.enabled ??
        true;
      if (isActive) return false;
    }

    return true;
  });

  // Debug: Log modifier data
  useEffect(() => {
    if (modifierListResponse) {
      console.log("modifierListResponse:", modifierListResponse);
      console.log("modifierListResponse.data:", modifiersList);
      if (modifiersList.length > 0) {
        console.log("First modifier:", modifiersList[0]);
      }
    }
  }, [modifierListResponse, modifiersList]);


  // Modifier mutations
  const createModifierMutation = useCreateModifier();
  const updateModifierMutation = useUpdateModifier();

  const selectedModifierDetails =
    selectedModifierForEdit
      ? modifiersList.find((modifier) => String(modifier.id) === String(selectedModifierForEdit)) ?? null
      : null;

  useEffect(() => {
    if (!selectedModifierForEdit) return;
    const imageValue =
      selectedModifierDetails?.icon ||
      selectedModifierDetails?.icon_url ||
      selectedModifierDetails?.image ||
      selectedModifierDetails?.image_url;
    if (imageValue) {
      const src = String(imageValue);
      setModifierEditImagePreview(src.startsWith("http") ? src : `${BACKEND_URL}${src}`);
    } else {
      setModifierEditImagePreview("");
    }
    setModifierEditImageFile(null);
  }, [selectedModifierForEdit, selectedModifierDetails]);

  // Build API filters
  const activeFilterValue =
    selectedPublishFilter === "active"
      ? true
      : selectedPublishFilter === "inactive"
        ? false
        : undefined;

  const availabilityFilterValue =
    selectedAvailabilityFilter === "available"
      ? true
      : selectedAvailabilityFilter === "unavailable"
        ? false
        : undefined;

  const filters = {
    page: currentPage,
    page_size: 12,
    search: debouncedSearch || undefined,
    category_id: selectedCategory !== "all" ? selectedCategory : undefined,
    // Backends may use `active` and/or `is_published` for this concept. Send both.
    active: activeFilterValue,
    is_published: activeFilterValue,
    available: availabilityFilterValue,
  };

  // API Hooks - Fetch products
  const { data: productsResponse, isLoading: productsLoading } = useProducts(filters, selectedRestaurantId);
  // Ensure we handle both paginated and non-paginated responses if needed
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
  const pagination = (productsResponse as any)?.pagination;

  // API Hooks - Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Map API categories to UI format
  const categories: any[] = apiCategories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description || "",
    active: cat.active,
    sortOrder: cat.sort_order,
    productCount: 0,
  }));

  // Use categories directly from API
  const displayCategories = categories;

  // Map API products to UI format
  const products: Product[] = apiProducts.map(product => ({
    id: product.id,
    restaurant_id: product.restaurant_id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    price: Number(product.price || 0), // API returns rupees
    category: product.category_id || "",
    stock: product.stock,
    minStock: product.min_stock || 5,
    available: product.available,
    is_published: !!product.is_published,
    featured: product.featured,
    cost: Number(product.cost || 0),
    margin: product.cost && product.price ?
      ((product.price - product.cost) / product.price) * 100 : 0,
    tags: product.tags || [],
    modifiers: [],
    image: product.image || undefined,
    sku: product.sku,
  }));

  const buildProductUpdatePayload = (product: Product, updates: Record<string, any>) => ({
    restaurant_id: product.restaurant_id || selectedRestaurantId,
    name: product.name,
    slug: product.slug,
    price: Number(product.price || 0),
    category_id: product.category,
    ...updates,
  });

  const confirmAndUpdateProduct = ({
    product,
    fieldLabel,
    nextValue,
    updates,
  }: {
    product: Product;
    fieldLabel: "Active" | "Available";
    nextValue: boolean;
    updates: Record<string, any>;
  }) => {
    setPendingStatusUpdate({ product, fieldLabel, nextValue, updates });
  };

  // Mock modifiers removed - now using real API data from useModifiers hook

  // Filtering is now done by API, so we use products directly
  // But keep client-side filtering for low-stock status
  const filteredProducts = products.filter((product) => {
    if (activeFilterValue !== undefined && product.is_published !== activeFilterValue) {
      return false;
    }
    if (
      availabilityFilterValue !== undefined &&
      product.available !== availabilityFilterValue
    ) {
      return false;
    }
    if (selectedStockFilter === "low-stock") {
      return product.stock <= product.minStock;
    }
    return true;
  });

  const getStockStatus = (product: Product) => {
    if (!product.available)
      return { status: "unavailable", color: "bg-red-500" };
    if (product.stock <= product.minStock)
      return { status: "low", color: "bg-yellow-500" };
    return { status: "good", color: "bg-green-500" };
  };

  return (
    <div className="space-y-6">
      <AlertDialog
        open={!!pendingStatusUpdate}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) setPendingStatusUpdate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusUpdate
                ? `Set ${pendingStatusUpdate.fieldLabel} to ${pendingStatusUpdate.nextValue ? "ON" : "OFF"} for "${pendingStatusUpdate.product.name}"?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingStatusUpdate) return;
                updateMutation.mutate(
                  {
                    id: pendingStatusUpdate.product.id,
                    data: buildProductUpdatePayload(
                      pendingStatusUpdate.product,
                      pendingStatusUpdate.updates,
                    ),
                  } as any,
                  {
                    onSettled: () => setPendingStatusUpdate(null),
                  },
                );
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingModifierStatusUpdate}
        onOpenChange={(open) => {
          if (!open && !updateModifierMutation.isPending) setPendingModifierStatusUpdate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Modifier Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingModifierStatusUpdate
                ? `Are you sure you want to set ${pendingModifierStatusUpdate.modifier?.name || "this modifier"} as ${pendingModifierStatusUpdate.nextValue ? "Active" : "Inactive"}?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateModifierMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingModifierStatusUpdate?.modifier?.id) return;
                const modifierId = String(pendingModifierStatusUpdate.modifier.id);
                const previousOverride = modifierActiveOverrides[modifierId];
                setModifierActiveOverrides((prev) => ({
                  ...prev,
                  [modifierId]: pendingModifierStatusUpdate.nextValue,
                }));
                updateModifierMutation.mutate(
                  {
                    id: pendingModifierStatusUpdate.modifier.id,
                    data: {
                      active: pendingModifierStatusUpdate.nextValue,
                      is_active: pendingModifierStatusUpdate.nextValue,
                    },
                  },
                  {
                    onError: () => {
                      setModifierActiveOverrides((prev) => ({
                        ...prev,
                        [modifierId]: previousOverride ?? prev[modifierId],
                      }));
                    },
                    onSettled: () => setPendingModifierStatusUpdate(null),
                  },
                );
              }}
              disabled={updateModifierMutation.isPending}
            >
              {updateModifierMutation.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Product Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage menu items, pricing, and inventory
          </p>
        </div>
        {activeTab === "products" && (
          <Dialog open={isAddingProduct} onOpenChange={(open) => {
            setIsAddingProduct(open);
            if (open) {
              setAddProductFormKey((prev) => prev + 1);
              setImagePreview("");
              setImageFile(null);
              queryClient.invalidateQueries({ queryKey: ["products"] });
            } else {
              setImagePreview("");
              setImageFile(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-pos-surface border-pos-secondary max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-pos-text">
                  Add New Product
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                key={`add-product-${addProductFormKey}`}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                imageFile={imageFile}
                setImageFile={setImageFile}
                isSuperAdmin={isSuperAdmin}
                defaultRestaurantId={selectedRestaurantId}
                restaurantOptions={restaurantOptions}
                userBranchId={user?.branchId || ""}
                onSave={(productData) => {
                  console.log('Product form data:', productData);
                  console.log('Image file:', imageFile);

                  // Prepare payload using required create fields only.
                  const apiData = {
                    restaurant_id: productData.restaurant_id!,
                    name: productData.name!,
                    slug: buildProductSlug(String(productData.name || "")),
                    category_id: productData.category!,
                    price: Number(productData.price || 0),
                    image: imageFile || undefined,
                  };

                  console.log('API data prepared:', apiData);

                  createMutation.mutate(apiData, {
                    onSuccess: () => {
                      console.log('Product created successfully!');
                      setIsAddingProduct(false);
                      setImagePreview("");
                      setImageFile(null);
                    },
                    onError: (error) => {
                      console.error('Error creating product:', error);
                    },
                  });
                }}
                onCancel={() => setIsAddingProduct(false)}
              />
            </DialogContent>
          </Dialog>
        )}
        {activeTab === "categories" && (
          <Dialog open={isAddingCategory} onOpenChange={(open) => {
            setIsAddingCategory(open);
            if (!open) {
              setEditingCategory(null);
              setCategoryImagePreview("");
              setCategoryImageFile(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
              </DialogHeader>
              <CategoryForm
                category={editingCategory}
                categoryImagePreview={categoryImagePreview}
                setCategoryImagePreview={setCategoryImagePreview}
                categoryImageFile={categoryImageFile}
                setCategoryImageFile={setCategoryImageFile}
                onSave={(categoryData) => {
                  if (editingCategory) {
                    updateCategoryMutation.mutate(
                      {
                        id: editingCategory.id,
                        data: {
                          name: categoryData.name,
                          slug: categoryData.slug,
                          description: categoryData.description,
                          active: categoryData.active,
                          sort_order: categoryData.sort_order,
                          image: categoryData.image,
                        }
                      },
                      {
                        onSuccess: () => {
                          setIsAddingCategory(false);
                          setEditingCategory(null);
                          setCategoryImagePreview("");
                          setCategoryImageFile(null);
                        },
                      }
                    );
                  } else {
                    createCategoryMutation.mutate({
                      name: categoryData.name,
                      slug: categoryData.slug,
                      description: categoryData.description,
                      active: categoryData.active,
                      sort_order: categoryData.sort_order,
                      image: categoryData.image,
                    }, {
                      onSuccess: () => {
                        setIsAddingCategory(false);
                        setCategoryImagePreview("");
                        setCategoryImageFile(null);
                      },
                    });
                  }
                }}
                onCancel={() => {
                  setIsAddingCategory(false);
                  setEditingCategory(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
        {activeTab === "modifiers" && (
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setIsAddingModifier(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Modifier
          </Button>

        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (singleViewTab) return;
          setActiveTab(value);
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("tab", value);
              return next;
            },
            { replace: true },
          );
        }}
      >
        {!singleViewTab && (
          <TabsList className="bg-muted border-border">
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Package className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Filter className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger
            value="modifiers"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Modifiers
          </TabsTrigger>
          </TabsList>
        )}

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 flex-wrap gap-y-3">
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
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48 bg-background border-border text-foreground">
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
                <Select
                  value={selectedPublishFilter}
                  onValueChange={(value) =>
                    setSelectedPublishFilter(value as "all" | "active" | "inactive")
                  }
                >
                  <SelectTrigger className="w-44 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedAvailabilityFilter}
                  onValueChange={(value) =>
                    setSelectedAvailabilityFilter(value as "all" | "available" | "unavailable")
                  }
                >
                  <SelectTrigger className="w-44 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Available" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedStockFilter}
                  onValueChange={(value) => setSelectedStockFilter(value as "all" | "low-stock")}
                >
                  <SelectTrigger className="w-40 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {productsLoading || categoriesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : isSuperAdmin && !selectedRestaurantId ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a restaurant</h3>
                <p className="text-muted-foreground">Choose a restaurant to view its products</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or create a new product</p>
              </div>
            </div>
          ) : isSuperAdmin ? (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {categories.find((c) => c.id === product.category)?.name || "-"}
                        </TableCell>
                        <TableCell className="text-foreground">{formatINR(product.price)}</TableCell>
                        <TableCell>
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {product.image ? (
                              <img
                                src={product.image.startsWith("http") ? product.image : `${BACKEND_URL}${product.image}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.parentElement
                                    ?.querySelector("[data-fallback]")
                                    ?.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <ImageIcon
                              data-fallback
                              className={`h-5 w-5 text-muted-foreground ${product.image ? "hidden" : ""}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.is_published}
                              onCheckedChange={(checked) => {
                                confirmAndUpdateProduct({
                                  product,
                                  fieldLabel: "Active",
                                  nextValue: checked,
                                  updates: { is_published: checked },
                                });
                              }}
                              disabled={updateMutation.isPending}
                            />
                            <span className="text-xs text-muted-foreground">
                              {product.is_published ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.available}
                              onCheckedChange={(checked) => {
                                confirmAndUpdateProduct({
                                  product,
                                  fieldLabel: "Available",
                                  nextValue: checked,
                                  updates: { available: checked },
                                });
                              }}
                              disabled={updateMutation.isPending}
                            />
                            <span className="text-xs text-muted-foreground">
                              {product.available ? "Available" : "Unavailable"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog
                              open={editingProduct?.id === product.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingProduct(product);
                                  setImagePreview(product.image ? `${BACKEND_URL}${product.image}` : "");
                                  setImageFile(null);
                                } else {
                                  setEditingProduct(null);
                                  setImagePreview("");
                                  setImageFile(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-pos-surface border-pos-secondary max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-pos-text">
                                    Edit Product
                                  </DialogTitle>
                                </DialogHeader>
                                <ProductForm
                                  product={product}
                                  imagePreview={imagePreview}
                                  setImagePreview={setImagePreview}
                                  imageFile={imageFile}
                                  setImageFile={setImageFile}
                                  isSuperAdmin={isSuperAdmin}
                                  defaultRestaurantId={selectedRestaurantId}
                                  restaurantOptions={restaurantOptions}
                                  userBranchId={user?.branchId || ""}
                                  onSave={(updatedData) => {
                                    const apiData: any = {
                                        restaurant_id: product.restaurant_id || updatedData.restaurant_id,
                                        name: updatedData.name,
                                        slug: buildProductSlug(String(updatedData.name || "")),
                                        price: Number(updatedData.price || 0),
                                        category_id: product.category || updatedData.category,
                                      };

                                    if (imageFile) {
                                      apiData.image = imageFile;
                                    }

                                    updateMutation.mutate({ id: product.id, data: apiData });
                                    setEditingProduct(null);
                                  }}
                                  onCancel={() => {
                                    setEditingProduct(null);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <Card
                    key={product.id}
                    className="bg-pos-surface border-pos-secondary"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-pos-text flex items-center">
                            {product.name}
                            {product.featured && (
                              <Star className="ml-2 h-4 w-4 text-pos-warning fill-current" />
                            )}
                          </CardTitle>
                          <p className="text-sm text-pos-text-muted mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-pos-secondary rounded-md flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image.startsWith("http") ? product.image : `${BACKEND_URL}${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <ImageIcon className={`h-8 w-8 text-pos-text-muted ${product.image ? 'hidden' : ''}`} />
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-pos-text-muted text-sm">Active</span>
                            <Switch
                              checked={product.is_published}
                              onCheckedChange={(checked) => {
                                confirmAndUpdateProduct({
                                  product,
                                  fieldLabel: "Active",
                                  nextValue: checked,
                                  updates: { is_published: checked },
                                });
                              }}
                              disabled={updateMutation.isPending}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-pos-text-muted text-sm">Available</span>
                            <Switch
                              checked={product.available}
                              onCheckedChange={(checked) => {
                                confirmAndUpdateProduct({
                                  product,
                                  fieldLabel: "Available",
                                  nextValue: checked,
                                  updates: { available: checked },
                                });
                              }}
                              disabled={updateMutation.isPending}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-pos-text-muted text-sm">
                            Price
                          </span>
                          <span className="text-pos-text font-bold text-lg">
                            {formatINR(product.price)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-pos-text-muted text-sm">
                            Cost
                          </span>
                          <span className="text-pos-text">{formatINR(product.cost)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-pos-text-muted text-sm">
                            Margin
                          </span>
                          <span className="text-pos-success">
                            {product.margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-pos-text-muted text-sm">
                            Stock:
                          </span>
                          <span className="text-pos-text font-medium">
                            {product.stock}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${stockStatus.color}`}
                          ></div>
                        </div>
                        {product.stock <= product.minStock && (
                          <AlertTriangle className="h-4 w-4 text-pos-warning" />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {
                            categories.find((c) => c.id === product.category)
                              ?.name
                          }
                        </Badge>
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2">
                        <Dialog
                          open={editingProduct?.id === product.id}
                          onOpenChange={(open) => {
                            if (open) {
                              // Set the editing product and initialize image preview
                              setEditingProduct(product);
                              // Concatenate BACKEND_URL with image path if image exists
                              setImagePreview(product.image ? `${BACKEND_URL}${product.image}` : "");
                              setImageFile(null);
                            } else {
                              // Reset when dialog closes
                              setEditingProduct(null);
                              setImagePreview("");
                              setImageFile(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-pos-secondary text-pos-text-muted hover:text-pos-text"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-pos-surface border-pos-secondary max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-pos-text">
                                Edit Product
                              </DialogTitle>
                            </DialogHeader>
                            <ProductForm
                              product={product}
                              imagePreview={imagePreview}
                              setImagePreview={setImagePreview}
                              imageFile={imageFile}
                              setImageFile={setImageFile}
                              isSuperAdmin={isSuperAdmin}
                              defaultRestaurantId={selectedRestaurantId}
                              restaurantOptions={restaurantOptions}
                              userBranchId={user?.branchId || ""}
                              onSave={(updatedData) => {
                                // Build API data object
                                const apiData: any = {
                                  restaurant_id: product.restaurant_id || updatedData.restaurant_id,
                                  name: updatedData.name,
                                  slug: buildProductSlug(String(updatedData.name || "")),
                                  price: Number(updatedData.price || 0),
                                  category_id: product.category || updatedData.category,
                                };

                                // Only include image if a new image file was selected
                                if (imageFile) {
                                  apiData.image = imageFile;
                                }

                                updateMutation.mutate({ id: product.id, data: apiData });
                                // Close dialog after save
                                setEditingProduct(null);
                              }}
                              onCancel={() => {
                                // Close the dialog when cancel is clicked
                                setEditingProduct(null);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!productsLoading && pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.has_previous || productsLoading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.has_next || productsLoading}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Search */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Grid */}
          {categoryListLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !categoryListResponse ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-destructive text-center">
                  Error loading categories. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : categoryListResponse.data?.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  No categories found. Create your first category to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryListResponse.data?.map((category) => (
                  <Card key={category.id} className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-foreground">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{category.slug}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {category.image ? (
                          <img
                            src={category.image.startsWith('http') ? category.image : `${BACKEND_URL}${category.image}`}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description || "No description"}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Order: {category.sort_order}</span>
                        <Badge variant={category.active ? "default" : "secondary"}>
                          {category.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryImagePreview(category.image || "");
                            setIsAddingCategory(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{category.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCategoryMutation.mutate(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {categoryListResponse && categoryListResponse.pagination.total > 12 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((categoryPage - 1) * 12) + 1} to {Math.min(categoryPage * 12, categoryListResponse.pagination.total)} of {categoryListResponse.pagination.total} categories
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoryPage(prev => Math.max(1, prev - 1))}
                      disabled={categoryPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {categoryPage} of {categoryListResponse.pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoryPage(prev => Math.min(categoryListResponse.pagination.total_pages, prev + 1))}
                      disabled={categoryPage === categoryListResponse.pagination.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Modifiers Tab */}
        <TabsContent value="modifiers" className="space-y-6">
          {/* Debug button to force cache refresh */}
          <Button
            onClick={() => {
              console.log('Invalidating modifiers cache...');
              queryClient.invalidateQueries({ queryKey: ['modifiers'] });
              console.log('Cache invalidated, refetching...');
            }}
            variant="outline"
            className="mb-4"
          >
            ðŸ”„ Force Refresh Modifiers Data
          </Button>

          {/* Modifiers Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 flex-wrap gap-y-3">
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
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search modifiers..."
                    value={modifierSearchQuery}
                    onChange={(e) => setModifierSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <Select
                  value={modifierTypeFilter}
                  onValueChange={(value) =>
                    setModifierTypeFilter(value as "all" | "single" | "multiple")
                  }
                >
                  <SelectTrigger className="w-40 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="multiple">Multiple</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={modifierRequiredFilter}
                  onValueChange={(value) =>
                    setModifierRequiredFilter(value as "all" | "required" | "optional")
                  }
                >
                  <SelectTrigger className="w-40 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Required" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={modifierActiveFilter}
                  onValueChange={(value) =>
                    setModifierActiveFilter(value as "all" | "active" | "inactive")
                  }
                >
                  <SelectTrigger className="w-40 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {modifiersLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : isSuperAdmin && !selectedRestaurantId ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a restaurant</h3>
                <p className="text-muted-foreground">Choose a restaurant to view its modifiers</p>
              </div>
            </div>
          ) : !modifierListResponse ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-destructive text-center">
                  Error loading modifiers. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : modifiersList.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  No modifiers found. Create your first modifier to get started.
                </p>
              </CardContent>
            </Card>
          ) : filteredModifiers.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  No modifiers match your filters. Try adjusting the filters or search.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModifiers.map((modifier) => (
                        <TableRow key={modifier.id}>
                          <TableCell className="font-medium">{modifier.name}</TableCell>
                          <TableCell>
                            <Badge variant={modifier.type === "single" ? "default" : "secondary"}>
                              {modifier.type || "unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {(() => {
                                const imageValue =
                                  modifier?.icon ||
                                  modifier?.icon_url ||
                                  modifier?.image ||
                                  modifier?.image_url;
                                if (!imageValue) {
                                  return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
                                }
                                const src = String(imageValue);
                                const resolvedSrc = src.startsWith("http") ? src : `${BACKEND_URL}${src}`;
                                return (
                                  <img
                                    src={resolvedSrc}
                                    alt={modifier.name || "Modifier"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.parentElement
                                        ?.querySelector("[data-fallback]")
                                        ?.classList.remove("hidden");
                                    }}
                                  />
                                );
                              })()}
                              <ImageIcon data-fallback className="hidden h-5 w-5 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={
                                  modifier?.id
                                    ? modifierActiveOverrides[String(modifier.id)] ??
                                      modifier?.active ??
                                      modifier?.is_active ??
                                      modifier?.isActive ??
                                      true
                                    : modifier?.active ??
                                      modifier?.is_active ??
                                      modifier?.isActive ??
                                      true
                                }
                                onCheckedChange={(checked) => {
                                  if (!modifier?.id) return;
                                  setPendingModifierStatusUpdate({
                                    modifier,
                                    nextValue: checked,
                                  });
                                }}
                                disabled={updateModifierMutation.isPending || !modifier?.id}
                              />
                              <span className="text-xs text-muted-foreground">
                                {(modifier?.id
                                  ? modifierActiveOverrides[String(modifier.id)] ??
                                    modifier?.active ??
                                    modifier?.is_active ??
                                    modifier?.isActive ??
                                    true
                                  : modifier?.active ?? modifier?.is_active ?? modifier?.isActive ?? true)
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedModifierForEdit(modifier.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination */}
              {modifiersPagination && modifiersPagination.total_items > 12 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((modifierPage - 1) * 12) + 1} to {Math.min(modifierPage * 12, modifiersPagination.total_items)} of {modifiersPagination.total_items} modifiers
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModifierPage(prev => Math.max(1, prev - 1))}
                      disabled={modifierPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {modifierPage} of {modifiersPagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModifierPage(prev => Math.min(modifiersPagination.total_pages, prev + 1))}
                      disabled={modifierPage === modifiersPagination.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modifier Dialog */}
      <>
        <Dialog
          open={isAddingModifier}
          onOpenChange={(open) => {
            setIsAddingModifier(open);
            if (!open) {
              setEditingModifier(null);
              setModifierIconFile(null);
              setModifierRestaurantId("");
              setModifierFormError("");
            }
          }}
        >
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingModifier ? "Edit Modifier" : "Add New Modifier"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                const restaurantId =
                  isSuperAdmin
                    ? String(modifierRestaurantId || "").trim()
                    : String(user?.branchId || "").trim();

                if (!restaurantId) {
                  setModifierFormError("Restaurant is required");
                  return;
                }
                setModifierFormError("");

                const payload = new FormData();
                payload.append("restaurant_id", restaurantId);
                payload.append("name", String(formData.get("name") || "").trim());
                payload.append("type", String(formData.get("type") || "").trim());
                if (modifierIconFile) payload.append("icon", modifierIconFile);

                createModifierMutation.mutate(payload, {
                  onSuccess: () => {
                    setIsAddingModifier(false);
                    setEditingModifier(null);
                    setModifierIconFile(null);
                  },
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isSuperAdmin ? (
                  <div className="space-y-2">
                    <Label htmlFor="modifier-restaurant" className="text-foreground">
                      Restaurant *
                    </Label>
                    <Select
                      value={modifierRestaurantId || "none"}
                      onValueChange={(value) => setModifierRestaurantId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger className="bg-background border-input text-foreground">
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
                    {modifierFormError && (
                      <p className="text-xs text-destructive">{modifierFormError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-foreground">Restaurant</Label>
                    <Input
                      value={user?.branchId || ""}
                      disabled
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="modifier-name" className="text-foreground">
                    Name *
                  </Label>
                  <Input
                    id="modifier-name"
                    name="name"
                    placeholder="e.g., Size, Toppings"
                    required
                    className="bg-background border-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modifier-type" className="text-foreground">
                    Type *
                  </Label>
                  <select
                    id="modifier-type"
                    name="type"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="single">single</option>
                    <option value="multiple">multiple</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Icon</Label>
                  <input
                    ref={modifierIconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setModifierIconFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => modifierIconInputRef.current?.click()}
                    >
                      Choose Icon
                    </Button>
                    <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                      {modifierIconFile?.name || "No file selected"}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingModifier(false);
                    setEditingModifier(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={createModifierMutation.isPending}
                >
                  {createModifierMutation.isPending ? "Creating..." : "Create Modifier"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Modifier Dialog */}
        <Dialog
          open={!!selectedModifierForEdit}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedModifierForEdit(null);
              setModifierEditImageFile(null);
              setModifierEditImagePreview("");
            }
          }}
        >
          <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Modifier</DialogTitle>
            </DialogHeader>

            {!selectedModifierDetails ? (
              <p className="text-muted-foreground text-center py-8">
                Modifier details not available.
              </p>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Modifier Image</Label>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                      {modifierEditImagePreview ? (
                        <img
                          src={modifierEditImagePreview}
                          alt={selectedModifierDetails?.name || "Modifier"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={modifierEditImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setModifierEditImageFile(file);
                          if (file) {
                            setModifierEditImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => modifierEditImageInputRef.current?.click()}
                        >
                          Choose Image
                        </Button>
                        <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                          {modifierEditImageFile?.name || "No file selected"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Only the image can be updated.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Name</Label>
                    <Input value={selectedModifierDetails?.name || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Type</Label>
                    <Input value={selectedModifierDetails?.type || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Category</Label>
                    <Input value={selectedModifierDetails?.category || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Required</Label>
                    <div className="flex items-center gap-2">
                      <Switch checked={!!selectedModifierDetails?.required} disabled />
                      <span className="text-xs text-muted-foreground">
                        {selectedModifierDetails?.required ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Min Selections</Label>
                    <Input value={selectedModifierDetails?.min_selections ?? ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Max Selections</Label>
                    <Input value={selectedModifierDetails?.max_selections ?? ""} disabled />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedModifierForEdit(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (!selectedModifierForEdit || !modifierEditImageFile) return;
                  const payload = new FormData();
                  payload.append("icon", modifierEditImageFile);
                  updateModifierMutation.mutate(
                    { id: selectedModifierForEdit, data: payload },
                    {
                      onSuccess: () => {
                        setSelectedModifierForEdit(null);
                        setModifierEditImageFile(null);
                        setModifierEditImagePreview("");
                      },
                    },
                  );
                }}
                disabled={!modifierEditImageFile || updateModifierMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {updateModifierMutation.isPending ? "Saving..." : "Save Image"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </div>
  );
}
