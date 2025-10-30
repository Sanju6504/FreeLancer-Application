import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../services/http.js";

const AdminAuthContext = createContext(undefined);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_user");
      if (raw) setAdmin(JSON.parse(raw));
    } catch {}
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const resp = await http("POST", "/admin/signin", { email, password });
      const adm = resp?.admin || resp;
      const token = resp?.token;
      setAdmin(adm);
      localStorage.setItem("admin_user", JSON.stringify(adm));
      if (token) localStorage.setItem("admin_token", token);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      setAdmin(null);
      localStorage.removeItem("admin_user");
      localStorage.removeItem("admin_token");
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ admin, loading, signIn, signOut }), [admin, loading]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
