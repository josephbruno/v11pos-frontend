import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/contexts/AuthContext";
import { getMyRestaurants } from "@/lib/apiServices";
import { useActiveCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useCombos } from "@/hooks/useCombos";
import {
  useCreateRowManagement,
  useDeleteRowManagement,
  useRowManagementList,
  useUpdateRowManagement,
} from "@/hooks/useRowManagement";
import type { RowManagement, RowType } from "@shared/api";

type RestaurantOption = { id: string; name: string };

const ALL_ROW_TYPE = "all" as const;

const ROW_TYPES: { value: RowType; label: string }[] = [
  { value: "category", label: "Category" },
  { value: "product", label: "Product" },
  { value: "combo_product", label: "Combo Product" },
  { value: "single_banner", label: "Single Banner" },
  { value: "ads_banner", label: "Ads Banner" },
  { value: "ads_video", label: "Ads Video" },
];

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function datetimeLocalToLocalIso(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function formatSchedule(startAt?: string | null, endAt?: string | null) {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  const startText = start && !Number.isNaN(start.getTime()) ? start.toLocaleString() : "";
  const endText = end && !Number.isNaN(end.getTime()) ? end.toLocaleString() : "";
  if (startText && endText) return `${startText} → ${endText}`;
  if (startText) return `From ${startText}`;
  if (endText) return `Until ${endText}`;
  return "Always";
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const value = JSON.parse(trimmed);
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  throw new Error("Metadata must be a JSON object.");
}

function getRowMedia(row: RowManagement | null | undefined, key: "image" | "mobile_image" | "desktop_image" | "thumbnail_image") {
  const value = row ? (row as any)?.[key] : undefined;
  return value ? String(value).trim() : "";
}

export default function RowManagementPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const canManage = user?.role === "super_admin" || user?.role === "admin" || user?.role === "supervisor";

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(user?.branchId || "");
  const [rowTypeFilter, setRowTypeFilter] = useState<RowType | typeof ALL_ROW_TYPE>(ALL_ROW_TYPE);
  const [activeOnly, setActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowManagement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RowManagement | null>(null);
  const [formError, setFormError] = useState("");

  const [formRestaurantId, setFormRestaurantId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [rowType, setRowType] = useState<RowType>("category");
  const [active, setActive] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [layoutStyle, setLayoutStyle] = useState("");
  const [itemsPerView, setItemsPerView] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [metadataText, setMetadataText] = useState("");

  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [comboIds, setComboIds] = useState<string[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const { data: restaurantsResponse, isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ["my-restaurants", user?.id],
    queryFn: () => getMyRestaurants(0, 500),
    enabled: Boolean(user?.id) && isSuperAdmin,
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

  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedRestaurantId(user?.branchId || "");
      return;
    }
    if (!selectedRestaurantId && restaurantOptions.length > 0) {
      setSelectedRestaurantId(restaurantOptions[0].id);
    }
  }, [isSuperAdmin, selectedRestaurantId, restaurantOptions, user?.branchId]);

  const effectiveRestaurantId = String(selectedRestaurantId || "").trim();
  const rowsQuery = useRowManagementList(effectiveRestaurantId, {
    row_type: rowTypeFilter === ALL_ROW_TYPE ? "" : rowTypeFilter,
    active_only: activeOnly,
    skip: 0,
    limit: 200,
  });

  const createMutation = useCreateRowManagement();
  const updateMutation = useUpdateRowManagement();
  const deleteMutation = useDeleteRowManagement();

  const optionsRestaurantId = String(
    (isSuperAdmin ? formRestaurantId : effectiveRestaurantId) || "",
  ).trim();

  const categoriesQuery = useActiveCategories(optionsRestaurantId);
  const productsQuery = useProducts({ active: true, page_size: 200 }, optionsRestaurantId);
  const combosQuery = useCombos({ active_only: true, limit: 200 }, optionsRestaurantId);

  const categories = useMemo(() => {
    const raw = categoriesQuery.data as any;
    const source = raw?.data ?? raw;
    const items = Array.isArray(source) ? source : Array.isArray(source?.data) ? source.data : [];
    return items
      .filter((c: any) => c?.id && c?.name)
      .map((c: any) => ({ id: String(c.id), name: String(c.name) }));
  }, [categoriesQuery.data]);

  const products = useMemo(() => {
    const raw = productsQuery.data as any;
    const source = raw?.data ?? raw;
    const items = Array.isArray(source) ? source : Array.isArray(source?.data) ? source.data : [];
    return items
      .filter((p: any) => p?.id && p?.name)
      .map((p: any) => ({ id: String(p.id), name: String(p.name) }));
  }, [productsQuery.data]);

  const combos = useMemo(() => {
    const raw = combosQuery.data as any;
    const source = raw?.data ?? raw;
    const items = Array.isArray(source) ? source : Array.isArray(source?.data) ? source.data : [];
    return items
      .filter((c: any) => c?.id && (c?.name || c?.title))
      .map((c: any) => ({ id: String(c.id), name: String(c.name || c.title) }));
  }, [combosQuery.data]);

  const rows = useMemo(() => {
    const list = rowsQuery.data?.data ?? [];
    const normalized = list.filter((r) => r && r.id);
    normalized.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((row) => {
      return (
        String(row.name || "").toLowerCase().includes(q) ||
        String(row.title || "").toLowerCase().includes(q)
      );
    });
  }, [rowsQuery.data, searchQuery]);

  const openCreate = () => {
    setEditingRow(null);
    setFormError("");
    setFormRestaurantId(isSuperAdmin ? (effectiveRestaurantId || undefined) : undefined);
    setName("");
    setTitle("");
    setSubtitle("");
    setDescription("");
    setRowType("category");
    setActive(true);
    setShowTitle(true);
    setSortOrder("0");
    setLayoutStyle("");
    setItemsPerView("");
    setAutoScroll(false);
    setRedirectUrl("");
    setButtonText("");
    setBackgroundColor("");
    setTextColor("");
    setStartAt("");
    setEndAt("");
    setMetadataText("");
    setCategoryIds([]);
    setProductIds([]);
    setComboIds([]);
    setImageFile(null);
    setMobileImageFile(null);
    setDesktopImageFile(null);
    setThumbnailFile(null);
    setVideoFile(null);
    setVideoUrl("");
    setDialogOpen(true);
  };

  const openEdit = (row: RowManagement) => {
    setEditingRow(row);
    setFormError("");
    setFormRestaurantId(String(row.restaurant_id || "").trim() || undefined);
    setName(String(row.name || ""));
    setTitle(String(row.title || ""));
    setSubtitle(String(row.subtitle || ""));
    setDescription(String(row.description || ""));
    setRowType(row.row_type);
    setActive(Boolean(row.active));
    setShowTitle(Boolean(row.show_title ?? true));
    setSortOrder(String(row.sort_order ?? 0));
    setLayoutStyle(String(row.layout_style || ""));
    setItemsPerView(row.items_per_view === null || row.items_per_view === undefined ? "" : String(row.items_per_view));
    setAutoScroll(Boolean(row.auto_scroll));
    setRedirectUrl(String(row.redirect_url || ""));
    setButtonText(String(row.button_text || ""));
    setBackgroundColor(String(row.background_color || ""));
    setTextColor(String(row.text_color || ""));
    setStartAt(toDatetimeLocalValue(row.start_at));
    setEndAt(toDatetimeLocalValue(row.end_at));
    setMetadataText(row.metadata ? JSON.stringify(row.metadata, null, 2) : "");
    setCategoryIds(Array.isArray(row.category_ids) ? row.category_ids.map(String) : []);
    setProductIds(Array.isArray(row.product_ids) ? row.product_ids.map(String) : []);
    setComboIds(Array.isArray(row.combo_product_ids) ? row.combo_product_ids.map(String) : []);
    setImageFile(null);
    setMobileImageFile(null);
    setDesktopImageFile(null);
    setThumbnailFile(null);
    setVideoFile(null);
    setVideoUrl(String(row.video_url || ""));
    setDialogOpen(true);
  };

  const validateForm = () => {
    const restaurantId = String((isSuperAdmin ? formRestaurantId : selectedRestaurantId) || "").trim();
    if (!restaurantId) return "Please select a restaurant.";
    if (!name.trim()) return "Name is required.";
    if (!rowType) return "Row type is required.";

    if (startAt && endAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end.getTime() < start.getTime()) {
        return "End date/time must be greater than or equal to Start date/time.";
      }
    }

    try {
      parseJsonObject(metadataText);
    } catch (e: any) {
      return e?.message || "Invalid metadata JSON.";
    }

    if (rowType === "category" && categoryIds.length === 0) return "Select at least one category.";
    if (rowType === "product" && productIds.length === 0) return "Select at least one product.";
    if (rowType === "combo_product" && comboIds.length === 0) return "Select at least one combo product.";

    const requiresImage = rowType === "single_banner" || rowType === "ads_banner";
    if (requiresImage) {
      const hasExisting =
        Boolean(getRowMedia(editingRow, "image")) ||
        Boolean(getRowMedia(editingRow, "mobile_image")) ||
        Boolean(getRowMedia(editingRow, "desktop_image"));
      const hasAny = Boolean(imageFile || mobileImageFile || desktopImageFile || hasExisting);
      if (!hasAny) return "Upload at least one image (image/mobile/desktop).";
    }

    if (rowType === "ads_video") {
      const hasVideo =
        Boolean(videoUrl.trim()) ||
        Boolean(videoFile) ||
        Boolean(editingRow && String(editingRow.video_url || "").trim());
      if (!hasVideo) return "Provide video URL or upload a video file.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setFormError("");

    const restaurantId = String((isSuperAdmin ? formRestaurantId : selectedRestaurantId) || "").trim();
    const payload: Record<string, any> = {
      restaurant_id: restaurantId,
      name: name.trim(),
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      row_type: rowType,
      active,
      show_title: showTitle,
      sort_order: sortOrder.trim() === "" ? undefined : Number(sortOrder),
      layout_style: layoutStyle.trim() || undefined,
      items_per_view: itemsPerView.trim() === "" ? undefined : Number(itemsPerView),
      auto_scroll: autoScroll,
      redirect_url: redirectUrl.trim() || undefined,
      button_text: buttonText.trim() || undefined,
      background_color: backgroundColor.trim() || undefined,
      text_color: textColor.trim() || undefined,
      start_at: datetimeLocalToLocalIso(startAt),
      end_at: datetimeLocalToLocalIso(endAt),
      metadata: parseJsonObject(metadataText),
    };

    if (rowType === "category") payload.category_ids = categoryIds;
    if (rowType === "product") payload.product_ids = productIds;
    if (rowType === "combo_product") payload.combo_product_ids = comboIds;

    if (imageFile) payload.image = imageFile;
    if (mobileImageFile) payload.mobile_image = mobileImageFile;
    if (desktopImageFile) payload.desktop_image = desktopImageFile;
    if (thumbnailFile) payload.thumbnail_image = thumbnailFile;
    if (videoUrl.trim()) payload.video_url = videoUrl.trim();
    if (videoFile) payload.video_file = videoFile;

    try {
      if (editingRow) {
        await updateMutation.mutateAsync({ id: editingRow.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (e: any) {
      setFormError(e?.message || "Failed to save row.");
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Row Management</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You don&apos;t have permission to manage homepage rows.
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBusy =
    Boolean(createMutation.isPending) ||
    Boolean(updateMutation.isPending) ||
    Boolean(deleteMutation.isPending);

  const toggleId = (ids: string[], id: string, checked: boolean) => {
    if (checked) return ids.includes(id) ? ids : [...ids, id];
    return ids.filter((x) => x !== id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-pos-accent" />
            <h1 className="text-2xl font-bold text-foreground">Row Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure homepage rows/sections (content, banners, ads, video).
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingRow ? "Edit Row" : "Create Row"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
              {formError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

              {isSuperAdmin ? (
                <div className="space-y-2">
                  <Label>Restaurant</Label>
                  <Select
                    value={formRestaurantId}
                    onValueChange={(value) => {
                      const next = value || undefined;
                      setFormRestaurantId(next);
                      setCategoryIds([]);
                      setProductIds([]);
                      setComboIds([]);
                    }}
                    disabled={isRestaurantsLoading}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurantOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-name">Name</Label>
                  <Input id="rm-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Row type</Label>
                  <Select value={rowType} onValueChange={(value: any) => setRowType(value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROW_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-title">Title</Label>
                  <Input id="rm-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rm-subtitle">Subtitle</Label>
                  <Input id="rm-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rm-description">Description</Label>
                <Textarea
                  id="rm-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between h-10 rounded-md border border-input bg-background px-3">
                  <div className="text-sm text-muted-foreground">Active</div>
                  <Switch checked={active} onCheckedChange={setActive} />
                </div>
                <div className="flex items-center justify-between h-10 rounded-md border border-input bg-background px-3">
                  <div className="text-sm text-muted-foreground">Show title</div>
                  <Switch checked={showTitle} onCheckedChange={setShowTitle} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-sort">Sort order</Label>
                  <Input
                    id="rm-sort"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rm-layout">Layout style</Label>
                  <Input
                    id="rm-layout"
                    value={layoutStyle}
                    onChange={(e) => setLayoutStyle(e.target.value)}
                    placeholder="carousel / grid"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-items">Items per view</Label>
                  <Input
                    id="rm-items"
                    type="number"
                    value={itemsPerView}
                    onChange={(e) => setItemsPerView(e.target.value)}
                    min={1}
                  />
                </div>
                <div className="flex items-center justify-between h-10 rounded-md border border-input bg-background px-3">
                  <div className="text-sm text-muted-foreground">Auto scroll</div>
                  <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-start">Start (optional)</Label>
                  <Input
                    id="rm-start"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => {
                      const next = e.target.value;
                      setStartAt(next);
                      if (endAt && next) {
                        const start = new Date(next);
                        const end = new Date(endAt);
                        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end.getTime() < start.getTime()) {
                          setEndAt(next);
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rm-end">End (optional)</Label>
                  <Input id="rm-end" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-redirect">Redirect URL</Label>
                  <Input
                    id="rm-redirect"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="/products"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rm-button">Button text</Label>
                  <Input
                    id="rm-button"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="View All"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-bg">Background color</Label>
                  <Input
                    id="rm-bg"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#FFFFFF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rm-text-color">Text color</Label>
                  <Input
                    id="rm-text-color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="#111111"
                  />
                </div>
              </div>

              {rowType === "category" ? (
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <ScrollArea className="h-52 rounded-md border border-border p-2">
                    <div className="space-y-2">
                      {categories.map((cat) => {
                        const checked = categoryIds.includes(cat.id);
                        return (
                          <label key={cat.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                setCategoryIds((prev) => toggleId(prev, cat.id, Boolean(value)))
                              }
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}

              {rowType === "product" ? (
                <div className="space-y-2">
                  <Label>Products</Label>
                  <ScrollArea className="h-52 rounded-md border border-border p-2">
                    <div className="space-y-2">
                      {products.map((prod) => {
                        const checked = productIds.includes(prod.id);
                        return (
                          <label key={prod.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                setProductIds((prev) => toggleId(prev, prod.id, Boolean(value)))
                              }
                            />
                            <span className="truncate">{prod.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}

              {rowType === "combo_product" ? (
                <div className="space-y-2">
                  <Label>Combo products</Label>
                  <ScrollArea className="h-52 rounded-md border border-border p-2">
                    <div className="space-y-2">
                      {combos.map((combo) => {
                        const checked = comboIds.includes(combo.id);
                        return (
                          <label key={combo.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                setComboIds((prev) => toggleId(prev, combo.id, Boolean(value)))
                              }
                            />
                            <span className="truncate">{combo.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}

              {rowType === "single_banner" || rowType === "ads_banner" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rm-image">Image</Label>
                    <Input id="rm-image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    {editingRow && getRowMedia(editingRow, "image") ? (
                      <div className="text-xs text-muted-foreground truncate" title={getRowMedia(editingRow, "image")}>
                        Current: {getRowMedia(editingRow, "image")}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rm-mobile">Mobile image</Label>
                    <Input id="rm-mobile" type="file" accept="image/*" onChange={(e) => setMobileImageFile(e.target.files?.[0] || null)} />
                    {editingRow && getRowMedia(editingRow, "mobile_image") ? (
                      <div className="text-xs text-muted-foreground truncate" title={getRowMedia(editingRow, "mobile_image")}>
                        Current: {getRowMedia(editingRow, "mobile_image")}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rm-desktop">Desktop image</Label>
                    <Input id="rm-desktop" type="file" accept="image/*" onChange={(e) => setDesktopImageFile(e.target.files?.[0] || null)} />
                    {editingRow && getRowMedia(editingRow, "desktop_image") ? (
                      <div className="text-xs text-muted-foreground truncate" title={getRowMedia(editingRow, "desktop_image")}>
                        Current: {getRowMedia(editingRow, "desktop_image")}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {rowType === "ads_video" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rm-video-url">Video URL</Label>
                      <Input id="rm-video-url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rm-video-file">Video file</Label>
                      <Input id="rm-video-file" type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rm-thumb">Thumbnail image</Label>
                      <Input id="rm-thumb" type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                      {editingRow && getRowMedia(editingRow, "thumbnail_image") ? (
                        <div className="text-xs text-muted-foreground truncate" title={getRowMedia(editingRow, "thumbnail_image")}>
                          Current: {getRowMedia(editingRow, "thumbnail_image")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="rm-metadata">Metadata (JSON)</Label>
                <Textarea id="rm-metadata" value={metadataText} onChange={(e) => setMetadataText(e.target.value)} rows={4} placeholder='{"section_key":"featured"}' />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isBusy}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={handleSubmit} disabled={isBusy}>
                  {editingRow ? "Save Changes" : "Create Row"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Rows</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
              {isSuperAdmin ? (
                <Select value={selectedRestaurantId || undefined} onValueChange={setSelectedRestaurantId} disabled={isRestaurantsLoading}>
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue placeholder="Restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              <Select value={rowTypeFilter} onValueChange={(value) => setRowTypeFilter(value as RowType | typeof ALL_ROW_TYPE)}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Row type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ROW_TYPE}>All types</SelectItem>
                  {ROW_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full sm:w-[240px]" />

              <div className="flex items-center gap-2 h-10 rounded-md border border-input bg-background px-3">
                <span className="text-sm text-muted-foreground">Active only</span>
                <Switch checked={activeOnly} onCheckedChange={setActiveOnly} />
              </div>
            </div>

            <div className="text-xs text-muted-foreground shrink-0">
              {rowsQuery.isLoading ? "Loading..." : `${rows.length} row(s)`}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {rowsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading rows…</div>
          ) : rowsQuery.isError ? (
            <div className="text-sm text-destructive">
              {String((rowsQuery.error as any)?.message || "").includes(
                "Backend bug: row-management list cannot be retrieved",
              )
                ? "Row list is temporarily unavailable due to a backend metadata serialization bug. (You can still create/update rows.)"
                : (rowsQuery.error as any)?.message || "Failed to load rows."}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rows found.</div>
          ) : (
            <Table className="border border-border rounded-md">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[320px]">
                      <div className="font-medium text-foreground truncate">{row.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{row.subtitle || row.description || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.row_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate">{row.title || "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={Boolean(row.active)}
                        onCheckedChange={async (checked) => {
                          await updateMutation.mutateAsync({
                            id: row.id,
                            data: { restaurant_id: row.restaurant_id || effectiveRestaurantId, active: checked },
                          });
                        }}
                        disabled={isBusy}
                      />
                    </TableCell>
                    <TableCell>{String(row.sort_order ?? 0)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{row.layout_style || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatSchedule(row.start_at, row.end_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setPendingDelete(row)} disabled={isBusy}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Row?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `This will permanently delete “${pendingDelete.name}”.` : "Confirm deletion."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={async (e) => {
                e.preventDefault();
                if (!pendingDelete) return;
                const target = pendingDelete;
                setPendingDelete(null);
                await deleteMutation.mutateAsync(target.id);
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
