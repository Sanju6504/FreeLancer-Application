import { Router } from "express";
import { User } from "../models/User.js";
import { Employer } from "../models/Employer.js";
import { sendMail } from "../utils/mailer.js";
import { verifyJWT, requireParamSelfOrAdmin } from "../utils/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, fullName, role, title } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const profile = {
      email,
      fullName,
      role,
      title: title || "",
      // new metrics per model
      activeProjects: 0,
      pendingApplications: 0,
      completedProjects: 0,
      totalRating: 0,
    };

    // hash password
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, role, profile });

    // If employer role, also create Employer record
    if (role === "employer") {
      try {
        const existingEmp = await Employer.findOne({ email });
        if (!existingEmp) {
          await Employer.create({
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
        }
      } catch (e) {
        console.warn("Failed to sync Employer on signup:", e?.message);
      }
    }
    const token = jwt.sign(
      { sub: String(user._id), role: user.role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" }
    );
    const userSafe = user.toObject ? user.toObject() : user;
    delete userSafe.password;
    delete userSafe.resetOtp;
    delete userSafe.resetOtpExpires;
    res.status(201).json({ user: userSafe, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    let ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      // Legacy support: accounts that may have stored plaintext passwords
      if (user.password === password) {
        const newHash = await bcrypt.hash(password, 10);
        user.password = newHash;
        await user.save();
        ok = true;
        if (user.role === "employer") {
          try {
            await Employer.findOneAndUpdate(
              { email: user.email },
              { $set: { password: newHash } },
              { upsert: false }
            );
          } catch (e) {
            console.warn("Failed to sync Employer password on legacy fix:", e?.message);
          }
        }
      }
    }
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Sync Employer collection on signin if role=employer
    if (user.role === "employer") {
      try {
        const p = user.profile || {};
        await Employer.findOneAndUpdate(
          { email: user.email },
          {
            $set: {
              email: user.email,
              password: user.password, // already hashed
              role: "employer",
              "profile.fullName": p.fullName || "",
              "profile.title": p.title || "",
            },
            $setOnInsert: {
              "profile.activeJobs": 0,
              "profile.totalApplications": 0,
              "profile.activeProjects": 0,
              "profile.draftJobs": 0,
            },
          },
          { new: true, upsert: true }
        );
      } catch (e) {
        console.warn("Failed to sync Employer on signin:", e?.message);
      }
    }
    const token = jwt.sign(
      { sub: String(user._id), role: user.role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" }
    );
    const userSafe = user.toObject ? user.toObject() : user;
    delete userSafe.password;
    delete userSafe.resetOtp;
    delete userSafe.resetOtpExpires;
    res.json({ user: userSafe, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signout", async (_req, res) => {
  res.json({ success: true });
});

router.patch(
  "/profile/:userId",
  verifyJWT,
  requireParamSelfOrAdmin("userId"),
  async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        $set: Object.fromEntries(
          Object.entries(updates).map(([k, v]) => [`profile.${k}`, v])
        ),
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated.profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
);

// Request password reset - generate OTP and email it
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    // Respond 200 regardless to avoid user enumeration
    if (!user) return res.json({ success: true });

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.resetOtp = otp;
    user.resetOtpExpires = expires;
    await user.save();

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset Code</h2>
        <p>Your one-time password (OTP) to reset your account is:</p>
        <p style="font-size: 24px; font-weight: bold;">${otp}</p>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>
    `;
    try {
      await sendMail(email, "Your password reset code", html);
    } catch (e) {
      console.warn("Failed to send email:", e?.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password using email + otp
router.post("/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: "Email, OTP and newPassword are required" });

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp || !user.resetOtpExpires)
      return res.status(400).json({ error: "Invalid or expired code" });

    if (user.resetOtp !== otp)
      return res.status(400).json({ error: "Invalid code" });

    if (new Date(user.resetOtpExpires) < new Date())
      return res.status(400).json({ error: "Code expired" });

    // Always hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    // Keep Employer doc in sync if applicable
    if (user.role === "employer") {
      try {
        await Employer.findOneAndUpdate(
          { email: user.email },
          { $set: { password: hashed } },
          { upsert: false }
        );
      } catch (e) {
        console.warn("Failed to sync Employer password on reset:", e?.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
