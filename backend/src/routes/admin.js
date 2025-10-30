import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";

const router = Router();

// GET /api/admin/health
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// POST /api/admin/bootstrap
// Create an admin account if bootstrap token matches; intended for initial setup.
router.post("/bootstrap", async (req, res) => {
  try {
    const token = req.headers["x-bootstrap-token"] || req.query.token;
    const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!expected || token !== expected) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { email, password, fullName } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(409).json({ error: "Admin already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email, password: hashed, role: "admin", profile: { fullName: fullName || "" } });
    const obj = admin.toObject();
    delete obj.password;
    return res.status(201).json({ admin: obj });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/signin
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { sub: String(admin._id), role: "admin" },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" }
    );
    const adminSafe = admin.toObject ? admin.toObject() : admin;
    delete adminSafe.password;

    return res.json({ admin: adminSafe, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
