import { useState, useEffect, useRef } from "react";
	import {
	  Plus,
	  Search,
	  CheckCircle2,
	  Edit,
	  Trash2,
	  Package,
	  DollarSign,
	  AlertTriangle,
	  Star,
	  ImageIcon,
	  Save,
	  X,
	  XCircle,
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
import { getMyRestaurants, getProducts } from "@/lib/apiServices";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const normalizeDoubleProtocolUrl = (url: string) =>
  url
    .replace(/^https?:\/\/https:\/\//i, "https://")
    .replace(/^https?:\/\/http:\/\//i, "http://");

const resolveProductImageSrc = (image?: string) => {
  if (!image) return "";
  const cleaned = normalizeDoubleProtocolUrl(image);
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  const base = String(BACKEND_URL || "").replace(/\/$/, "");
  const path = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return `${base}${path}`;
};

interface Product {
  id: string;
  restaurant_id?: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string | null;
  price: number;
  category: string;
  subcategory_id?: string | null;
  stock: number;
  minStock: number;
  min_stock?: number;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  stock_unit?: string | null;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  available: boolean;
  is_published: boolean;
  featured: boolean;
  image?: string;
  thumbnail?: string | null;
  images?: any;
  video_url?: string | null;
  cost: number;
  compare_at_price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  price_varies?: boolean;
  tax_rate?: number | null;
  tax_inclusive?: boolean;
  margin: number;
  tags: string[];
  modifiers: string[];
  sku?: string;
  barcode?: string | null;
  department?: string | null;
  kitchen_station?: string | null;
  preparation_time?: number | null;
  is_veg?: boolean;
  calories?: number | null;
  spice_level?: string | null;
  ingredients?: string | null;
  available_for_delivery?: boolean;
  available_for_takeaway?: boolean;
  available_for_dine_in?: boolean;
  available_from_time?: string | null;
  available_to_time?: string | null;
  has_variants?: boolean;
  variant_options?: any;
  requires_customization?: boolean;
  badge_text?: string | null;
  badge_color?: string | null;
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
  sortKey?: number;
  hasDate?: boolean;
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
  onSave: (product: Record<string, any>) => void;
  onCancel: () => void;
  existingProducts?: Product[];
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
  existingProducts,
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
	  const thumbnailInputRef = useRef<HTMLInputElement>(null);
	  const videoInputRef = useRef<HTMLInputElement>(null);
	  const getRestaurantName = (restaurantId: string) =>
	    restaurantOptions.find((r) => String(r.id) === String(restaurantId))?.name || "";
  const sanitizeProductName = (value: string) =>
    value
      .replace(/[^A-Za-z\s]/g, "")
      .replace(/\s+/g, " ")
      .replace(/^\s+/, "")
      .slice(0, 200);
  const buildSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const [formData, setFormData] = useState({
    restaurant_id: product?.restaurant_id || (isSuperAdmin ? "" : (defaultRestaurantId || "")),
    name: product?.name || "",
    price: product?.price || 0,
    category: product?.category || "",
    image: product?.image || "",
    subcategory_id: product?.subcategory_id || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    cost: product?.cost || 0,
    compare_at_price: product?.compare_at_price ?? "",
    min_price: product?.min_price ?? "",
    max_price: product?.max_price ?? "",
    price_varies: product?.price_varies ?? false,
    tax_rate: product?.tax_rate ?? "",
    tax_inclusive: product?.tax_inclusive ?? false,
    stock: product?.stock ?? 0,
    min_stock: (product as any)?.min_stock ?? product?.minStock ?? 5,
    track_inventory: product?.track_inventory ?? true,
    allow_backorder: product?.allow_backorder ?? false,
    stock_unit: product?.stock_unit ?? "",
    reorder_point: product?.reorder_point ?? "",
    reorder_quantity: product?.reorder_quantity ?? "",
    description: product?.description || "",
    short_description: product?.short_description ?? "",
    thumbnail: product?.thumbnail ?? "",
    images: product?.images ? JSON.stringify(product.images, null, 2) : "",
    video_url: product?.video_url ?? "",
    department: product?.department ?? "kitchen",
    kitchen_station: product?.kitchen_station ?? "",
    preparation_time: product?.preparation_time ?? 15,
    is_veg: product?.is_veg ?? false,
    calories: product?.calories ?? "",
    spice_level: product?.spice_level ?? "",
    ingredients: product?.ingredients ?? "",
    available: product?.available ?? true,
    is_published: product?.is_published ?? true,
    featured: product?.featured ?? false,
    available_for_delivery: product?.available_for_delivery ?? true,
    available_for_takeaway: product?.available_for_takeaway ?? true,
    available_for_dine_in: product?.available_for_dine_in ?? true,
    available_from_time: product?.available_from_time ?? "",
    available_to_time: product?.available_to_time ?? "",
    has_variants: product?.has_variants ?? false,
    variant_options: product?.variant_options ? JSON.stringify(product.variant_options, null, 2) : "",
    requires_customization: product?.requires_customization ?? false,
    badge_text: product?.badge_text ?? "",
    badge_color: product?.badge_color ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const [isTaxRateFocused, setIsTaxRateFocused] = useState(false);
  const [isPreparationTimeFocused, setIsPreparationTimeFocused] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(
    product?.thumbnail ? resolveProductImageSrc(product.thumbnail) : "",
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>(
    (() => {
      const url = String(product?.video_url || "").trim();
      if (!url) return "";
      const resolved = resolveProductImageSrc(url);
      return /\.(mp4|webm|ogg)(\?.*)?$/i.test(resolved) ? resolved : "";
    })(),
  );

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

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Product name is required";
    } else if (trimmedName.length < 3) {
      newErrors.name = "Product name must be at least 3 characters";
    } else if (trimmedName.length > 200) {
      newErrors.name = "Product name must be 200 characters or less";
    } else if (!/^[A-Za-z][A-Za-z\s]*$/.test(trimmedName)) {
      newErrors.name = "Product name must start with a letter and contain letters/spaces only";
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      newErrors.name = "Product name can contain letters and spaces only";
    }
    if (!newErrors.name && formData.restaurant_id) {
      const normalizedName = trimmedName.toLowerCase();
      const currentId = product?.id;
      const duplicateExists = (existingProducts || []).some((p) => {
        if (!p?.restaurant_id) return false;
        if (p.restaurant_id !== formData.restaurant_id) return false;
        if (currentId && p.id === currentId) return false;
        return String(p.name || "").trim().toLowerCase() === normalizedName;
      });
      if (duplicateExists) {
        newErrors.name = "Product name must be unique for this restaurant";
      }
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

    if (isEditMode) {
      if (formData.images && typeof formData.images === "string") {
        try {
          JSON.parse(formData.images);
        } catch {
          newErrors.images = "Images must be valid JSON";
        }
      }
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, "product");
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, thumbnail: validation.error || "Invalid thumbnail file" }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.thumbnail;
      return next;
    });
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedName = formData.name.trim();
      if (trimmedName && formData.restaurant_id) {
        try {
          const nameLookupResponse = await getProducts(formData.restaurant_id, {
            search: trimmedName,
            page_size: 50,
          });
          const payload = nameLookupResponse as any;
          const source =
            payload?.data?.data ??
            payload?.data?.items ??
            payload?.data?.products ??
            payload?.data ??
            payload;
          const matches = Array.isArray(source) ? source : [];
          const normalized = trimmedName.toLowerCase();
          const currentId = product?.id;
          const duplicateExists = matches.some((p: any) => {
            if (currentId && String(p?.id) === String(currentId)) return false;
            return String(p?.name || "").trim().toLowerCase() === normalized;
          });
          if (duplicateExists) {
            setErrors((prev) => ({
              ...prev,
              name: "Product name must be unique for this restaurant",
            }));
            return;
          }
        } catch {
          // If lookup fails, fall back to server-side validation on submit.
        }
      }

      onSave({
        ...formData,
        thumbnail_file: thumbnailFile,
        video_file: videoFile,
      });
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
	        {!isEditMode ? (
	          <>
	            {isSuperAdmin ? (
	              <div className="space-y-2">
	                <Label htmlFor="restaurant" className="text-pos-text">
	                  Restaurant
	                </Label>
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
	                  <SelectTrigger
	                    className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.restaurant_id ? "border-destructive" : ""}`}
	                  >
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
	                {errors.restaurant_id && (
	                  <p className="text-xs text-destructive">{errors.restaurant_id}</p>
	                )}
	              </div>
	            ) : null}
	
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
                <SelectTrigger
	                  className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.category ? "border-destructive" : ""}`}
	                >
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
                className={`bg-background border-2 border-border text-foreground ${errors.name ? "border-destructive" : ""}`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

	            <div className="space-y-2">
	              <Label htmlFor="price" className="text-pos-text">
	                Price
	              </Label>
	              <Input
                id="price"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={displayedPriceValue}
                onFocus={() => setIsPriceFocused(true)}
                onBlur={(e) => {
                  setIsPriceFocused(false);
                  if (!e.target.value) {
                    setFormData((prev) => ({ ...prev, price: 0 }));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey || e.altKey) return;
                  const allowed = [
                    "Backspace",
                    "Delete",
                    "Tab",
                    "Enter",
                    "Escape",
                    "ArrowLeft",
                    "ArrowRight",
                    "ArrowUp",
                    "ArrowDown",
                    "Home",
                    "End",
                  ];
                  if (allowed.includes(e.key)) return;
                  if (/^\d$/.test(e.key)) return;
                  e.preventDefault();
                }}
                onChange={(e) => {
                  const digitsOnly = String(e.target.value || "").replace(/\D/g, "");
                  const nextPrice = digitsOnly ? parseInt(digitsOnly, 10) || 0 : 0;
                  setFormData({
                    ...formData,
                    price: nextPrice,
                  });
                  if (errors.price) setErrors({ ...errors, price: "" });
                }}
	                className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.price ? "border-destructive" : ""}`}
	                placeholder="Enter price"
	              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
          </>
	        ) : (
	          <>
	            {isSuperAdmin ? (
	              <div className="space-y-2">
	                <Label htmlFor="restaurant" className="text-pos-text">
	                  Restaurant
	                </Label>
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
	                  <SelectTrigger
		                    className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.restaurant_id ? "border-destructive" : ""}`}
		                  >
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
	                {errors.restaurant_id && (
	                  <p className="text-xs text-destructive">{errors.restaurant_id}</p>
	                )}
	              </div>
	            ) : null}
	
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
	                  className={`bg-background border-2 border-border text-foreground ${errors.name ? "border-destructive" : ""}`}
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
                <SelectTrigger
	                  className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.category ? "border-destructive" : ""}`}
	                >
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
	                className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.price ? "border-destructive" : ""}`}
	                placeholder="Enter price"
	              />
	              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
	            </div>

	            {!isSuperAdmin && (
	              <div className="space-y-2">
	                <Label htmlFor="barcode" className="text-pos-text">
	                  Barcode
	                </Label>
	                <Input
	                  id="barcode"
	                  value={formData.barcode}
	                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
	                  className="bg-pos-surface border-2 border-pos-secondary text-pos-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary"
	                  placeholder="Optional"
	                />
	              </div>
	            )}
	          </>
	        )}
	      </div>

      {/* Image Upload Section */}
      {!isEditMode && (
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
            {imagePreview && <p className="text-xs text-green-600">✓ Image ready for upload</p>}
            {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
          </div>
        </div>
      </div>
      )}

	      {isEditMode && (
	        <div className="space-y-6">
	          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	            {isSuperAdmin && (
	              <div className="space-y-2">
	                <Label htmlFor="barcode" className="text-pos-text">
	                  Barcode
	                </Label>
	                <Input
	                  id="barcode"
	                  value={formData.barcode}
	                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
	                  className="bg-pos-surface border-2 border-pos-secondary text-pos-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary"
	                  placeholder="Optional"
	                />
	              </div>
	            )}
	
	            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
	              <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
	                <Label htmlFor="tax_inclusive" className="text-pos-text">
                  Tax Inclusive
                </Label>
                <Switch
                  id="tax_inclusive"
                  checked={!!formData.tax_inclusive}
                  onCheckedChange={(checked) => setFormData({ ...formData, tax_inclusive: checked })}
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
                <Label htmlFor="tax_rate" className="text-pos-text">
                  Tax Rate (%)
                </Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    isTaxRateFocused && Number(formData.tax_rate) === 0
                      ? ""
                      : (formData.tax_rate as any)
                  }
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  onFocus={() => setIsTaxRateFocused(true)}
                  onBlur={() => setIsTaxRateFocused(false)}
                  disabled={!formData.tax_inclusive}
                  className="h-9 w-28 border-0 bg-transparent pl-0 pr-7 py-0 text-right text-pos-text focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-pos-text">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
	                className="bg-pos-surface border-2 border-pos-secondary text-pos-text"
	                rows={4}
	                placeholder="Optional"
	              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description" className="text-pos-text">
                Short Description
              </Label>
              <Textarea
                id="short_description"
                value={formData.short_description as any}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
	                className="bg-pos-surface border-2 border-pos-secondary text-pos-text"
	                rows={4}
	                placeholder="Optional"
	              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-pos-text">
                Thumbnail
              </Label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-pos-secondary rounded-md flex items-center justify-center overflow-hidden bg-muted">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={thumbnailInputRef}
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-pos-secondary"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      Select Thumbnail
                    </Button>
                    <span className="text-sm text-muted-foreground truncate max-w-[240px]">
                      {thumbnailFile?.name || "No file selected"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Max 2MB (JPG/PNG/GIF).</p>
                  {errors.thumbnail && <p className="text-xs text-destructive">{errors.thumbnail}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url" className="text-pos-text">
                Video
              </Label>
              <div className="space-y-2">
                <input
                  ref={videoInputRef}
                  id="video_url"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-pos-secondary"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    Select Video
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[240px]">
                    {videoFile?.name || (formData.video_url ? "Existing video" : "No file selected")}
                  </span>
                </div>
                {videoPreview && (
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-w-[360px] rounded-md border border-pos-secondary"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="images" className="text-pos-text">
                Images (JSON)
              </Label>
              <Textarea
                id="images"
                value={formData.images as any}
                onChange={(e) => setFormData({ ...formData, images: e.target.value })}
	                className={`bg-pos-surface border-2 border-pos-secondary text-pos-text ${errors.images ? "border-destructive" : ""}`}
	                rows={4}
	                placeholder='Optional. Example: {"gallery": ["url1", "url2"]}'
	              />
              {errors.images && <p className="text-xs text-destructive">{errors.images}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="preparation_time" className="text-pos-text">
                Preparation Time (min)
              </Label>
              <Input
                id="preparation_time"
                type="number"
                step="1"
                min="0"
                value={
                  isPreparationTimeFocused && formData.preparation_time === 0
                    ? ""
                    : (formData.preparation_time as any)
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preparation_time: e.target.value === "" ? 0 : (parseInt(e.target.value || "0", 10) || 0),
                  })
                }
                onFocus={() => setIsPreparationTimeFocused(true)}
                onBlur={() => setIsPreparationTimeFocused(false)}
                className="h-9 w-28 border-0 bg-transparent pl-0 pr-7 py-0 text-right text-pos-text focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="is_veg" className="text-pos-text">
                Is Veg
              </Label>
              <Switch
                id="is_veg"
                checked={!!formData.is_veg}
                onCheckedChange={(checked) => setFormData({ ...formData, is_veg: checked })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ingredients" className="text-pos-text">
                Ingredients
              </Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients as any}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
	                className="bg-pos-surface border-2 border-pos-secondary text-pos-text"
	                rows={3}
	                placeholder="Optional"
	              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="available" className="text-pos-text">
                Available
              </Label>
              <Switch
                id="available"
                checked={!!formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="is_published" className="text-pos-text">
                Published
              </Label>
              <Switch
                id="is_published"
                checked={!!formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="featured" className="text-pos-text">
                Featured
              </Label>
              <Switch
                id="featured"
                checked={!!formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="available_for_delivery" className="text-pos-text">
                Delivery
              </Label>
              <Switch
                id="available_for_delivery"
                checked={!!formData.available_for_delivery}
                onCheckedChange={(checked) => setFormData({ ...formData, available_for_delivery: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="available_for_takeaway" className="text-pos-text">
                Takeaway
              </Label>
              <Switch
                id="available_for_takeaway"
                checked={!!formData.available_for_takeaway}
                onCheckedChange={(checked) => setFormData({ ...formData, available_for_takeaway: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-2 border-pos-secondary rounded-md px-3 h-11 bg-pos-surface">
              <Label htmlFor="available_for_dine_in" className="text-pos-text">
                Dine In
              </Label>
              <Switch
                id="available_for_dine_in"
                checked={!!formData.available_for_dine_in}
                onCheckedChange={(checked) => setFormData({ ...formData, available_for_dine_in: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_from_time" className="text-pos-text">
                Available From
              </Label>
              <Input
                id="available_from_time"
                type="time"
                value={formData.available_from_time as any}
                onChange={(e) => setFormData({ ...formData, available_from_time: e.target.value })}
	                className="bg-pos-surface border-2 border-pos-secondary text-pos-text"
	              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_to_time" className="text-pos-text">
                Available To
              </Label>
              <Input
                id="available_to_time"
                type="time"
                value={formData.available_to_time as any}
                onChange={(e) => setFormData({ ...formData, available_to_time: e.target.value })}
	                className="bg-pos-surface border-2 border-pos-secondary text-pos-text"
	              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="badge_text" className="text-pos-text">
                Badge Text
              </Label>
              <Input
                id="badge_text"
                value={formData.badge_text as any}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
	                className="bg-pos-surface border-2 border-pos-secondary text-pos-text"
	                placeholder="Optional"
	              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge_color" className="text-pos-text">
                Badge Color
              </Label>
              <Input
                id="badge_color"
                type="color"
                value={(formData.badge_color as any) || "#000000"}
                onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
	                className="bg-pos-surface border-2 border-pos-secondary text-pos-text h-11 p-1"
	              />
            </div>
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="pt-2 border-t border-pos-secondary">
          <Label htmlFor="image" className="text-foreground">
            Product Image
          </Label>
          <div className="flex items-start gap-4 mt-2">
            <div className="w-32 h-32 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
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
              {imagePreview && <p className="text-xs text-green-600">✓ Image ready for upload</p>}
              {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
            </div>
          </div>
        </div>
      )}

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
  const userRole = String(user?.role || "").toLowerCase().trim();
  const isSuperAdmin = ["super_admin", "superadmin"].includes(userRole);
  const canManageModifiers = isSuperAdmin || ["admin", "supervisor"].includes(userRole);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPublishFilter, setSelectedPublishFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addProductFormKey, setAddProductFormKey] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    isSuperAdmin ? "" : (user?.branchId || ""),
  );
  const effectiveRestaurantId = isSuperAdmin ? selectedRestaurantId : (user?.branchId || selectedRestaurantId || "");

  // Image state at parent level to persist across dialog re-renders
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

	  // Category management state
	  const tabParam = searchParams.get("tab");
	  const singleViewTab =
	    isSuperAdmin && (tabParam === "products" || tabParam === "modifiers") ? tabParam : null;
	  const initialTab =
	    (isSuperAdmin && (tabParam === "products" || tabParam === "categories" || tabParam === "modifiers")) ||
	    (!isSuperAdmin && canManageModifiers && (tabParam === "products" || tabParam === "modifiers"))
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
  const [modifierAvailabilityFilter, setModifierAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
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
  const [pendingModifierAvailabilityUpdate, setPendingModifierAvailabilityUpdate] = useState<null | {
    modifier: any;
    nextValue: boolean;
  }>(null);
  const [modifierActiveOverrides, setModifierActiveOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [modifierAvailableOverrides, setModifierAvailableOverrides] = useState<Record<string, boolean>>(
    {},
  );

	  useEffect(() => {
	    const nextTab =
	      (isSuperAdmin && (tabParam === "products" || tabParam === "categories" || tabParam === "modifiers")) ||
	      (!isSuperAdmin && canManageModifiers && (tabParam === "products" || tabParam === "modifiers"))
	        ? tabParam
	        : "products";
	    if (nextTab !== activeTab) setActiveTab(nextTab);
	    // eslint-disable-next-line react-hooks/exhaustive-deps
	  }, [tabParam, isSuperAdmin, canManageModifiers]);

  const buildProductSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const { data: restaurantsResponse, isLoading: restaurantsLoading } = useQuery({
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
    const restaurants: any[] = Array.isArray(source)
      ? source
      : Array.isArray(source?.items)
        ? source.items
        : Array.isArray(source?.restaurants)
          ? source.restaurants
          : [];

    const toSortKey = (restaurant: any) => {
      const raw =
        restaurant?.created_at ??
        restaurant?.createdAt ??
        restaurant?.updated_at ??
        restaurant?.updatedAt ??
        restaurant?.added_at ??
        restaurant?.addedAt ??
        null;
      const ms = raw ? Date.parse(String(raw)) : NaN;
      return {
        hasDate: Number.isFinite(ms),
        sortKey: Number.isFinite(ms) ? ms : undefined,
      };
    };

    const byId = new Map<string, RestaurantOption>();
    restaurants
      .filter((restaurant: any) => restaurant?.id && (restaurant?.name || restaurant?.business_name))
      .forEach((restaurant: any, index: number) => {
        const id = String(restaurant.id);
        const dateInfo = toSortKey(restaurant);
        const next: RestaurantOption = {
          id,
          name: String(restaurant.name || restaurant.business_name),
          hasDate: dateInfo.hasDate,
          sortKey: dateInfo.sortKey ?? index,
        };
        const existing = byId.get(id);
        if (!existing || (next.sortKey ?? -Infinity) > (existing.sortKey ?? -Infinity)) {
          byId.set(id, next);
        }
      });

    return Array.from(byId.values()).sort((a, b) => {
      if (!!a.hasDate && !!b.hasDate) {
        const diff = (b.sortKey ?? -Infinity) - (a.sortKey ?? -Infinity);
        if (diff !== 0) return diff;
      } else if (!!a.hasDate !== !!b.hasDate) {
        return a.hasDate ? -1 : 1;
      } else {
        const diff = (b.sortKey ?? -Infinity) - (a.sortKey ?? -Infinity);
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    });
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
  }, [selectedPublishFilter, selectedAvailabilityFilter]);

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
  }, [
    modifierTypeFilter,
    modifierRequiredFilter,
    modifierAvailabilityFilter,
    modifierActiveFilter,
    selectedRestaurantId,
  ]);

  // API Hooks - Fetch categories for product dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({
    page_size: 100, // Get all categories for dropdown
  }, effectiveRestaurantId);

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

  const categoryListPayload = categoryListResponse as any;
  const categoryListItems: any[] = (() => {
    const source =
      categoryListPayload?.data?.data ??
      categoryListPayload?.data?.items ??
      categoryListPayload?.data?.categories ??
      categoryListPayload?.data ??
      categoryListPayload;
    return Array.isArray(source) ? source : [];
  })();
  const categoryListPagination =
    categoryListPayload?.pagination ??
    categoryListPayload?.data?.pagination ??
    categoryListPayload?.data?.meta?.pagination ??
    categoryListPayload?.meta?.pagination ??
    categoryListPayload?.meta ??
    null;

  // API Hooks - Fetch modifiers for modifier tab with pagination
  const modifierActiveFilterValue =
    modifierActiveFilter === "active"
      ? true
      : modifierActiveFilter === "inactive"
        ? false
        : undefined;

  const modifierAvailabilityFilterValue =
    modifierAvailabilityFilter === "available"
      ? true
      : modifierAvailabilityFilter === "unavailable"
        ? false
        : undefined;

  const { data: modifierListResponse, isLoading: modifiersLoading } = useModifiers(
    {
      page: isSuperAdmin ? modifierPage : 1,
      page_size: isSuperAdmin ? 12 : 500,
      active: modifierActiveFilterValue,
      available: modifierAvailabilityFilterValue,
    },
    effectiveRestaurantId,
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

  useEffect(() => {
    if (!modifiersList.length) return;
    setModifierAvailableOverrides((prev) => {
      const next = { ...prev };
      modifiersList.forEach((modifier) => {
        if (!modifier?.id) return;
        const hasAvailableProp =
          Object.prototype.hasOwnProperty.call(modifier, "available") ||
          Object.prototype.hasOwnProperty.call(modifier, "is_available") ||
          Object.prototype.hasOwnProperty.call(modifier, "isAvailable");
        if (hasAvailableProp) {
          const availableValue =
            modifier?.available ??
            modifier?.is_available ??
            modifier?.isAvailable ??
            true;
          next[String(modifier.id)] = !!availableValue;
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

    const overrideValue = modifier?.id ? modifierActiveOverrides[String(modifier.id)] : undefined;
    const isActive =
      overrideValue ??
      modifier?.active ??
      modifier?.is_active ??
      modifier?.isActive ??
      modifier?.enabled ??
      true;

    if (modifierAvailabilityFilter !== "all") {
      const availableOverride = modifier?.id
        ? modifierAvailableOverrides[String(modifier.id)]
        : undefined;
      const availableValue =
        availableOverride ??
        modifier?.available ??
        modifier?.is_available ??
        modifier?.isAvailable ??
        modifier?.is_available_for_sale ??
        modifier?.enabled ??
        true;
      const isAvailable = !!availableValue;
      if (modifierAvailabilityFilter === "available" && !isAvailable) return false;
      if (modifierAvailabilityFilter === "unavailable" && isAvailable) return false;
    }

    if (modifierTypeFilter !== "all" && modifier?.type !== modifierTypeFilter) {
      return false;
    }

    if (modifierRequiredFilter !== "all") {
      const isRequired = !!modifier?.required;
      if (modifierRequiredFilter === "required" && !isRequired) return false;
      if (modifierRequiredFilter === "optional" && isRequired) return false;
    }

    if (modifierActiveFilter === "active" && !isActive) return false;
    if (modifierActiveFilter === "inactive" && isActive) return false;

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
  const { data: productsResponse, isLoading: productsLoading } = useProducts(
    filters,
    isSuperAdmin ? effectiveRestaurantId : undefined,
  );
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
    short_description: product.short_description ?? null,
    price: Number(product.price || 0), // API returns rupees
    category: product.category_id || "",
    subcategory_id: product.subcategory_id ?? null,
    stock: product.stock,
    minStock: product.min_stock || 5,
    min_stock: product.min_stock || 5,
    track_inventory: product.track_inventory ?? true,
    allow_backorder: product.allow_backorder ?? false,
    stock_unit: product.stock_unit ?? null,
    reorder_point: product.reorder_point ?? null,
    reorder_quantity: product.reorder_quantity ?? null,
    available: product.available,
    is_published: !!product.is_published,
    featured: product.featured,
    cost: Number(product.cost || 0),
    compare_at_price: product.compare_at_price ?? null,
    min_price: product.min_price ?? null,
    max_price: product.max_price ?? null,
    price_varies: product.price_varies ?? false,
    tax_rate: product.tax_rate ?? null,
    tax_inclusive: product.tax_inclusive ?? false,
    margin: product.cost && product.price ?
      ((product.price - product.cost) / product.price) * 100 : 0,
    tags: product.tags || [],
    modifiers: [],
    image: product.image || undefined,
    thumbnail: product.thumbnail ?? null,
    images: product.images ?? null,
    video_url: product.video_url ?? null,
    sku: product.sku,
    barcode: product.barcode ?? null,
    department: product.department ?? null,
    kitchen_station: product.kitchen_station ?? null,
    preparation_time: product.preparation_time ?? null,
    is_veg: product.is_veg ?? false,
    calories: product.calories ?? null,
    spice_level: product.spice_level ?? null,
    ingredients: product.ingredients ?? null,
    available_for_delivery: product.available_for_delivery ?? true,
    available_for_takeaway: product.available_for_takeaway ?? true,
    available_for_dine_in: product.available_for_dine_in ?? true,
    available_from_time: product.available_from_time ?? null,
    available_to_time: product.available_to_time ?? null,
    has_variants: product.has_variants ?? false,
    variant_options: product.variant_options ?? null,
    requires_customization: product.requires_customization ?? false,
    badge_text: product.badge_text ?? null,
    badge_color: product.badge_color ?? null,
  }));

  const buildProductUpdatePayload = (product: Product, updates: Record<string, any>) => ({
    restaurant_id: product.restaurant_id || effectiveRestaurantId,
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

      <AlertDialog
        open={!!pendingModifierAvailabilityUpdate}
        onOpenChange={(open) => {
          if (!open && !updateModifierMutation.isPending) setPendingModifierAvailabilityUpdate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Modifier Availability</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingModifierAvailabilityUpdate
                ? `Are you sure you want to set ${pendingModifierAvailabilityUpdate.modifier?.name || "this modifier"} as ${pendingModifierAvailabilityUpdate.nextValue ? "Available" : "Unavailable"}?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateModifierMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingModifierAvailabilityUpdate?.modifier?.id) return;
                const modifierId = String(pendingModifierAvailabilityUpdate.modifier.id);
                const previousOverride = modifierAvailableOverrides[modifierId];
                setModifierAvailableOverrides((prev) => ({
                  ...prev,
                  [modifierId]: pendingModifierAvailabilityUpdate.nextValue,
                }));
                updateModifierMutation.mutate(
                  {
                    id: pendingModifierAvailabilityUpdate.modifier.id,
                    data: {
                      available: pendingModifierAvailabilityUpdate.nextValue,
                      is_available: pendingModifierAvailabilityUpdate.nextValue,
                    },
                  },
                  {
                    onError: () => {
                      setModifierAvailableOverrides((prev) => ({
                        ...prev,
                        [modifierId]: previousOverride ?? prev[modifierId],
                      }));
                    },
                    onSettled: () => setPendingModifierAvailabilityUpdate(null),
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
                existingProducts={products}
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
	          if (singleViewTab || !isSuperAdmin) return;
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
	        {isSuperAdmin && !singleViewTab && (
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
              <div className="flex items-center gap-4 overflow-x-auto">
                {isSuperAdmin && (
                  <Select
                    value={selectedRestaurantId || "none"}
                    onValueChange={(value) => setSelectedRestaurantId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="w-56 shrink-0 bg-background border-border text-foreground">
                      <SelectValue placeholder="Select Restaurant" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {restaurantOptions.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="relative flex-1 min-w-[320px]">
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
                  <SelectTrigger className="w-56 shrink-0 bg-background border-border text-foreground">
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
                  <SelectTrigger className="w-44 shrink-0 bg-pos-surface border-pos-secondary text-pos-text">
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
                  <SelectTrigger className="w-44 shrink-0 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Available" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {productsLoading || categoriesLoading || (isSuperAdmin && restaurantsLoading) ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : isSuperAdmin && !effectiveRestaurantId ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No restaurant available</h3>
                <p className="text-muted-foreground">No restaurants found for this account</p>
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
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[260px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Category</TableHead>
                        <TableHead className="w-[110px] text-right">Price</TableHead>
                        <TableHead className="w-[80px] text-center">Image</TableHead>
                        <TableHead className="w-[150px] text-center">Active</TableHead>
                        <TableHead className="w-[160px] text-center">Available</TableHead>
                        <TableHead className="w-[180px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {categories.find((c) => c.id === product.category)?.name || "-"}
                          </TableCell>
                          <TableCell className="text-foreground text-right tabular-nums">
                            {formatINR(product.price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex w-10 h-10 rounded-md overflow-hidden bg-muted items-center justify-center">
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
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
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
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
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
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog
                                open={editingProduct?.id === product.id}
                                    onOpenChange={(open) => {
                                  if (open && !product.is_published) return;
                                  if (open) {
                                    setEditingProduct(product);
                                    setImagePreview(resolveProductImageSrc(product.image));
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
                                    disabled={!product.is_published}
                                    title={!product.is_published ? "Inactive products can't be edited" : undefined}
                                    className="border-pos-secondary text-pos-text-muted hover:text-pos-text disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                              <DialogContent className="bg-pos-surface border-pos-secondary w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                                <DialogHeader>
                                  <DialogTitle className="text-pos-text">
                                    Edit Product
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="min-h-0 overflow-y-auto pr-1">
                                <ProductForm
                                  product={product}
                                  existingProducts={products}
                                  imagePreview={imagePreview}
                                  setImagePreview={setImagePreview}
                                  imageFile={imageFile}
                                  setImageFile={setImageFile}
                                  isSuperAdmin={isSuperAdmin}
                                  defaultRestaurantId={selectedRestaurantId}
                                  restaurantOptions={restaurantOptions}
                                  userBranchId={user?.branchId || ""}
                                  onSave={(updatedData) => {
                                    const toOptionalString = (value: any) => {
                                      if (value === undefined || value === null) return undefined;
                                      const trimmed = String(value).trim();
                                      return trimmed ? trimmed : undefined;
                                    };
                                    const toOptionalNumber = (value: any) => {
                                      if (value === undefined || value === null || value === "") return undefined;
                                      const parsed = Number(value);
                                      return Number.isFinite(parsed) ? parsed : undefined;
                                    };
                                    const toOptionalJson = (value: any) => {
                                      if (value === undefined || value === null || value === "") return undefined;
                                      if (typeof value === "string") {
                                        const trimmed = value.trim();
                                        if (!trimmed) return undefined;
                                        try {
                                          return JSON.parse(trimmed);
                                        } catch {
                                          return undefined;
                                        }
                                      }
                                      return value;
                                    };

                                    const apiData: any = {
                                      restaurant_id: product.restaurant_id || updatedData.restaurant_id,
                                      name: updatedData.name,
                                      slug: buildProductSlug(String(updatedData.name || "")),
                                      price: Number(updatedData.price || 0),
                                      category_id: product.category || (updatedData as any).category,
                                      barcode: toOptionalString((updatedData as any).barcode),
                                      tax_rate: (updatedData as any).tax_inclusive
                                        ? toOptionalNumber((updatedData as any).tax_rate)
                                        : undefined,
                                      tax_inclusive: !!(updatedData as any).tax_inclusive,

                                      description: (updatedData as any).description,
                                      short_description: toOptionalString((updatedData as any).short_description),
                                      thumbnail: toOptionalString((updatedData as any).thumbnail),
                                      images: toOptionalJson((updatedData as any).images),
                                      video_url: toOptionalString((updatedData as any).video_url),
                                      preparation_time: toOptionalNumber((updatedData as any).preparation_time),
                                      is_veg: !!(updatedData as any).is_veg,
                                      ingredients: toOptionalString((updatedData as any).ingredients),

                                      available: !!(updatedData as any).available,
                                      is_published: !!(updatedData as any).is_published,
                                      featured: !!(updatedData as any).featured,
                                      available_for_delivery: !!(updatedData as any).available_for_delivery,
                                      available_for_takeaway: !!(updatedData as any).available_for_takeaway,
                                      available_for_dine_in: !!(updatedData as any).available_for_dine_in,
                                      available_from_time: toOptionalString((updatedData as any).available_from_time),
                                      available_to_time: toOptionalString((updatedData as any).available_to_time),

                                      badge_text: toOptionalString((updatedData as any).badge_text),
                                      badge_color: toOptionalString((updatedData as any).badge_color),
                                    };

                                    if (imageFile) {
                                      apiData.image = imageFile;
                                    }
                                    const nextThumbnail = (updatedData as any).thumbnail_file;
                                    if (nextThumbnail instanceof File) {
                                      apiData.thumbnail = nextThumbnail;
                                    }
                                    const nextVideo = (updatedData as any).video_file;
                                    if (nextVideo instanceof File) {
                                      apiData.video_url = nextVideo;
                                    }

                                    updateMutation.mutate({ id: product.id, data: apiData });
                                    setEditingProduct(null);
                                  }}
                                  onCancel={() => {
                                    setEditingProduct(null);
                                  }}
                                />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
	            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
	              {filteredProducts.map((product) => {
	                const stockStatus = getStockStatus(product);
	                return (
	                  <Card
	                    key={product.id}
	                    className="bg-pos-surface border-pos-secondary"
	                  >
	                    <CardHeader className="pb-1">
	                      <div className="flex items-start justify-between">
	                        <div className="flex-1">
	                          <CardTitle className="text-base text-pos-text flex items-center">
	                            {product.name}
	                            {product.featured && (
	                              <Star className="ml-2 h-4 w-4 text-pos-warning fill-current" />
	                            )}
	                          </CardTitle>
	                          {null}
	                        </div>
	                        <div />
	                      </div>
	                    </CardHeader>
	                    <CardContent className="space-y-3 pt-0">
	                      <div className="h-28 bg-pos-secondary rounded-md flex items-center justify-center overflow-hidden">
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
	                            <Button
	                              variant="ghost"
	                              size="icon"
	                              className="h-10 w-10"
	                              onClick={() => {
	                                confirmAndUpdateProduct({
	                                  product,
	                                  fieldLabel: "Active",
	                                  nextValue: !product.is_published,
	                                  updates: { is_published: !product.is_published },
	                                });
	                              }}
	                              disabled={updateMutation.isPending}
	                              title={product.is_published ? "Active" : "Inactive"}
	                              aria-label={product.is_published ? "Active" : "Inactive"}
	                            >
	                              {product.is_published ? (
	                                <CheckCircle2 className="h-7 w-7 text-green-600" />
	                              ) : (
	                                <XCircle className="h-7 w-7 text-destructive" />
	                              )}
	                            </Button>
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
	                          <span className="text-pos-text font-bold text-base">
	                            {formatINR(product.price)}
	                          </span>
	                        </div>
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
                            if (open && !product.is_published) return;
                            if (open) {
                              // Set the editing product and initialize image preview
                              setEditingProduct(product);
                              setImagePreview(resolveProductImageSrc(product.image));
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
                              disabled={!product.is_published}
                              title={!product.is_published ? "Inactive products can't be edited" : undefined}
                              className="flex-1 border-pos-secondary text-pos-text-muted hover:text-pos-text disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-pos-surface border-pos-secondary w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle className="text-pos-text">
                                Edit Product
                              </DialogTitle>
                            </DialogHeader>
                            <div className="min-h-0 overflow-y-auto pr-1">
                            <ProductForm
                              product={product}
                              existingProducts={products}
                              imagePreview={imagePreview}
                              setImagePreview={setImagePreview}
                              imageFile={imageFile}
                              setImageFile={setImageFile}
                              isSuperAdmin={isSuperAdmin}
                              defaultRestaurantId={selectedRestaurantId}
                              restaurantOptions={restaurantOptions}
                              userBranchId={user?.branchId || ""}
                              onSave={(updatedData) => {
                                const toOptionalString = (value: any) => {
                                  if (value === undefined || value === null) return undefined;
                                  const trimmed = String(value).trim();
                                  return trimmed ? trimmed : undefined;
                                };
                                const toOptionalNumber = (value: any) => {
                                  if (value === undefined || value === null || value === "") return undefined;
                                  const parsed = Number(value);
                                  return Number.isFinite(parsed) ? parsed : undefined;
                                };
                                const toOptionalJson = (value: any) => {
                                  if (value === undefined || value === null || value === "") return undefined;
                                  if (typeof value === "string") {
                                    const trimmed = value.trim();
                                    if (!trimmed) return undefined;
                                    try {
                                      return JSON.parse(trimmed);
                                    } catch {
                                      return undefined;
                                    }
                                  }
                                  return value;
                                };

                                const apiData: any = {
                                  restaurant_id: product.restaurant_id || updatedData.restaurant_id,
                                  name: updatedData.name,
                                  slug: buildProductSlug(String(updatedData.name || "")),
                                  price: Number(updatedData.price || 0),
                                  category_id: product.category || (updatedData as any).category,
                                  barcode: toOptionalString((updatedData as any).barcode),
                                  tax_rate: (updatedData as any).tax_inclusive
                                    ? toOptionalNumber((updatedData as any).tax_rate)
                                    : undefined,
                                  tax_inclusive: !!(updatedData as any).tax_inclusive,

                                  description: (updatedData as any).description,
                                  short_description: toOptionalString((updatedData as any).short_description),
                                  thumbnail: toOptionalString((updatedData as any).thumbnail),
                                  images: toOptionalJson((updatedData as any).images),
                                  video_url: toOptionalString((updatedData as any).video_url),
                                  preparation_time: toOptionalNumber((updatedData as any).preparation_time),
                                  is_veg: !!(updatedData as any).is_veg,
                                  ingredients: toOptionalString((updatedData as any).ingredients),

                                  available: !!(updatedData as any).available,
                                  is_published: !!(updatedData as any).is_published,
                                  featured: !!(updatedData as any).featured,
                                  available_for_delivery: !!(updatedData as any).available_for_delivery,
                                  available_for_takeaway: !!(updatedData as any).available_for_takeaway,
                                  available_for_dine_in: !!(updatedData as any).available_for_dine_in,
                                  available_from_time: toOptionalString((updatedData as any).available_from_time),
                                  available_to_time: toOptionalString((updatedData as any).available_to_time),

                                  badge_text: toOptionalString((updatedData as any).badge_text),
                                  badge_color: toOptionalString((updatedData as any).badge_color),
                                };

                                // Only include image if a new image file was selected
                                if (imageFile) {
                                  apiData.image = imageFile;
                                }
                                const nextThumbnail = (updatedData as any).thumbnail_file;
                                if (nextThumbnail instanceof File) {
                                  apiData.thumbnail = nextThumbnail;
                                }
                                const nextVideo = (updatedData as any).video_file;
                                if (nextVideo instanceof File) {
                                  apiData.video_url = nextVideo;
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
                            </div>
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

	        {isSuperAdmin && (
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
          ) : categoryListItems.length === 0 ? (
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
                {categoryListItems.map((category) => (
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
              {categoryListPagination &&
                Number((categoryListPagination as any).total ?? (categoryListPagination as any).total_items ?? 0) > 12 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((categoryPage - 1) * 12) + 1} to{" "}
                    {Math.min(
                      categoryPage * 12,
                      Number((categoryListPagination as any).total ?? (categoryListPagination as any).total_items ?? 0),
                    )}{" "}
                    of {Number((categoryListPagination as any).total ?? (categoryListPagination as any).total_items ?? 0)} categories
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
                      Page {categoryPage} of {Number((categoryListPagination as any).total_pages ?? 1)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCategoryPage(prev => Math.min(Number((categoryListPagination as any).total_pages ?? 1), prev + 1))
                      }
                      disabled={categoryPage === Number((categoryListPagination as any).total_pages ?? 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
	        </TabsContent>
	        )}

	        {/* Modifiers Tab */}
	        {canManageModifiers && (
	        <TabsContent value="modifiers" className="space-y-6">
          {/* Modifiers Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 overflow-x-auto">
                {isSuperAdmin && (
                  <Select
                    value={selectedRestaurantId || "none"}
                    onValueChange={(value) => setSelectedRestaurantId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="w-56 shrink-0 bg-background border-border text-foreground">
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
                <div className="relative flex-1 min-w-[320px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search modifiers..."
                    value={modifierSearchQuery}
                    onChange={(e) => setModifierSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                {isSuperAdmin && (
                  <Select
                    value={modifierTypeFilter}
                    onValueChange={(value) =>
                      setModifierTypeFilter(value as "all" | "single" | "multiple")
                    }
                  >
                    <SelectTrigger className="w-44 shrink-0 bg-background border-border text-foreground">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="multiple">Multiple</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {isSuperAdmin && (
                  <Select
                    value={modifierRequiredFilter}
                    onValueChange={(value) =>
                      setModifierRequiredFilter(value as "all" | "required" | "optional")
                    }
                  >
                    <SelectTrigger className="w-44 shrink-0 bg-background border-border text-foreground">
                      <SelectValue placeholder="Required" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Select
                  value={modifierAvailabilityFilter}
                  onValueChange={(value) =>
                    setModifierAvailabilityFilter(value as "all" | "available" | "unavailable")
                  }
                >
                  <SelectTrigger className="w-44 shrink-0 bg-background border-border text-foreground">
                    <SelectValue placeholder="Available" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={modifierActiveFilter}
                  onValueChange={(value) =>
                    setModifierActiveFilter(value as "all" | "active" | "inactive")
                  }
                >
                  <SelectTrigger className="w-44 shrink-0 bg-background border-border text-foreground">
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
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
              {isSuperAdmin ? (
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
              ) : (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                  {filteredModifiers.map((modifier) => {
                    const typeLabel = String(modifier?.type || "unknown");
                    const imageValue =
                      modifier?.icon ||
                      modifier?.icon_url ||
                      modifier?.image ||
                      modifier?.image_url;
                    const src = imageValue ? String(imageValue) : "";
                    const resolvedSrc =
                      src && (src.startsWith("http") ? src : `${BACKEND_URL}${src}`);
                    const isActive =
                      (modifier?.id ? modifierActiveOverrides[String(modifier.id)] : undefined) ??
                      modifier?.active ??
                      modifier?.is_active ??
                      modifier?.isActive ??
                      modifier?.enabled ??
                      true;
                    const isAvailable =
                      (modifier?.id ? modifierAvailableOverrides[String(modifier.id)] : undefined) ??
                      modifier?.available ??
                      modifier?.is_available ??
                      modifier?.isAvailable ??
                      modifier?.is_available_for_sale ??
                      true;

                    return (
                      <Card key={modifier.id} className="bg-card border-border">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-foreground truncate">
                                {modifier?.name || "-"}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground truncate">
                                {typeLabel}
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                              {resolvedSrc ? (
                                <img
                                  src={resolvedSrc}
                                  alt={modifier?.name || "Modifier"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">
                                {isActive ? "Active" : "Inactive"}
                              </span>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 transition-none hover:bg-transparent"
                                disabled={updateModifierMutation.isPending || !modifier?.id}
                                onClick={() => {
                                  if (!modifier?.id) return;
                                  setPendingModifierStatusUpdate({
                                    modifier,
                                    nextValue: !isActive,
                                  });
                                }}
                                aria-label={isActive ? "Set inactive" : "Set active"}
                              >
                                {isActive ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </Button>
                            </div>

                            <div className="ml-auto flex items-center gap-2 justify-end">
                              <span className="text-sm text-foreground">Available</span>
                              <Switch
                                checked={!!isAvailable}
                                disabled={updateModifierMutation.isPending || !modifier?.id}
                                onCheckedChange={(checked) => {
                                  if (!modifier?.id) return;
                                  setPendingModifierAvailabilityUpdate({
                                    modifier,
                                    nextValue: checked,
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 flex-nowrap">
                            <div className="min-w-0 flex items-baseline gap-2 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">Required</span>
                              <span className="text-sm font-semibold text-foreground truncate">
                                {modifier?.required ? "Yes" : "No"}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">Type</span>
                              <span className="text-sm text-foreground">{typeLabel}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full justify-center bg-muted/40 hover:bg-muted/60 h-11"
                            onClick={() => setSelectedModifierForEdit(modifier.id)}
                            disabled={!modifier?.id}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {isSuperAdmin && modifiersPagination && modifiersPagination.total_items > 12 && (
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
	        )}
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
