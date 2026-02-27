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

    // Handle 401 — redirect to login via full page load
    if (res.status === 401) {
      // Only redirect if not already on the login page (avoid loops)
      if (window.location.pathname !== "/login") {
        const returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
      return { error: "Session expired. Please log in again.", status: 401 };
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
