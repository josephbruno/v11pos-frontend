import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Eye,
  EyeOff,
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
  useDeleteProduct,
  formatPrice,
  dollarsToCents,
  centsToDollars,
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
  useModifier,
  useCreateModifier,
  useDeleteModifier,
  useModifierOptions,
  useCreateModifierOption,
  useDeleteModifierOption,
} from "@/hooks/useModifiers";
import { useQueryClient } from "@tanstack/react-query";
import { getImageCropConfig, validateImageFile } from "@/lib/imageCropConfig";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  minStock: number;
  available: boolean;
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

export default function ProductManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Image state at parent level to persist across dialog re-renders
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Category management state
  const [activeTab, setActiveTab] = useState("products");
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
  const [selectedModifierForOptions, setSelectedModifierForOptions] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce category search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategoryDebouncedSearch(categorySearchQuery);
      setCategoryPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [categorySearchQuery]);

  // API Hooks - Fetch categories for product dropdown (fetch all active categories)
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({
    active: true,
    page_size: 100, // Get all categories for dropdown
  });

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

  const apiCategories = categoriesData?.data || [];

  // API Hooks - Fetch modifiers for modifier tab with pagination
  const { data: modifierListResponse, isLoading: modifiersLoading } = useModifiers({
    page: modifierPage,
    page_size: 12,
  });

  // Debug: Log modifier data
  useEffect(() => {
    if (modifierListResponse) {
      console.log('modifierListResponse:', modifierListResponse);
      console.log('modifierListResponse.data:', modifierListResponse.data);
      if (modifierListResponse.data && modifierListResponse.data.length > 0) {
        console.log('First modifier:', modifierListResponse.data[0]);
      }
    }
  }, [modifierListResponse]);


  // Modifier mutations
  const createModifierMutation = useCreateModifier();
  const deleteModifierMutation = useDeleteModifier();
  const createModifierOptionMutation = useCreateModifierOption();
  const deleteModifierOptionMutation = useDeleteModifierOption();

  // Fetch modifier details and options when a modifier is selected for options management
  const { data: selectedModifierData } = useModifier(selectedModifierForOptions || undefined);
  const { data: modifierOptionsData, isLoading: optionsLoading } = useModifierOptions(
    selectedModifierForOptions || undefined
  );

  // Build API filters
  const filters = {
    page: currentPage,
    page_size: 12,
    search: debouncedSearch || undefined,
    category_id: selectedCategory !== "all" ? selectedCategory : undefined,
    available: selectedStatus === "available" ? true :
      selectedStatus === "unavailable" ? false : undefined,
  };

  // API Hooks - Fetch products
  const { data: productsResponse, isLoading: productsLoading } = useProducts(filters);
  const apiProducts = productsResponse?.data || [];
  const pagination = productsResponse?.pagination;

  // API Hooks - Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Map API categories to UI format
  const categories: Category[] = apiCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description || "",
    active: cat.active,
    sortOrder: cat.sort_order,
    productCount: 0, // This would need a separate API call
  }));

  // Use categories directly from API
  const displayCategories = categories;

  // Map API products to UI format
  const products: Product[] = apiProducts.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    price: centsToDollars(product.price), // Convert cents to dollars
    category: product.category_id || "",
    stock: product.stock,
    minStock: product.min_stock || 5,
    available: product.available,
    featured: product.featured,
    cost: centsToDollars(product.cost || 0),
    margin: product.cost && product.price ?
      ((product.price - product.cost) / product.price) * 100 : 0,
    tags: product.tags || [],
    modifiers: [],
    image: product.image || undefined,
    sku: product.sku,
  }));

  // Mock modifiers removed - now using real API data from useModifiers hook

  // Filtering is now done by API, so we use products directly
  // But keep client-side filtering for low-stock status
  const filteredProducts = products.filter((product) => {
    if (selectedStatus === "low-stock") {
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

  const ProductForm = ({
    product,
    onSave,
    onCancel,
    imagePreview,
    setImagePreview,
    imageFile,
    setImageFile,
  }: {
    product?: Product;
    onSave: (product: Partial<Product>) => void;
    onCancel: () => void;
    imagePreview: string;
    setImagePreview: (preview: string) => void;
    imageFile: File | null;
    setImageFile: (file: File | null) => void;
  }) => {
    const [formData, setFormData] = useState({
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      price: product?.price || 0,
      category: product?.category || "",
      stock: product?.stock || 0,
      minStock: product?.minStock || 5,
      cost: product?.cost || 0,
      available: product?.available ?? true,
      featured: product?.featured ?? false,
      image: product?.image || "",
      sku: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-generate slug from name when creating new product
    useEffect(() => {
      if (!product && formData.name) {
        const slug = formData.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        setFormData(prev => ({ ...prev, slug }));
      }
    }, [formData.name, product]);

    // Debug: Monitor imagePreview changes
    useEffect(() => {
      console.log('imagePreview state changed to:', imagePreview);
    }, [imagePreview]);

    // Get crop dimensions from config
    const imageCropConfig = getImageCropConfig('product');
    const { width: cropWidth, height: cropHeight } = imageCropConfig;

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.name.trim()) {
        newErrors.name = "Product name is required";
      } else if (formData.name.length < 3) {
        newErrors.name = "Product name must be at least 3 characters";
      }

      if (!formData.slug.trim()) {
        newErrors.slug = "Slug is required";
      }

      if (!formData.category) {
        newErrors.category = "Category is required";
      }

      if (formData.price <= 0) {
        newErrors.price = "Price must be greater than 0";
      }

      if (formData.cost < 0) {
        newErrors.cost = "Cost cannot be negative";
      }

      if (formData.cost > formData.price) {
        newErrors.cost = "Cost should not exceed price";
      }

      if (formData.stock < 0) {
        newErrors.stock = "Stock cannot be negative";
      }

      if (formData.minStock < 0) {
        newErrors.minStock = "Minimum stock cannot be negative";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (file) {
        // Validate file using config
        const validation = validateImageFile(file, 'product');

        if (!validation.valid) {
          setErrors({ ...errors, image: validation.error || 'Invalid image file' });
          return;
        }

        setErrors({ ...errors, image: '' });

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
        // Don't upload image separately - the product API will handle it via FormData
        // Just pass the form data, image file will be handled by parent component
        const productData = {
          ...formData,
          margin:
            formData.price > 0
              ? ((formData.price - formData.cost) / formData.price) * 100
              : 0,
        };

        onSave(productData);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="image" className="text-foreground">
            Product Image
          </Label>
          <div className="flex items-start gap-4">
            {/* Image Preview */}
            <div className="w-32 h-32 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            {/* Upload Button */}
            <div className="flex-1 space-y-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="bg-background border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Upload a product image (max 10MB, JPG, PNG, GIF). Image will be cropped to {cropWidth}x{cropHeight}px.
              </p>
              {imagePreview && (
                <p className="text-xs text-green-600">✓ Image ready for upload</p>
              )}
              {errors.image && (
                <p className="text-xs text-destructive">{errors.image}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            className={`bg-background border-border text-foreground ${errors.name ? 'border-destructive' : ''
              }`}
            placeholder="Enter product name"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-foreground">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                setFormData({ ...formData, slug: e.target.value });
                if (errors.slug) setErrors({ ...errors, slug: '' });
              }}
              className={`bg-background border-border text-foreground ${errors.slug ? 'border-destructive' : ''
                }`}
              placeholder="product-slug"
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug}</p>
            )}
            <p className="text-xs text-muted-foreground">Auto-generated from name</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku" className="text-foreground">
              SKU
            </Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => {
                setFormData({ ...formData, sku: e.target.value });
              }}
              className="bg-background border-border text-foreground"
              placeholder="SKU-001"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-pos-text">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              setFormData({ ...formData, category: value });
              if (errors.category) setErrors({ ...errors, category: '' });
            }}
          >
            <SelectTrigger className={`bg-pos-surface border-pos-secondary text-pos-text ${errors.category ? 'border-destructive' : ''
              }`}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-pos-surface border-pos-secondary">
              {displayCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-pos-text">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="bg-pos-surface border-pos-secondary text-pos-text"
            placeholder="Product description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-pos-text">
              Sale Price ($) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                });
                if (errors.price) setErrors({ ...errors, price: '' });
              }}
              className={`bg-pos-surface border-pos-secondary text-pos-text ${errors.price ? 'border-destructive' : ''
                }`}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost" className="text-pos-text">
              Cost ($)
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  cost: parseFloat(e.target.value) || 0,
                });
                if (errors.cost) setErrors({ ...errors, cost: '' });
              }}
              className={`bg-pos-surface border-pos-secondary text-pos-text ${errors.cost ? 'border-destructive' : ''
                }`}
              placeholder="0.00"
            />
            {errors.cost && (
              <p className="text-xs text-destructive">{errors.cost}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-pos-text">Margin</Label>
            <div className="h-10 flex items-center px-3 py-2 border border-pos-secondary rounded-md bg-pos-secondary text-pos-text-muted">
              {formData.price > 0
                ? `${(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%`
                : "0%"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock" className="text-pos-text">
              Current Stock
            </Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  stock: parseInt(e.target.value) || 0,
                });
                if (errors.stock) setErrors({ ...errors, stock: '' });
              }}
              className={`bg-pos-surface border-pos-secondary text-pos-text ${errors.stock ? 'border-destructive' : ''
                }`}
              placeholder="0"
            />
            {errors.stock && (
              <p className="text-xs text-destructive">{errors.stock}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStock" className="text-pos-text">
              Minimum Stock
            </Label>
            <Input
              id="minStock"
              type="number"
              min="0"
              value={formData.minStock}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  minStock: parseInt(e.target.value) || 0,
                });
                if (errors.minStock) setErrors({ ...errors, minStock: '' });
              }}
              className={`bg-pos-surface border-pos-secondary text-pos-text ${errors.minStock ? 'border-destructive' : ''
                }`}
              placeholder="5"
            />
            {errors.minStock && (
              <p className="text-xs text-destructive">{errors.minStock}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, available: checked })
                }
              />
              <Label htmlFor="available" className="text-pos-text">
                Available for sale
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked })
                }
              />
              <Label htmlFor="featured" className="text-pos-text">
                Featured item
              </Label>
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
  };

  // Category Form Component
  const CategoryForm = ({
    category,
    onSave,
    onCancel,
  }: {
    category?: any;
    onSave: (category: any) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      active: category?.active ?? true,
      sort_order: category?.sort_order || 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const imageCropConfig = getImageCropConfig('category');
    const { width: cropWidth, height: cropHeight } = imageCropConfig;

    useEffect(() => {
      if (!category && formData.name) {
        setFormData(prev => ({
          ...prev,
          slug: generateSlug(formData.name),
        }));
      }
    }, [formData.name, category]);

    const validateForm = () => {
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) newErrors.name = "Category name is required";
      if (!formData.slug.trim()) newErrors.slug = "Slug is required";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validation = validateImageFile(file, 'category');
        if (!validation.valid) {
          setErrors({ ...errors, image: validation.error || 'Invalid image file' });
          return;
        }
        setErrors({ ...errors, image: '' });
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
                <img src={categoryImagePreview.startsWith('/uploads') ? `${BACKEND_URL}${categoryImagePreview}` : categoryImagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              <p className="text-xs text-muted-foreground">Max 10MB, JPG/PNG/GIF/WebP. Cropped to {cropWidth}x{cropHeight}px.</p>
              {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Category name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="category-slug" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input type="number" min="0" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
          <Label>Active</Label>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save</>}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
            if (!open) {
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
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                imageFile={imageFile}
                setImageFile={setImageFile}
                onSave={(productData) => {
                  console.log('Product form data:', productData);
                  console.log('Image file:', imageFile);

                  // Prepare data for API according to documentation
                  const apiData = {
                    name: productData.name!,
                    slug: productData.slug!,
                    category_id: productData.category!,
                    price: dollarsToCents(productData.price || 0),
                    description: productData.description || undefined,
                    sku: productData.sku || undefined,
                    stock: productData.stock || 0,
                    is_available: productData.available ?? true,
                    image: imageFile || null,
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
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
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-48 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or create a new product</p>
              </div>
            </div>
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
                          {product.available ? (
                            <Eye className="h-4 w-4 text-pos-success" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-pos-text-muted" />
                          )}
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
                            src={`${BACKEND_URL}${product.image}`}
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-pos-text-muted text-sm">
                            Price
                          </span>
                          <span className="text-pos-text font-bold text-lg">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-pos-text-muted text-sm">
                            Cost
                          </span>
                          <span className="text-pos-text">${product.cost.toFixed(2)}</span>
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

                      <div className="flex items-center space-x-2 pt-2">
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
                              onSave={(updatedData) => {
                                // Build API data object
                                const apiData: any = {
                                  name: updatedData.name,
                                  description: updatedData.description,
                                  price: dollarsToCents(updatedData.price || 0),
                                  cost: dollarsToCents(updatedData.cost || 0),
                                  category_id: updatedData.category,
                                  stock: updatedData.stock,
                                  min_stock: updatedData.minStock,
                                  available: updatedData.available,
                                  featured: updatedData.featured,
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-pos-secondary text-pos-error hover:text-pos-error"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            🔄 Force Refresh Modifiers Data
          </Button>

          {modifiersLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !modifierListResponse || !modifierListResponse.data || !Array.isArray(modifierListResponse.data) ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-destructive text-center">
                  Error loading modifiers. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : modifierListResponse.data.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  No modifiers found. Create your first modifier to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modifierListResponse.data.map((modifier) => (
                  <Card key={modifier.id} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center justify-between">
                        <span>{modifier.name}</span>
                        <Badge variant={modifier.type === 'single' ? 'default' : 'secondary'}>
                          {modifier.type}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Category</span>
                          <Badge variant="outline">{modifier.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Required</span>
                          <Badge variant={modifier.required ? 'destructive' : 'secondary'}>
                            {modifier.required ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedModifierForOptions(modifier.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Manage Options
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Modifier</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{modifier.name}"? This will also delete all its options. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteModifierMutation.mutate(modifier.id)}
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
              {modifierListResponse && modifierListResponse.pagination.total_items > 12 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((modifierPage - 1) * 12) + 1} to {Math.min(modifierPage * 12, modifierListResponse.pagination.total_items)} of {modifierListResponse.pagination.total_items} modifiers
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
                      Page {modifierPage} of {modifierListResponse.pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModifierPage(prev => Math.min(modifierListResponse.pagination.total_pages, prev + 1))}
                      disabled={modifierPage === modifierListResponse.pagination.total_pages}
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
      <Dialog open={isAddingModifier} onOpenChange={setIsAddingModifier}>
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
              const data = {
                name: formData.get("name") as string,
                type: formData.get("type") as "single" | "multiple",
                category: formData.get("category") as string,
                required: formData.get("required") === "on",
                min_selections: parseInt(formData.get("min_selections") as string) || 0,
                max_selections: formData.get("max_selections")
                  ? parseInt(formData.get("max_selections") as string)
                  : null,
              };
              createModifierMutation.mutate(data, {
                onSuccess: () => {
                  setIsAddingModifier(false);
                  setEditingModifier(null);
                },
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
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
                  <option value="single">Single Choice</option>
                  <option value="multiple">Multiple Choice</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modifier-category" className="text-foreground">
                Category
              </Label>
              <Input
                id="modifier-category"
                name="category"
                placeholder="e.g., Size, Add-ons, Customization"
                className="bg-background border-input text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-selections" className="text-foreground">
                  Minimum Selections
                </Label>
                <Input
                  id="min-selections"
                  name="min_selections"
                  type="number"
                  min="0"
                  defaultValue="0"
                  className="bg-background border-input text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-selections" className="text-foreground">
                  Maximum Selections
                </Label>
                <Input
                  id="max-selections"
                  name="max_selections"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  className="bg-background border-input text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="modifier-required"
                name="required"
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="modifier-required" className="text-foreground cursor-pointer">
                Required (Customer must make a selection)
              </Label>
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

      {/* Manage Modifier Options Dialog */}
      {console.log('selectedModifierForOptions:', selectedModifierForOptions)}
      {console.log('Dialog open state:', !!selectedModifierForOptions)}
      <Dialog
        open={!!selectedModifierForOptions}
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange called, open:', open);
          !open && setSelectedModifierForOptions(null);
        }}
      >
        <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Manage Options
              {selectedModifierData && (
                <span className="text-muted-foreground ml-2">
                  - {selectedModifierData.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {optionsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !modifierOptionsData?.data ? (
            <p className="text-destructive text-center py-8">
              Error loading modifier options. Please try again.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Add New Option Form */}
              <Card className="bg-muted/50 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Add New Option</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const data = {
                        name: formData.get("option_name") as string,
                        price: Math.round(parseFloat(formData.get("option_price") as string || "0") * 100),
                        available: formData.get("option_available") === "on",
                        sort_order: parseInt(formData.get("option_sort_order") as string || "0"),
                      };

                      if (selectedModifierForOptions) {
                        createModifierOptionMutation.mutate(
                          {
                            modifierId: selectedModifierForOptions,
                            data: data,
                          },
                          {
                            onSuccess: () => {
                              e.currentTarget.reset();
                            },
                          }
                        );
                      }
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="option_name" className="text-foreground">
                        Option Name *
                      </Label>
                      <Input
                        id="option_name"
                        name="option_name"
                        placeholder="e.g., Small, Large, Extra Cheese"
                        required
                        className="bg-background border-input text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option_price" className="text-foreground">
                        Additional Price ($)
                      </Label>
                      <Input
                        id="option_price"
                        name="option_price"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue="0.00"
                        placeholder="0.00"
                        className="bg-background border-input text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option_sort_order" className="text-foreground">
                        Sort Order
                      </Label>
                      <Input
                        id="option_sort_order"
                        name="option_sort_order"
                        type="number"
                        min="0"
                        defaultValue="0"
                        className="bg-background border-input text-foreground"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-8">
                      <input
                        type="checkbox"
                        id="option_available"
                        name="option_available"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="option_available" className="text-foreground cursor-pointer">
                        Available
                      </Label>
                    </div>

                    <div className="col-span-2">
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={createModifierOptionMutation.isPending}
                      >
                        {createModifierOptionMutation.isPending ? "Adding..." : "Add Option"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Options List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  Existing Options ({modifierOptionsData.data?.length || 0})
                </h3>

                {!modifierOptionsData.data || modifierOptionsData.data.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No options yet. Add your first option above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {modifierOptionsData.data
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((option) => (
                        <Card key={option.id} className="bg-card border-border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-foreground">
                                    {option.name}
                                  </span>
                                  <Badge variant={option.available ? "default" : "secondary"}>
                                    {option.available ? "Available" : "Unavailable"}
                                  </Badge>
                                  <span className="text-muted-foreground text-sm">
                                    Order: {option.sort_order}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Price: ${(option.price / 100).toFixed(2)}
                                </p>
                              </div>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Option</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{option.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (selectedModifierForOptions) {
                                          deleteModifierOptionMutation.mutate({
                                            modifierId: selectedModifierForOptions,
                                            optionId: option.id,
                                          });
                                        }
                                      }}
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
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedModifierForOptions(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
