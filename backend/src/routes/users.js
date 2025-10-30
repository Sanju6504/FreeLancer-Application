import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Employer } from "../models/Employer.js";

const router = Router();

// GET /api/users/:id/metrics
// Returns the dashboard metrics stored on the user profile
router.get("/:id/metrics", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const p = user.profile || {};
    return res.json({
      activeProjects: p.activeProjects ?? 0,
      pendingApplications: p.pendingApplications ?? 0,
      completedProjects: p.completedProjects ?? 0,
      totalRating: p.totalRating ?? 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/users
// Supports listing freelancers: /api/users?role=freelancer
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    if (role === "freelancer") {
      const users = await User.find({ "profile.role": "freelancer" })
        .select("profile fullName email")
        .lean();
      const result = users.map((u) => ({
        id: String(u._id),
        fullName: u.profile?.fullName || u.fullName || "",
        title: u.profile?.title || "",
        email: u.email || u.profile?.email || "",
        bio: u.profile?.bio || "",
        location: u.profile?.location || "",
        hourlyRate: u.profile?.hourlyRate ?? undefined,
        skills: Array.isArray(u.profile?.skills) ? u.profile.skills : [],
        totalRating: typeof u.profile?.totalRating === 'number' ? u.profile.totalRating : 0,
        reviewsCount: Array.isArray(u.profile?.reviews) ? u.profile.reviews.length : 0,
      }));
      return res.json(result);
    }
    return res.status(400).json({ error: "Unsupported query" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
// Returns the full user profile data for viewing freelancer portfolio
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (type === 'employer') {
      let employer = await Employer.findById(id).lean();
      if (!employer) {
        // Synthesize from User if possible so the UI can load
        const user = await User.findById(id).select("email profile").lean();
        if (!user) return res.status(404).json({ error: "Employer not found" });
        employer = {
          _id: user._id,
          email: user.email,
          profile: {
            fullName: user.profile?.fullName || "",
            title: user.profile?.title || "",
            phone: user.profile?.phone || "",
            location: user.profile?.location || "",
            website: user.profile?.website || "",
            linkedin: user.profile?.linkedin || "",
            github: user.profile?.github || "",
            bio: user.profile?.bio || "",
            avatarUrl: user.profile?.avatarUrl || "",
            activeJobs: 0,
            totalApplications: 0,
            activeProjects: 0,
            draftJobs: 0,
          },
        };
      }
      return res.json(employer);
    }

    const user = await User.findById(id).select("-password -resetOtp -resetOtpExpires").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/profile
// Update core profile fields (excluding skills and projects)
router.put("/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const {
      fullName,
      title,
      location,
      website,
      linkedin,
      github,
      bio,
      hourlyRate,
      phone,
      email,
    } = req.body || {};

    // If updating employer record, write to Employer collection
    if (type === 'employer') {
      const {
        fullName,
        title,
        location,
        website,
        linkedin,
        github,
        bio,
        phone,
        email,
        avatarUrl,
      } = req.body || {};

      const fallbackUser = await User.findById(id).select("email profile").lean();
      const existingEmployer = await Employer.findById(id).lean();
      const seedEmail = (typeof email === 'string' && email.trim()) ? email.trim() : (fallbackUser?.email || null);
      const seedFullName = (typeof fullName === 'string' && fullName.trim()) ? fullName.trim() : (fallbackUser?.profile?.fullName || null);

      const set = { updatedAt: new Date() };
      if (typeof fullName === 'string') set['profile.fullName'] = fullName.trim();
      if (typeof title === 'string') set['profile.title'] = title.trim();
      if (typeof location === 'string') set['profile.location'] = location.trim();
      if (typeof website === 'string') set['profile.website'] = website.trim();
      if (typeof linkedin === 'string') set['profile.linkedin'] = linkedin.trim();
      if (typeof github === 'string') set['profile.github'] = github.trim();
      if (typeof bio === 'string') set['profile.bio'] = bio;
      if (typeof phone === 'string') set['profile.phone'] = phone.trim();
      // Do not update top-level employer email here to avoid unique conflicts; it's set on insert
      if (typeof avatarUrl === 'string') set['profile.avatarUrl'] = avatarUrl.trim();
      const setOnInsert = (!existingEmployer && seedEmail && seedFullName) ? {
        email: seedEmail,
        role: 'employer',
        profile: {
          fullName: seedFullName,
          title: fallbackUser?.profile?.title || '',
          phone: fallbackUser?.profile?.phone || '',
          location: fallbackUser?.profile?.location || '',
          website: fallbackUser?.profile?.website || '',
          linkedin: fallbackUser?.profile?.linkedin || '',
          github: fallbackUser?.profile?.github || '',
          bio: fallbackUser?.profile?.bio || '',
        },
      } : null;

      // IMPORTANT: Only when inserting, avoid setting profile.* together with $setOnInsert.profile
      if (setOnInsert) {
        for (const key of Object.keys(set)) {
          if (key.startsWith('profile.')) delete set[key];
        }
      }

      // If we cannot infer required fields for insert, attempt normal update first
      try {
        const updated = await Employer.findByIdAndUpdate(
          id,
          setOnInsert ? { $set: set, $setOnInsert: setOnInsert } : { $set: set },
          { new: true, runValidators: true, upsert: Boolean(setOnInsert) }
        ).lean();
        if (!updated) return res.status(404).json({ error: 'Employer not found' });
        return res.json({ success: true, profile: updated.profile, id: String(updated._id) });
      } catch (err) {
        if (err && err.code === 11000) {
          return res.status(409).json({ error: 'Email already exists for another employer' });
        }
        throw err;
      }
    }

    const update = {};
    const unset = {};
    if (typeof fullName === "string") update["profile.fullName"] = fullName.trim();
    if (typeof title === "string") update["profile.title"] = title.trim();
    if (typeof location === "string") update["profile.location"] = location.trim();
    if (typeof website === "string") update["profile.website"] = website.trim();
    if (typeof linkedin === "string") update["profile.linkedin"] = linkedin.trim();
    if (typeof github === "string") update["profile.github"] = github.trim();
    if (typeof bio === "string") update["profile.bio"] = bio;
    if (typeof phone === "string") update["profile.phone"] = phone.trim();
    if (typeof email === "string" && email.trim()) {
      update["profile.email"] = email.trim();
      update["email"] = email.trim();
    }
    if (hourlyRate === null) {
      unset["profile.hourlyRate"] = "";
    } else if (typeof hourlyRate === "number" && !Number.isNaN(hourlyRate)) {
      update["profile.hourlyRate"] = hourlyRate;
    }
    update["updatedAt"] = new Date();

    const updateDoc = { $set: update };
    if (Object.keys(unset).length > 0) updateDoc.$unset = unset;

    const updated = await User.findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true })
      .select("-password -resetOtp -resetOtpExpires")
      .lean();

    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json({ success: true, profile: updated.profile, id: String(updated._id) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/skills
// Replace the user's profile.skills with the provided array
router.put("/:id/skills", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const { skills } = req.body || {};
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: "skills must be an array of strings" });
    }
    const cleaned = skills.map((s) => String(s).trim()).filter(Boolean);
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { "profile.skills": cleaned, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).select("profile.skills").lean();
    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json({ success: true, skills: updated.profile?.skills || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/projects
// Create a new embedded project under the user's profile.projects
router.post("/:id/projects", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const { title, description, technologies, duration, budget, completedAt, projectUrl, githubUrl, public: isPublic } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const project = {
      title: String(title).trim(),
      description: String(description).trim(),
      technologies: Array.isArray(technologies) ? technologies.map(String) : [],
      duration: duration ? String(duration) : undefined,
      budget: typeof budget === "number" ? budget : budget ? Number(budget) : undefined,
      completedAt: completedAt ? new Date(completedAt) : undefined,
      projectUrl: projectUrl ? String(projectUrl) : undefined,
      githubUrl: githubUrl ? String(githubUrl) : undefined,
      public: typeof isPublic === "boolean" ? isPublic : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = await User.findByIdAndUpdate(
      id,
      { $push: { "profile.projects": project }, $set: { updatedAt: new Date() } },
      { new: true, runValidators: true }
    )
      .select("profile.projects")
      .lean();

    if (!updated) return res.status(404).json({ error: "User not found" });

    return res.status(201).json({ success: true, projects: updated.profile?.projects || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

// PUT /api/users/:id/projects/:projectId
// Update an embedded project under the user's profile.projects
router.put("/:id/projects/:projectId", async (req, res) => {
  try {
    const { id, projectId } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const {
      title,
      description,
      technologies,
      duration,
      budget,
      completedAt,
      projectUrl,
      githubUrl,
      public: isPublic,
    } = req.body || {};

    // Build $set updates for the matching embedded doc
    const set = { 'profile.projects.$.updatedAt': new Date() };
    if (typeof title === 'string' && title.trim()) set['profile.projects.$.title'] = title.trim();
    if (typeof description === 'string' && description.trim()) set['profile.projects.$.description'] = description;
    if (Array.isArray(technologies)) set['profile.projects.$.technologies'] = technologies.map(String);
    if (typeof duration === 'string') set['profile.projects.$.duration'] = duration;
    if (typeof budget === 'number') set['profile.projects.$.budget'] = budget;
    if (completedAt) set['profile.projects.$.completedAt'] = new Date(completedAt);
    if (typeof projectUrl === 'string') set['profile.projects.$.projectUrl'] = projectUrl;
    if (typeof githubUrl === 'string') set['profile.projects.$.githubUrl'] = githubUrl;
    if (typeof isPublic === 'boolean') set['profile.projects.$.public'] = isPublic;

    const result = await User.findOneAndUpdate(
      { _id: id, 'profile.projects._id': projectId },
      { $set: set },
      { new: true }
    ).select('profile.projects').lean();

    if (!result) return res.status(404).json({ error: 'Project not found' });

    const updated = (result.profile?.projects || []).find((p) => String(p._id) === String(projectId));
    return res.json({ success: true, project: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id/projects/:projectId
// Remove an embedded project under the user's profile.projects
router.delete("/:id/projects/:projectId", async (req, res) => {
  try {
    const { id, projectId } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const result = await User.findByIdAndUpdate(
      id,
      { $pull: { "profile.projects": { _id: projectId } }, $set: { updatedAt: new Date() } },
      { new: true }
    ).select("profile.projects").lean();

    if (!result) return res.status(404).json({ error: "User not found" });

    // If nothing was removed, check whether project existed
    const stillExists = (result.profile?.projects || []).some((p) => String(p._id) === String(projectId));
    if (stillExists) return res.status(404).json({ error: "Project not found" });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/reviews
// Adds a review to a freelancer's profile.reviews and updates totalRating
router.post("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params; // freelancer id
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const { jobId, employerId, rating, comment } = req.body || {};
    if (!jobId || !employerId) {
      return res.status(400).json({ error: "jobId and employerId are required" });
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be a number between 1 and 5" });
    }

    const review = {
      jobId: String(jobId),
      employerId: String(employerId),
      rating,
      comment: comment ? String(comment) : undefined,
      createdAt: new Date(),
    };

    // Push review
    const updated = await User.findByIdAndUpdate(
      id,
      { $push: { "profile.reviews": review }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "User not found" });

    // Recompute totalRating as average of reviews
    const all = Array.isArray(updated.profile?.reviews) ? updated.profile.reviews : [];
    const avg = all.length > 0 ? all.reduce((s, r) => s + (Number(r.rating) || 0), 0) / all.length : 0;
    await User.findByIdAndUpdate(id, { $set: { "profile.totalRating": avg, updatedAt: new Date() } });

    return res.status(201).json({ success: true, review });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
