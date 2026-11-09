const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const access_token = localStorage.getItem("access_token");
  const refresh_token = localStorage.getItem("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isLoggedIn(): boolean {
  return getTokens() !== null;
}

async function refreshAccessToken(refresh_token: string): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  const json: ApiResponse<AuthTokens> = await res.json();
  if (!res.ok) throw new Error(json.message || "Refresh failed");
  return json.data;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (tokens) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  let res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401 && tokens) {
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      setTokens(newTokens);
      headers["Authorization"] = `Bearer ${newTokens.access_token}`;
      res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    } catch {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  const json: ApiResponse<T> = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Request failed");
  }
  return json.data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(data);
  return data;
}

export async function register(name: string, email: string, password: string) {
  const data = await apiFetch<{ user: { id: number; name: string; email: string }; access_token: string; refresh_token: string }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify({ name, email, password }) }
  );
  setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
  return data;
}

export async function getProfile(): Promise<User> {
  // /user/me returns the raw JWT payload { sub, email, username } -> normalize it
  const payload = await apiFetch<{ sub: number; email: string; username: string }>(
    "/user/me"
  );
  return { id: payload.sub, name: payload.username, email: payload.email };
}

export async function getUsers(name?: string): Promise<User[]> {
  const query = name ? `?name=${encodeURIComponent(name)}` : "";
  return apiFetch<User[]>(`/user${query}`);
}

export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  return apiFetch<User>("/user", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

// NOTE: the backend's PUT /user only updates the *currently logged-in* user.
export async function updateUser(dto: {
  name?: string;
  email?: string;
  password?: string;
}): Promise<User> {
  return apiFetch<User>("/user", {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

// Requires the "role: admin" header (checked by the backend RoleGuard).
export async function deleteUser(id: number): Promise<void> {
  return apiFetch<void>(`/user/${id}`, {
    method: "DELETE",
    headers: { role: "admin" },
  });
}

export function logout() {
  clearTokens();
  window.location.href = "/login";
}
