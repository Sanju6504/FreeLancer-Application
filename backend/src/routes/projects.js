import { Router } from "express";
import mongoose from "mongoose";
import { Project } from "../models/Project.js";

const router = Router();

// GET /api/projects/freelancer/:id
// Returns all public projects for a specific freelancer
router.get("/freelancer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid freelancer id" });
    }

    const projects = await Project.find({ 
      freelancerId: id, 
      isPublic: true 
    })
    .sort({ completedAt: -1, createdAt: -1 })
    .lean();

    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
// Deletes a project document (collection-based projects only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

// PUT /api/projects/:id
// Updates a project document (collection-based projects only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id" });
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
      clientName,
      isPublic,
    } = req.body || {};

    const update = { updatedAt: new Date() };
    if (typeof title === "string" && title.trim()) update.title = title.trim();
    if (typeof description === "string" && description.trim()) update.description = description;
    if (Array.isArray(technologies)) update.technologies = technologies.map(String);
    if (typeof duration === "string") update.duration = duration;
    if (typeof budget === "number") update.budget = budget;
    if (completedAt) update.completedAt = new Date(completedAt);
    if (typeof projectUrl === "string") update.projectUrl = projectUrl;
    if (typeof githubUrl === "string") update.githubUrl = githubUrl;
    if (typeof clientName === "string") update.clientName = clientName;
    if (typeof isPublic === "boolean") update.isPublic = isPublic;

    const updated = await Project.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ error: "Project not found" });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
