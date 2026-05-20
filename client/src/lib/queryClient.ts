import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function resolveApiUrl(url: string): string {
  if (!API_BASE_URL || /^https?:\/\//i.test(url)) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token if available
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    // Auth not available, continue without token
    console.warn('[apiRequest] Failed to get auth token:', error);
  }

  const res = await fetch(resolveApiUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Better error handling - check content-type before parsing JSON
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    const text = await res.text();
    if (contentType?.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        throw new Error(json.error || json.message || `${res.status}: ${text.slice(0, 100)}`);
      } catch (e) {
        throw new Error(`${res.status}: ${text.slice(0, 100)}`);
      }
    }
    throw new Error(`${res.status}: ${text.slice(0, 100)}`);
  }

  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON, got ${contentType}. Response: ${text.slice(0, 100)}`);
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(resolveApiUrl(queryKey.join("/") as string), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
