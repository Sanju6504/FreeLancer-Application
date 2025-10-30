export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export async function http(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  try {
    const adminToken = localStorage.getItem("admin_token");
    const userToken = localStorage.getItem("auth_token");
    const token = adminToken || userToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {}

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
