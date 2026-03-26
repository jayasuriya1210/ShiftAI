import { createContext, useContext, useMemo, useState } from "react";
import { apiFetch, setAuthToken } from "./api";

type User = {
  id: string;
  employeeId: string;
  email?: string;
  name: string;
  role: "employee" | "admin";
};

type AuthContextValue = {
  user: User | null;
  token: string;
  login: (payload: { employeeId?: string; email?: string; password: string }) => Promise<void>;
  register: (payload: { employeeId: string; email?: string; name: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "shiftlog_user";

const readStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser());
  const [token, setToken] = useState<string>(
    localStorage.getItem("shiftlog_token") || ""
  );

  const login: AuthContextValue["login"] = async (payload) => {
    const data = await apiFetch<{
      token: string;
      user: User;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setAuthToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register: AuthContextValue["register"] = async (payload) => {
    const data = await apiFetch<{
      token: string;
      user: User;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setAuthToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setAuthToken("");
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, login, register, logout }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
