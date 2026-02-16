/**
 * Route-to-RBAC mapping
 * Maps URL paths to required sidebar item IDs for access control.
 * Used by AccessProtectedRoute to enforce route-level RBAC.
 */

/**
 * Get the required item ID for a given path.
 * Returns null if the path has no RBAC requirement (e.g. public or catch-all).
 *
 * - /dashboard -> 'dashboard'
 * - /superset-dashboard/:uuid -> 'report:{uuid}'
 * - /superset-dashboard (no uuid) -> allow (redirects internally)
 * - /admin/* -> 'admin:{route}'
 */
export function getRequiredItemIdForPath(pathname: string): string | null {
  if (!pathname || pathname === '/') return 'dashboard'; // redirect target

  if (pathname === '/dashboard') return 'dashboard';

  const supersetMatch = pathname.match(/^\/superset-dashboard\/([^/]+)$/);
  if (supersetMatch) {
    return `report:${supersetMatch[1]}`;
  }

  // /superset-dashboard without uuid - will redirect internally
  if (pathname === '/superset-dashboard') return null;

  const adminMatch = pathname.match(/^\/admin\/([^/]+)$/);
  if (adminMatch) {
    return `admin:${adminMatch[1]}`;
  }

  return null;
}

