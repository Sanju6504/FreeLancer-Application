import { Router } from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { User } from "../models/User.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { search, experienceLevel, employerId, budgetRange, appliedBy } = req.query;
    const query = {};
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (employerId) query.employerId = employerId;
    if (appliedBy) query["applications.freelancerId"] = appliedBy;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (budgetRange) {
      const [min, max] = String(budgetRange).split("-").map(Number);
      query.budgetMin = { $gte: min };
      query.budgetMax = { $lte: max };
    }
    const jobs = await Job.find(query).sort({ updatedAt: -1 }).lean();

    // Collect unique freelancerIds from all embedded applications
    const allIds = new Set();
    for (const j of jobs) {
      const apps = Array.isArray(j.applications) ? j.applications : [];
      for (const a of apps) {
        if (a && a.freelancerId && mongoose.isValidObjectId(a.freelancerId)) {
          allIds.add(String(a.freelancerId));
        }
      }
    }

    let userMap = new Map();
    if (allIds.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(allIds) } })
        .select({ _id: 1, "profile.fullName": 1, "profile.title": 1 })
        .lean();
      userMap = new Map(users.map((u) => [String(u._id), { fullName: u.profile?.fullName, title: u.profile?.title }]));
    }

    const enriched = jobs.map((j) => {
      const apps = Array.isArray(j.applications) ? j.applications : [];
      const withNames = apps.map((a) => {
        const info = a && a.freelancerId ? userMap.get(String(a.freelancerId)) : undefined;
        return info ? { ...a, freelancerName: info.fullName, freelancerTitle: info.title } : a;
      });
      return { id: String(j._id), ...j, applications: withNames };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Enrich applications with freelancer name/title
    const apps = Array.isArray(job.applications) ? job.applications : [];
    const ids = Array.from(
      new Set(
        apps
          .map((a) => a && a.freelancerId)
          .filter((v) => v && mongoose.isValidObjectId(v))
          .map((v) => String(v))
      )
    );

    let userMap = new Map();
    if (ids.length > 0) {
      const users = await User.find({ _id: { $in: ids } })
        .select({ _id: 1, "profile.fullName": 1, "profile.title": 1 })
        .lean();
      userMap = new Map(users.map((u) => [String(u._id), { fullName: u.profile?.fullName, title: u.profile?.title }]));
    }

    const withNames = apps.map((a) => {
      const info = a && a.freelancerId ? userMap.get(String(a.freelancerId)) : undefined;
      return info ? { ...a, freelancerName: info.fullName, freelancerTitle: info.title } : a;
    });

    res.json({ id: String(job._id), ...job, applications: withNames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const created = await Job.create(req.body);
    const j = created.toObject();
    res.status(201).json({ id: String(j._id), ...j });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ id: String(job._id), ...job });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id
// Deletes a job by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid job id" });
    }
    const deleted = await Job.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Job not found" });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Submit a project for a job
router.post("/:id/submissions", async (req, res) => {
  try {
    const { id } = req.params;
    const { deployLink, githubLink, description, freelancerId } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid job id" });
    }
    if (!freelancerId) {
      return res.status(400).json({ error: "freelancerId is required" });
    }

    const submission = {
      freelancerId: String(freelancerId),
      deployLink: deployLink ? String(deployLink) : undefined,
      githubLink: githubLink ? String(githubLink) : undefined,
      description: description ? String(description) : undefined,
      createdAt: new Date(),
    };

    const updated = await Job.findByIdAndUpdate(
      id,
      { $push: { submissions: submission }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Job not found" });

    const added = (updated.submissions || []).slice(-1)[0];
    return res.status(201).json({ success: true, submission: added, jobId: String(updated._id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update (or create if missing) a project submission for a job by freelancerId
router.put("/:id/submissions", async (req, res) => {
  try {
    const { id } = req.params;
    const { deployLink, githubLink, description, freelancerId } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid job id" });
    }
    if (!freelancerId) {
      return res.status(400).json({ error: "freelancerId is required" });
    }

    // Try to update existing submission
    const setObj = { updatedAt: new Date() };
    if (typeof deployLink === "string") setObj["submissions.$.deployLink"] = deployLink;
    if (typeof githubLink === "string") setObj["submissions.$.githubLink"] = githubLink;
    if (typeof description === "string") setObj["submissions.$.description"] = description;

    const updated = await Job.findOneAndUpdate(
      { _id: id, "submissions.freelancerId": String(freelancerId) },
      { $set: setObj },
      { new: true }
    ).lean();

    if (updated) {
      const sub = (updated.submissions || []).find((s) => String(s.freelancerId) === String(freelancerId));
      return res.json({ success: true, submission: sub, jobId: String(updated._id) });
    }

    // If not found, create new submission instead
    const submission = {
      freelancerId: String(freelancerId),
      deployLink: deployLink ? String(deployLink) : undefined,
      githubLink: githubLink ? String(githubLink) : undefined,
      description: description ? String(description) : undefined,
      createdAt: new Date(),
    };

    const created = await Job.findByIdAndUpdate(
      id,
      { $push: { submissions: submission }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!created) return res.status(404).json({ error: "Job not found" });
    const added = (created.submissions || []).slice(-1)[0];
    return res.status(201).json({ success: true, submission: added, jobId: String(created._id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
