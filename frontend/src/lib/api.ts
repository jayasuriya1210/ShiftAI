export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getAuthToken = () =>
  localStorage.getItem("shiftlog_token") || "";

export const setAuthToken = (token: string) => {
  if (token) {
    localStorage.setItem("shiftlog_token", token);
  } else {
    localStorage.removeItem("shiftlog_token");
  }
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
