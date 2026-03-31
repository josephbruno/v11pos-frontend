import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  ImageIcon,
  Save,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  generateSlug,
} from "@/hooks/useCategories";
import { getImageCropConfig, validateImageFile } from "@/lib/imageCropConfig";
import { useAuth } from "@/contexts/AuthContext";
import { getMyRestaurants } from "@/lib/apiServices";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function normalizeDoubleProtocolUrl(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(https?:\/\/)(https?:\/\/)(.+)$/i);
  if (!match) return trimmed;
  return `${match[2]}${match[3]}`;
}

function resolveImageSrc(value?: string | null) {
  if (!value) return "";
  const normalized = normalizeDoubleProtocolUrl(String(value));

  if (/^(blob:|data:)/i.test(normalized)) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;

  if (normalized.startsWith("/")) return `${BACKEND_URL}${normalized}`;

  // Fallback for legacy backends that return a filename instead of a full URL/path
  return `${BACKEND_URL}/uploads/${normalized}`;
}

interface Category {
  id: string;
  restaurant_id?: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description: string | null;
  image: string | null;
  active: boolean;
  sort_order: number;
  is_featured?: boolean;
  icon?: string | null;
  banner_image?: string | null;
  thumbnail?: string | null;
  display_type?: string | null;
  items_per_row?: number | null;
  color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  show_in_menu?: boolean;
  show_in_homepage?: boolean;
  show_in_pos?: boolean;
  available_for_delivery?: boolean;
  available_for_takeaway?: boolean;
  available_for_dine_in?: boolean;
  available_from_time?: string | null;
  available_to_time?: string | null;
  available_days?: Record<string, boolean> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  created_at: string;
  updated_at: string;
}

interface RestaurantOption {
  id: string;
  name: string;
}

function sanitizeCategoryName(value: string) {
  return value.replace(/[^A-Za-z0-9\s&-]/g, "");
}

function getCategoryNameError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Category name is required";
  if (trimmed.length < 2 || trimmed.length > 50) {
    return "Category name must be between 2 and 50 characters";
  }
  if (!/^[A-Za-z]/.test(trimmed)) {
    return "Category name must start with a letter";
  }
  if (!/^[A-Za-z0-9\s&-]+$/.test(trimmed)) {
    return "Category name can contain letters, numbers, spaces, & and - only";
  }
  return undefined;
}

function normalizeCategoryNameForCompare(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function sanitizeCategoryDescription(value: string) {
  return value.replace(/[^A-Za-z0-9\s]/g, "");
}

const DEFAULT_AVAILABLE_DAYS: Record<string, boolean> = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
};

function getInitialCategoryFormData(category: Category | undefined, defaultRestaurantId: string) {
  return {
    restaurant_id: category?.restaurant_id
      ? String(category.restaurant_id)
      : defaultRestaurantId
        ? String(defaultRestaurantId)
        : "",
    name: category?.name || "",
    description: category?.description || "",
    sort_order: category?.sort_order ?? 0,
    is_featured: category?.is_featured ?? false,
    icon: category?.icon || "",
    banner_image: category?.banner_image || "",
    thumbnail: category?.thumbnail || "",
    display_type: category?.display_type || "",
    items_per_row: category?.items_per_row ?? "",
    color: category?.color || "",
    background_color: category?.background_color || "",
    text_color: category?.text_color || "",
    show_in_menu: category?.show_in_menu ?? true,
    show_in_homepage: category?.show_in_homepage ?? false,
    show_in_pos: category?.show_in_pos ?? true,
    available_for_delivery: category?.available_for_delivery ?? true,
    available_for_takeaway: category?.available_for_takeaway ?? true,
    available_for_dine_in: category?.available_for_dine_in ?? true,
    available_from_time: category?.available_from_time || "",
    available_to_time: category?.available_to_time || "",
    seo_title: category?.seo_title || "",
    seo_description: category?.seo_description || "",
    seo_keywords: category?.seo_keywords || "",
  };
}

export default function CategoryConfiguration() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const canManageRestaurants = user?.role === "super_admin" || user?.role === "admin";
  const canEditCategories = user?.role === "super_admin" || user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pendingCategoryStatusChange, setPendingCategoryStatusChange] = useState<{
    category: Category;
    active: boolean;
  } | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(user?.branchId || "");

  const { data: restaurantsResponse, isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ["my-restaurants", user?.id],
    queryFn: () => getMyRestaurants(0, 500),
    enabled: canManageRestaurants,
    staleTime: 60000,
  });

  const restaurantOptions: RestaurantOption[] = useMemo(() => {
    const source = (restaurantsResponse as any)?.data ?? restaurantsResponse;
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
  }, [restaurantsResponse]);

  const restaurantNameById = useMemo(() => {
    return new Map(restaurantOptions.map((restaurant) => [restaurant.id, restaurant.name]));
  }, [restaurantOptions]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedRestaurantId(user?.branchId || "");
      return;
    }

    if (!selectedRestaurantId && restaurantOptions.length > 0) {
      setSelectedRestaurantId(restaurantOptions[0].id);
    }
  }, [isSuperAdmin, user?.branchId, selectedRestaurantId, restaurantOptions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRestaurantId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categoriesResponse, isLoading } = useCategories({
    page: currentPage,
    page_size: 12,
  }, selectedRestaurantId);
  
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const categories = categoriesResponse?.data || [];
  const pagination = categoriesResponse?.pagination;

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        const matchesSearch = cat.name.toLowerCase().includes(debouncedSearch.toLowerCase());
        if (!matchesSearch) return false;
        if (statusFilter === "active" && !cat.active) return false;
        if (statusFilter === "inactive" && cat.active) return false;
        if (!isSuperAdmin && selectedRestaurantId) {
          return String(cat.restaurant_id || "") === String(selectedRestaurantId);
        }
        return true;
      })
      .sort((a, b) => {
        const orderA = Number.isFinite(a.sort_order) ? a.sort_order : 0;
        const orderB = Number.isFinite(b.sort_order) ? b.sort_order : 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
  }, [categories, debouncedSearch, isSuperAdmin, selectedRestaurantId, statusFilter]);

  const handleToggleCategoryStatus = (category: any, checked: boolean) => {
    updateMutation.mutate({
      id: category.id,
      data: { active: checked },
    });
  };

  const handleRequestCategoryStatusChange = (category: Category, checked: boolean) => {
    const nextStatus = !!checked;
    if (nextStatus === !!category.active) return;
    setPendingCategoryStatusChange({ category, active: nextStatus });
  };

  const CategoryForm = ({
    category,
    onSave,
    onCancel,
    restaurantOptions,
    defaultRestaurantId,
    isSuperAdmin,
    isRestaurantsLoading,
  }: {
    category?: Category;
    onSave: (category: any) => void;
    onCancel: () => void;
    restaurantOptions: RestaurantOption[];
    defaultRestaurantId: string;
    isSuperAdmin: boolean;
    isRestaurantsLoading: boolean;
  }) => {
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const iconInputRef = useRef<HTMLInputElement | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
    const bannerImageInputRef = useRef<HTMLInputElement | null>(null);
    const [localImagePreview, setLocalImagePreview] = useState<string>(category?.image || "");
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);
    const [localIconPreview, setLocalIconPreview] = useState<string>(category?.icon || "");
    const [localIconFile, setLocalIconFile] = useState<File | null>(null);
    const [localThumbnailPreview, setLocalThumbnailPreview] = useState<string>(category?.thumbnail || "");
    const [localThumbnailFile, setLocalThumbnailFile] = useState<File | null>(null);
    const [localBannerImagePreview, setLocalBannerImagePreview] = useState<string>(category?.banner_image || "");
    const [localBannerImageFile, setLocalBannerImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState(() =>
      getInitialCategoryFormData(category, defaultRestaurantId),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [sortOrderInput, setSortOrderInput] = useState<string>(
      String(category?.sort_order ?? 0),
    );
    const [availableDays, setAvailableDays] = useState<Record<string, boolean>>(
      category?.available_days || DEFAULT_AVAILABLE_DAYS,
    );

    const imageCropConfig = getImageCropConfig('category');
    const { width: cropWidth, height: cropHeight } = imageCropConfig;

    useEffect(() => {
      setFormData(getInitialCategoryFormData(category, defaultRestaurantId));
      setErrors({});
      setTouched({});
      setLocalImagePreview(category?.image || "");
      setLocalImageFile(null);
      setLocalIconPreview(category?.icon || "");
      setLocalIconFile(null);
      setLocalThumbnailPreview(category?.thumbnail || "");
      setLocalThumbnailFile(null);
      setLocalBannerImagePreview(category?.banner_image || "");
      setLocalBannerImageFile(null);
      setSortOrderInput(String(category?.sort_order ?? 0));
      setAvailableDays(category?.available_days || DEFAULT_AVAILABLE_DAYS);
    }, [category?.id, defaultRestaurantId]);

    const getPreviewSrc = (preview: string) => {
      return resolveImageSrc(preview);
    };

    const getDuplicateCategoryNameError = (name: string, restaurantId: string) => {
      if (!restaurantId) return undefined;
      const normalizedName = normalizeCategoryNameForCompare(name);
      if (!normalizedName) return undefined;

      const hasDuplicateName = categories.some((existing) => {
        if (String(existing.restaurant_id || "") !== String(restaurantId)) return false;
        if (category?.id && String(existing.id) === String(category.id)) return false;
        return normalizeCategoryNameForCompare(existing.name) === normalizedName;
      });

      if (!hasDuplicateName) return undefined;
      return "Category name already exists for this restaurant";
    };

    const validateForm = () => {
      const newErrors: Record<string, string> = {};
      const hasImage = Boolean(localImageFile || localImagePreview || category?.image);

      const nameError = getCategoryNameError(formData.name);
      if (nameError) newErrors.name = nameError;

      if (!newErrors.name) {
        const duplicateError = getDuplicateCategoryNameError(
          formData.name,
          String(formData.restaurant_id || ""),
        );
        if (duplicateError) newErrors.name = duplicateError;
      }

      if (Number(formData.sort_order) < 0) {
        newErrors.sort_order = "Sort order cannot be negative";
      }

      if (formData.description && !/^[A-Za-z0-9\s]*$/.test(formData.description)) {
        newErrors.description = "Description cannot contain special characters";
      }

      if (!formData.restaurant_id) {
        newErrors.restaurant_id = "Restaurant is required";
      }

      if (!category && !hasImage) {
        newErrors.image = "Category image is required";
      }

      if (localImageFile && errors.image) {
        newErrors.image = errors.image;
      }
      if (localIconFile && errors.icon) {
        newErrors.icon = errors.icon;
      }
      if (localThumbnailFile && errors.thumbnail) {
        newErrors.thumbnail = errors.thumbnail;
      }
      if (localBannerImageFile && errors.banner_image) {
        newErrors.banner_image = errors.banner_image;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const validateMandatoryField = (field: "restaurant_id" | "name" | "image") => {
      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        if (field === "restaurant_id") {
          if (!formData.restaurant_id) nextErrors.restaurant_id = "Restaurant is required";
          else delete nextErrors.restaurant_id;
        }
        if (field === "name") {
          const nameError = getCategoryNameError(formData.name);
          if (nameError) {
            nextErrors.name = nameError;
          } else {
            const duplicateError = getDuplicateCategoryNameError(
              formData.name,
              String(formData.restaurant_id || ""),
            );
            if (duplicateError) nextErrors.name = duplicateError;
            else delete nextErrors.name;
          }
        }
        if (field === "image") {
          if (localImageFile && prevErrors.image) nextErrors.image = prevErrors.image;
          else delete nextErrors.image;
        }
        return nextErrors;
      });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      
      if (file) {
        setTouched((prev) => ({ ...prev, image: true }));
        const validation = validateImageFile(file, 'category');
        
        if (!validation.valid) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            image: validation.error || "Invalid image file",
          }));
          setLocalImageFile(null);
          return;
        }

        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          delete nextErrors.image;
          return nextErrors;
        });
        setTouched((prev) => ({ ...prev, image: true }));
        setLocalImageFile(file);

        const objectUrl = URL.createObjectURL(file);
        setLocalImagePreview(objectUrl);
      }
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setTouched((prev) => ({ ...prev, icon: true }));
      const validation = validateImageFile(file, "category");
      if (!validation.valid) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          icon: validation.error || "Invalid image file",
        }));
        setLocalIconFile(null);
        return;
      }

      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        delete nextErrors.icon;
        return nextErrors;
      });
      setLocalIconFile(file);
      setLocalIconPreview(URL.createObjectURL(file));
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setTouched((prev) => ({ ...prev, thumbnail: true }));
      const validation = validateImageFile(file, "category");
      if (!validation.valid) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          thumbnail: validation.error || "Invalid image file",
        }));
        setLocalThumbnailFile(null);
        return;
      }

      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        delete nextErrors.thumbnail;
        return nextErrors;
      });
      setLocalThumbnailFile(file);
      setLocalThumbnailPreview(URL.createObjectURL(file));
    };

    const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setTouched((prev) => ({ ...prev, banner_image: true }));
      const validation = validateImageFile(file, "category");
      if (!validation.valid) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          banner_image: validation.error || "Invalid image file",
        }));
        setLocalBannerImageFile(null);
        return;
      }

      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        delete nextErrors.banner_image;
        return nextErrors;
      });
      setLocalBannerImageFile(file);
      setLocalBannerImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
      setTouched((prev) => ({
        ...prev,
        restaurant_id: true,
        name: true,
        image: true,
      }));

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        const isEdit = !!category;
        const slugFinal = generateSlug(formData.name).trim();

        const categoryData: Record<string, any> = isEdit
          ? {
              restaurant_id: formData.restaurant_id,
              name: formData.name,
              slug: slugFinal,
            }
          : {
              restaurant_id: formData.restaurant_id,
              name: formData.name,
              slug: slugFinal,
            };

        if (isEdit) {
          if (touched.description) categoryData.description = formData.description?.trim() || null;
          if (touched.sort_order) categoryData.sort_order = Number(formData.sort_order) || 0;

          if (touched.is_featured) categoryData.is_featured = !!formData.is_featured;
          if (touched.display_type) categoryData.display_type = formData.display_type?.trim() || null;
          if (touched.items_per_row) {
            categoryData.items_per_row =
              formData.items_per_row === "" ? null : Number(formData.items_per_row) || 0;
          }

          if (touched.color) categoryData.color = formData.color?.trim() || null;
          if (touched.background_color) categoryData.background_color = formData.background_color?.trim() || null;
          if (touched.text_color) categoryData.text_color = formData.text_color?.trim() || null;

          if (localIconFile) categoryData.icon = localIconFile;
          if (localBannerImageFile) categoryData.banner_image = localBannerImageFile;
          if (localThumbnailFile) categoryData.thumbnail = localThumbnailFile;

          if (touched.show_in_menu) categoryData.show_in_menu = !!formData.show_in_menu;
          if (touched.show_in_homepage) categoryData.show_in_homepage = !!formData.show_in_homepage;
          if (touched.show_in_pos) categoryData.show_in_pos = !!formData.show_in_pos;

          if (touched.available_for_delivery) categoryData.available_for_delivery = !!formData.available_for_delivery;
          if (touched.available_for_takeaway) categoryData.available_for_takeaway = !!formData.available_for_takeaway;
          if (touched.available_for_dine_in) categoryData.available_for_dine_in = !!formData.available_for_dine_in;
          if (touched.available_from_time) categoryData.available_from_time = formData.available_from_time?.trim() || null;
          if (touched.available_to_time) categoryData.available_to_time = formData.available_to_time?.trim() || null;
          if (touched.available_days) categoryData.available_days = availableDays;

          if (touched.seo_title) categoryData.seo_title = formData.seo_title?.trim() || null;
          if (touched.seo_description) categoryData.seo_description = formData.seo_description?.trim() || null;
          if (touched.seo_keywords) categoryData.seo_keywords = formData.seo_keywords?.trim() || null;

          if (localImageFile) categoryData.image = localImageFile;
        } else {
          categoryData.description = formData.description?.trim() || null;
          categoryData.sort_order = Number(formData.sort_order) || 0;
          categoryData.image = localImageFile;
        }

        onSave(categoryData);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!category) {
      return (
	        <div className="space-y-6 pb-1">
	          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	            {isSuperAdmin ? (
	              <div className="space-y-2">
	                <Label htmlFor="restaurant_id" className="text-foreground">
	                  Restaurant
	                </Label>
	                <Select
	                  value={formData.restaurant_id || "none"}
	                  onValueChange={(value) => {
	                    const nextRestaurantId = value === "none" ? "" : value;
	                    setFormData({ ...formData, restaurant_id: nextRestaurantId });
	                    setTouched((prev) => ({ ...prev, restaurant_id: true }));
	                    setErrors((prevErrors) => {
	                      const nextErrors = { ...prevErrors };
	                      if (!nextRestaurantId) nextErrors.restaurant_id = "Restaurant is required";
	                      else delete nextErrors.restaurant_id;
	                      return nextErrors;
	                    });
	                  }}
	                  disabled={isRestaurantsLoading}
	                >
	                  <SelectTrigger
	                    className={`bg-background border-border text-foreground ${errors.restaurant_id ? "border-destructive" : ""}`}
	                  >
	                    <SelectValue
	                      placeholder={
	                        isRestaurantsLoading ? "Loading restaurants..." : "Select restaurant"
	                      }
	                    />
	                  </SelectTrigger>
	                  <SelectContent className="bg-background border-border">
	                    <SelectItem value="none">Select Restaurant</SelectItem>
	                    {restaurantOptions.length === 0 && (
	                      <SelectItem value="no-restaurants" disabled>
	                        No restaurants found
	                      </SelectItem>
	                    )}
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
                Category Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: sanitizeCategoryName(e.target.value) });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }));
                  validateMandatoryField("name");
                }}
                className={`bg-background border-border text-foreground ${errors.name ? 'border-destructive' : ''}`}
                placeholder="Enter category name"
              />
              {(errors.name && (touched.name || isSubmitting)) && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: sanitizeCategoryDescription(e.target.value) });
                setTouched((prev) => ({ ...prev, description: true }));
                if (errors.description) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.description;
                    return next;
                  });
                }
              }}
              className="bg-background border-border text-foreground"
              placeholder="Category description"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-2">
              <Label htmlFor="image" className="text-foreground">Category Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                {localImagePreview ? (
                  <img
                    src={resolveImageSrc(localImagePreview)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
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
                    className="border-border"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                    {localImageFile?.name || "No file chosen"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a category image (max 2MB, JPG, PNG, GIF, WebP). Image will be cropped to {cropWidth}x{cropHeight}px.
                </p>
                {localImageFile && <p className="text-xs text-green-600">✓ New image ready for upload</p>}
                {(errors.image && (touched.image || isSubmitting)) && (
                  <p className="text-xs text-destructive">{errors.image}</p>
                )}
              </div>
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order" className="text-foreground">Sort Order</Label>
            <Input
              id="sort_order"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={sortOrderInput}
              onFocus={() => {
                if (sortOrderInput === "0") setSortOrderInput("");
              }}
              onKeyDown={(e) => {
                if (
                  e.key.length === 1 &&
                  !/[0-9]/.test(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey &&
                  !e.altKey
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const raw = e.target.value;
                const digitsOnly = raw.replace(/\D/g, "");
                if (digitsOnly === "") {
                  setSortOrderInput("");
                  setFormData((prev) => ({ ...prev, sort_order: 0 }));
                  setTouched((prev) => ({ ...prev, sort_order: true }));
                  return;
                }

                const parsed = parseInt(digitsOnly, 10);
                const clamped = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
                setSortOrderInput(String(clamped));
                setFormData((prev) => ({ ...prev, sort_order: clamped }));
                setTouched((prev) => ({ ...prev, sort_order: true }));
                if (errors.sort_order) setErrors({ ...errors, sort_order: '' });
              }}
              onBlur={() => {
                if (sortOrderInput.trim() === "") {
                  setSortOrderInput("0");
                  setFormData((prev) => ({ ...prev, sort_order: 0 }));
                }
              }}
              className={`bg-background border-border text-foreground max-w-[140px] ${errors.sort_order ? 'border-destructive' : ''}`}
              placeholder="0"
            />
            {errors.sort_order && <p className="text-xs text-destructive">{errors.sort_order}</p>}
            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
          </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <DialogClose asChild>
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="border-border">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Category
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	        {isSuperAdmin ? (
	          <div className="space-y-2">
	            <Label htmlFor="restaurant_id" className="text-foreground">
	              Restaurant
	            </Label>
	            <Select
	              value={formData.restaurant_id || "none"}
	              onValueChange={(value) => {
	                const nextRestaurantId = value === "none" ? "" : value;
	                setFormData({ ...formData, restaurant_id: nextRestaurantId });
	                setTouched((prev) => ({ ...prev, restaurant_id: true }));
	                setErrors((prevErrors) => {
	                  const nextErrors = { ...prevErrors };
	                  if (!nextRestaurantId) nextErrors.restaurant_id = "Restaurant is required";
	                  else delete nextErrors.restaurant_id;
	                  return nextErrors;
	                });
	              }}
	              disabled
	            >
	              <SelectTrigger
	                className={`bg-background border-border text-foreground ${errors.restaurant_id ? "border-destructive" : ""}`}
	              >
	                <SelectValue
	                  placeholder={
	                    isRestaurantsLoading ? "Loading restaurants..." : "Select restaurant"
	                  }
	                />
	              </SelectTrigger>
	              <SelectContent className="bg-background border-border">
	                <SelectItem value="none">Select Restaurant</SelectItem>
	                {restaurantOptions.length === 0 && (
	                  <SelectItem value="no-restaurants" disabled>
	                    No restaurants found
	                  </SelectItem>
	                )}
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
            Category Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: sanitizeCategoryName(e.target.value) });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, name: true }));
              validateMandatoryField("name");
            }}
            className={`bg-background border-border text-foreground ${errors.name ? 'border-destructive' : ''}`}
            placeholder="Enter category name"
          />
          {(errors.name && (touched.name || isSubmitting)) && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
      </div>

        {category && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Card className="md:col-span-2">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">

        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: sanitizeCategoryDescription(e.target.value) });
              setTouched((prev) => ({ ...prev, description: true }));
              if (errors.description) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.description;
                  return next;
                });
              }
            }}
            className="bg-background border-border text-foreground"
            placeholder="Category description"
            rows={3}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sort_order" className="text-foreground">Sort Order</Label>
            <Input
              id="sort_order"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={sortOrderInput}
              onFocus={() => {
                if (sortOrderInput === "0") setSortOrderInput("");
              }}
              onKeyDown={(e) => {
                if (
                  e.key.length === 1 &&
                  !/[0-9]/.test(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey &&
                  !e.altKey
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const raw = e.target.value;
                const digitsOnly = raw.replace(/\D/g, "");
                if (digitsOnly === "") {
                  setSortOrderInput("");
                  setFormData((prev) => ({ ...prev, sort_order: 0 }));
                  setTouched((prev) => ({ ...prev, sort_order: true }));
                  return;
                }

                const parsed = parseInt(digitsOnly, 10);
                const clamped = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
                setSortOrderInput(String(clamped));
                setFormData((prev) => ({ ...prev, sort_order: clamped }));
                setTouched((prev) => ({ ...prev, sort_order: true }));
                if (errors.sort_order) setErrors({ ...errors, sort_order: '' });
              }}
              onBlur={() => {
                if (sortOrderInput.trim() === "") {
                  setSortOrderInput("0");
                  setFormData((prev) => ({ ...prev, sort_order: 0 }));
                }
              }}
              className={`bg-background border-border text-foreground max-w-[140px] ${errors.sort_order ? 'border-destructive' : ''}`}
              placeholder="0"
            />
            {errors.sort_order && <p className="text-xs text-destructive">{errors.sort_order}</p>}
            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
          </div>

          <div className="flex items-center space-x-2 md:pt-7">
            <Switch
              id="is_featured"
              checked={!!formData.is_featured}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, is_featured: checked });
                setTouched((prev) => ({ ...prev, is_featured: true }));
              }}
            />
            <Label htmlFor="is_featured" className="text-foreground">Featured</Label>
          </div>
        </div>

                    </CardContent>
                  </Card>

                  

                  <Card className="md:col-span-2">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">Images</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="icon" className="text-foreground">Icon</Label>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                {localIconPreview ? (
                  <img
                    src={getPreviewSrc(localIconPreview)}
                    alt="Icon preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={iconInputRef}
                  id="icon"
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border"
                    onClick={() => iconInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                    {localIconFile?.name || "No file chosen"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Upload an icon image (max 2MB).</p>
                {(errors.icon && (touched.icon || isSubmitting)) && (
                  <p className="text-xs text-destructive">{errors.icon}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-foreground">Thumbnail</Label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                {localThumbnailPreview ? (
                  <img
                    src={getPreviewSrc(localThumbnailPreview)}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
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
                    className="border-border"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                    {localThumbnailFile?.name || "No file chosen"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Upload a thumbnail image (max 2MB).</p>
                {(errors.thumbnail && (touched.thumbnail || isSubmitting)) && (
                  <p className="text-xs text-destructive">{errors.thumbnail}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner_image" className="text-foreground">Banner Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-20 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                {localBannerImagePreview ? (
                  <img
                    src={getPreviewSrc(localBannerImagePreview)}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={bannerImageInputRef}
                  id="banner_image"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border"
                    onClick={() => bannerImageInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                    {localBannerImageFile?.name || "No file chosen"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Upload a banner image (max 2MB).</p>
                {(errors.banner_image && (touched.banner_image || isSubmitting)) && (
                  <p className="text-xs text-destructive">{errors.banner_image}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-foreground">Category Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                {localImagePreview ? (
                  <img
                    src={getPreviewSrc(localImagePreview)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
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
                    className="border-border"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[280px]">
                    {localImageFile?.name || "No file chosen"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a category image (max 2MB). Image will be cropped to {cropWidth}x{cropHeight}px.
                </p>
                {localImageFile && <p className="text-xs text-green-600">✓ New image ready for upload</p>}
                {(errors.image && (touched.image || isSubmitting)) && (
                  <p className="text-xs text-destructive">{errors.image}</p>
                )}
              </div>
            </div>
          </div>
        </div>


                    </CardContent>
                  </Card>

<Card className="md:col-span-2">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">Display & Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label htmlFor="display_type" className="text-foreground">Display Type</Label>
            <Select
              value={formData.display_type || "none"}
              onValueChange={(value) => {
                const next = value === "none" ? "" : value;
                setFormData({ ...formData, display_type: next });
                setTouched((prev) => ({ ...prev, display_type: true }));
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">Not set</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="items_per_row" className="text-foreground">Items Per Row</Label>
            <Input
              id="items_per_row"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.items_per_row}
              onKeyDown={(e) => {
                if (
                  e.key.length === 1 &&
                  !/[0-9]/.test(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey &&
                  !e.altKey
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const raw = e.target.value;
                const digitsOnly = raw.replace(/\D/g, "");
                const nextValue =
                  digitsOnly === "" ? "" : Math.max(0, parseInt(digitsOnly, 10) || 0);
                setFormData({ ...formData, items_per_row: nextValue });
                setTouched((prev) => ({ ...prev, items_per_row: true }));
              }}
              className="bg-background border-border text-foreground"
              placeholder="e.g. 4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="color" className="text-foreground">Accent Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color || "#000000"}
                onChange={(e) => {
                  setFormData({ ...formData, color: e.target.value });
                  setTouched((prev) => ({ ...prev, color: true }));
                }}
                className="bg-background border-border text-foreground h-10 p-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background_color" className="text-foreground">Background Color</Label>
              <Input
                id="background_color"
                type="color"
                value={formData.background_color || "#ffffff"}
                onChange={(e) => {
                  setFormData({ ...formData, background_color: e.target.value });
                  setTouched((prev) => ({ ...prev, background_color: true }));
                }}
                className="bg-background border-border text-foreground h-10 p-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_color" className="text-foreground">Text Color</Label>
              <Input
                id="text_color"
                type="color"
                value={formData.text_color || "#000000"}
                onChange={(e) => {
                  setFormData({ ...formData, text_color: e.target.value });
                  setTouched((prev) => ({ ...prev, text_color: true }));
                }}
                className="bg-background border-border text-foreground h-10 p-1"
              />
            </div>
          </div>
        </div>

                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">Visibility</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_in_menu"
              checked={!!formData.show_in_menu}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, show_in_menu: !!checked });
                setTouched((prev) => ({ ...prev, show_in_menu: true }));
              }}
            />
            <Label htmlFor="show_in_menu" className="text-foreground">Show in Menu</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_in_homepage"
              checked={!!formData.show_in_homepage}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, show_in_homepage: !!checked });
                setTouched((prev) => ({ ...prev, show_in_homepage: true }));
              }}
            />
            <Label htmlFor="show_in_homepage" className="text-foreground">Show on Homepage</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_in_pos"
              checked={!!formData.show_in_pos}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, show_in_pos: !!checked });
                setTouched((prev) => ({ ...prev, show_in_pos: true }));
              }}
            />
            <Label htmlFor="show_in_pos" className="text-foreground">Show in POS</Label>
          </div>
        </div>

                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">Availability</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="available_for_delivery"
              checked={!!formData.available_for_delivery}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, available_for_delivery: checked });
                setTouched((prev) => ({ ...prev, available_for_delivery: true }));
              }}
            />
            <Label htmlFor="available_for_delivery" className="text-foreground">Delivery</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="available_for_takeaway"
              checked={!!formData.available_for_takeaway}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, available_for_takeaway: checked });
                setTouched((prev) => ({ ...prev, available_for_takeaway: true }));
              }}
            />
            <Label htmlFor="available_for_takeaway" className="text-foreground">Takeaway</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="available_for_dine_in"
              checked={!!formData.available_for_dine_in}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, available_for_dine_in: checked });
                setTouched((prev) => ({ ...prev, available_for_dine_in: true }));
              }}
            />
            <Label htmlFor="available_for_dine_in" className="text-foreground">Dine In</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="available_from_time" className="text-foreground">From (HH:MM)</Label>
            <Input
              id="available_from_time"
              type="time"
              value={formData.available_from_time}
              onChange={(e) => {
                setFormData({ ...formData, available_from_time: e.target.value });
                setTouched((prev) => ({ ...prev, available_from_time: true }));
              }}
              className="bg-background border-border text-foreground"
              placeholder="09:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="available_to_time" className="text-foreground">To (HH:MM)</Label>
            <Input
              id="available_to_time"
              type="time"
              value={formData.available_to_time}
              onChange={(e) => {
                setFormData({ ...formData, available_to_time: e.target.value });
                setTouched((prev) => ({ ...prev, available_to_time: true }));
              }}
              className="bg-background border-border text-foreground"
              placeholder="23:00"
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label className="text-foreground">Available Days</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              {Object.entries(availableDays).map(([day, enabled]) => (
                <label key={day} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={enabled}
                    onCheckedChange={(checked) => {
                      setAvailableDays((prev) => ({ ...prev, [day]: !!checked }));
                      setTouched((prev) => ({ ...prev, available_days: true }));
                    }}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">SEO & Meta</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo_title" className="text-foreground">SEO Title</Label>
            <Input
              id="seo_title"
              value={formData.seo_title}
              onChange={(e) => {
                setFormData({ ...formData, seo_title: e.target.value });
                setTouched((prev) => ({ ...prev, seo_title: true }));
              }}
              className="bg-background border-border text-foreground"
              placeholder="Meta title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_keywords" className="text-foreground">SEO Keywords</Label>
            <Input
              id="seo_keywords"
              value={formData.seo_keywords}
              onChange={(e) => {
                setFormData({ ...formData, seo_keywords: e.target.value });
                setTouched((prev) => ({ ...prev, seo_keywords: true }));
              }}
              className="bg-background border-border text-foreground"
              placeholder="comma,separated,keywords"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seo_description" className="text-foreground">SEO Description</Label>
            <Textarea
              id="seo_description"
              value={formData.seo_description}
              onChange={(e) => {
                setFormData({ ...formData, seo_description: e.target.value });
                setTouched((prev) => ({ ...prev, seo_description: true }));
              }}
              className="bg-background border-border text-foreground"
              placeholder="Meta description"
              rows={3}
            />
          </div>
        </div>

                    </CardContent>
                  </Card>
                </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="border-border">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Category
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Category Management</h1>
          <p className="text-muted-foreground mt-1">Organize and manage menu categories with images</p>
        </div>
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={isSuperAdmin && !selectedRestaurantId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              restaurantOptions={restaurantOptions}
              defaultRestaurantId={isSuperAdmin ? "" : selectedRestaurantId}
              isSuperAdmin={isSuperAdmin}
              isRestaurantsLoading={isRestaurantsLoading}
              onSave={(categoryData) => {
                createMutation.mutate(categoryData, {
                  onSuccess: () => {
                    setIsAddingCategory(false);
                  },
                });
              }}
              onCancel={() => {
                setIsAddingCategory(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isSuperAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-[260px_200px_200px] gap-4 items-end">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="space-y-0">
                <Select
                  value={selectedRestaurantId || "none"}
                  onValueChange={(value) =>
                    setSelectedRestaurantId(value === "none" ? "" : value)
                  }
                  disabled={isRestaurantsLoading}
                >
                <SelectTrigger
                  id="restaurant-filter"
                  className="bg-background border-border text-foreground h-9"
                  aria-label="Restaurant"
                >
                  <SelectValue
                      placeholder={isRestaurantsLoading ? "Loading..." : "Restaurant"}
                    />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                    <SelectItem value="none" disabled className="hidden">
                      Select Restaurant
                    </SelectItem>
                    {restaurantOptions.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="space-y-0">
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as "all" | "active" | "inactive")
                  }
                >
                  <SelectTrigger
                    id="status-filter"
                    className="bg-background border-border text-foreground h-9"
                    aria-label="Status"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="all">Select status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground h-9"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      ) : isSuperAdmin && !selectedRestaurantId ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a restaurant</h3>
            <p className="text-muted-foreground">Choose a restaurant to manage categories.</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search" : "Get started by creating your first category"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddingCategory(true)} disabled={isSuperAdmin && !selectedRestaurantId}>
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            )}
          </div>
        </div>
      ) : isSuperAdmin ? (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      {restaurantNameById.get(String(category.restaurant_id || "")) || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {category.image ? (
                          <img
                            src={resolveImageSrc(category.image)}
                            alt={category.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!category.active}
                        onCheckedChange={(checked) =>
                          handleRequestCategoryStatusChange(category, checked)
                        }
                        disabled={updateMutation.isPending || !canEditCategories}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {canEditCategories && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border"
                          onClick={() => setEditingCategory(category)}
                          disabled={!category.active}
                          title={!category.active ? "Inactive categories cannot be edited" : undefined}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-foreground flex items-center">
                      {category.name}
                      {category.active ? (
                        <Eye className="ml-2 h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{category.slug}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  {category.image ? (
                    <img 
                      src={resolveImageSrc(category.image)}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order: {category.sort_order}</span>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  {canEditCategories && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border"
                      onClick={() => setEditingCategory(category)}
                      disabled={!category.active}
                      title={!category.active ? "Inactive categories cannot be edited" : undefined}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Switch
                    checked={!!category.active}
                    onCheckedChange={(checked) =>
                      handleRequestCategoryStatusChange(category, checked)
                    }
                    disabled={updateMutation.isPending || !canEditCategories}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!pagination.has_prev || isLoading}
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
            disabled={!pagination.has_next || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={canEditCategories && !!editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
      >
        <DialogContent className="bg-card border-border w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Category</DialogTitle>
          </DialogHeader>
          {canEditCategories && editingCategory && (
            <CategoryForm
              category={editingCategory}
              restaurantOptions={restaurantOptions}
              defaultRestaurantId={selectedRestaurantId}
              isSuperAdmin={isSuperAdmin}
              isRestaurantsLoading={isRestaurantsLoading}
              onSave={(updatedData) => {
                updateMutation.mutate(
                  { id: editingCategory.id, data: updatedData },
                  {
                    onSuccess: () => {
                      setEditingCategory(null);
                    },
                  },
                );
              }}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingCategoryStatusChange}
        onOpenChange={(open) => {
          if (!open) setPendingCategoryStatusChange(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Category Status?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCategoryStatusChange
                ? `Are you sure you want to set ${pendingCategoryStatusChange.category.name} as ${
                    pendingCategoryStatusChange.active ? "Active" : "Inactive"
                  }?`
                : "Confirm status change."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!pendingCategoryStatusChange) return;
                const target = pendingCategoryStatusChange;
                setPendingCategoryStatusChange(null);
                handleToggleCategoryStatus(target.category, target.active);
              }}
            >
              {pendingCategoryStatusChange?.active ? "Set Active" : "Set Inactive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
