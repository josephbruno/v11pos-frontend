import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
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
import { useCreateHomebanner, useDeleteHomebanner, useHomebanners, useUpdateHomebanner } from "@/hooks/useHomebanners";
import type { Homebanner } from "@shared/api";

type RestaurantOption = { id: string; name: string };

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function datetimeLocalToLocalIso(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  // Send a "local" ISO string (no timezone suffix) to avoid unexpected UTC shifts.
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

function getBannerImageValue(banner: Homebanner | null | undefined, kind: "mobile" | "desktop") {
  if (!banner) return "";
  if (kind === "mobile") {
    return (
      String(banner.mobile_image_url || banner.mobile_image || "").trim()
    );
  }
  return String(banner.desktop_image_url || banner.desktop_image || "").trim();
}

function getFileSizeLabel(file: File | null) {
  if (!file) return "";
  const mb = file.size / (1024 * 1024);
  if (mb < 1) return `${Math.round((file.size / 1024) * 10) / 10} KB`;
  return `${Math.round(mb * 100) / 100} MB`;
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

export default function HomebannerManagement() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const canManageBanners = user?.role === "super_admin" || user?.role === "admin" || user?.role === "supervisor";
  const maxImageBytes = 2 * 1024 * 1024; // 2 MB
  const restaurantStorageKey = "homebanners.selectedRestaurantId";

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(user?.branchId || "");
  const [formRestaurantId, setFormRestaurantId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Homebanner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Homebanner | null>(null);
  const [formError, setFormError] = useState<string>("");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");

  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);

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

  const restaurantNameById = useMemo(() => {
    return new Map(restaurantOptions.map((option) => [option.id, option.name]));
  }, [restaurantOptions]);

  const defaultRestaurantIdForSuperAdmin = useMemo(() => {
    if (restaurantOptions.length === 0) return "";
    const sangeetha = restaurantOptions.find((option) =>
      option.name.toLowerCase().includes("sangeetha"),
    );
    return (sangeetha || restaurantOptions[0]).id;
  }, [restaurantOptions]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedRestaurantId(user?.branchId || "");
      return;
    }

    if (restaurantOptions.length === 0) return;

    const isValid = (candidate: string) =>
      Boolean(candidate) && restaurantOptions.some((option) => option.id === candidate);

    const current = String(selectedRestaurantId || "").trim();
    if (isValid(current)) return;

    const stored = String(localStorage.getItem(restaurantStorageKey) || "").trim();
    if (isValid(stored)) {
      setSelectedRestaurantId(stored);
      return;
    }

    setSelectedRestaurantId(defaultRestaurantIdForSuperAdmin);
  }, [
    isSuperAdmin,
    user?.branchId,
    selectedRestaurantId,
    restaurantOptions,
    defaultRestaurantIdForSuperAdmin,
    restaurantStorageKey,
  ]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const current = String(selectedRestaurantId || "").trim();
    if (!current) return;
    localStorage.setItem(restaurantStorageKey, current);
  }, [isSuperAdmin, selectedRestaurantId, restaurantStorageKey]);

  const bannersQuery = useHomebanners(selectedRestaurantId);
  const createMutation = useCreateHomebanner();
  const updateMutation = useUpdateHomebanner();
  const deleteMutation = useDeleteHomebanner();

  const banners = useMemo(() => {
    const items = bannersQuery.data?.data ?? [];
    const normalized = items.filter((item) => item && item.id);
    normalized.sort((a, b) => {
      const aOrder = Number(a.sort_order ?? 0);
      const bOrder = Number(b.sort_order ?? 0);
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || ""));
    });
    if (!searchQuery.trim()) return normalized;
    const q = searchQuery.trim().toLowerCase();
    return normalized.filter((banner) => String(banner.title || "").toLowerCase().includes(q));
  }, [bannersQuery.data, searchQuery]);

  const currentMobileImage = useMemo(() => {
    return editingBanner ? getBannerImageValue(editingBanner, "mobile") : "";
  }, [editingBanner]);

  const currentDesktopImage = useMemo(() => {
    return editingBanner ? getBannerImageValue(editingBanner, "desktop") : "";
  }, [editingBanner]);

  const openCreate = () => {
    setEditingBanner(null);
    setFormError("");
    setFormRestaurantId(undefined);
    if (isSuperAdmin && !String(selectedRestaurantId || "").trim() && defaultRestaurantIdForSuperAdmin) {
      setSelectedRestaurantId(defaultRestaurantIdForSuperAdmin);
    }
    setTitle("");
    setSubtitle("");
    setDescription("");
    setRedirectUrl("");
    setButtonText("");
    setFeatured(false);
    setSortOrder("0");
    setStartAt("");
    setEndAt("");
    setMobileImageFile(null);
    setDesktopImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (banner: Homebanner) => {
    setEditingBanner(banner);
    setFormError("");
    setFormRestaurantId(String(banner.restaurant_id || "").trim() || undefined);
    setTitle(String(banner.title || ""));
    setSubtitle(String(banner.subtitle || ""));
    setDescription(String(banner.description || ""));
    setRedirectUrl(String(banner.redirect_url || ""));
    setButtonText(String(banner.button_text || ""));
    setFeatured(Boolean(banner.featured));
    setSortOrder(String(banner.sort_order ?? 0));
    setStartAt(toDatetimeLocalValue(banner.start_at));
    setEndAt(toDatetimeLocalValue(banner.end_at));

    setMobileImageFile(null);
    setDesktopImageFile(null);
    setDialogOpen(true);
  };

  const validateForm = () => {
    const restaurantId = String((isSuperAdmin ? formRestaurantId : selectedRestaurantId) || "").trim();
    if (!restaurantId) return "Please select a restaurant.";
    if (!title.trim()) return "Title is required.";

    if (startAt && endAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (end.getTime() < start.getTime()) {
          return "End date/time must be greater than or equal to Start date/time.";
        }
      }
    }

    const existingMobile = editingBanner ? getBannerImageValue(editingBanner, "mobile") : "";
    const existingDesktop = editingBanner ? getBannerImageValue(editingBanner, "desktop") : "";
    const hasMobile = Boolean(mobileImageFile || existingMobile);
    const hasDesktop = Boolean(desktopImageFile || existingDesktop);
    if (!hasMobile && !hasDesktop) {
      return "At least one of Mobile image or Desktop image is required.";
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

    const activeValue = editingBanner ? Boolean(editingBanner.active) : true;
    const startIso = datetimeLocalToLocalIso(startAt);
    const endIso = datetimeLocalToLocalIso(endAt);
    const restaurantId = String((isSuperAdmin ? formRestaurantId : selectedRestaurantId) || "").trim();

    const payload: Record<string, any> = {
      restaurant_id: restaurantId,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      redirect_url: redirectUrl.trim() || undefined,
      button_text: buttonText.trim() || undefined,
      active: activeValue,
      featured,
      sort_order: sortOrder.trim() === "" ? undefined : Number(sortOrder),
      start_at: startIso,
      end_at: endIso,
    };

    const existingMobile = editingBanner ? getBannerImageValue(editingBanner, "mobile") : "";
    const existingDesktop = editingBanner ? getBannerImageValue(editingBanner, "desktop") : "";

    if (mobileImageFile) payload.mobile_image = mobileImageFile;

    if (desktopImageFile) payload.desktop_image = desktopImageFile;

    try {
      if (editingBanner) {
        await updateMutation.mutateAsync({ id: editingBanner.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (e: any) {
      setFormError(e?.message || "Failed to save banner.");
    }
  };

  if (!canManageBanners) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Home Banners</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You don&apos;t have permission to manage home banners.
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBusy =
    Boolean(createMutation.isPending) || Boolean(updateMutation.isPending) || Boolean(deleteMutation.isPending);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-pos-accent" />
            <h1 className="text-2xl font-bold text-foreground">Home Banners</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage homepage banners (mobile/desktop variants, CTA, scheduling).
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Edit Banner" : "Create Banner"}
                {isSuperAdmin && formRestaurantId ? (
                  <div className="mt-1 text-xs font-normal text-muted-foreground">
                    Restaurant: {restaurantNameById.get(formRestaurantId) || formRestaurantId}
                  </div>
                ) : null}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
              {formError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

              {isSuperAdmin ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Restaurant</Label>
                    <Select
                      value={formRestaurantId}
                      onValueChange={(value) => setFormRestaurantId(value || undefined)}
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
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hb-title">Title</Label>
                  <Input id="hb-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hb-subtitle">Subtitle</Label>
                  <Input id="hb-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hb-description">Description</Label>
                <Textarea
                  id="hb-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hb-mobile-file">Mobile image</Label>
                  <Input
                    id="hb-mobile-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMobileImageFile(e.target.files?.[0] || null)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {mobileImageFile
                      ? `${mobileImageFile.name} (${getFileSizeLabel(mobileImageFile)})${
                          mobileImageFile.size > maxImageBytes ? " • will be compressed to ≤ 2MB" : ""
                        }`
                      : "No file selected"}
                  </div>
                  {editingBanner && currentMobileImage ? (
                    <div className="text-xs text-muted-foreground truncate" title={currentMobileImage}>
                      Current: {currentMobileImage}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hb-desktop-file">Desktop image</Label>
                  <Input
                    id="hb-desktop-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDesktopImageFile(e.target.files?.[0] || null)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {desktopImageFile
                      ? `${desktopImageFile.name} (${getFileSizeLabel(desktopImageFile)})${
                          desktopImageFile.size > maxImageBytes ? " • will be compressed to ≤ 2MB" : ""
                        }`
                      : "No file selected"}
                  </div>
                  {editingBanner && currentDesktopImage ? (
                    <div className="text-xs text-muted-foreground truncate" title={currentDesktopImage}>
                      Current: {currentDesktopImage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hb-redirect">Redirect URL</Label>
                  <Input
                    id="hb-redirect"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hb-button-text">Button text</Label>
                  <Input
                    id="hb-button-text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Order Now"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hb-sort">Sort order</Label>
                  <Input
                    id="hb-sort"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hb-start">Start (optional)</Label>
                  <Input
                    id="hb-start"
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
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hb-end">End (optional)</Label>
                  <Input
                    id="hb-end"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Featured</Label>
                  <div className="flex items-center justify-between h-10 rounded-md border border-input bg-background px-3">
                    <div className="text-sm text-muted-foreground">Highlight this banner</div>
                  <Switch checked={featured} onCheckedChange={setFeatured} />
                </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isBusy}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={handleSubmit} disabled={isBusy}>
                  {editingBanner ? "Save Changes" : "Create Banner"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Banners</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
              {isSuperAdmin ? (
                <Select
                  value={selectedRestaurantId || "none"}
                  onValueChange={(value) => setSelectedRestaurantId(value === "none" ? "" : value)}
                  disabled={isRestaurantsLoading}
                >
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

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full sm:w-[240px]"
              />
            </div>

            <div className="text-xs text-muted-foreground shrink-0">
              {bannersQuery.isLoading ? "Loading..." : `${banners.length} banner(s)`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bannersQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading banners…</div>
          ) : bannersQuery.isError ? (
            <div className="text-sm text-destructive">Failed to load banners.</div>
          ) : banners.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No banners found. Click <span className="font-medium">Add Banner</span> to create one.
            </div>
          ) : (
            <Table className="border border-border rounded-md">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Web</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Redirect</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => {
                  const scheduleText = formatSchedule(banner.start_at, banner.end_at);
                  const redirect = String(banner.redirect_url || "").trim();
                  const mobileImage = getBannerImageValue(banner, "mobile");
                  const desktopImage = getBannerImageValue(banner, "desktop");
                  return (
                    <TableRow key={banner.id}>
                      <TableCell className="max-w-[520px]">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{banner.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {banner.subtitle || banner.description || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {mobileImage ? (
                          <a href={mobileImage} target="_blank" rel="noreferrer" title={mobileImage}>
                            <img
                              src={mobileImage}
                              alt="Mobile banner"
                              className="h-10 w-16 rounded border border-border object-cover bg-muted"
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {desktopImage ? (
                          <a href={desktopImage} target="_blank" rel="noreferrer" title={desktopImage}>
                            <img
                              src={desktopImage}
                              alt="Web banner"
                              className="h-10 w-16 rounded border border-border object-cover bg-muted"
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>{banner.featured ? <Badge>Yes</Badge> : <span className="text-muted-foreground">No</span>}</TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(banner.active)}
                          onCheckedChange={async (checked) => {
                            await updateMutation.mutateAsync({
                              id: banner.id,
                              data: {
                                restaurant_id: banner.restaurant_id || String(selectedRestaurantId || "").trim(),
                                active: checked,
                              },
                            });
                          }}
                          disabled={isBusy}
                        />
                      </TableCell>
                      <TableCell>{String(banner.sort_order ?? 0)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{scheduleText}</TableCell>
                      <TableCell className="max-w-[260px]">
                        {redirect ? (
                          <a
                            href={redirect}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-pos-accent underline underline-offset-4 truncate block"
                            title={redirect}
                          >
                            {redirect}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(banner)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setPendingDelete(banner)}
                            disabled={isBusy}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `This will permanently delete “${pendingDelete.title}”.` : "Confirm deletion."}
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
