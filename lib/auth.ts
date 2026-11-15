import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export function saveTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function getCurrentUser(): JwtPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.exp * 1000 < Date.now()) {
      clearTokens();
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}
