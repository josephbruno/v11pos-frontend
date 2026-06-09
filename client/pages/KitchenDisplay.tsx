import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChefHat,
  CheckCircle,
  Play,
  Printer,
  RefreshCw,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  acknowledgeKdsDisplay,
  bumpKdsDisplay,
  completeKdsDisplay,
  getKdsDisplaysByStation,
  getKdsStations,
  printKot,
  startKdsDisplay,
  updateKdsItemStatus,
} from "@/lib/apiServices";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000/api/v1";

function unwrapList(res: unknown): any[] {
  const r = res as { data?: unknown };
  const src = r?.data ?? res;
  if (Array.isArray(src)) return src;
  if (src && typeof src === "object") {
    const obj = src as Record<string, unknown>;
    for (const key of ["stations", "displays", "items", "data"]) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
}

function getKdsWsUrl(restaurantId: string, stationId: string) {
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  return `${wsBase}/kds/ws/station/${restaurantId}/${stationId}`;
}

export default function KitchenDisplay() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";
  const [stationId, setStationId] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  const { data: stationsRaw, isLoading: loadingStations } = useQuery({
    queryKey: ["kdsStations", restaurantId],
    queryFn: () => getKdsStations(restaurantId),
    enabled: !!restaurantId,
  });

  const stations = useMemo(() => unwrapList(stationsRaw), [stationsRaw]);

  useEffect(() => {
    if (!stationId && stations.length > 0) {
      setStationId(String(stations[0].id));
    }
  }, [stations, stationId]);

  const { data: displaysRaw, isLoading: loadingDisplays, refetch } = useQuery({
    queryKey: ["kdsDisplays", stationId],
    queryFn: () => getKdsDisplaysByStation(stationId),
    enabled: !!stationId,
    refetchInterval: 15_000,
  });

  const displays = useMemo(() => unwrapList(displaysRaw), [displaysRaw]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["kdsDisplays", stationId] });
  }, [queryClient, stationId]);

  useEffect(() => {
    if (!restaurantId || !stationId) return;

    const ws = new WebSocket(getKdsWsUrl(restaurantId, stationId));
    wsRef.current = ws;

    ws.onmessage = () => invalidate();
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "ping" }));
    };

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);

    return () => {
      clearInterval(ping);
      ws.close();
      wsRef.current = null;
    };
  }, [restaurantId, stationId, invalidate]);

  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      displayId,
      itemId,
      status,
    }: {
      action: string;
      displayId: string;
      itemId?: string;
      status?: string;
    }) => {
      switch (action) {
        case "acknowledge":
          return acknowledgeKdsDisplay(displayId);
        case "start":
          return startKdsDisplay(displayId);
        case "complete":
          return completeKdsDisplay(displayId);
        case "bump":
          return bumpKdsDisplay(displayId);
        case "print":
          return printKot(displayId, "text");
        case "item_status":
          if (!itemId || !status) throw new Error("Missing item");
          return updateKdsItemStatus(itemId, status);
        default:
          throw new Error("Unknown action");
      }
    },
    onSuccess: (_, vars) => {
      invalidate();
      if (vars.action === "print") addToast({ title: "KOT sent to printer", type: "success" });
      else addToast({ title: "Ticket updated", type: "success" });
    },
    onError: (err: Error) => addToast({ title: err.message || "Action failed", type: "error" }),
  });

  if (!restaurantId) {
    return (
      <div className="p-6 text-muted-foreground">Select a restaurant to view the kitchen display.</div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-pos-accent" />
            Kitchen Display
          </h1>
          <p className="text-muted-foreground text-sm">Live tickets by station</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={stationId} onValueChange={setStationId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={loadingStations ? "Loading..." : "Select station"} />
            </SelectTrigger>
            <SelectContent>
              {stations.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name ?? `Station ${s.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loadingDisplays}>
            <RefreshCw className={`h-4 w-4 ${loadingDisplays ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {stations.length === 0 && !loadingStations && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No KDS stations found. Refresh the page — a default Main Kitchen station is
            created automatically on first load.
          </CardContent>
        </Card>
      )}

      {loadingStations && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading kitchen stations...
          </CardContent>
        </Card>
      )}

      {loadingDisplays && stationId && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading kitchen tickets...
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {displays.map((display: any) => (
          <Card key={display.id} className="border-pos-secondary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  #{display.order_number ?? display.order_id?.slice(-6) ?? display.id?.slice(-6)}
                </CardTitle>
                <Badge variant="outline">{display.status ?? "pending"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {display.table_number ? `Table ${display.table_number}` : display.order_type ?? "dine_in"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1 text-sm">
                {(display.items ?? []).map((item: any) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>
                      {item.quantity}x {item.product_name ?? item.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {item.status ?? "pending"}
                    </Badge>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ action: "acknowledge", displayId: display.id })}
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Ack
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ action: "start", displayId: display.id })}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ action: "complete", displayId: display.id })}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ action: "bump", displayId: display.id })}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Bump
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ action: "print", displayId: display.id })}
                >
                  <Printer className="h-3 w-3 mr-1" />
                  KOT
                </Button>
              </div>
              {(display.items ?? []).map((item: any) =>
                item.status !== "ready" ? (
                  <Button
                    key={`ready-${item.id}`}
                    size="sm"
                    className="w-full"
                    variant="secondary"
                    disabled={actionMutation.isPending}
                    onClick={() =>
                      actionMutation.mutate({
                        action: "item_status",
                        displayId: display.id,
                        itemId: item.id,
                        status: "ready",
                      })
                    }
                  >
                    Mark {item.product_name ?? "item"} ready
                  </Button>
                ) : null,
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {displays.length === 0 && stationId && !loadingDisplays && stations.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No active tickets for this station. New orders from the POS are sent here
            automatically when placed.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
