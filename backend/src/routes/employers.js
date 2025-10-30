import { Router } from "express";
import mongoose from "mongoose";
import { Employer } from "../models/Employer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// POST /api/employers/signup
router.post("/signup", async (req, res) => {
  try {
    const { fullName, title, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "fullName, email and password are required" });
    }

    const existing = await Employer.findOne({ email });
    if (existing) return res.status(400).json({ error: "Employer already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const employer = await Employer.create({
      email,
      password: hashed,
      role: "employer",
      profile: {
        fullName,
        title: title || "",
        activeJobs: 0,
        totalApplications: 0,
        activeProjects: 0,
        draftJobs: 0,
      },
    });

    const token = jwt.sign(
      { sub: String(employer._id), role: employer.role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" }
    );
    const employerSafe = employer.toObject ? employer.toObject() : employer;
    delete employerSafe.password;
    return res.status(201).json({ employer: employerSafe, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/employers/signin
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const employerDoc = await Employer.findOne({ email });
    if (!employerDoc) return res.status(401).json({ error: "Invalid credentials" });
    let ok = await bcrypt.compare(password, employerDoc.password);
    if (!ok) {
      // Legacy plaintext fallback
      if (employerDoc.password === password) {
        const newHash = await bcrypt.hash(password, 10);
        employerDoc.password = newHash;
        await employerDoc.save();
        ok = true;
      }
    }
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const employer = employerDoc.toObject();
    const token = jwt.sign(
      { sub: String(employerDoc._id), role: employerDoc.role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" }
    );

    delete employer.password;
    return res.json({ employer, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/employers
router.get("/", async (req, res) => {
  try {
    const list = await Employer.find({}).sort({ updatedAt: -1 }).lean();
    return res.json(
      list.map((e) => {
        const { password, ...rest } = e;
        return { id: String(e._id), ...rest };
      })
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/employers/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    const employer = await Employer.findById(id).lean();
    if (!employer) return res.status(404).json({ error: "Employer not found" });
    const { password, ...rest } = employer;
    return res.json({ id: String(employer._id), ...rest });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/employers/:id/metrics
router.get("/:id/metrics", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    const employer = await Employer.findById(id).lean();
    if (!employer) return res.status(404).json({ error: "Employer not found" });

    const p = employer.profile || {};
    return res.json({
      activeJobs: p.activeJobs ?? 0,
      totalApplications: p.totalApplications ?? 0,
      activeProjects: p.activeProjects ?? 0,
      draftJobs: p.draftJobs ?? 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employers/:id/metrics
router.patch("/:id/metrics", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const allowed = ["activeJobs", "totalApplications", "activeProjects", "draftJobs"];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
    );

    const setObj = Object.fromEntries(Object.entries(updates).map(([k, v]) => [
      `profile.${k}`, v,
    ]));

    const updated = await Employer.findByIdAndUpdate(
      id,
      { $set: setObj },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Employer not found" });
    const p = updated.profile || {};
    return res.json({
      activeJobs: p.activeJobs ?? 0,
      totalApplications: p.totalApplications ?? 0,
      activeProjects: p.activeProjects ?? 0,
      draftJobs: p.draftJobs ?? 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
