import jwt from "jsonwebtoken";

export function verifyJWT(req, res, next) {
  try {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = auth.slice(7);
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret);
    req.auth = payload; // { sub, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireParamSelfOrAdmin(paramName = "id") {
  return function (req, res, next) {
    try {
      const { auth } = req;
      const paramVal = req.params?.[paramName];
      if (!auth) return res.status(401).json({ error: "Unauthorized" });
      const isAdmin = auth.role === "admin";
      const isSelf = paramVal != null && String(auth.sub) === String(paramVal);
      if (!isAdmin && !isSelf) return res.status(403).json({ error: "Forbidden" });
      next();
    } catch (err) {
      return res.status(403).json({ error: "Forbidden" });
    }
  };
}

export const requireSelfOrAdmin = requireParamSelfOrAdmin("id");
