const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// Auth
export async function login(username: string, password: string) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function register(username: string, password: string) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

// Users
export async function getUsers() {
  const res = await apiFetch("/users");
  return res.json();
}

export async function updateUser(
  id: number,
  data: { username?: string; password?: string; role?: string }
) {
  const res = await apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteUser(id: number) {
  const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
  return res.json();
}
