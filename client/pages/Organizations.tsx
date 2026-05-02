import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Activity,
  Building2,
  Calendar,
  Eye,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
} from "lucide-react";
import {
  createRestaurant,
  getRestaurantById,
  getMyRestaurants,
  uploadFile,
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

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
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

type OrganizationEditForm = OrganizationForm & {
  business_name: string;
  description: string;
  logo: string | File;
  banner_image: string | File;
  primary_color: string;
  accent_color: string;
  gstin: string;
  fssai_license: string;
  enable_gst: boolean;
  cgst_rate: string;
  sgst_rate: string;
  service_charge_percentage: string;
  opening_time: string;
  closing_time: string;
  is_24_hours: boolean;
  holiday_mode: boolean;
  timezone: string;
  currency: string;
  enable_online_ordering: boolean;
  enable_dine_in: boolean;
  enable_takeaway: boolean;
  enable_delivery: boolean;
  delivery_radius: string;
  minimum_order_value: string;
  enable_kot: boolean;
  enable_kds: boolean;
  auto_accept_orders: boolean;
  preparation_time_buffer: string;
  receipt_header: string;
  receipt_footer: string;
  alternate_phone: string;
  invoice_prefix: string;
};

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
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
  const [viewingOrganization, setViewingOrganization] = useState<any | null>(null);
  const [viewingOrganizationFallbackStatus, setViewingOrganizationFallbackStatus] = useState<
    "active" | "inactive"
  >("inactive");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
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
  const initialEditForm: OrganizationEditForm = {
    ...initialForm,
    business_name: "",
    description: "",
    logo: "",
    banner_image: "",
    primary_color: "",
    accent_color: "",
    gstin: "",
    fssai_license: "",
    enable_gst: false,
    cgst_rate: "",
    sgst_rate: "",
    service_charge_percentage: "",
    opening_time: "",
    closing_time: "",
    is_24_hours: false,
    holiday_mode: false,
    timezone: "",
    currency: "",
    enable_online_ordering: false,
    enable_dine_in: true,
    enable_takeaway: true,
    enable_delivery: true,
    delivery_radius: "",
    minimum_order_value: "",
    enable_kot: false,
    enable_kds: false,
    auto_accept_orders: false,
    preparation_time_buffer: "",
    receipt_header: "",
    receipt_footer: "",
    alternate_phone: "",
    invoice_prefix: "",
  };

  const resetCreateForm = () => {
    setForm(initialForm);
    setErrors({});
  };

  const [editForm, setEditForm] = useState<OrganizationEditForm>(initialEditForm);

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

  const getImageDisplayName = (value: string | File) => {
    if (value instanceof File) return value.name;
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname || "";
      const filename = pathname.split("/").filter(Boolean).pop() || "";
      return filename || trimmed;
    } catch {
      const filename = trimmed.split("/").filter(Boolean).pop() || "";
      return filename || trimmed;
    }
  };

  const isValidHttpUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    try {
      const url = new URL(trimmed);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const isValidHexColor = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(trimmed);
  };

  const isValidTimeHHMM = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed);
  };

  const isValidFloat = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^\d+(\.\d+)?$/.test(trimmed);
  };

  const sanitizeUnsignedDecimal = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const [whole = "", ...rest] = cleaned.split(".");
    const decimals = rest.join("");
    return decimals ? `${whole}.${decimals}` : whole;
  };

  const isValidNonNegativeFloat = (value: string) => {
    if (!isValidFloat(value)) return false;
    const trimmed = value.trim();
    if (!trimmed) return true;
    return Number(trimmed) >= 0;
  };

  const isValidPercentage = (value: string) => {
    if (!isValidNonNegativeFloat(value)) return false;
    const trimmed = value.trim();
    if (!trimmed) return true;
    const numeric = Number(trimmed);
    return numeric >= 0 && numeric <= 100;
  };

  const isValidIanaTimezone = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[A-Za-z_]+\/[A-Za-z0-9_\-+]+$/.test(trimmed);
  };

  const isValidCurrencyCode = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[A-Z]{3}$/.test(trimmed);
  };

  const isValidGstin = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
      trimmed.toUpperCase(),
    );
  };

  const isValidFssai = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[0-9]{14}$/.test(trimmed);
  };

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

  const validateEditField = (
    field: keyof OrganizationEditForm,
    value: OrganizationEditForm[keyof OrganizationEditForm],
    currentForm: OrganizationEditForm,
  ): string => {
    if (field in initialForm) {
      return validateField(field as keyof OrganizationForm, String(value ?? ""), currentForm);
    }

    if (typeof value === "boolean") {
      return "";
    }

    if (value instanceof File) {
      if (field !== "logo" && field !== "banner_image") return "";
      if (!value.type?.startsWith("image/")) return "Please select an image file.";
      if (value.size > MAX_IMAGE_BYTES) return "Image must be 2MB or less.";
      return "";
    }

    const trimmed = String(value ?? "").trim();

    if (field === "business_name") {
      if (!trimmed) return "Business name is required.";
      if (trimmed.length < 3) return "Business name must be at least 3 characters.";
      return "";
    }

    if (field === "description") {
      if (trimmed && trimmed.length > 500) return "Description must be 500 characters or less.";
      return "";
    }

    if (field === "logo") {
      if (!isValidHttpUrl(trimmed)) return "Logo must be a valid http(s) URL.";
      return "";
    }

    if (field === "banner_image") {
      if (!isValidHttpUrl(trimmed)) return "Banner Image must be a valid http(s) URL.";
      return "";
    }

    if (field === "primary_color") {
      if (!isValidHexColor(trimmed)) return "Primary color must be a hex code like #FF5733.";
      return "";
    }

    if (field === "accent_color") {
      if (!isValidHexColor(trimmed)) return "Accent color must be a hex code like #FF5733.";
      return "";
    }

    if (field === "gstin") {
      if (currentForm.enable_gst && !trimmed) return "GSTIN is required when GST is enabled.";
      if (!isValidGstin(trimmed)) return "GSTIN format is invalid.";
      return "";
    }

    if (field === "fssai_license") {
      if (!isValidFssai(trimmed)) return "FSSAI License must be exactly 14 digits.";
      return "";
    }

    if (field === "alternate_phone") {
      if (trimmed && !/^[0-9]{10}$/.test(trimmed)) {
        return "Alternate phone must be exactly 10 digits.";
      }
      return "";
    }

    if (field === "cgst_rate" || field === "sgst_rate") {
      if (currentForm.enable_gst && !trimmed) return "This rate is required when GST is enabled.";
      if (!isValidPercentage(trimmed)) return "Rate must be a number between 0 and 100.";
      return "";
    }

    if (field === "service_charge_percentage") {
      if (!isValidPercentage(trimmed)) return "Service charge must be a number between 0 and 100.";
      return "";
    }

    if (field === "opening_time") {
      if (!currentForm.is_24_hours && !trimmed) return "Opening time is required unless 24 hours.";
      if (!isValidTimeHHMM(trimmed)) return "Opening time must be in HH:MM (24h) format.";
      return "";
    }

    if (field === "closing_time") {
      if (!currentForm.is_24_hours && !trimmed) return "Closing time is required unless 24 hours.";
      if (!isValidTimeHHMM(trimmed)) return "Closing time must be in HH:MM (24h) format.";
      return "";
    }

    if (field === "timezone") {
      if (!isValidIanaTimezone(trimmed)) return "Timezone should look like Asia/Kolkata.";
      return "";
    }

    if (field === "currency") {
      if (!isValidCurrencyCode(trimmed)) return "Currency should be a 3-letter code like INR.";
      return "";
    }

    if (field === "delivery_radius") {
      if (!isValidNonNegativeFloat(trimmed)) return "Delivery radius must be a non-negative number.";
      return "";
    }

    if (field === "minimum_order_value") {
      if (!isValidNonNegativeFloat(trimmed)) return "Minimum order value must be a non-negative number.";
      return "";
    }

    if (field === "preparation_time_buffer") {
      if (trimmed && !/^\d+$/.test(trimmed)) return "Preparation time buffer must be a whole number.";
      return "";
    }

    if (field === "receipt_header" || field === "receipt_footer") {
      if (trimmed && trimmed.length > 200) return "Receipt text must be 200 characters or less.";
      return "";
    }

    if (field === "invoice_prefix") {
      if (trimmed && trimmed.length > 10) return "Invoice prefix must be 10 characters or less.";
      return "";
    }

    return "";
  };

  const getCreateValidationErrors = (currentForm: OrganizationForm) => {
    const nextErrors: Record<string, string> = {};
    (Object.keys(currentForm) as (keyof OrganizationForm)[]).forEach((field) => {
      const message = validateField(field, currentForm[field], currentForm);
      if (message) {
        nextErrors[field] = message;
      }
    });
    return nextErrors;
  };

  const getEditValidationErrors = (currentForm: OrganizationEditForm) => {
    const visibleFields: (keyof OrganizationEditForm)[] = [
      "name",
      "business_name",
      "description",
      "logo",
      "banner_image",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "postal_code",
      "country",
      "gstin",
      "enable_gst",
      "cgst_rate",
      "sgst_rate",
      "service_charge_percentage",
      "opening_time",
      "closing_time",
      "is_24_hours",
      "holiday_mode",
      "enable_online_ordering",
      "enable_dine_in",
      "enable_takeaway",
      "enable_delivery",
      "delivery_radius",
      "minimum_order_value",
      "enable_kot",
      "enable_kds",
      "auto_accept_orders",
      "preparation_time_buffer",
      "receipt_header",
      "receipt_footer",
      "status",
    ];
    const nextErrors: Record<string, string> = {};
    visibleFields.forEach((field) => {
      const message = validateEditField(field, currentForm[field], currentForm);
      if (message) {
        nextErrors[field] = message;
      }
    });
    return nextErrors;
  };

  const validateForm = (currentForm: OrganizationForm) => {
    const nextErrors = getCreateValidationErrors(currentForm);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateEditForm = (currentForm: OrganizationEditForm) => {
    const nextErrors = getEditValidationErrors(currentForm);
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

  const handleEditFieldChange = (field: keyof OrganizationEditForm, value: any) => {
    setEditForm((prev) => {
      const nextValue = typeof value === "function" ? value(prev) : value;
      const nextForm = { ...prev, [field]: nextValue };

      if (editErrors[field]) {
        const message = validateEditField(field, nextValue, nextForm);
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

  const handleEditFieldBlur = (field: keyof OrganizationEditForm) => {
    const message = validateEditField(field, editForm[field], editForm);
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
      ...initialEditForm,
      name: organization.name || "",
      business_name: (organization as any).business_name || organization.name || "",
      description: String((organization as any).description ?? ""),
      email: organization.email || "",
      phone: organization.phone || "",
      alternate_phone: String((organization as any).alternate_phone ?? ""),
      address: organization.address || "",
      city: organization.city || "",
      state: organization.state || "",
      postal_code: organization.postal_code || "",
      country: organization.country || "",
      logo: String((organization as any).logo ?? (organization as any).logo_url ?? ""),
      banner_image: String(
        (organization as any).banner_image ?? (organization as any).banner_url ?? "",
      ),
      primary_color: String((organization as any).primary_color ?? ""),
      accent_color: String((organization as any).accent_color ?? ""),
      gstin: String((organization as any).gstin ?? ""),
      fssai_license: String((organization as any).fssai_license ?? ""),
      enable_gst: Boolean((organization as any).enable_gst ?? false),
      cgst_rate: String((organization as any).cgst_rate ?? ""),
      sgst_rate: String((organization as any).sgst_rate ?? ""),
      service_charge_percentage: String((organization as any).service_charge_percentage ?? ""),
      opening_time: String((organization as any).opening_time ?? ""),
      closing_time: String((organization as any).closing_time ?? ""),
      is_24_hours: Boolean((organization as any).is_24_hours ?? false),
      holiday_mode: Boolean((organization as any).holiday_mode ?? false),
      timezone: String((organization as any).timezone ?? ""),
      currency: String((organization as any).currency ?? ""),
      enable_online_ordering: Boolean((organization as any).enable_online_ordering ?? false),
      enable_dine_in: Boolean((organization as any).enable_dine_in ?? true),
      enable_takeaway: Boolean((organization as any).enable_takeaway ?? true),
      enable_delivery: Boolean((organization as any).enable_delivery ?? true),
      delivery_radius: String((organization as any).delivery_radius ?? ""),
      minimum_order_value: String((organization as any).minimum_order_value ?? ""),
      enable_kot: Boolean((organization as any).enable_kot ?? false),
      enable_kds: Boolean((organization as any).enable_kds ?? false),
      auto_accept_orders: Boolean((organization as any).auto_accept_orders ?? false),
      preparation_time_buffer: String((organization as any).preparation_time_buffer ?? ""),
      receipt_header: String((organization as any).receipt_header ?? ""),
      receipt_footer: String((organization as any).receipt_footer ?? ""),
      invoice_prefix: String((organization as any).invoice_prefix ?? ""),
      status: organization.status === "inactive" ? "inactive" : "active",
    });
    setEditErrors({});
    setOpenEditDialog(true);
  };

  const openViewOrganization = async (organization: Restaurant) => {
    const fallbackStatus = normalizeRestaurantStatus(organization);
    setOpenViewDialog(true);
    setIsViewLoading(true);
    setViewingOrganization(null);
    setViewingOrganizationFallbackStatus(fallbackStatus);
    try {
      const response = await getRestaurantById(organization.id);
      const restaurant = (response as any)?.data ?? response;
      // Backend `GET /restaurants/{id}` may not include a dedicated status field.
      // Always prefer the status already shown in the table list to avoid mismatches.
      setViewingOrganization({ ...restaurant, status: fallbackStatus });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Failed to Load Restaurant",
        description: error?.message || "Unable to fetch restaurant details.",
      });
      setOpenViewDialog(false);
    } finally {
      setIsViewLoading(false);
    }
  };

  const formatDateTime = (value: any) => {
    if (!value) return "";
    const raw = String(value);
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString();
  };

  const formatViewValue = (value: any): string => {
    if (value === undefined || value === null || value === "") return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "N/A";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const isHttpUrl = (value: any) => {
    if (!value || typeof value !== "string") return false;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
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
      let logoValue = typeof editForm.logo === "string" ? editForm.logo.trim() : "";
      let bannerValue =
        typeof editForm.banner_image === "string" ? editForm.banner_image.trim() : "";

      if (editForm.logo instanceof File) {
        const response = await uploadFile(editForm.logo);
        const data = (response as any)?.data ?? response;
        logoValue = String(data?.url || "").trim();
        if (!logoValue) {
          throw new Error("Logo upload did not return a URL.");
        }
      }

      if (editForm.banner_image instanceof File) {
        const response = await uploadFile(editForm.banner_image);
        const data = (response as any)?.data ?? response;
        bannerValue = String(data?.url || "").trim();
        if (!bannerValue) {
          throw new Error("Banner upload did not return a URL.");
        }
      }

      const updatePayload: any = {
        name: editForm.name.trim(),
        business_name: editForm.business_name.trim() || editForm.name.trim(),
        slug,
        description: editForm.description.trim() || undefined,
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        alternate_phone: editForm.alternate_phone.trim() || undefined,
        address: editForm.address.trim() || undefined,
        city: editForm.city.trim() || undefined,
        state: editForm.state.trim() || undefined,
        postal_code: editForm.postal_code.trim() || undefined,
        country: editForm.country.trim() || undefined,
        ...(logoValue
          ? {
              logo: logoValue,
            }
          : {}),
        ...(bannerValue
          ? {
              banner_image: bannerValue,
            }
          : {}),
        gstin: editForm.gstin.trim() ? editForm.gstin.trim().toUpperCase() : undefined,
        fssai_license: editForm.fssai_license.trim() || undefined,
        enable_gst: editForm.enable_gst,
        cgst_rate:
          editForm.enable_gst && editForm.cgst_rate.trim()
            ? Number(editForm.cgst_rate.trim())
            : undefined,
        sgst_rate:
          editForm.enable_gst && editForm.sgst_rate.trim()
            ? Number(editForm.sgst_rate.trim())
            : undefined,
        service_charge_percentage: editForm.service_charge_percentage.trim()
          ? Number(editForm.service_charge_percentage.trim())
          : undefined,
        opening_time: editForm.is_24_hours ? undefined : editForm.opening_time.trim() || undefined,
        closing_time: editForm.is_24_hours ? undefined : editForm.closing_time.trim() || undefined,
        is_24_hours: editForm.is_24_hours,
        holiday_mode: editForm.holiday_mode,
        enable_online_ordering: editForm.enable_online_ordering,
        enable_dine_in: editForm.enable_dine_in,
        enable_takeaway: editForm.enable_takeaway,
        enable_delivery: editForm.enable_delivery,
        delivery_radius: editForm.delivery_radius.trim()
          ? Number(editForm.delivery_radius.trim())
          : undefined,
        minimum_order_value: editForm.minimum_order_value.trim()
          ? Number(editForm.minimum_order_value.trim())
          : undefined,
        enable_kot: editForm.enable_kot,
        enable_kds: editForm.enable_kds,
        auto_accept_orders: editForm.auto_accept_orders,
        preparation_time_buffer: editForm.preparation_time_buffer.trim()
          ? Number.parseInt(editForm.preparation_time_buffer.trim(), 10)
          : undefined,
        receipt_header: editForm.receipt_header.trim() || undefined,
        receipt_footer: editForm.receipt_footer.trim() || undefined,
        invoice_prefix: editForm.invoice_prefix.trim() || undefined,
        status: editForm.status,
        is_active: editForm.status === "active",
        active: editForm.status === "active",
      };

      await updateRestaurant(editingOrganization.id, updatePayload);

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
                business_name: editForm.business_name.trim() || editForm.name.trim(),
                email: editForm.email.trim() || undefined,
                phone: editForm.phone.trim() || undefined,
                address: editForm.address.trim() || undefined,
                city: editForm.city.trim() || undefined,
                state: editForm.state.trim() || undefined,
                postal_code: editForm.postal_code.trim() || undefined,
                country: editForm.country.trim() || undefined,
                ...(logoValue ? { logo_url: logoValue } : {}),
                ...(bannerValue ? { banner_url: bannerValue } : {}),
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

      await updateRestaurant(restaurant.id, payload);

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
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Restaurant</DialogTitle>
                <DialogDescription>
                  Update restaurant details and save changes.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="edit-org-business-name">Business Name *</Label>
                    <Input
                      id="edit-org-business-name"
                      value={editForm.business_name}
                      onChange={(e) => handleEditFieldChange("business_name", e.target.value)}
                      onBlur={() => handleEditFieldBlur("business_name")}
                      placeholder="Bestwave Innovations Pvt Ltd"
                      className={
                        editErrors.business_name ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.business_name && (
                      <p className="text-xs text-red-500">{editErrors.business_name}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="edit-org-description">Description</Label>
                    <Textarea
                      id="edit-org-description"
                      value={editForm.description}
                      onChange={(e) => handleEditFieldChange("description", e.target.value)}
                      onBlur={() => handleEditFieldBlur("description")}
                      placeholder="Short bio about the restaurant..."
                      className={
                        editErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.description && (
                      <p className="text-xs text-red-500">{editErrors.description}</p>
                    )}
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
                        handleEditFieldChange(
                          "phone",
                          sanitizeDigits(e.target.value).slice(0, 10),
                        )
                      }
                      onBlur={() => handleEditFieldBlur("phone")}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      className={editErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {editErrors.phone && <p className="text-xs text-red-500">{editErrors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-alt-phone">Alternate Phone</Label>
                    <Input
                      id="edit-org-alt-phone"
                      value={editForm.alternate_phone}
                      onChange={(e) =>
                        handleEditFieldChange(
                          "alternate_phone",
                          sanitizeDigits(e.target.value).slice(0, 10),
                        )
                      }
                      onBlur={() => handleEditFieldBlur("alternate_phone")}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      className={
                        editErrors.alternate_phone
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {editErrors.alternate_phone && (
                      <p className="text-xs text-red-500">{editErrors.alternate_phone}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="edit-org-address">Address</Label>
                    <Input
                      id="edit-org-address"
                      value={editForm.address}
                      onChange={(e) =>
                        handleEditFieldChange("address", sanitizeAddress(e.target.value))
                      }
                      onBlur={() => handleEditFieldBlur("address")}
                      placeholder="Street, Area"
                      className={editErrors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {editErrors.address && (
                      <p className="text-xs text-red-500">{editErrors.address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-city">City</Label>
                    <Input
                      id="edit-org-city"
                      value={editForm.city}
                      onChange={(e) =>
                        handleEditFieldChange("city", sanitizeAlphaSpaces(e.target.value))
                      }
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
                        handleEditFieldChange(
                          "postal_code",
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      onBlur={() => handleEditFieldBlur("postal_code")}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="600001"
                      className={
                        editErrors.postal_code ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.postal_code && (
                      <p className="text-xs text-red-500">{editErrors.postal_code}</p>
                    )}
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
                    {editErrors.country && (
                      <p className="text-xs text-red-500">{editErrors.country}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <p className="text-sm font-semibold text-foreground">Branding</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-logo">Logo (Upload)</Label>
                    <div
                      className={[
                        "flex items-center gap-3 rounded-md border p-3",
                        editErrors.logo ? "border-red-500" : "",
                      ].join(" ")}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-md border bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => logoInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate">
                            {getImageDisplayName(editForm.logo) || "No file chosen"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Upload an icon image (max 2MB).
                        </p>
                        <input
                          ref={logoInputRef}
                          id="edit-org-logo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            let message = "";
                            if (!file.type?.startsWith("image/")) {
                              message = "Please select an image file.";
                            } else if (file.size > MAX_IMAGE_BYTES) {
                              message = "Image must be 2MB or less.";
                            }
                            if (message) {
                              setEditErrors((prev) => ({ ...prev, logo: message }));
                              return;
                            }
                            setEditErrors((prev) => {
                              const { logo: _, ...rest } = prev;
                              return rest;
                            });
                            handleEditFieldChange("logo", file);
                          }}
                        />
                      </div>
                    </div>
                    {editErrors.logo && <p className="text-xs text-red-500">{editErrors.logo}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-banner-image">Banner Image (Upload)</Label>
                    <div
                      className={[
                        "flex items-center gap-3 rounded-md border p-3",
                        editErrors.banner_image ? "border-red-500" : "",
                      ].join(" ")}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-md border bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => bannerInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate">
                            {getImageDisplayName(editForm.banner_image) || "No file chosen"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Upload a banner image (max 2MB).
                        </p>
                        <input
                          ref={bannerInputRef}
                          id="edit-org-banner-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            let message = "";
                            if (!file.type?.startsWith("image/")) {
                              message = "Please select an image file.";
                            } else if (file.size > MAX_IMAGE_BYTES) {
                              message = "Image must be 2MB or less.";
                            }
                            if (message) {
                              setEditErrors((prev) => ({ ...prev, banner_image: message }));
                              return;
                            }
                            setEditErrors((prev) => {
                              const { banner_image: _, ...rest } = prev;
                              return rest;
                            });
                            handleEditFieldChange("banner_image", file);
                          }}
                        />
                      </div>
                    </div>
                    {editErrors.banner_image && (
                      <p className="text-xs text-red-500">{editErrors.banner_image}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <p className="text-sm font-semibold text-foreground">Legal & Tax</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-fssai">FSSAI License</Label>
                    <Input
                      id="edit-org-fssai"
                      value={editForm.fssai_license}
                      onChange={(e) =>
                        handleEditFieldChange("fssai_license", sanitizeDigits(e.target.value).slice(0, 14))
                      }
                      onBlur={() => handleEditFieldBlur("fssai_license")}
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="12345678901234"
                      className={
                        editErrors.fssai_license ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.fssai_license && (
                      <p className="text-xs text-red-500">{editErrors.fssai_license}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-enable-gst">Enable GST</Label>
                      <p className="text-xs text-muted-foreground">Toggle GST calculation</p>
                    </div>
                    <Switch
                      id="edit-org-enable-gst"
                      checked={editForm.enable_gst}
                      onCheckedChange={(checked) => handleEditFieldChange("enable_gst", checked)}
                    />
                  </div>
                  {editForm.enable_gst && (
                    <>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="edit-org-gstin">GSTIN *</Label>
                        <Input
                          id="edit-org-gstin"
                          value={editForm.gstin}
                          onChange={(e) =>
                            handleEditFieldChange("gstin", e.target.value.toUpperCase())
                          }
                          onBlur={() => handleEditFieldBlur("gstin")}
                          placeholder="29ABCDE1234F1Z5"
                          className={
                            editErrors.gstin ? "border-red-500 focus-visible:ring-red-500" : ""
                          }
                        />
                        {editErrors.gstin && (
                          <p className="text-xs text-red-500">{editErrors.gstin}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-org-cgst-rate">CGST Rate (%)</Label>
                        <Input
                          id="edit-org-cgst-rate"
                          value={editForm.cgst_rate}
                          onChange={(e) =>
                            handleEditFieldChange("cgst_rate", sanitizeUnsignedDecimal(e.target.value))
                          }
                          onBlur={() => handleEditFieldBlur("cgst_rate")}
                          inputMode="decimal"
                          placeholder="2.5"
                          className={
                            editErrors.cgst_rate ? "border-red-500 focus-visible:ring-red-500" : ""
                          }
                        />
                        {editErrors.cgst_rate && (
                          <p className="text-xs text-red-500">{editErrors.cgst_rate}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-org-sgst-rate">SGST Rate (%)</Label>
                        <Input
                          id="edit-org-sgst-rate"
                          value={editForm.sgst_rate}
                          onChange={(e) =>
                            handleEditFieldChange("sgst_rate", sanitizeUnsignedDecimal(e.target.value))
                          }
                          onBlur={() => handleEditFieldBlur("sgst_rate")}
                          inputMode="decimal"
                          placeholder="2.5"
                          className={
                            editErrors.sgst_rate ? "border-red-500 focus-visible:ring-red-500" : ""
                          }
                        />
                        {editErrors.sgst_rate && (
                          <p className="text-xs text-red-500">{editErrors.sgst_rate}</p>
                        )}
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-service-charge">Service Charge (%)</Label>
                    <Input
                      id="edit-org-service-charge"
                      value={editForm.service_charge_percentage}
                      onChange={(e) =>
                        handleEditFieldChange(
                          "service_charge_percentage",
                          sanitizeUnsignedDecimal(e.target.value),
                        )
                      }
                      onBlur={() => handleEditFieldBlur("service_charge_percentage")}
                      inputMode="decimal"
                      placeholder="5"
                      className={
                        editErrors.service_charge_percentage
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {editErrors.service_charge_percentage && (
                      <p className="text-xs text-red-500">
                        {editErrors.service_charge_percentage}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <p className="text-sm font-semibold text-foreground">Operations & Hours</p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                    <div>
                      <Label htmlFor="edit-org-24-hours">24 Hours</Label>
                      <p className="text-xs text-muted-foreground">Restaurant runs all day</p>
                    </div>
                    <Switch
                      id="edit-org-24-hours"
                      checked={editForm.is_24_hours}
                      onCheckedChange={(checked) => handleEditFieldChange("is_24_hours", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-opening">Opening Time</Label>
                    <Input
                      id="edit-org-opening"
                      type="time"
                      value={editForm.opening_time}
                      onChange={(e) => handleEditFieldChange("opening_time", e.target.value)}
                      onBlur={() => handleEditFieldBlur("opening_time")}
                      disabled={editForm.is_24_hours}
                      className={
                        editErrors.opening_time ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.opening_time && (
                      <p className="text-xs text-red-500">{editErrors.opening_time}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-closing">Closing Time</Label>
                    <Input
                      id="edit-org-closing"
                      type="time"
                      value={editForm.closing_time}
                      onChange={(e) => handleEditFieldChange("closing_time", e.target.value)}
                      onBlur={() => handleEditFieldBlur("closing_time")}
                      disabled={editForm.is_24_hours}
                      className={
                        editErrors.closing_time ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.closing_time && (
                      <p className="text-xs text-red-500">{editErrors.closing_time}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-holiday">Holiday Mode</Label>
                      <p className="text-xs text-muted-foreground">Temporarily close restaurant</p>
                    </div>
                    <Switch
                      id="edit-org-holiday"
                      checked={editForm.holiday_mode}
                      onCheckedChange={(checked) => handleEditFieldChange("holiday_mode", checked)}
                    />
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <p className="text-sm font-semibold text-foreground">Ordering & Service</p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-online-ordering">Online Ordering</Label>
                      <p className="text-xs text-muted-foreground">Enable online ordering</p>
                    </div>
                    <Switch
                      id="edit-org-online-ordering"
                      checked={editForm.enable_online_ordering}
                      onCheckedChange={(checked) =>
                        handleEditFieldChange("enable_online_ordering", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-dine-in">Dine-in</Label>
                      <p className="text-xs text-muted-foreground">Enable dine-in</p>
                    </div>
                    <Switch
                      id="edit-org-dine-in"
                      checked={editForm.enable_dine_in}
                      onCheckedChange={(checked) => handleEditFieldChange("enable_dine_in", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-takeaway">Takeaway</Label>
                      <p className="text-xs text-muted-foreground">Enable takeaway</p>
                    </div>
                    <Switch
                      id="edit-org-takeaway"
                      checked={editForm.enable_takeaway}
                      onCheckedChange={(checked) =>
                        handleEditFieldChange("enable_takeaway", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-delivery">Delivery</Label>
                      <p className="text-xs text-muted-foreground">Enable delivery</p>
                    </div>
                    <Switch
                      id="edit-org-delivery"
                      checked={editForm.enable_delivery}
                      onCheckedChange={(checked) => handleEditFieldChange("enable_delivery", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-delivery-radius">Delivery Radius (km)</Label>
                    <Input
                      id="edit-org-delivery-radius"
                      value={editForm.delivery_radius}
                      onChange={(e) => handleEditFieldChange("delivery_radius", e.target.value)}
                      onBlur={() => handleEditFieldBlur("delivery_radius")}
                      inputMode="decimal"
                      placeholder="5"
                      className={
                        editErrors.delivery_radius ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.delivery_radius && (
                      <p className="text-xs text-red-500">{editErrors.delivery_radius}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-min-order">Minimum Order Value</Label>
                    <Input
                      id="edit-org-min-order"
                      value={editForm.minimum_order_value}
                      onChange={(e) => handleEditFieldChange("minimum_order_value", e.target.value)}
                      onBlur={() => handleEditFieldBlur("minimum_order_value")}
                      inputMode="decimal"
                      placeholder="199"
                      className={
                        editErrors.minimum_order_value
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {editErrors.minimum_order_value && (
                      <p className="text-xs text-red-500">{editErrors.minimum_order_value}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <p className="text-sm font-semibold text-foreground">Kitchen & Receipt</p>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-kot">Enable KOT</Label>
                      <p className="text-xs text-muted-foreground">Kitchen Order Tickets</p>
                    </div>
                    <Switch
                      id="edit-org-kot"
                      checked={editForm.enable_kot}
                      onCheckedChange={(checked) => handleEditFieldChange("enable_kot", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="edit-org-kds">Enable KDS</Label>
                      <p className="text-xs text-muted-foreground">Kitchen Display System</p>
                    </div>
                    <Switch
                      id="edit-org-kds"
                      checked={editForm.enable_kds}
                      onCheckedChange={(checked) => handleEditFieldChange("enable_kds", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                    <div>
                      <Label htmlFor="edit-org-auto-accept">Auto Accept Orders</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically accept incoming orders
                      </p>
                    </div>
                    <Switch
                      id="edit-org-auto-accept"
                      checked={editForm.auto_accept_orders}
                      onCheckedChange={(checked) =>
                        handleEditFieldChange("auto_accept_orders", checked)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-prep-buffer">Preparation Buffer (min)</Label>
                    <Input
                      id="edit-org-prep-buffer"
                      value={editForm.preparation_time_buffer}
                      onChange={(e) =>
                        handleEditFieldChange(
                          "preparation_time_buffer",
                          e.target.value.replace(/[^\d]/g, ""),
                        )
                      }
                      onBlur={() => handleEditFieldBlur("preparation_time_buffer")}
                      inputMode="numeric"
                      placeholder="10"
                      className={
                        editErrors.preparation_time_buffer
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {editErrors.preparation_time_buffer && (
                      <p className="text-xs text-red-500">{editErrors.preparation_time_buffer}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-receipt-header">Receipt Header</Label>
                    <Input
                      id="edit-org-receipt-header"
                      value={editForm.receipt_header}
                      onChange={(e) => handleEditFieldChange("receipt_header", e.target.value)}
                      onBlur={() => handleEditFieldBlur("receipt_header")}
                      placeholder="Thank you for visiting!"
                      className={
                        editErrors.receipt_header ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.receipt_header && (
                      <p className="text-xs text-red-500">{editErrors.receipt_header}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-org-invoice-prefix">Invoice Prefix</Label>
                    <Input
                      id="edit-org-invoice-prefix"
                      value={editForm.invoice_prefix}
                      onChange={(e) => handleEditFieldChange("invoice_prefix", e.target.value)}
                      onBlur={() => handleEditFieldBlur("invoice_prefix")}
                      placeholder="INV-"
                      maxLength={10}
                      className={
                        editErrors.invoice_prefix ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.invoice_prefix && (
                      <p className="text-xs text-red-500">{editErrors.invoice_prefix}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="edit-org-receipt-footer">Receipt Footer</Label>
                    <Textarea
                      id="edit-org-receipt-footer"
                      value={editForm.receipt_footer}
                      onChange={(e) => handleEditFieldChange("receipt_footer", e.target.value)}
                      onBlur={() => handleEditFieldBlur("receipt_footer")}
                      placeholder="Visit again soon."
                      className={
                        editErrors.receipt_footer ? "border-red-500 focus-visible:ring-red-500" : ""
                      }
                    />
                    {editErrors.receipt_footer && (
                      <p className="text-xs text-red-500">{editErrors.receipt_footer}</p>
                    )}
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

          <Dialog
            open={openViewDialog}
            onOpenChange={(nextOpen) => {
              setOpenViewDialog(nextOpen);
              if (!nextOpen) {
                setViewingOrganization(null);
                setIsViewLoading(false);
              }
            }}
          >
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Restaurant Details</DialogTitle>
                <DialogDescription>View complete restaurant configuration.</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {isViewLoading || (openViewDialog && !viewingOrganization) ? (
                  <div className="space-y-4 py-2">
                    <div className="rounded-lg border bg-muted/20 p-4 animate-pulse">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="h-5 w-56 rounded bg-muted" />
                          <div className="h-4 w-72 rounded bg-muted" />
                        </div>
                        <div className="h-6 w-24 rounded bg-muted" />
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="h-20 rounded-md border bg-background" />
                        <div className="h-20 rounded-md border bg-background" />
                        <div className="h-20 rounded-md border bg-background" />
                      </div>
                    </div>
                    <div className="rounded-lg border bg-background p-4 animate-pulse">
                      <div className="h-4 w-40 rounded bg-muted" />
                      <div className="mt-4 space-y-3">
                        <div className="h-10 rounded bg-muted/30" />
                        <div className="h-10 rounded bg-muted/30" />
                        <div className="h-10 rounded bg-muted/30" />
                      </div>
                    </div>
                  </div>
                ) : !viewingOrganization ? (
                  <div className="text-sm text-muted-foreground">No details available.</div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-foreground truncate">
                            {viewingOrganization.name || "Restaurant"}
                          </p>
                          <p className="text-sm text-muted-foreground break-all">
                            {viewingOrganization.slug || "—"}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            String(
                              viewingOrganization.status ?? viewingOrganizationFallbackStatus,
                            ) === "active"
                              ? "bg-green-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {String(viewingOrganization.status ?? viewingOrganizationFallbackStatus).toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          ["ID", viewingOrganization.id, true],
                          ["Created", formatDateTime(viewingOrganization.created_at), false],
                          ["Updated", formatDateTime(viewingOrganization.updated_at), false],
                        ].map(([label, value, mono]) => (
                          <div key={String(label)} className="rounded-md border bg-background p-3">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p
                              className={[
                                "mt-1 text-sm break-words whitespace-pre-wrap",
                                mono ? "font-mono text-xs" : "",
                              ].join(" ")}
                            >
                              {formatViewValue(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Accordion type="multiple" defaultValue={["basic", "branding"]} className="w-full">
                      <AccordionItem value="basic">
                        <AccordionTrigger>Basic Info</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ["Business Name", viewingOrganization.business_name],
                              ["Email", viewingOrganization.email],
                              ["Phone", viewingOrganization.phone],
                              ["Alternate Phone", viewingOrganization.alternate_phone],
                              ["Description", viewingOrganization.description],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                                  {formatViewValue(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="branding">
                        <AccordionTrigger>Branding</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ["Logo", viewingOrganization.logo],
                              ["Banner Image", viewingOrganization.banner_image],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                {isHttpUrl(value) ? (
                                  <div className="mt-2 space-y-2">
                                    <a
                                      href={String(value)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-primary underline break-all"
                                    >
                                      {String(value)}
                                    </a>
                                    <img
                                      src={String(value)}
                                      alt={String(label)}
                                      className="max-h-44 w-auto rounded-md border bg-background"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                                    {formatViewValue(value)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="location">
                        <AccordionTrigger>Contact & Location</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ["Address", viewingOrganization.address],
                              ["City", viewingOrganization.city],
                              ["State", viewingOrganization.state],
                              ["Country", viewingOrganization.country],
                              ["Postal Code", viewingOrganization.postal_code],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                                  {formatViewValue(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="tax">
                        <AccordionTrigger>Legal & Tax</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ["GSTIN", viewingOrganization.gstin],
                              ["FSSAI License", viewingOrganization.fssai_license],
                              ["PAN Number", viewingOrganization.pan_number],
                              ["GST Enabled", viewingOrganization.enable_gst],
                              ["CGST Rate", viewingOrganization.cgst_rate],
                              ["SGST Rate", viewingOrganization.sgst_rate],
                              ["IGST Rate", viewingOrganization.igst_rate],
                              ["Service Charge %", viewingOrganization.service_charge_percentage],
                              ["Tax Number", viewingOrganization.tax_number],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                                  {formatViewValue(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="hours">
                        <AccordionTrigger>Operations & Hours</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ["24 Hours", viewingOrganization.is_24_hours],
                              ["Holiday Mode", viewingOrganization.holiday_mode],
                              ...(viewingOrganization.is_24_hours
                                ? [
                                    ["Opening Time", "Not required (24 hours)"],
                                    ["Closing Time", "Not required (24 hours)"],
                                  ]
                                : [
                                    ["Opening Time", viewingOrganization.opening_time],
                                    ["Closing Time", viewingOrganization.closing_time],
                                  ]),
                              ["Operating Days", viewingOrganization.operating_days],
                              ["Special Hours", viewingOrganization.special_hours],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                {typeof value === "string" && value.startsWith("{") ? (
                                  <pre className="mt-2 max-h-48 overflow-auto rounded-md border bg-background p-2 text-xs">
                                    {value}
                                  </pre>
                                ) : (
                                  <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                                    {formatViewValue(value)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="ordering">
                        <AccordionTrigger>Ordering & Delivery</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ["Online Ordering", viewingOrganization.enable_online_ordering],
                              ["Table Booking", viewingOrganization.enable_table_booking],
                              ["Delivery", viewingOrganization.enable_delivery],
                              ["Takeaway", viewingOrganization.enable_takeaway],
                              ["Dine-in", viewingOrganization.enable_dine_in],
                              ["Delivery Radius (km)", viewingOrganization.delivery_radius],
                              ["Delivery Charge", viewingOrganization.delivery_charge],
                              ["Minimum Order Value", viewingOrganization.minimum_order_value],
                              ["Free Delivery Above", viewingOrganization.free_delivery_above],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                                  {formatViewValue(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="receipt">
                        <AccordionTrigger>Kitchen & Receipt</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ["Enable KOT", viewingOrganization.enable_kot],
                              ["Enable KDS", viewingOrganization.enable_kds],
                              ["Auto Accept Orders", viewingOrganization.auto_accept_orders],
                              ["Preparation Buffer (min)", viewingOrganization.preparation_time_buffer],
                              ["Invoice Prefix", viewingOrganization.invoice_prefix],
                              ["Invoice Counter", viewingOrganization.invoice_counter],
                              ["Enable Auto Print", viewingOrganization.enable_auto_print],
                              ["Receipt Header", viewingOrganization.receipt_header],
                              ["Receipt Footer", viewingOrganization.receipt_footer],
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                                  {formatViewValue(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenViewDialog(false)}>
                  Close
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
                      <TableHead className="text-center">Action</TableHead>
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
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                title="View Restaurant"
                                onClick={() => openViewOrganization(org)}
                                className="h-9 transition-colors hover:bg-green-600 hover:text-white"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                title="Edit Restaurant"
                                onClick={() => openEditOrganization(org)}
                                className="h-9 transition-colors hover:bg-green-600 hover:text-white"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
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
