import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { Mail, Lock } from "lucide-react";

export function AdminLogin() {
  const { signIn, loading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(email, password);
      navigate("/admin/dashboard", { replace: true });
    } catch (e) {
      setError(e?.message || "Failed to sign in");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Admin Sign In</h1>
          <p className="text-gray-600 mt-1">Access the admin dashboard</p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/40 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
          )}
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-800">Email</label>
              <div className="mt-2 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full border border-gray-300 rounded-lg  px-3 py-2.5 pl-4 pr-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800">Password</label>
              <div className="mt-2 relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-4 pr-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 shadow"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer text removed per request */}
      </div>
    </div>
  );
}
