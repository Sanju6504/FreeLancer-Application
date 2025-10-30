import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { http } from "../services/http.js";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        const stored = JSON.parse(raw);
        setUser(stored);
        const derivedProfile = stored?.profile
          ? { id: stored._id || stored.id, ...stored.profile }
          : null;
        setProfile(derivedProfile);
      }
    } catch {}
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      let resp;
      try {
        // Try employer auth first
        resp = await http("POST", "/employers/signin", { email, password });
      } catch (err1) {
        // Fallback to user auth
        resp = await http("POST", "/auth/signin", { email, password });
      }

      const signedInUser = resp?.user || resp?.employer || resp;
      const token = resp?.token;

      setUser(signedInUser);
      const derivedProfile = signedInUser?.profile
        ? { id: signedInUser._id || signedInUser.id, ...signedInUser.profile }
        : null;
      setProfile(derivedProfile);
      localStorage.setItem("auth_user", JSON.stringify(signedInUser));
      if (token) localStorage.setItem("auth_token", token);
    } finally {
      setLoading(false);
    }
  };

  // Reload the current user's profile from backend and sync context/localStorage
  const reloadProfile = async () => {
    if (!user) return;
    try {
      const latest = await http("GET", `/users/${user._id || user.id}`);
      const mergedUser = { ...user, ...latest };
      setUser(mergedUser);
      const derivedProfile = latest?.profile
        ? { id: latest._id || latest.id, ...latest.profile }
        : null;
      setProfile(derivedProfile);
      localStorage.setItem("auth_user", JSON.stringify(mergedUser));
    } catch (e) {
      console.error("Failed to reload profile", e);
    }
  };

  const signUp = async (email, password, fullName, role, title) => {
    setLoading(true);
    try {
      const isEmployer = role === "employer";
      const path = isEmployer ? "/employers/signup" : "/auth/signup";
      const resp = await http("POST", path, {
        email,
        password,
        fullName,
        role,
        title,
      });
      const created = resp?.user || resp?.employer || resp;
      const token = resp?.token;

      setUser(created);
      const derivedProfile = created?.profile
        ? { id: created._id || created.id, ...created.profile }
        : null;
      setProfile(derivedProfile);
      localStorage.setItem("auth_user", JSON.stringify(created));
      if (token) localStorage.setItem("auth_token", token);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await http("POST", "/auth/signout");
      setUser(null);
      setProfile(null);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    setLoading(true);
    try {
      const updated = await http(
        "PATCH",
        `/auth/profile/${user._id || user.id}`,
        updates
      );
      const mergedUser = { ...user, profile: updated };
      setUser(mergedUser);
      setProfile({ id: user._id || user.id, ...updated });
      localStorage.setItem("auth_user", JSON.stringify(mergedUser));
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, profile, loading, signIn, signUp, signOut, updateProfile, reloadProfile }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
