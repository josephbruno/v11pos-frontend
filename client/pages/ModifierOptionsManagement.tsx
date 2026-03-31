import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Plus, GitBranch, Edit, Check, X, CheckCircle2, XCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getModifierOptions, getMyRestaurants } from "@/lib/apiServices";
import {
  useCreateModifierOption,
  useModifierOptions,
  useModifiers,
  useUpdateModifierOption,
} from "@/hooks/useModifiers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Modifier, ModifierOption, Restaurant } from "@shared/api";

function extractArray<T = any>(payload: any): T[] {
  const source =
    payload?.data?.data?.data ??
    payload?.data?.data?.items ??
    payload?.data?.data?.options ??
    payload?.data?.data?.modifiers ??
    payload?.data?.data ??
    payload?.data?.items ??
    payload?.data?.options ??
    payload?.data?.modifiers ??
    payload?.data ??
    payload;
  return Array.isArray(source) ? source : [];
}

function normalizePrice(option: any) {
  const candidate =
    option?.price ??
    option?.price_adjustment ??
    option?.priceAdjustment ??
    option?.amount ??
    0;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBoolean(value: any, defaultValue: boolean) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on", "active"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off", "inactive"].includes(normalized)) return false;
    return defaultValue;
  }
  return !!value;
}

function normalizeAvailable(option: any) {
  if (option?.available !== undefined) return normalizeBoolean(option.available, true);
  if (option?.is_available !== undefined) return normalizeBoolean(option.is_available, true);
  if (option?.isAvailable !== undefined) return normalizeBoolean(option.isAvailable, true);
  return true;
}

function normalizeHidden(option: any) {
  if (option?.hidden !== undefined) return !!option.hidden;
  if (option?.is_hidden !== undefined) return !!option.is_hidden;
  if (option?.isHidden !== undefined) return !!option.isHidden;
  return false;
}

function normalizeModifierActive(modifier: any) {
  if (modifier?.active !== undefined) return normalizeBoolean(modifier.active, true);
  if (modifier?.is_active !== undefined) return normalizeBoolean(modifier.is_active, true);
  if (modifier?.isActive !== undefined) return normalizeBoolean(modifier.isActive, true);
  if (modifier?.enabled !== undefined) return normalizeBoolean(modifier.enabled, true);
  return true;
}

function formatINR(amount: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(amount);
}

function buildModifierOptionPutPayload(option: any, overrides?: Record<string, any>) {
  return {
    restaurant_id: option?.restaurant_id,
    modifier_id: option?.modifier_id,
    name: option?.name,
    price: normalizePrice(option),
    sort_order: Number(option?.sort_order ?? option?.sortOrder ?? 0),
    available: normalizeAvailable(option),
    hidden: normalizeHidden(option),
    ...(overrides || {}),
  };
}

export default function ModifierOptionsManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isSuperAdmin = useMemo(
    () => String(user?.role || "").toLowerCase().trim() === "super_admin",
    [user?.role],
  );
  const isAdmin = useMemo(
    () => String(user?.role || "").toLowerCase().trim() === "admin",
    [user?.role],
  );
  const canEditOption = isSuperAdmin || isAdmin;

  const restaurantStorageKey = "modifierOptions.selectedRestaurantId";

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    (() => {
      if (!isSuperAdmin) return user?.branchId || "";
      if (typeof window === "undefined") return "";
      return localStorage.getItem(restaurantStorageKey) || "";
    })(),
  );
  const effectiveRestaurantId = isSuperAdmin
    ? selectedRestaurantId
    : (user?.branchId || selectedRestaurantId || "");

  const [selectedModifierId, setSelectedModifierId] = useState<string>("");
  const [optionSearchQuery, setOptionSearchQuery] = useState("");
  const [optionDebouncedSearch, setOptionDebouncedSearch] = useState("");
  const [optionAvailabilityFilter, setOptionAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [optionStatusFilter, setOptionStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [modifierActiveFilter, setModifierActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [updatingOptionIds, setUpdatingOptionIds] = useState<Record<string, boolean>>(
    {},
  );
  const [pendingToggleUpdate, setPendingToggleUpdate] = useState<null | {
    option: any;
    field: "available" | "hidden";
    nextValue: boolean;
  }>(null);
  const [createRestaurantId, setCreateRestaurantId] = useState("");
  const [createModifierId, setCreateModifierId] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    price: "0",
    sort_order: "0",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    price: "0",
    sort_order: "0",
  });

  const sanitizeDigits = (value: string) => value.replace(/[^\d]/g, "");

  useEffect(() => {
    setSelectedModifierId("");
  }, [effectiveRestaurantId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOptionDebouncedSearch(optionSearchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [optionSearchQuery]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (typeof window === "undefined") return;
    if (selectedRestaurantId) {
      localStorage.setItem(restaurantStorageKey, selectedRestaurantId);
    } else {
      localStorage.removeItem(restaurantStorageKey);
    }
  }, [isSuperAdmin, selectedRestaurantId]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setCreateRestaurantId(effectiveRestaurantId || "");
      return;
    }
  }, [effectiveRestaurantId, isSuperAdmin]);

  useEffect(() => {
    // prefill create modifier when user already filtered by a modifier
    if (selectedModifierId) setCreateModifierId(selectedModifierId);
  }, [selectedModifierId]);

  const { data: restaurantsResponse, isLoading: restaurantsLoading } = useQuery({
    queryKey: ["my-restaurants", user?.id],
    queryFn: () => getMyRestaurants(0, 500),
    enabled: isSuperAdmin,
  });

  const restaurants = useMemo(() => {
    const payload = restaurantsResponse as any;
    const list = extractArray<Restaurant>(payload);
    return list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [restaurantsResponse]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (selectedRestaurantId) return;
    if (!restaurants.length) return;
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(restaurantStorageKey) || ""
        : "";
    const next = stored || String(restaurants[0]?.id || "");
    if (next) setSelectedRestaurantId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, restaurants]);

  const { data: modifiersResponse, isLoading: modifiersLoading } = useModifiers(
    { page: 1, page_size: 500 },
    effectiveRestaurantId,
  );

  const modifiers = useMemo(() => {
    const payload = modifiersResponse as any;
    const list = extractArray<Modifier>(payload);
    const filtered =
      modifierActiveFilter === "all"
        ? list
        : list.filter((m: any) =>
            modifierActiveFilter === "active"
              ? normalizeModifierActive(m)
              : !normalizeModifierActive(m),
          );
    return filtered.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }, [modifiersResponse, modifierActiveFilter]);

  const createEffectiveRestaurantId = isSuperAdmin
    ? createRestaurantId
    : (effectiveRestaurantId || "");

  const { data: createModifiersResponse, isLoading: createModifiersLoading } = useModifiers(
    { page: 1, page_size: 500 },
    createEffectiveRestaurantId,
  );

  const createModifiers = useMemo(() => {
    const payload = createModifiersResponse as any;
    const list = extractArray<Modifier>(payload);
    return list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [createModifiersResponse]);

  const { data: optionsResponse, isLoading: optionsLoading } = useModifierOptions(
    selectedModifierId || undefined,
    { page: 1, page_size: 500 },
  );

  const modifierIdsForAllOptions = useMemo(
    () =>
      modifiers
        .map((m: any) => String(m?.id || "").trim())
        .filter(Boolean),
    [modifiers],
  );

  const allOptionsQueries = useQueries({
    queries: modifierIdsForAllOptions.map((modifierId) => ({
      queryKey: ["modifierOptions", modifierId, { page: 1, page_size: 500 }],
      queryFn: () => getModifierOptions(modifierId, { page: 1, page_size: 500 }),
      enabled: !!effectiveRestaurantId && !selectedModifierId && !!modifierId,
      staleTime: 60000,
      retry: 0,
    })),
  });

  const allOptionsLoading =
    !selectedModifierId &&
    (!!modifiersLoading ||
      allOptionsQueries.some((q) => q.isLoading || q.isFetching));
  const allOptionsErrorCount = useMemo(
    () => (selectedModifierId ? 0 : allOptionsQueries.filter((q) => q.isError).length),
    [allOptionsQueries, selectedModifierId],
  );

  const allOptions = useMemo(() => {
    if (selectedModifierId) return [];
    const aggregated: any[] = [];
    allOptionsQueries.forEach((queryResult, index) => {
      const modifierId = modifierIdsForAllOptions[index];
      if (!modifierId) return;
      const list = extractArray<any>(queryResult.data);
      list.forEach((opt) => {
        aggregated.push({
          ...opt,
          modifier_id: opt?.modifier_id ?? modifierId,
        });
      });
    });
    return aggregated;
  }, [allOptionsQueries, modifierIdsForAllOptions, selectedModifierId]);

  const options = useMemo(() => {
    const payload = (selectedModifierId ? optionsResponse : allOptions) as any;
    const list = extractArray<ModifierOption>(payload);
    const availabilityFiltered =
      optionAvailabilityFilter === "all"
        ? list
        : list.filter((opt: any) =>
            optionAvailabilityFilter === "available"
              ? normalizeAvailable(opt)
              : !normalizeAvailable(opt),
          );

    const statusFiltered =
      optionStatusFilter === "all"
        ? availabilityFiltered
        : availabilityFiltered.filter((opt: any) =>
            optionStatusFilter === "active"
              ? !normalizeHidden(opt)
              : normalizeHidden(opt),
          );

    const searched = optionDebouncedSearch
      ? statusFiltered.filter((opt: any) =>
          String(opt?.name || "")
            .toLowerCase()
            .includes(optionDebouncedSearch.toLowerCase()),
        )
      : statusFiltered;

    return searched.sort((a: any, b: any) => {
      const ao = Number(a?.sort_order ?? a?.sortOrder ?? 0);
      const bo = Number(b?.sort_order ?? b?.sortOrder ?? 0);
      if (Number.isFinite(ao) && Number.isFinite(bo) && ao !== bo) return ao - bo;
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });
  }, [
    optionsResponse,
    allOptions,
    selectedModifierId,
    optionAvailabilityFilter,
    optionStatusFilter,
    optionDebouncedSearch,
  ]);

  const createOptionMutation = useCreateModifierOption();
  const updateOptionMutation = useUpdateModifierOption();

  const canCreate =
    !!createForm.name.trim() &&
    !!(isSuperAdmin ? createRestaurantId : effectiveRestaurantId) &&
    !!createModifierId;

  const handleCreate = () => {
    const restaurantId = isSuperAdmin ? createRestaurantId : effectiveRestaurantId;
    if (!restaurantId) {
      addToast({
        type: "error",
        title: "Select Restaurant",
        description: "Please select a restaurant first.",
      });
      return;
    }
    if (!createModifierId) {
      addToast({
        type: "error",
        title: "Select Modifier",
        description: "Please select a modifier first.",
      });
      return;
    }

    const name = createForm.name.trim();
    const price = Math.max(0, Math.trunc(Number(createForm.price || 0)));
    const sortOrder = Math.max(0, Math.trunc(Number(createForm.sort_order || 0)));
    const available = true;

    createOptionMutation.mutate(
      {
        modifierId: createModifierId,
        data: {
          restaurant_id: restaurantId,
          modifier_id: createModifierId,
          name,
          price,
          available,
          sort_order: sortOrder,
        },
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateForm({
            name: "",
            price: "0",
            sort_order: "0",
          });
          // bring the user to the created modifier + restaurant context
          if (isSuperAdmin && restaurantId && restaurantId !== effectiveRestaurantId) {
            setSelectedRestaurantId(restaurantId);
          }
          if (createModifierId && createModifierId !== selectedModifierId) {
            setSelectedModifierId(createModifierId);
          }
        },
      },
    );
  };

  const handleCreateOpen = () => {
    // Open the dialog even if modifier isn't chosen yet; allow selection inside the form.
    if (isSuperAdmin) {
      setCreateRestaurantId("");
      setCreateModifierId("");
    }
    setCreateForm((prev) => ({
      ...prev,
      name: "",
      price: "0",
      sort_order: "0",
    }));
    setIsCreateOpen(true);
  };

  const openEdit = (option: any) => {
    if (!normalizeAvailable(option)) {
      addToast({
        type: "error",
        title: "Option Inactive",
        description: "Activate this option before editing.",
      });
      return;
    }
    if (!canEditOption) {
      addToast({
        type: "error",
        title: "Permission Denied",
        description: "You don't have permission to edit this option.",
      });
      return;
    }
    setEditingOption(option);
    setEditForm({
      name: String(option?.name || ""),
      price: String(normalizePrice(option)),
      sort_order: String(option?.sort_order ?? option?.sortOrder ?? 0),
    });
    setIsEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editingOption?.id) return;
    const optionId = String(editingOption.id);
    const name = editForm.name.trim();
    if (!name) {
      addToast({
        type: "error",
        title: "Name Required",
        description: "Please enter an option name.",
      });
      return;
    }
    const price = Math.max(0, Math.trunc(Number(editForm.price || 0)));
    const sortOrder = Math.max(0, Math.trunc(Number(editForm.sort_order || 0)));

    setUpdatingOptionIds((prev) => ({ ...prev, [optionId]: true }));
    updateOptionMutation.mutate(
      {
        optionId,
        data: {
          restaurant_id: effectiveRestaurantId || undefined,
          modifier_id: selectedModifierId || editingOption?.modifier_id,
          name,
          price,
          sort_order: sortOrder,
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingOption(null);
        },
        onSettled: () => {
          setUpdatingOptionIds((prev) => {
            const next = { ...prev };
            delete next[optionId];
            return next;
          });
        },
      },
    );
  };

  const confirmToggleUpdate = () => {
    if (!pendingToggleUpdate?.option?.id) return;
    if (!canEditOption) {
      addToast({
        type: "error",
        title: "Permission Denied",
        description: "You don't have permission to update this option.",
      });
      setPendingToggleUpdate(null);
      return;
    }
    const optionId = String(pendingToggleUpdate.option.id);
    setUpdatingOptionIds((prev) => ({ ...prev, [optionId]: true }));

    const payload =
      pendingToggleUpdate.field === "available"
        ? buildModifierOptionPutPayload(pendingToggleUpdate.option, {
            available: pendingToggleUpdate.nextValue,
          })
        : buildModifierOptionPutPayload(pendingToggleUpdate.option, {
            hidden: !pendingToggleUpdate.nextValue,
            is_hidden: !pendingToggleUpdate.nextValue,
          });

    updateOptionMutation.mutate(
      { optionId, data: payload },
      {
        onSuccess: () => setPendingToggleUpdate(null),
        onSettled: () => {
          setUpdatingOptionIds((prev) => {
            const next = { ...prev };
            delete next[optionId];
            return next;
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <AlertDialog
        open={!!pendingToggleUpdate}
        onOpenChange={(open) => {
          if (!open) setPendingToggleUpdate(null);
        }}
      >
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {pendingToggleUpdate?.field === "available"
                ? "Update Availability"
                : "Update Status"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {pendingToggleUpdate?.field === "available"
                ? `Are you sure you want to set ${
                    pendingToggleUpdate?.option?.name || "this option"
                  } as ${
                    pendingToggleUpdate?.nextValue ? "Available" : "Unavailable"
                  }?`
                : `Are you sure you want to set ${
                    pendingToggleUpdate?.option?.name || "this option"
                  } as ${pendingToggleUpdate?.nextValue ? "Active" : "Inactive"}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleUpdate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modifier Options</h1>
          <p className="text-muted-foreground">
            Create and manage modifier options for your menu modifiers.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleCreateOpen}
          disabled={!canEditOption}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Modifier Option</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label className="text-foreground">Restaurant</Label>
                  <Select
                    value={createRestaurantId || "none"}
                    onValueChange={(value) => {
                      const next = value === "none" ? "" : value;
                      setCreateRestaurantId(next);
                      setCreateModifierId("");
                    }}
                    disabled={restaurantsLoading}
                  >
                    <SelectTrigger className="w-full bg-background border-border text-foreground">
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">Select restaurant</SelectItem>
                      {restaurants.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-foreground">Modifier</Label>
                <Select
                  value={createModifierId || "none"}
                  onValueChange={(value) =>
                    setCreateModifierId(value === "none" ? "" : value)
                  }
                  disabled={!createEffectiveRestaurantId || createModifiersLoading}
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue
                      placeholder={
                        createEffectiveRestaurantId
                          ? "Select modifier"
                          : "Select restaurant first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none">Select modifier</SelectItem>
                    {createModifiers.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        No modifiers found
                      </SelectItem>
                    ) : (
                      createModifiers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Extra Cheese"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Price (cents/paise)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        price: sanitizeDigits(e.target.value),
                      }))
                    }
                    onFocus={() => {
                      if (createForm.price === "0") {
                        setCreateForm((prev) => ({ ...prev, price: "" }));
                      }
                    }}
                    onBlur={() => {
                      if (!createForm.price) {
                        setCreateForm((prev) => ({ ...prev, price: "0" }));
                      }
                    }}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Sort Order</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={createForm.sort_order}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        sort_order: sanitizeDigits(e.target.value),
                      }))
                    }
                    onFocus={() => {
                      if (createForm.sort_order === "0") {
                        setCreateForm((prev) => ({ ...prev, sort_order: "" }));
                      }
                    }}
                    onBlur={() => {
                      if (!createForm.sort_order) {
                        setCreateForm((prev) => ({ ...prev, sort_order: "0" }));
                      }
                    }}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!canCreate || createOptionMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {createOptionMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setEditingOption(null);
          }}
        >
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Modifier Option</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Price (cents/paise)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        price: sanitizeDigits(e.target.value),
                      }))
                    }
                    onFocus={() => {
                      if (editForm.price === "0") {
                        setEditForm((prev) => ({ ...prev, price: "" }));
                      }
                    }}
                    onBlur={() => {
                      if (!editForm.price) {
                        setEditForm((prev) => ({ ...prev, price: "0" }));
                      }
                    }}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Sort Order</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editForm.sort_order}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        sort_order: sanitizeDigits(e.target.value),
                      }))
                    }
                    onFocus={() => {
                      if (editForm.sort_order === "0") {
                        setEditForm((prev) => ({ ...prev, sort_order: "" }));
                      }
                    }}
                    onBlur={() => {
                      if (!editForm.sort_order) {
                        setEditForm((prev) => ({ ...prev, sort_order: "0" }));
                      }
                    }}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  disabled={
                    !editingOption?.id ||
                    updateOptionMutation.isPending ||
                    !!updatingOptionIds[String(editingOption?.id)]
                  }
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {updateOptionMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <GitBranch className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 overflow-x-auto">
            {isSuperAdmin && (
              <div className="space-y-2 min-w-[260px]">
                <Label className="text-foreground">Restaurant</Label>
                <Select
                  value={effectiveRestaurantId || "none"}
                  onValueChange={(value) =>
                    setSelectedRestaurantId(value === "none" ? "" : value)
                  }
                  disabled={restaurantsLoading}
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue placeholder="Select restaurant" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none">Select restaurant</SelectItem>
                    {restaurants.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="relative flex-1 min-w-[320px]">
              <Label className="text-foreground">Search</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={optionSearchQuery}
                  onChange={(e) => setOptionSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="pl-10 bg-background border-border text-foreground"
                  disabled={!effectiveRestaurantId}
                />
              </div>
            </div>

            <div className="space-y-2 min-w-[220px]">
              <Label className="text-foreground">Modifier Status</Label>
              <Select
                value={modifierActiveFilter}
                onValueChange={(v) => setModifierActiveFilter(v as any)}
                disabled={!effectiveRestaurantId || modifiersLoading}
              >
                <SelectTrigger className="w-full bg-background border-border text-foreground">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-[260px]">
              <Label className="text-foreground">Modifier</Label>
              <Select
                value={selectedModifierId || "none"}
                onValueChange={(value) =>
                  setSelectedModifierId(value === "none" ? "" : value)
                }
                disabled={!effectiveRestaurantId || modifiersLoading}
              >
                <SelectTrigger className="w-full bg-background border-border text-foreground">
                  <SelectValue
                    placeholder={
                      effectiveRestaurantId ? "Select modifier" : "Select restaurant first"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">Select modifier</SelectItem>
                  {modifiers.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      No modifiers found
                    </SelectItem>
                  ) : (
                    modifiers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-[220px]">
              <Label className="text-foreground">Availability</Label>
              <Select
                value={optionAvailabilityFilter}
                onValueChange={(v) => setOptionAvailabilityFilter(v as any)}
                disabled={!effectiveRestaurantId}
              >
                <SelectTrigger className="w-full bg-background border-border text-foreground">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-[220px]">
              <Label className="text-foreground">Status</Label>
              <Select
                value={optionStatusFilter}
                onValueChange={(v) => setOptionStatusFilter(v as any)}
                disabled={!effectiveRestaurantId}
              >
                <SelectTrigger className="w-full bg-background border-border text-foreground">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground">Options</CardTitle>
        </CardHeader>
        <CardContent>
          {!effectiveRestaurantId ? (
            <div className="text-sm text-muted-foreground">
              {isSuperAdmin
                ? "Select a restaurant to view options."
                : "No restaurant found for this user."}
            </div>
          ) : (selectedModifierId ? optionsLoading : allOptionsLoading) ? (
            <div className="text-sm text-muted-foreground">Loading options...</div>
          ) : allOptionsErrorCount > 0 ? (
            <div className="text-sm text-muted-foreground">
              Some options could not be loaded. Please try again.
            </div>
          ) : options.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {selectedModifierId
                ? "No options found for this modifier."
                : "No options found for this restaurant."}
            </div>
          ) : (
            <>
              {isSuperAdmin ? (
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Modifier</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Sort</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {options.map((option: any) => (
                        <TableRow key={String(option?.id ?? option?.option_id ?? option?.name)}>
                          <TableCell className="font-medium text-foreground">
                            {option?.name || "-"}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {(() => {
                              const modifierId = String(option?.modifier_id || "");
                              if (!modifierId) return "-";
                              const modifier = modifiers.find(
                                (m: any) => String(m?.id) === modifierId,
                              );
                              return modifier?.name || modifierId;
                            })()}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {normalizePrice(option)}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={normalizeAvailable(option)}
                              disabled={
                                !canEditOption ||
                                !option?.id ||
                                updateOptionMutation.isPending ||
                                !!updatingOptionIds[String(option?.id)]
                              }
                              onCheckedChange={(checked) => {
                                if (!option?.id) return;
                                setPendingToggleUpdate({
                                  option,
                                  field: "available",
                                  nextValue: checked,
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                !canEditOption ||
                                !option?.id ||
                                updateOptionMutation.isPending ||
                                !!updatingOptionIds[String(option?.id)]
                              }
                              onClick={() => {
                                if (!option?.id) return;
                                setPendingToggleUpdate({
                                  option,
                                  field: "hidden",
                                  nextValue: normalizeHidden(option),
                                });
                              }}
                              aria-label={
                                !normalizeHidden(option) ? "Set inactive" : "Set active"
                              }
                            >
                              {!normalizeHidden(option) ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {String(option?.sort_order ?? option?.sortOrder ?? 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(option)}
                                disabled={
                                  !canEditOption ||
                                  !option?.id ||
                                  !normalizeAvailable(option)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                  {options.map((option: any) => (
                    <Card key={String(option?.id ?? option?.option_id ?? option?.name)} className="bg-card border-border">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-bold text-foreground truncate">
                            {option?.name || "-"}
                          </div>
                          <div className="text-xs text-muted-foreground text-right truncate">
                            {(() => {
                              const modifierId = String(option?.modifier_id || "");
                              if (!modifierId) return "-";
                              const modifier = modifiers.find(
                                (m: any) => String(m?.id) === modifierId,
                              );
                              return modifier?.name || modifierId;
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">
                              {!normalizeHidden(option) ? "Active" : "Inactive"}
                            </span>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 transition-none hover:bg-transparent"
                              disabled={
                                !canEditOption ||
                                !option?.id ||
                                updateOptionMutation.isPending ||
                                !!updatingOptionIds[String(option?.id)]
                              }
                              onClick={() => {
                                if (!option?.id) return;
                                setPendingToggleUpdate({
                                  option,
                                  field: "hidden",
                                  nextValue: normalizeHidden(option),
                                });
                              }}
                              aria-label={
                                !normalizeHidden(option) ? "Set inactive" : "Set active"
                              }
                            >
                              {!normalizeHidden(option) ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>

                          <div className="ml-auto flex items-center gap-2 justify-end">
                            <span className="text-sm text-foreground">Available</span>
                            <Switch
                              checked={normalizeAvailable(option)}
                              disabled={
                                !canEditOption ||
                                !option?.id ||
                                updateOptionMutation.isPending ||
                                !!updatingOptionIds[String(option?.id)]
                              }
                              onCheckedChange={(checked) => {
                                if (!option?.id) return;
                                setPendingToggleUpdate({
                                  option,
                                  field: "available",
                                  nextValue: checked,
                                });
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 flex-nowrap">
                          <div className="min-w-0 flex items-baseline gap-2 whitespace-nowrap">
                            <span className="text-xs text-muted-foreground">Price</span>
                            <span className="text-sm font-semibold text-foreground truncate">
                              {formatINR(normalizePrice(option))}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2 whitespace-nowrap">
                            <span className="text-xs text-muted-foreground">Sort</span>
                            <span className="text-sm text-foreground">
                              {String(option?.sort_order ?? option?.sortOrder ?? 0)}
                            </span>
                          </div>
                        </div>

                        {canEditOption && (
                          <Button
                            variant="outline"
                            className="w-full justify-center bg-muted/40 hover:bg-muted/60 h-11"
                            onClick={() => openEdit(option)}
                            disabled={!option?.id || !normalizeAvailable(option)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
