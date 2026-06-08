import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUsageLimits } from "@/lib/apiServices";

const BILLING_ALLOWED = ["/admin/billing", "/login"];

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const restaurantId = user?.branchId ?? "";

  const { data: usage } = useQuery({
    queryKey: ["subscription-guard", restaurantId],
    queryFn: async () => {
      const res: any = await getUsageLimits(restaurantId);
      return res?.data ?? res;
    },
    enabled: !!restaurantId && user?.role === "admin",
    staleTime: 60_000,
  });

  const blocked =
    user?.role === "admin" &&
    restaurantId &&
    usage &&
    usage.is_operational === false;

  useEffect(() => {
    if (!blocked) return;
    const path = location.pathname;
    const allowed = BILLING_ALLOWED.some((p) => path.startsWith(p));
    if (!allowed) {
      navigate("/admin/billing", { replace: true });
    }
  }, [blocked, location.pathname, navigate]);

  const trialDays =
    usage?.trial_ends_at != null
      ? Math.ceil((new Date(usage.trial_ends_at).getTime() - Date.now()) / 86400000)
      : null;

  const showTrialWarning =
    user?.role === "admin" &&
    trialDays != null &&
    trialDays > 0 &&
    trialDays <= 7 &&
    usage?.is_operational !== false;

  return (
    <>
      {showTrialWarning && !location.pathname.startsWith("/admin/billing") && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Trial ends in {trialDays} day{trialDays === 1 ? "" : "s"}.{" "}
          <a href="/admin/billing" className="underline font-medium">
            Choose a plan
          </a>
        </div>
      )}
      {children}
    </>
  );
}
