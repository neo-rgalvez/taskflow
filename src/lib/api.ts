/**
 * Typed fetch wrapper for client-side API calls.
 * Handles JSON parsing, error responses, and 401 detection.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; errors?: Record<string, string[]>; status: number }> {
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    // Handle 401 — redirect to login (full page load to trigger middleware)
    if (res.status === 401) {
      const currentPath = window.location.pathname;
      const loginUrl = `/login${currentPath !== "/login" ? `?returnUrl=${encodeURIComponent(currentPath)}` : ""}`;
      window.location.replace(loginUrl);
      return { error: "Unauthorized", status: 401 };
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        error: json?.error || `Request failed (${res.status})`,
        errors: json?.errors,
        status: res.status,
      };
    }

    return { data: json as T, status: res.status };
  } catch {
    return { error: "Network error. Please check your connection.", status: 0 };
  }
}
