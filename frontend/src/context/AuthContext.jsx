import React, { createContext, useContext, useState } from "react";
import apiClient from "../api/axiosClient";
import { disconnectSocket } from "../api/socketClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ironmind_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const { data } = await apiClient.post("/api/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("ironmind_token", data.access_token);
      localStorage.setItem("ironmind_user", JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.detail || "Login failed. Check your credentials.",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password, goal) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/auth/register", {
        full_name: fullName,
        email,
        password,
        goal,
      });
      localStorage.setItem("ironmind_token", data.access_token);
      localStorage.setItem("ironmind_user", JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.detail || "Registration failed.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("ironmind_token");
    localStorage.removeItem("ironmind_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
