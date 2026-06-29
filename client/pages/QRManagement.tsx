import { useEffect, useMemo, useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  QrCode,
  Download,
  Eye,
  Copy,
  Users,
  MapPin,
  Settings as SettingsIcon,
  Printer,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  TrendingUp,
  Image as ImageIcon,
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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { createTable, getMyRestaurants, getTables, updateTable } from "@/lib/apiServices";
import { getImageCropConfig, validateImageFile } from "@/lib/imageCropConfig";
import { formatISTDateOnly } from "@/lib/istDate";
import type { QRTable, QRSession } from "@/shared/api";
import {
  BACKEND_URL,
  buildQrMenuUrl,
  buildRemoteQrImageUrl,
  composeMonkeyQr,
  composeQrSticker,
  ensureTableIdInQrMenuUrl,
  isProbablyImageUrl,
  resolveTableImageSrc,
  safeFilePart,
  triggerDownloadDataUrl,
} from "./qr-management/qrUtils";
import { CreateTableForm } from "./qr-management/CreateTableForm";
import { EditTableForm } from "./qr-management/EditTableForm";
import { QRCodePreview } from "./qr-management/QRCodePreview";
import { QRSettingsForm } from "./qr-management/QRSettingsForm";
export default function QRManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTable, setEditingTable] = useState<QRTable | null>(null);
  const [previewTable, setPreviewTable] = useState<QRTable | null>(null);
  const [qrOnlyTable, setQrOnlyTable] = useState<QRTable | null>(null);
  const [qrOnlyDataUrl, setQrOnlyDataUrl] = useState<string | null>(null);
  const [qrOnlyLoading, setQrOnlyLoading] = useState(false);
  const [qrOnlyError, setQrOnlyError] = useState<string | null>(null);
  const [tables, setTables] = useState<QRTable[]>([]);
  const isSuperAdmin = ["super_admin", "superadmin"].includes(
    String(user?.role || "").toLowerCase().trim(),
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    isSuperAdmin ? "" : String(user?.branchId || ""),
  );
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const { data: restaurantsResponse } = useQuery({
    queryKey: ["my-restaurants", user?.id],
    queryFn: () => getMyRestaurants(0, 500),
    enabled: isSuperAdmin,
    staleTime: 60000,
  });

  const restaurantOptions = (() => {
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
              logoUrl: String(restaurant.logo_url ?? restaurant.logoUrl ?? restaurant.logo ?? ""),
              websiteUrl: String(restaurant.website_url ?? restaurant.websiteUrl ?? ""),
            },
          ]),
      ).values(),
    ) as { id: string; name: string; logoUrl?: string; websiteUrl?: string }[];
  })();

  const currentRestaurantLogoUrl =
    restaurantOptions.find((restaurant) => restaurant.id === selectedRestaurantId)?.logoUrl ||
    String((user as any)?.restaurantLogoUrl ?? (user as any)?.logo_url ?? (user as any)?.logo ?? "");

  const currentRestaurantName =
    restaurantOptions.find((restaurant) => restaurant.id === selectedRestaurantId)?.name ||
    (user as any)?.branchName ||
    (user as any)?.restaurantName ||
    "Current Restaurant";

  const currentRestaurantWebsiteUrl =
    restaurantOptions.find((restaurant) => restaurant.id === selectedRestaurantId)?.websiteUrl ||
    String((user as any)?.websiteUrl ?? (user as any)?.website_url ?? "");

  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedRestaurantId(String(user?.branchId || ""));
    }
  }, [isSuperAdmin, user?.branchId]);

  useEffect(() => {
    if (isSuperAdmin && !selectedRestaurantId && restaurantOptions.length > 0) {
      setSelectedRestaurantId(restaurantOptions[0].id);
    }
  }, [isSuperAdmin, selectedRestaurantId, restaurantOptions]);

  const { data: tablesResponse, refetch: refetchTables } = useQuery({
    queryKey: ["tables", selectedRestaurantId],
    queryFn: () => getTables(selectedRestaurantId),
    enabled: Boolean(selectedRestaurantId),
    staleTime: 60000,
  });

  useEffect(() => {
    if (!selectedRestaurantId) {
      setTables([]);
      return;
    }
    const payload: any = tablesResponse;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.tables ??
      payload?.data ??
      payload;
    const items = Array.isArray(source) ? source : [];

    if (!items.length) {
      setTables([]);
      return;
    }

    const normalizedTables = items.map((table: any, index: number) => {
      const id = String(table.id ?? table.table_id ?? table.tableId ?? "");
      const restaurant_id = String(
        table.restaurant_id ?? table.restaurantId ?? selectedRestaurantId ?? "",
      );
      const tableNumber = String(
        table.table_number ??
          table.tableNumber ??
          table.table_name ??
          table.tableName ??
          table.name ??
          "",
      );
      const safeTableNumber = tableNumber || id || `Table-${index + 1}`;
      const tableName = String(
        table.table_name ?? table.tableName ?? table.name ?? safeTableNumber,
      );
      const capacity = Number(table.capacity ?? table.seats ?? 0);
      const section = String(table.section ?? table.location ?? table.area ?? "");
      const floor = String(table.floor ?? "");
      const qrToken = String(
        table.qr_token ??
          table.qrToken ??
          table.qr_code_token ??
          table.qrCodeToken ??
          table.qr_code ??
          table.qrCode ??
          table.qr ??
          id ??
          safeTableNumber,
      );
      let qrCodeUrl = String(
        table.qr_code_url ??
          table.qrCodeUrl ??
          table.qr_url ??
          (qrToken ? buildQrMenuUrl(baseUrl, qrToken, id || safeTableNumber) : ""),
      );

      if (currentRestaurantWebsiteUrl) {
        const base = currentRestaurantWebsiteUrl.endsWith("/")
          ? currentRestaurantWebsiteUrl
          : currentRestaurantWebsiteUrl + "/";
        qrCodeUrl = `${base}table/${id || safeTableNumber}`;
      } else {
        qrCodeUrl = ensureTableIdInQrMenuUrl(qrCodeUrl, id || safeTableNumber);
      }

      return {
        id: id || `table-${index + 1}`,
        restaurant_id: restaurant_id || undefined,
        tableNumber: safeTableNumber,
        tableName,
        location: section || floor || "Main Floor",
        capacity: capacity || 1,
        min_capacity: table.min_capacity ?? table.minCapacity ?? undefined,
        floor: floor || undefined,
        section: section || undefined,
        position_x: table.position_x ?? table.positionX ?? undefined,
        position_y: table.position_y ?? table.positionY ?? undefined,
        image: table.image ?? undefined,
        qr_code: table.qr_code ?? table.qrCode ?? undefined,
        status: table.status ?? undefined,
        is_bookable: table.is_bookable ?? table.isBookable ?? undefined,
        is_outdoor: table.is_outdoor ?? table.isOutdoor ?? undefined,
        is_accessible: table.is_accessible ?? table.isAccessible ?? undefined,
        has_power_outlet: table.has_power_outlet ?? table.hasPowerOutlet ?? undefined,
        minimum_spend: table.minimum_spend ?? table.minimumSpend ?? undefined,
        description: table.description ?? undefined,
        notes: table.notes ?? undefined,
        qrCodeUrl,
        qrToken,
        isActive: table.is_active ?? table.isActive ?? true,
        isOccupied: table.is_occupied ?? table.isOccupied ?? false,
        currentSessionId:
          table.current_session_id ?? table.currentSessionId ?? undefined,
        createdAt: table.created_at ? new Date(table.created_at) : new Date(),
        lastUsed: table.last_used ? new Date(table.last_used) : undefined,
      } as QRTable;
    });

    setTables(normalizedTables);
  }, [tablesResponse, baseUrl, selectedRestaurantId, currentRestaurantWebsiteUrl]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!qrOnlyTable) return;
      setQrOnlyLoading(true);
      setQrOnlyError(null);
      setQrOnlyDataUrl(null);

      const qrSrcCandidate = String((qrOnlyTable as any).qr_code ?? "").trim();
      const qrSrc = isProbablyImageUrl(qrSrcCandidate)
        ? qrSrcCandidate
        : qrOnlyTable.qrCodeUrl
          ? buildRemoteQrImageUrl(qrOnlyTable.qrCodeUrl)
          : "";

      if (!qrSrc) {
        setQrOnlyError("QR image is not available for this table.");
        setQrOnlyLoading(false);
        return;
      }

      try {
        const dataUrl = await composeQrSticker({
          qrSrc,
          logoSrc: currentRestaurantLogoUrl,
          restaurantName: currentRestaurantName,
          tableLabel: String(qrOnlyTable.tableNumber || "").trim(),
          providerName: "V11TECH",
        });
        if (cancelled) return;
        setQrOnlyDataUrl(dataUrl);
      } catch (error: any) {
        if (cancelled) return;
        setQrOnlyError(
          error?.message ||
            "Could not render QR image. This can happen due to image CORS restrictions.",
        );
      } finally {
        if (cancelled) return;
        setQrOnlyLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [qrOnlyTable, currentRestaurantLogoUrl]);

  const downloadQrOnly = () => {
    if (!qrOnlyTable || !qrOnlyDataUrl) return;
    const filename = `${safeFilePart(currentRestaurantName)}_${safeFilePart(
      String(qrOnlyTable.tableNumber || qrOnlyTable.tableName || "table"),
    )}_sticker.png`;
    triggerDownloadDataUrl(qrOnlyDataUrl, filename);
    addToast({
      type: "success",
      title: "Downloaded",
      description: "QR image downloaded as PNG.",
    });
  };

  const filteredTables = tables.filter((table) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      table.tableNumber.toLowerCase().includes(query) ||
      table.tableName.toLowerCase().includes(query);
    const matchesLocation =
      selectedLocation === "all" || table.location === selectedLocation;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" ? table.isActive : !table.isActive);
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const createTableMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Table Created",
        description: "Table has been created successfully",
      });
      setIsAddingTable(false);
      refetchTables();
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Table",
        description: error?.message || "An error occurred while creating the table",
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTable(id, data),
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Table Updated",
        description: "Table has been updated successfully",
      });
      setEditingTable(null);
      refetchTables();
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Table",
        description: error?.message || "An error occurred while updating the table",
      });
    },
  });

  const handleSaveTable = (tableData: any) => {
    const restaurantId = String(tableData.restaurant_id || selectedRestaurantId || "").trim();
    const tableNumber = String(tableData.table_number || "").trim();
    const tableName = String(tableData.table_name || "").trim();
    const capacity = Number(tableData.capacity || 0);
    const minCapacity =
      tableData.min_capacity === "" || tableData.min_capacity === undefined
        ? undefined
        : Number(tableData.min_capacity);
    const floor = String(tableData.floor || "").trim() || undefined;
    const section = String(tableData.section || "").trim() || undefined;
    const positionX =
      tableData.position_x === "" || tableData.position_x === undefined
        ? undefined
        : Number(tableData.position_x);
    const positionY =
      tableData.position_y === "" || tableData.position_y === undefined
        ? undefined
        : Number(tableData.position_y);
    const image = tableData.image_file instanceof File ? tableData.image_file : (String(tableData.image || "").trim() || undefined);
    const qrCode = String(tableData.qr_code || "").trim() || undefined;
    const status = String(tableData.status || "").trim() || undefined;
    const isBookable = tableData.is_bookable ?? true;
    const isOutdoor = tableData.is_outdoor ?? false;
    const isAccessible = tableData.is_accessible ?? false;
    const hasPowerOutlet = tableData.has_power_outlet ?? false;
    const minimumSpend =
      tableData.minimum_spend === "" || tableData.minimum_spend === undefined
        ? undefined
        : Number(tableData.minimum_spend);
    const description = String(tableData.description || "").trim() || undefined;
    const notes = String(tableData.notes || "").trim() || undefined;
    const isActive = tableData.is_active ?? true;

    if (!restaurantId) {
      addToast({
        type: "error",
        title: "Restaurant Required",
        description: "Please select a restaurant before creating a table.",
      });
      return;
    }
    if (!tableNumber) {
      addToast({
        type: "error",
        title: "Table Number Required",
        description: "Please enter a table number.",
      });
      return;
    }
    if (!capacity || capacity <= 0) {
      addToast({
        type: "error",
        title: "Capacity Required",
        description: "Please enter a valid capacity.",
      });
      return;
    }

    const finalPayload = {
      restaurant_id: restaurantId,
      table_number: tableNumber,
      table_name: tableName,
      capacity,
      min_capacity: minCapacity,
      floor,
      section,
      position_x: positionX,
      position_y: positionY,
      image,
      qr_code: qrCode,
      status,
      is_bookable: isBookable,
      is_outdoor: isOutdoor,
      is_accessible: isAccessible,
      has_power_outlet: hasPowerOutlet,
      minimum_spend: minimumSpend,
      description,
      notes,
      is_active: isActive,
    };

    if (!editingTable?.id) return;
    updateTableMutation.mutate({ id: editingTable.id, data: finalPayload });
  };

  const deleteTable = (tableId: string) => {
    setTables(tables.filter((t) => t.id !== tableId));
  };

  const toggleTableStatus = (tableId: string) => {
    setTables(
      tables.map((table) =>
        table.id === tableId ? { ...table, isActive: !table.isActive } : table,
      ),
    );
  };

  const getTableStats = () => {
    return {
      total: tables.length,
      active: tables.filter((t) => t.isActive).length,
      occupied: tables.filter((t) => t.isOccupied).length,
      available: tables.filter((t) => t.isActive && !t.isOccupied).length,
    };
  };

  const stats = getTableStats();
  const locations = Array.from(new Set(tables.map((t) => t.location)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QR Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage QR codes, tables, and ordering settings
          </p>
        </div>
        <Dialog open={isAddingTable} onOpenChange={setIsAddingTable}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                Add New Table
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-foreground">Restaurant</Label>
              {isSuperAdmin ? (
                <Select
                  value={selectedRestaurantId || "none"}
                  onValueChange={(value) =>
                    setSelectedRestaurantId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
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
              ) : (
                <Input value={currentRestaurantName} disabled />
              )}
            </div>
            <CreateTableForm
              onSave={(values) => {
                const restaurantId = String(selectedRestaurantId || "").trim();
                const tableNumber = String(values.table_number || "").trim();
                const tableName = String(values.table_name || "").trim();
                const location = String(values.location || "").trim();
                const capacity = Number(values.capacity || 0);
                const isActive = values.is_active ?? true;
                const image = values.image_file;

                if (!restaurantId) {
                  addToast({
                    type: "error",
                    title: "Restaurant Required",
                    description: "Please select a restaurant before creating a table.",
                  });
                  return;
                }
                if (!tableNumber) {
                  addToast({
                    type: "error",
                    title: "Table Number Required",
                    description: "Please enter a table number.",
                  });
                  return;
                }
                if (!capacity || capacity <= 0) {
                  addToast({
                    type: "error",
                    title: "Capacity Required",
                    description: "Please enter a valid capacity.",
                  });
                  return;
                }

                createTableMutation.mutate({
                  restaurant_id: restaurantId,
                  table_number: tableNumber,
                  table_name: tableName || undefined,
                  capacity,
                  location: location || undefined,
                  is_active: !!isActive,
                  image,
                });
              }}
              onCancel={() => setIsAddingTable(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.active}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.occupied}
              </div>
              <div className="text-sm text-muted-foreground">Occupied</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {stats.available}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables">
        <TabsList className="bg-muted border-border">
          <TabsTrigger
            value="tables"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Tables & QR Codes
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            QR Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          {/* Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {isSuperAdmin ? (
                  <Select
                    value={selectedRestaurantId || "none"}
                    onValueChange={(value) =>
                      setSelectedRestaurantId(value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full lg:w-60 bg-background border-border text-foreground">
                      <SelectValue placeholder="Restaurant" />
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
                ) : (
                  <Input
                    value={currentRestaurantName}
                    disabled
                    className="w-full lg:w-60 bg-background border-border text-foreground"
                  />
                )}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex">
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger className="w-full lg:w-48 bg-background border-border text-foreground">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setSelectedStatus(value as "all" | "active" | "inactive")
                    }
                  >
                    <SelectTrigger className="w-full lg:w-44 bg-background border-border text-foreground">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTables.map((table) => (
              <Card
                key={table.id}
                className={`bg-card border-border overflow-hidden hover:shadow-lg transition-shadow group ${
                  !table.isActive ? "opacity-60" : ""
                }`}
              >
                {table.image && (
                  <div className="aspect-video w-full overflow-hidden border-b border-border bg-muted">
                    <img 
                      src={table.image} 
                      alt={table.tableName} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-card-foreground flex items-center">
                        {table.tableName}
                        {table.isOccupied && (
                          <Badge className="ml-2 bg-red-500 text-white">
                            Occupied
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {table.tableNumber} • {table.location}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {table.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="text-foreground flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {table.capacity} people
                    </span>
                  </div>

                  {table.lastUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="text-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatISTDateOnly(table.lastUsed)}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                    {table.qrCodeUrl}
                  </div>

                  <div className="flex items-center space-x-2">

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrOnlyTable(table)}
                      className="border-border text-blue-600 hover:text-blue-700"
                      title="Show QR"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTableStatus(table.id)}
                      className={`border-border ${
                        table.isActive
                          ? "text-red-500 hover:text-red-500"
                          : "text-green-500 hover:text-green-500"
                      }`}
                    >
                      {table.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>

                    <Dialog
                      open={Boolean(editingTable)}
                      onOpenChange={(open) => {
                        if (!open) setEditingTable(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingTable(table)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-card-foreground">
                            Edit Table
                          </DialogTitle>
                        </DialogHeader>
                        <EditTableForm
                          table={editingTable || undefined}
                          restaurantId={String((editingTable as any)?.restaurant_id || selectedRestaurantId || "")}
                          onSave={handleSaveTable}
                          onCancel={() => setEditingTable(null)}
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Delete option removed as requested */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTables.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="text-center py-12">
                <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No tables found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {!selectedRestaurantId && isSuperAdmin
                    ? "Select a restaurant to view its tables"
                    : searchQuery ||
                        selectedLocation !== "all" ||
                        selectedStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first QR table to get started"}
                </p>
                {!selectedRestaurantId && isSuperAdmin ? null : !searchQuery &&
                  selectedLocation === "all" &&
                  selectedStatus === "all" && (
                  <Button
                    onClick={() => setIsAddingTable(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Table
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <QRSettingsForm />
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(qrOnlyTable)}
        onOpenChange={(open) => {
          if (open) return;
          setQrOnlyTable(null);
          setQrOnlyDataUrl(null);
          setQrOnlyError(null);
          setQrOnlyLoading(false);
        }}
      >
        <DialogContent className="bg-card border-border max-w-xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold flex items-center">
              <QrCode className="mr-2 h-5 w-5 text-primary" />
              QR Sticker Preview
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Preview and download the stylized QR sticker for {qrOnlyTable?.tableName || "this table"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-10 bg-muted/30">
            {qrOnlyLoading ? (
              <div className="w-80 h-[480px] bg-background rounded-2xl flex flex-col items-center justify-center shadow-inner">
                <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
                <span className="text-sm text-muted-foreground animate-pulse font-medium">Generating high-quality sticker...</span>
              </div>
            ) : qrOnlyDataUrl ? (
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-blue-400/20 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <button
                  type="button"
                  onClick={downloadQrOnly}
                  className="relative bg-white rounded-[2rem] p-8 shadow-2xl border border-white/20 transform transition duration-500 hover:scale-[1.02]"
                  title="Click to download"
                >
                  <img src={qrOnlyDataUrl} alt="QR sticker" className="w-[400px] max-w-full h-auto rounded-lg" />
                </button>
              </div>
            ) : (
              <div className="w-full py-16 text-center text-sm text-destructive bg-destructive/5 rounded-2xl border border-destructive/20">
                <XCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                {qrOnlyError || "Unable to render QR sticker"}
              </div>
            )}
          </div>

          <div className="p-6 pt-0 flex gap-4">
            <Button
              variant="outline"
              onClick={() => setQrOnlyTable(null)}
              className="flex-1 border-border py-6"
            >
              Cancel
            </Button>
            {qrOnlyDataUrl ? (
              <Button
                onClick={downloadQrOnly}
                className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 py-6"
              >
                <Download className="mr-2 h-5 w-5" />
                Download PNG Sticker
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
