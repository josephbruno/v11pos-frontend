import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Building2, Calendar, MapPin, Pencil, Plus } from "lucide-react";
import {
  createRestaurant,
  getRestaurantById,
  getMyRestaurants,
  patchRestaurant,
  updateRestaurant,
} from "@/lib/apiServices";
import { Restaurant } from "@shared/api";
import { useToast } from "@/contexts/ToastContext";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeAlphaSpaces(value: string) {
  return value.replace(/[^a-zA-Z\s]/g, "");
}

function sanitizeAddress(value: string) {
  return value.replace(/[^a-zA-Z0-9\s/,]/g, "");
}

function normalizeRestaurantStatus(raw: any): "active" | "inactive" {
  const status = String(raw?.status || "").toLowerCase();
  if (status === "active" || status === "inactive") {
    return status;
  }
  if (raw?.is_active === true || raw?.active === true) return "active";
  if (raw?.is_active === false || raw?.active === false) return "inactive";
  return "inactive";
}

function extractRestaurants(payload: any): Restaurant[] {
  const source = payload?.data ?? payload;
  const list = Array.isArray(source)
    ? source
    : Array.isArray(source?.items)
      ? source.items
      : Array.isArray(source?.restaurants)
        ? source.restaurants
        : [];

  return list.map((restaurant: any) => ({
    ...restaurant,
    status: normalizeRestaurantStatus(restaurant),
  })) as Restaurant[];
}

type OrganizationForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: "active" | "inactive";
};

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    restaurant: Restaurant;
    active: boolean;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState<OrganizationForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    status: "active",
  });
  const { addToast } = useToast();
  const [editingOrganization, setEditingOrganization] = useState<Restaurant | null>(null);
  const initialForm: OrganizationForm = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    status: "active",
  };

  const resetCreateForm = () => {
    setForm(initialForm);
    setErrors({});
  };

  const [editForm, setEditForm] = useState<OrganizationForm>(initialForm);

  const validateField = (
    field: keyof OrganizationForm,
    value: string,
    currentForm: OrganizationForm
  ): string => {
    const trimmed = value.trim();

    if (field === "name") {
      if (!trimmed) return "Restaurant name is required.";
      if (trimmed.length < 3) return "Name must be at least 3 characters.";
      return "";
    }

    if (field === "email") {
      if (!trimmed) return "Email is required.";
      if (!isValidEmail(trimmed)) {
        return "Please enter a valid email like manager@restaurant.com.";
      }
      return "";
    }

    if (field === "phone") {
      if (!trimmed) return "Phone number is required.";
      if (!/^[0-9]{10}$/.test(trimmed)) {
        return "Phone number must be exactly 10 digits.";
      }
      return "";
    }

    if (field === "postal_code") {
      if (!trimmed) return "Postal code is required.";
      if (!/^[0-9]{6}$/.test(trimmed)) {
        return "Postal code must be exactly 6 digits.";
      }
      return "";
    }

    if (field === "city") {
      if (!trimmed) return "City is required.";
      if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return "City should contain letters only.";
      }
      return "";
    }

    if (field === "state") {
      if (!trimmed) return "State is required.";
      if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return "State should contain letters only.";
      }
      return "";
    }

    if (field === "country") {
      if (!trimmed) return "Country is required.";
      if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return "Country should contain letters only.";
      }
      return "";
    }

    if (field === "address") {
      if (!trimmed) return "Address is required.";
      if (!/^[a-zA-Z0-9\s/,]+$/.test(trimmed)) {
        return "Address allows letters, numbers, space, / and comma only.";
      }
      return "";
    }

    return "";
  };

  const getValidationErrors = (currentForm: OrganizationForm) => {
    const nextErrors: Record<string, string> = {};
    (Object.keys(currentForm) as (keyof OrganizationForm)[]).forEach((field) => {
      const message = validateField(field, currentForm[field], currentForm);
      if (message) {
        nextErrors[field] = message;
      }
    });
    return nextErrors;
  };

  const validateForm = (currentForm: OrganizationForm) => {
    const nextErrors = getValidationErrors(currentForm);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateEditForm = (currentForm: OrganizationForm) => {
    const nextErrors = getValidationErrors(currentForm);
    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (
    field: keyof OrganizationForm,
    value: string | ((previous: OrganizationForm) => string)
  ) => {
    setForm((prev) => {
      const nextValue = typeof value === "function" ? value(prev) : value;
      const nextForm = { ...prev, [field]: nextValue };

      if (errors[field]) {
        const message = validateField(field, String(nextValue), nextForm);
        setErrors((prevErrors) => {
          if (message) {
            return { ...prevErrors, [field]: message };
          }
          const { [field]: _, ...rest } = prevErrors;
          return rest;
        });
      }

      return nextForm;
    });
  };

  const handleFieldBlur = (field: keyof OrganizationForm) => {
    const message = validateField(field, form[field], form);
    setErrors((prevErrors) => {
      if (message) {
        return { ...prevErrors, [field]: message };
      }
      const { [field]: _, ...rest } = prevErrors;
      return rest;
    });
  };

  const handleEditFieldChange = (
    field: keyof OrganizationForm,
    value: string | ((previous: OrganizationForm) => string)
  ) => {
    setEditForm((prev) => {
      const nextValue = typeof value === "function" ? value(prev) : value;
      const nextForm = { ...prev, [field]: nextValue };

      if (editErrors[field]) {
        const message = validateField(field, String(nextValue), nextForm);
        setEditErrors((prevErrors) => {
          if (message) {
            return { ...prevErrors, [field]: message };
          }
          const { [field]: _, ...rest } = prevErrors;
          return rest;
        });
      }

      return nextForm;
    });
  };

  const handleEditFieldBlur = (field: keyof OrganizationForm) => {
    const message = validateField(field, editForm[field], editForm);
    setEditErrors((prevErrors) => {
      if (message) {
        return { ...prevErrors, [field]: message };
      }
      const { [field]: _, ...rest } = prevErrors;
      return rest;
    });
  };

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await getMyRestaurants(0, 200);
      setOrganizations(extractRestaurants(response));
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Failed to Load Restaurants",
        description: error?.message || "Could not fetch restaurants.",
      });
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleCreateOrganization = async () => {
    if (!validateForm(form)) {
      addToast({
        type: "warning",
        title: "Validation Failed",
        description: "Please fix the highlighted fields and try again.",
      });
      return;
    }

    const slug = toSlug(form.name);
    if (!slug) {
      addToast({
        type: "warning",
        title: "Invalid Slug",
        description: "Please enter a valid name or slug.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createRestaurant({
        name: form.name.trim(),
        business_name: form.name.trim(),
        slug,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        country: form.country.trim() || undefined,
        status: "active",
      });

      addToast({
        type: "success",
        title: "Restaurant Created",
        description: `${form.name.trim()} has been created.`,
      });

      setOpenCreateDialog(false);
      resetCreateForm();
      await loadOrganizations();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Creation Failed",
        description: error?.message || "Unable to create restaurant.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditOrganization = (organization: Restaurant) => {
    setEditingOrganization(organization);
    setEditForm({
      name: organization.name || "",
      email: organization.email || "",
      phone: organization.phone || "",
      address: organization.address || "",
      city: organization.city || "",
      state: organization.state || "",
      postal_code: organization.postal_code || "",
      country: organization.country || "",
      status: organization.status === "inactive" ? "inactive" : "active",
    });
    setEditErrors({});
    setOpenEditDialog(true);
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrganization) return;

    if (!validateEditForm(editForm)) {
      addToast({
        type: "warning",
        title: "Validation Failed",
        description: "Please fix the highlighted fields and try again.",
      });
      return;
    }

    const slug = toSlug(editForm.name);
    if (!slug) {
      addToast({
        type: "warning",
        title: "Invalid Name",
        description: "Restaurant name should generate a valid slug.",
      });
      return;
    }

    setIsEditSubmitting(true);
    try {
      const updatePayload: any = {
        name: editForm.name.trim(),
        business_name: editForm.name.trim(),
        slug,
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        address: editForm.address.trim() || undefined,
        city: editForm.city.trim() || undefined,
        state: editForm.state.trim() || undefined,
        postal_code: editForm.postal_code.trim() || undefined,
        country: editForm.country.trim() || undefined,
        status: editForm.status,
        is_active: editForm.status === "active",
        active: editForm.status === "active",
      };

      try {
        await patchRestaurant(editingOrganization.id, updatePayload);
      } catch {
        await updateRestaurant(editingOrganization.id, updatePayload);
      }

      const refreshedResponse = await getRestaurantById(editingOrganization.id);
      const refreshed = (refreshedResponse as any)?.data ?? refreshedResponse;
      const refreshedName = String(
        refreshed?.name || refreshed?.business_name || "",
      ).trim();
      const expectedName = editForm.name.trim();
      const normalizedExpected = expectedName.toLowerCase();
      const normalizedRefreshed = refreshedName.toLowerCase();

      if (normalizedRefreshed && normalizedRefreshed !== normalizedExpected) {
        addToast({
          type: "warning",
          title: "Name Not Updated by API",
          description:
            "Restaurant update response did not persist the new name. Please verify backend update rules.",
        });
      }

      // Update local state immediately so status reflects without waiting for backend normalization.
      setOrganizations((prev) =>
        prev.map((restaurant) =>
          restaurant.id === editingOrganization.id
            ? {
                ...restaurant,
                name: editForm.name.trim(),
                email: editForm.email.trim() || undefined,
                phone: editForm.phone.trim() || undefined,
                address: editForm.address.trim() || undefined,
                city: editForm.city.trim() || undefined,
                state: editForm.state.trim() || undefined,
                postal_code: editForm.postal_code.trim() || undefined,
                country: editForm.country.trim() || undefined,
                status: editForm.status,
              }
            : restaurant,
        ),
      );

      addToast({
        type: "success",
        title: "Restaurant Updated",
        description: `${editForm.name.trim()} has been updated.`,
      });
      setOpenEditDialog(false);
      setEditingOrganization(null);
      await loadOrganizations();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Update Failed",
        description: error?.message || "Unable to update restaurant.",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleToggleRestaurantStatus = async (restaurant: Restaurant, active: boolean) => {
    const nextStatus: "active" | "inactive" = active ? "active" : "inactive";
    const previousStatus = normalizeRestaurantStatus(restaurant);

    setStatusUpdatingId(restaurant.id);
    setOrganizations((prev) =>
      prev.map((item) =>
        item.id === restaurant.id
          ? {
              ...item,
              status: nextStatus,
            }
          : item,
      ),
    );

    try {
      const payload: any = {
        name: restaurant.name,
        business_name: (restaurant as any).business_name || restaurant.name,
        slug: restaurant.slug || toSlug(restaurant.name),
        status: nextStatus,
        is_active: nextStatus === "active",
        active: nextStatus === "active",
      };

      try {
        await updateRestaurant(restaurant.id, payload);
      } catch {
        await patchRestaurant(restaurant.id, payload);
      }

      addToast({
        type: "success",
        title: "Status Updated",
        description: `${restaurant.name} is now ${nextStatus}.`,
      });
    } catch (error: any) {
      setOrganizations((prev) =>
        prev.map((item) =>
          item.id === restaurant.id
            ? {
                ...item,
                status: previousStatus,
              }
            : item,
        ),
      );
      addToast({
        type: "error",
        title: "Status Update Failed",
        description: error?.message || "Unable to update restaurant status.",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleRequestRestaurantStatusChange = (restaurant: Restaurant, active: boolean) => {
    if (statusUpdatingId === restaurant.id) return;
    const currentStatus = normalizeRestaurantStatus(restaurant);
    const nextStatus: "active" | "inactive" = active ? "active" : "inactive";
    if (currentStatus === nextStatus) return;
    setPendingStatusChange({ restaurant, active });
  };

  const activeCount = organizations.filter((org) => org.status === "active").length;
  const locationCount = new Set(
    organizations
      .map((org) => `${org.city || ""}-${org.state || ""}-${org.country || ""}`)
      .filter((value) => value !== "--")
  ).size;
  const filteredOrganizations = organizations.filter((org) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      org.name?.toLowerCase().includes(query) ||
      org.email?.toLowerCase().includes(query) ||
      org.city?.toLowerCase().includes(query) ||
      org.state?.toLowerCase().includes(query) ||
      org.country?.toLowerCase().includes(query) ||
      org.phone?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const pagedOrganizations = filteredOrganizations.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Restaurant Management
          </h1>
          <p className="text-muted-foreground">
            Manage all restaurants and their details
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog
            open={openCreateDialog}
            onOpenChange={(nextOpen) => {
              setOpenCreateDialog(nextOpen);
              if (nextOpen) resetCreateForm();
              else setErrors({});
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" onClick={resetCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Restaurant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Create New Restaurant</DialogTitle>
                <DialogDescription>
                  This creates a new restaurant entity for your platform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="org-name">Restaurant Name *</Label>
                  <Input
                    id="org-name"
                    value={form.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    placeholder="Bestwave Restaurant"
                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    placeholder="manager@restaurant.com"
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone</Label>
                  <Input
                    id="org-phone"
                    value={form.phone}
                    onChange={(e) =>
                      handleFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    onBlur={() => handleFieldBlur("phone")}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="org-address">Address</Label>
                  <Input
                    id="org-address"
                    value={form.address}
                    onChange={(e) => handleFieldChange("address", sanitizeAddress(e.target.value))}
                    onBlur={() => handleFieldBlur("address")}
                    placeholder="Street, Area"
                    className={errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500">{errors.address}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-city">City</Label>
                  <Input
                    id="org-city"
                    value={form.city}
                    onChange={(e) => handleFieldChange("city", sanitizeAlphaSpaces(e.target.value))}
                    onBlur={() => handleFieldBlur("city")}
                    placeholder="Bengaluru"
                    className={errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-state">State</Label>
                  <Input
                    id="org-state"
                    value={form.state}
                    onChange={(e) =>
                      handleFieldChange("state", sanitizeAlphaSpaces(e.target.value))
                    }
                    onBlur={() => handleFieldBlur("state")}
                    placeholder="Karnataka"
                    className={errors.state ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.state && (
                    <p className="text-xs text-red-500">{errors.state}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-postal">Postal Code</Label>
                  <Input
                    id="org-postal"
                    value={form.postal_code}
                    onChange={(e) =>
                      handleFieldChange(
                        "postal_code",
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    onBlur={() => handleFieldBlur("postal_code")}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="600001"
                    className={errors.postal_code ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.postal_code && (
                    <p className="text-xs text-red-500">{errors.postal_code}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-country">Country</Label>
                  <Input
                    id="org-country"
                    value={form.country}
                    onChange={(e) =>
                      handleFieldChange("country", sanitizeAlphaSpaces(e.target.value))
                    }
                    onBlur={() => handleFieldBlur("country")}
                    placeholder="India"
                    className={errors.country ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.country && (
                    <p className="text-xs text-red-500">{errors.country}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenCreateDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Restaurant"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={openEditDialog}
            onOpenChange={(nextOpen) => {
              setOpenEditDialog(nextOpen);
              if (!nextOpen) {
                setEditingOrganization(null);
                setEditErrors({});
              }
            }}
          >
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Edit Restaurant</DialogTitle>
                <DialogDescription>
                  Update restaurant details and save changes.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="edit-org-name">Restaurant Name *</Label>
                  <Input
                    id="edit-org-name"
                    value={editForm.name}
                    onChange={(e) => handleEditFieldChange("name", e.target.value)}
                    onBlur={() => handleEditFieldBlur("name")}
                    placeholder="Bestwave Restaurant"
                    className={editErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.name && <p className="text-xs text-red-500">{editErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-email">Email</Label>
                  <Input
                    id="edit-org-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditFieldChange("email", e.target.value)}
                    onBlur={() => handleEditFieldBlur("email")}
                    placeholder="manager@restaurant.com"
                    className={editErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.email && <p className="text-xs text-red-500">{editErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-phone">Phone</Label>
                  <Input
                    id="edit-org-phone"
                    value={editForm.phone}
                    onChange={(e) =>
                      handleEditFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    onBlur={() => handleEditFieldBlur("phone")}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    className={editErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.phone && <p className="text-xs text-red-500">{editErrors.phone}</p>}
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="edit-org-address">Address</Label>
                  <Input
                    id="edit-org-address"
                    value={editForm.address}
                    onChange={(e) => handleEditFieldChange("address", sanitizeAddress(e.target.value))}
                    onBlur={() => handleEditFieldBlur("address")}
                    placeholder="Street, Area"
                    className={editErrors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.address && <p className="text-xs text-red-500">{editErrors.address}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-city">City</Label>
                  <Input
                    id="edit-org-city"
                    value={editForm.city}
                    onChange={(e) => handleEditFieldChange("city", sanitizeAlphaSpaces(e.target.value))}
                    onBlur={() => handleEditFieldBlur("city")}
                    placeholder="Bengaluru"
                    className={editErrors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.city && <p className="text-xs text-red-500">{editErrors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-state">State</Label>
                  <Input
                    id="edit-org-state"
                    value={editForm.state}
                    onChange={(e) =>
                      handleEditFieldChange("state", sanitizeAlphaSpaces(e.target.value))
                    }
                    onBlur={() => handleEditFieldBlur("state")}
                    placeholder="Karnataka"
                    className={editErrors.state ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.state && <p className="text-xs text-red-500">{editErrors.state}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-postal">Postal Code</Label>
                  <Input
                    id="edit-org-postal"
                    value={editForm.postal_code}
                    onChange={(e) =>
                      handleEditFieldChange("postal_code", e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    onBlur={() => handleEditFieldBlur("postal_code")}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="600001"
                    className={editErrors.postal_code ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.postal_code && <p className="text-xs text-red-500">{editErrors.postal_code}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-country">Country</Label>
                  <Input
                    id="edit-org-country"
                    value={editForm.country}
                    onChange={(e) =>
                      handleEditFieldChange("country", sanitizeAlphaSpaces(e.target.value))
                    }
                    onBlur={() => handleEditFieldBlur("country")}
                    placeholder="India"
                    className={editErrors.country ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.country && <p className="text-xs text-red-500">{editErrors.country}</p>}
                </div>
                <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="edit-org-status">Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle restaurant active state
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {editForm.status === "active" ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      id="edit-org-status"
                      checked={editForm.status === "active"}
                      onCheckedChange={(checked) =>
                        handleEditFieldChange("status", checked ? "active" : "inactive")
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenEditDialog(false)}
                  disabled={isEditSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateOrganization} disabled={isEditSubmitting}>
                  {isEditSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{organizations.length}</p>
                <p className="text-sm text-muted-foreground">Restaurants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{locationCount}</p>
                <p className="text-sm text-muted-foreground">Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {organizations.length > 0 ? "Live" : "--"}
                </p>
                <p className="text-sm text-muted-foreground">Data Source</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restaurants List */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurants</CardTitle>
          <CardDescription>
            Manage all restaurant entities and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading restaurants...</div>
          ) : organizations.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No restaurants found. Click <strong>New Restaurant</strong> to create one.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone, or location"
                  className="md:max-w-sm"
                />
                <div className="flex items-center gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "all" | "active" | "inactive")
                    }
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                  </select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedOrganizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No results found for current search/filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedOrganizations.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>{org.email || org.phone || "N/A"}</TableCell>
                          <TableCell>
                            {[
                              org.address,
                              org.city,
                              org.state,
                              org.country,
                              org.postal_code,
                            ]
                              .filter(Boolean)
                              .join(", ") || "N/A"}
                          </TableCell>
                          <TableCell>
                            {org.created_at ? new Date(org.created_at).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Restaurant"
                                onClick={() => openEditOrganization(org)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={normalizeRestaurantStatus(org) === "active"}
                              onCheckedChange={(checked) =>
                                handleRequestRestaurantStatusChange(org, checked)
                              }
                              disabled={statusUpdatingId === org.id}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredOrganizations.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(startIndex + pageSize, filteredOrganizations.length)} of{" "}
                  {filteredOrganizations.length} restaurants
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPageSafe <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPageSafe} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPageSafe >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingStatusChange}
        onOpenChange={(open) => {
          if (!open) setPendingStatusChange(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Restaurant Status?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange
                ? `Are you sure you want to set ${pendingStatusChange.restaurant.name} as ${
                    pendingStatusChange.active ? "Active" : "Inactive"
                  }?`
                : "Confirm status change."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!pendingStatusChange) return;
                const target = pendingStatusChange;
                setPendingStatusChange(null);
                await handleToggleRestaurantStatus(target.restaurant, target.active);
              }}
            >
              {pendingStatusChange?.active ? "Set Active" : "Set Inactive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
