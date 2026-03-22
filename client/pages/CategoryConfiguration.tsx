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

interface Category {
  id: string;
  restaurant_id?: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface RestaurantOption {
  id: string;
  name: string;
}

function sanitizeCategoryName(value: string) {
  return value.replace(/[^A-Za-z\s]/g, "");
}

function sanitizeCategoryDescription(value: string) {
  return value.replace(/[^A-Za-z0-9\s]/g, "");
}

export default function CategoryConfiguration() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    enabled: isSuperAdmin,
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
  }, [categories, debouncedSearch, isSuperAdmin, selectedRestaurantId]);

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
    const [localImagePreview, setLocalImagePreview] = useState<string>(category?.image || "");
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
      restaurant_id: category?.restaurant_id || defaultRestaurantId || "",
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      active: category?.active ?? true,
      sort_order: category?.sort_order || 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const imageCropConfig = getImageCropConfig('category');
    const { width: cropWidth, height: cropHeight } = imageCropConfig;

    useEffect(() => {
      const generatedSlug = generateSlug(formData.name);
      setFormData((prev) => {
        if (!generatedSlug || prev.slug === generatedSlug) {
          return prev;
        }
        return {
          ...prev,
          slug: generatedSlug,
        };
      });
    }, [formData.name]);

    useEffect(() => {
      setLocalImagePreview(category?.image || "");
      setLocalImageFile(null);
    }, [category?.id, category?.image]);

    const validateForm = () => {
      const newErrors: Record<string, string> = {};
      const hasImage = Boolean(localImageFile || localImagePreview || category?.image);
      const slugValue = (formData.slug || generateSlug(formData.name)).trim();

      if (!formData.name.trim()) {
        newErrors.name = "Category name is required";
      } else if (formData.name.length < 2) {
        newErrors.name = "Category name must be at least 2 characters";
      } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
        newErrors.name = "Category name can contain letters and spaces only";
      }

      if (!slugValue) {
        newErrors.slug = "Slug is required";
      } else if (!/^[a-z0-9-]+$/.test(slugValue)) {
        newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
      }

      if (formData.sort_order < 0) {
        newErrors.sort_order = "Sort order cannot be negative";
      }

      if (formData.description && !/^[A-Za-z0-9\s]*$/.test(formData.description)) {
        newErrors.description = "Description cannot contain special characters";
      }

      if (!formData.restaurant_id) {
        newErrors.restaurant_id = "Restaurant is required";
      }

      if (!hasImage) {
        newErrors.image = "Category image is required";
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
          if (!formData.name.trim()) nextErrors.name = "Category name is required";
          else if (formData.name.length < 2) {
            nextErrors.name = "Category name must be at least 2 characters";
          } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
            nextErrors.name = "Category name can contain letters and spaces only";
          } else delete nextErrors.name;
        }
        if (field === "image") {
          const hasImage = Boolean(localImageFile || localImagePreview || category?.image);
          if (!hasImage) nextErrors.image = "Category image is required";
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
        const categoryData = {
          ...formData,
          slug: (formData.slug || generateSlug(formData.name)).trim(),
          image: localImageFile,
        };

        onSave(categoryData);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-6 pb-1">
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
            disabled={!isSuperAdmin || isRestaurantsLoading}
          >
            <SelectTrigger className={`bg-background border-border text-foreground ${errors.restaurant_id ? "border-destructive" : ""}`}>
              <SelectValue
                placeholder={
                  isRestaurantsLoading
                    ? "Loading restaurants..."
                    : "Select restaurant"
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
          {errors.restaurant_id && <p className="text-xs text-destructive">{errors.restaurant_id}</p>}
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: sanitizeCategoryDescription(e.target.value) });
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

        <div className="space-y-2">
          <Label htmlFor="image" className="text-foreground">Category Image</Label>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
              {localImagePreview ? (
                <img
                  src={localImagePreview.startsWith('http') || localImagePreview.startsWith('/uploads') 
                    ? `${BACKEND_URL}${localImagePreview}` 
                    : localImagePreview}
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
            type="number"
            min="0"
            value={formData.sort_order}
            onChange={(e) => {
              setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 });
              if (errors.sort_order) setErrors({ ...errors, sort_order: '' });
            }}
            className={`bg-background border-border text-foreground max-w-[140px] ${errors.sort_order ? 'border-destructive' : ''}`}
            placeholder="0"
          />
          {errors.sort_order && <p className="text-xs text-destructive">{errors.sort_order}</p>}
          <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
        </div>

        <div className="flex items-center space-x-2">
          {category && (
            <>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active" className="text-foreground">Active</Label>
            </>
          )}
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

      {isSuperAdmin && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="restaurant-filter" className="text-foreground">
                Restaurant
              </Label>
              <Select
                value={selectedRestaurantId || "none"}
                onValueChange={(value) =>
                  setSelectedRestaurantId(value === "none" ? "" : value)
                }
                disabled={isRestaurantsLoading}
              >
                <SelectTrigger id="restaurant-filter" className="bg-background border-border text-foreground">
                  <SelectValue placeholder={isRestaurantsLoading ? "Loading restaurants..." : "Select restaurant"} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="none">Select Restaurant</SelectItem>
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
      )}

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
                  <TableHead>Description</TableHead>
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
                    <TableCell className="max-w-[260px] truncate">
                      {category.description || "N/A"}
                    </TableCell>
                    <TableCell>
                      {restaurantNameById.get(String(category.restaurant_id || "")) || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {category.image ? (
                          <img
                            src={`${BACKEND_URL}/uploads/${category.image}`}
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
                      <Badge variant={category.active ? "default" : "secondary"}>
                        {category.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Switch
                          checked={!!category.active}
                          onCheckedChange={(checked) =>
                            handleRequestCategoryStatusChange(category, checked)
                          }
                          disabled={updateMutation.isPending}
                        />
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
                      src={`${BACKEND_URL}/uploads/${category.image}`}
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
                  <Badge variant={category.active ? "default" : "secondary"}>
                    {category.active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Switch
                    checked={!!category.active}
                    onCheckedChange={(checked) =>
                      handleRequestCategoryStatusChange(category, checked)
                    }
                    disabled={updateMutation.isPending}
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
        open={!!editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
      >
        <DialogContent className="bg-card border-border w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
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
