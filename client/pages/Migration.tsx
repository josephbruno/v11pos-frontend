import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowRight, RefreshCw, Play, Clock, CheckCircle2, XCircle,
  AlertTriangle, Loader2, BarChart3, List, ChevronRight, Building2,
  Copy, Activity,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import {
  getAllRestaurantsAdmin,
  createDataCopy,
  listDataCopies,
  getDataCopyDetail,
  getDataCopyLogs,
  getDataCopyStatistics,
  type DataCopyOperation,
  type DataCopyCreatePayload,
} from "@/lib/apiServices";
import type { Restaurant } from "@/shared/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const COPY_TYPES: { value: DataCopyCreatePayload["copy_type"]; label: string; desc: string }[] = [
  { value: "full_menu", label: "Full Menu", desc: "Copy everything: categories, products, modifiers, combos" },
  { value: "category_products", label: "Categories + Products", desc: "Copy categories with their products" },
  { value: "category", label: "Categories Only", desc: "Copy only menu categories" },
  { value: "product", label: "Products Only", desc: "Copy only products (without categories)" },
  { value: "modifier", label: "Modifiers Only", desc: "Copy modifier groups and options" },
  { value: "combo", label: "Combos Only", desc: "Copy combo products" },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:    { label: "Queued",    icon: Clock,         color: "text-yellow-600", badge: "outline" },
  processing: { label: "Running",   icon: Loader2,       color: "text-blue-600",   badge: "secondary" },
  completed:  { label: "Completed", icon: CheckCircle2,  color: "text-green-600",  badge: "default" },
  partial:    { label: "Partial",   icon: AlertTriangle, color: "text-orange-500", badge: "outline" },
  failed:     { label: "Failed",    icon: XCircle,       color: "text-red-600",    badge: "destructive" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function fmtDuration(s: number | null) {
  if (!s) return "—";
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function RestaurantOption({ r }: { r: Restaurant }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{r.name}</span>
      <span className="text-xs text-muted-foreground truncate max-w-xs">
        {[r.city, r.state].filter(Boolean).join(", ") || r.address || r.id.slice(0, 8)}
      </span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.badge} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {cfg.label}
    </Badge>
  );
}

// ─── Log Helpers ──────────────────────────────────────────────────────────────

function skipReason(log: any): string {
  if (log.is_duplicate) {
    const field = log.duplicate_field;
    const val = log.duplicate_value;
    if (field === "name") return `Already exists in destination with the same name${val ? ` "${val}"` : ""}`;
    if (field) return `Duplicate ${field}${val ? `: "${val}"` : ""}`;
    return "Duplicate — already exists in destination";
  }
  if (log.error_message) return log.error_message;
  return "Skipped by copy rules";
}

function failReason(log: any): string {
  return log.error_message || log.error_type || "Unknown error";
}

const ENTITY_LABELS: Record<string, string> = {
  category: "Category",
  product: "Product",
  modifier: "Modifier",
  combo: "Combo",
  modifier_option: "Option",
};

function LogSection({ logs }: { logs: any[] }) {
  const [filter, setFilter] = useState<"all" | "copied" | "skipped" | "failed">("all");

  const counts = {
    all: logs.length,
    copied:  logs.filter((l) => l.action_taken === "copied").length,
    skipped: logs.filter((l) => l.action_taken === "skipped").length,
    failed:  logs.filter((l) => l.action_taken === "failed").length,
  };

  const visible = filter === "all" ? logs : logs.filter((l) => l.action_taken === filter);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Copy Log</p>
        <span className="text-xs text-muted-foreground">{logs.length} total items</span>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 flex-wrap">
        {(["all", "copied", "skipped", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? f === "copied"  ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : f === "skipped" ? "bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                : f === "failed"  ? "bg-red-100 border-red-400 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                : "bg-muted border-border text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Skipped explanation banner */}
      {(filter === "skipped" || filter === "all") && counts.skipped > 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>{counts.skipped} item{counts.skipped !== 1 ? "s" : ""} were skipped</strong> because they already exist
            in the destination restaurant with the same name. To overwrite them, run a new migration
            with <em>Skip Duplicates</em> turned off.
          </span>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto border rounded-lg divide-y divide-border">
        {visible.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No items</p>
        ) : (
          visible.map((log, i) => (
            <div key={log.id ?? i} className="flex items-start gap-2 px-3 py-2 text-xs hover:bg-muted/30 transition-colors">
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {log.action_taken === "copied"  && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                {log.action_taken === "skipped" && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                {log.action_taken === "failed"  && <XCircle className="h-3.5 w-3.5 text-red-500" />}
              </div>

              {/* Name + type */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium truncate">{log.source_entity_name}</span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] uppercase tracking-wide">
                    {ENTITY_LABELS[log.source_entity_type] ?? log.source_entity_type}
                  </span>
                </div>

                {/* Reason */}
                {log.action_taken === "skipped" && (
                  <p className="mt-0.5 text-yellow-600 dark:text-yellow-400">{skipReason(log)}</p>
                )}
                {log.action_taken === "failed" && (
                  <p className="mt-0.5 text-red-600 dark:text-red-400">{failReason(log)}</p>
                )}
                {log.action_taken === "copied" && log.destination_entity_id && (
                  <p className="mt-0.5 text-green-600 dark:text-green-400">Copied successfully</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function CopyDetailModal({
  copyId,
  open,
  onClose,
  restaurantMap,
}: {
  copyId: string | null;
  open: boolean;
  onClose: () => void;
  restaurantMap: Record<string, string>;
}) {
  const { data: detailRaw } = useQuery({
    queryKey: ["dataCopyDetail", copyId],
    queryFn: () => getDataCopyDetail(copyId!),
    enabled: !!copyId && open,
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.data?.status ?? (q.state.data as any)?.status;
      return s === "pending" || s === "processing" ? 2000 : false;
    },
    select: (r: any) => r?.data ?? r,
  });

  const { data: logsRaw } = useQuery({
    queryKey: ["dataCopyLogs", copyId],
    queryFn: () => getDataCopyLogs(copyId!, { page_size: 100 }),
    enabled: !!copyId && open,
    select: (r: any) => {
      const src = r?.data ?? r;
      return Array.isArray(src?.items) ? src.items : [];
    },
  });

  const detail: DataCopyOperation | null = detailRaw ?? null;
  const logs: any[] = logsRaw ?? [];
  const stats = detail?.statistics;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            {detail?.copy_number ?? "Copy Details"}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `${restaurantMap[detail.source_restaurant_id] ?? "?"} → ${restaurantMap[detail.destination_restaurant_id] ?? "?"}`
              : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {!detail ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status row */}
            <div className="flex items-center justify-between">
              <StatusBadge status={detail.status} />
              <span className="text-xs text-muted-foreground">{fmtDate(detail.created_at)}</span>
            </div>

            {detail.error_message && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {detail.error_message}
              </div>
            )}

            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Copied",   value: stats.items_copied,  color: "text-green-600" },
                  { label: "Skipped",  value: stats.items_skipped, color: "text-yellow-600" },
                  { label: "Failed",   value: stats.items_failed,  color: "text-red-600" },
                  { label: "Duration", value: fmtDuration(detail.processing_time), color: "text-blue-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 border rounded-lg">
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Entity breakdown */}
            {stats && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Entity Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Categories", stats.categories_copied],
                    ["Products",   stats.products_copied],
                    ["Modifiers",  stats.modifiers_copied],
                    ["Combos",     stats.combos_copied],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between p-2 bg-muted/40 rounded">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <LogSection logs={logs} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Operation Card ───────────────────────────────────────────────────────────

function OperationCard({
  op,
  restaurantMap,
  onDetail,
}: {
  op: DataCopyOperation;
  restaurantMap: Record<string, string>;
  onDetail: () => void;
}) {
  const stats = op.statistics;
  const isRunning = op.status === "pending" || op.status === "processing";
  const total = stats.items_copied + stats.items_skipped + stats.items_failed;
  const pct = total > 0 ? Math.round((stats.items_copied / total) * 100) : (op.status === "completed" ? 100 : 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={op.status} />
              <span className="text-xs text-muted-foreground font-mono">{op.copy_number}</span>
              <Badge variant="outline" className="text-xs capitalize">{op.copy_type.replace("_", " ")}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="font-medium text-sm text-blue-600 truncate max-w-[180px]">
                {restaurantMap[op.source_restaurant_id] ?? op.source_restaurant_id.slice(0, 8)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm text-green-600 truncate max-w-[180px]">
                {restaurantMap[op.destination_restaurant_id] ?? op.destination_restaurant_id.slice(0, 8)}
              </span>
            </div>
            {op.copy_name && !/[0-9a-f]{8}-[0-9a-f]{4}/i.test(op.copy_name) && (
              <p className="text-xs text-muted-foreground mt-1 italic">{op.copy_name}</p>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onDetail}>
            <BarChart3 className="h-4 w-4 mr-1" />
            Details
          </Button>
        </div>

        {/* Progress bar */}
        {(isRunning || op.status === "completed" || op.status === "partial") && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.items_copied} copied · {stats.items_skipped} skipped · {stats.items_failed} failed</span>
              <span>{isRunning ? "Running…" : fmtDuration(op.processing_time)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  op.status === "completed" ? "bg-green-500" :
                  op.status === "partial"   ? "bg-orange-500" :
                  op.status === "failed"    ? "bg-red-500" : "bg-blue-500"
                } ${isRunning ? "animate-pulse" : ""}`}
                style={{ width: `${Math.max(pct, isRunning ? 10 : 0)}%` }}
              />
            </div>
          </div>
        )}

        {op.error_message && (
          <p className="mt-2 text-xs text-red-500 truncate">{op.error_message}</p>
        )}

        <p className="mt-2 text-xs text-muted-foreground">{fmtDate(op.created_at)}</p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Migration() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [copyType, setCopyType] = useState<DataCopyCreatePayload["copy_type"]>("full_menu");
  const [copyName, setCopyName] = useState("");
  const [notes, setNotes] = useState("");
  const [options, setOptions] = useState({
    skip_duplicates: true,
    copy_images: true,
    copy_prices: true,
    copy_stock: false,
    maintain_relationships: true,
    include_inactive: false,
  });

  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("new");

  // Restaurants
  const { data: restaurantsRaw, isLoading: loadingRestaurants } = useQuery({
    queryKey: ["allRestaurantsAdmin"],
    queryFn: () => getAllRestaurantsAdmin(),
    select: (r: any) => {
      const src = r?.data ?? r;
      return (Array.isArray(src) ? src : []) as Restaurant[];
    },
  });
  const restaurants: Restaurant[] = restaurantsRaw ?? [];
  const restaurantMap = Object.fromEntries(restaurants.map((r) => [r.id, r.name]));

  // Operations list — auto-refreshes every 5s
  const { data: copiesRaw, isLoading: loadingCopies, refetch: refetchCopies } = useQuery({
    queryKey: ["dataCopies"],
    queryFn: () => listDataCopies({ page: 1, page_size: 50 }),
    refetchInterval: (q) => {
      const items = q.state.data;
      const hasRunning = Array.isArray(items) &&
        items.some((c: DataCopyOperation) => c.status === "pending" || c.status === "processing");
      return hasRunning ? 2000 : 5000;
    },
    select: (r: any) => {
      const src = r?.data ?? r;
      return (Array.isArray(src?.items) ? src.items : []) as DataCopyOperation[];
    },
  });
  const copies: DataCopyOperation[] = copiesRaw ?? [];
  const active  = copies.filter((c) => c.status === "pending" || c.status === "processing");
  const history = copies.filter((c) => c.status !== "pending" && c.status !== "processing");

  // Statistics
  const { data: statsRaw } = useQuery({
    queryKey: ["dataCopyStats"],
    queryFn: () => getDataCopyStatistics(),
    refetchInterval: 10000,
    select: (r: any) => r?.data ?? r,
  });
  const stats = statsRaw ?? {
    total_copies: 0, total_items_copied: 0,
    total_items_skipped: 0, total_categories_copied: 0, total_products_copied: 0,
  };

  // Mutation
  const mutation = useMutation({
    mutationFn: (payload: DataCopyCreatePayload) => createDataCopy(payload),
    onSuccess: (res: any) => {
      const count = res?.data?.copies?.length ?? 1;
      addToast({ type: "success", title: "Migration Queued", description: `${count} operation(s) sent to Celery worker` });
      queryClient.invalidateQueries({ queryKey: ["dataCopies"] });
      queryClient.invalidateQueries({ queryKey: ["dataCopyStats"] });
      // Force immediate re-fetch so the new job appears instantly
      queryClient.refetchQueries({ queryKey: ["dataCopies"] });
      setSourceId(""); setDestId(""); setCopyName(""); setNotes("");
      // Switch to Active Jobs tab so user sees the running job
      setActiveTab("active");
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Queue Failed", description: err?.message ?? "Unknown error" });
    },
  });

  const canSubmit = !!sourceId && !!destId && sourceId !== destId && !mutation.isPending;
  const selectedCopyType = COPY_TYPES.find((t) => t.value === copyType);

  const handleStart = () => {
    mutation.mutate({
      source_restaurant_id: sourceId,
      destination_restaurant_ids: [destId],
      copy_type: copyType,
      copy_name: copyName || undefined,
      notes: notes || undefined,
      options,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Migration</h1>
          <p className="text-muted-foreground">Copy menu data between restaurants via Celery background jobs</p>
        </div>
        <Button variant="outline" onClick={() => { refetchCopies(); queryClient.invalidateQueries({ queryKey: ["dataCopyStats"] }); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Copies",  value: stats.total_copies,        icon: Copy,         color: "text-blue-600" },
          { label: "Items Copied",  value: stats.total_items_copied,  icon: CheckCircle2, color: "text-green-600" },
          { label: "Items Skipped", value: stats.total_items_skipped, icon: AlertTriangle,color: "text-yellow-600" },
          { label: "Active Jobs",   value: active.length,             icon: Activity,     color: "text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <Icon className={`h-6 w-6 ${color} opacity-60`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">New Migration</TabsTrigger>
          <TabsTrigger value="active" className="relative">
            Active Jobs
            {active.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">{active.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── New Migration ────────────────────────────────────────── */}
        <TabsContent value="new" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Source → Destination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Select Restaurants
                </CardTitle>
                <CardDescription>Choose source and destination</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Source Restaurant</Label>
                  <Select value={sourceId} onValueChange={setSourceId} disabled={loadingRestaurants}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingRestaurants ? "Loading…" : "Select source restaurant"} />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((r) => (
                        <SelectItem key={r.id} value={r.id} disabled={r.id === destId}>
                          <RestaurantOption r={r} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-px w-12 bg-border" />
                    <ArrowRight className="h-5 w-5" />
                    <div className="h-px w-12 bg-border" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Destination Restaurant</Label>
                  <Select value={destId} onValueChange={setDestId} disabled={loadingRestaurants}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingRestaurants ? "Loading…" : "Select destination restaurant"} />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((r) => (
                        <SelectItem key={r.id} value={r.id} disabled={r.id === sourceId}>
                          <RestaurantOption r={r} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sourceId && destId && sourceId === destId && (
                    <p className="text-xs text-red-500">Source and destination must be different</p>
                  )}
                </div>

                <AnimatePresence>
                  {sourceId && destId && sourceId !== destId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg border bg-muted/40 p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-blue-600">{restaurantMap[sourceId]}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-green-600">{restaurantMap[destId]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy type: <strong>{selectedCopyType?.label}</strong>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Copy Type */}
            <Card>
              <CardHeader>
                <CardTitle>Copy Type</CardTitle>
                <CardDescription>Select what data to migrate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {COPY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setCopyType(t.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        copyType === t.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-border hover:bg-accent/30"
                      }`}
                    >
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Options + Notes + Submit */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>Fine-tune copy behaviour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(
                  [
                    { key: "skip_duplicates",        label: "Skip Duplicates",        desc: "Don't overwrite existing items with the same name" },
                    { key: "copy_images",             label: "Copy Images",             desc: "Copy product/category images to destination storage" },
                    { key: "copy_prices",             label: "Copy Prices",             desc: "Include prices in copied products" },
                    { key: "copy_stock",              label: "Copy Stock",              desc: "Copy current stock quantities" },
                    { key: "maintain_relationships",  label: "Maintain Relationships",  desc: "Preserve category-product links" },
                    { key: "include_inactive",        label: "Include Inactive",        desc: "Also copy disabled/inactive items" },
                  ] as { key: keyof typeof options; label: string; desc: string }[]
                ).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between p-3 border rounded-lg gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={options[key]}
                      onCheckedChange={(v) => setOptions((prev) => ({ ...prev, [key]: v }))}
                      className="shrink-0 mt-0.5"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="copy-name">Copy Name (optional)</Label>
                  <input
                    id="copy-name"
                    type="text"
                    value={copyName}
                    onChange={(e) => setCopyName(e.target.value)}
                    placeholder="e.g. Initial menu sync"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copy-notes">Notes (optional)</Label>
                  <Textarea
                    id="copy-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any remarks about this migration…"
                    className="h-10 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={!canSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
                >
                  {mutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Queuing…</>
                  ) : (
                    <><Play className="mr-2 h-4 w-4" />Start Migration</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Active Jobs ──────────────────────────────────────────── */}
        <TabsContent value="active" className="space-y-4">
          {loadingCopies ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : active.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <CheckCircle2 className="h-10 w-10 opacity-30" />
                <p>No active jobs</p>
              </CardContent>
            </Card>
          ) : (
            active.map((op) => (
              <OperationCard key={op.id} op={op} restaurantMap={restaurantMap} onDetail={() => setDetailId(op.id)} />
            ))
          )}
        </TabsContent>

        {/* ── History ─────────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          {loadingCopies ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <List className="h-10 w-10 opacity-30" />
                <p>No migration history yet</p>
              </CardContent>
            </Card>
          ) : (
            history.map((op) => (
              <OperationCard key={op.id} op={op} restaurantMap={restaurantMap} onDetail={() => setDetailId(op.id)} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Detail modal */}
      <CopyDetailModal
        copyId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
        restaurantMap={restaurantMap}
      />
    </motion.div>
  );
}
