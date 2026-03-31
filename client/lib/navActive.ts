import type { Location } from "react-router-dom";
import type { NavItem } from "@/lib/navigation";

type ActiveMatch = {
  href: string;
  score: number;
  exact: boolean;
};

/**
 * Picks a single "active" nav item for the current location.
 *
 * Matching rules:
 * - Pathname must match exactly.
 * - If the nav item has query params, they must be a subset of the current query.
 * - Prefer the item with more required query params (more specific).
 * - On ties, prefer an exact href match (includes current query).
 */
export function getActiveNavHref(
  items: NavItem[],
  location: Location,
): string | null {
  const currentFullPath = `${location.pathname}${location.search}`;
  const currentSearchParams = new URLSearchParams(location.search);

  let best: ActiveMatch | null = null;

  for (const item of items) {
    const [itemPathname, itemQuery = ""] = item.href.split("?");
    if (itemPathname !== location.pathname) continue;

    const requiredParams = new URLSearchParams(itemQuery);
    let score = 0;
    let matches = true;

    for (const [key, value] of requiredParams.entries()) {
      score += 1;
      if (currentSearchParams.get(key) !== value) {
        matches = false;
        break;
      }
    }

    if (!matches) continue;

    const exact = item.href === currentFullPath;
    if (
      !best ||
      score > best.score ||
      (score === best.score && exact && !best.exact)
    ) {
      best = { href: item.href, score, exact };
    }
  }

  return best?.href ?? null;
}

