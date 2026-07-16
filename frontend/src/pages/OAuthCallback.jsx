import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosClient";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login");
      return;
    }
    localStorage.setItem("ironmind_token", token);
    apiClient
      .get("/api/auth/me")
      .then(({ data }) => {
        localStorage.setItem("ironmind_user", JSON.stringify(data));
        setUser(data);
        navigate("/dashboard");
      })
      .catch(() => navigate("/login"));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-void text-bone">
      <p>Signing you in…</p>
    </div>
  );
}
