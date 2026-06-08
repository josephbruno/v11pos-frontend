import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const CUSTOMER_APP_URL =
  (import.meta.env.VITE_CUSTOMER_APP_URL as string)?.replace(/\/+$/, "") ||
  "http://localhost:8080";

/** Redirect legacy v11pos QR routes to the dedicated customer app (client-frontend). */
export function CustomerAppRedirect({ path }: { path: string }) {
  const params = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let target = `${CUSTOMER_APP_URL}${path}`;
    const tableToken = params.tableToken;
    const orderId = params.orderId;

    if (tableToken) {
      const qs = searchParams.toString();
      target = `${CUSTOMER_APP_URL}/order/validate?table=${encodeURIComponent(tableToken)}${qs ? `&${qs}` : ""}`;
    } else if (orderId) {
      target = `${CUSTOMER_APP_URL}/orders`;
    }

    window.location.replace(target);
  }, [path, params.tableToken, params.orderId, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
      <p className="text-muted-foreground">Redirecting to customer ordering…</p>
    </div>
  );
}
