import { Router } from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job.js";

const router = Router();

// Create an application for a job (embedded in Job.applications)
router.post("/", async (req, res) => {
  try {
    const {
      jobId,
      freelancerId,
      coverLetter,
      experience, // optional
      approach, // optional
      proposedRate, // optional number
      estimatedDuration, // optional number (weeks)
    } = req.body;

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ error: "Invalid jobId" });
    }
    if (!freelancerId) {
      return res.status(400).json({ error: "freelancerId is required" });
    }
    if (!coverLetter || typeof coverLetter !== "string" || !coverLetter.trim()) {
      return res.status(400).json({ error: "coverLetter is required" });
    }

    // Prevent duplicate applications by the same freelancer to the same job
    const existing = await Job.findOne({
      _id: jobId,
      "applications.freelancerId": freelancerId,
    }).lean();
    if (existing) {
      return res.status(409).json({ error: "You have already applied to this job" });
    }

    const application = {
      freelancerId,
      coverLetter: String(coverLetter).trim(),
      experience: experience ? String(experience) : undefined,
      approach: approach ? String(approach) : undefined,
      proposedRate: typeof proposedRate === "number" ? proposedRate : proposedRate ? Number(proposedRate) : undefined,
      estimatedDuration:
        typeof estimatedDuration === "number"
          ? estimatedDuration
          : estimatedDuration
          ? Number(estimatedDuration)
          : undefined,
      createdAt: new Date(),
    };

    const updated = await Job.findByIdAndUpdate(
      jobId,
      {
        $push: { applications: application },
        $inc: { applicationsCount: 1 },
        $set: { updatedAt: new Date(), status: "pending" },
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Job not found" });

    const createdApp = updated.applications[updated.applications.length - 1];
    return res.status(201).json({ success: true, application: createdApp, jobId, jobStatus: updated.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Accept an application
router.put("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the job containing this application
    const job = await Job.findOne({ "applications._id": id });
    if (!job) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Update the specific application status
    const result = await Job.updateOne(
      { "applications._id": id },
      { 
        $set: { 
          "applications.$.status": "accepted",
          "applications.$.updatedAt": new Date(),
          status: "accepted",
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Application not found or already updated" });
    }
    const updatedJob = await Job.findOne({ "applications._id": id }).lean();
    res.json({ success: true, message: "Application accepted successfully", jobId: updatedJob?._id, jobStatus: updatedJob?.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decline an application
router.put("/:id/decline", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the job containing this application
    const job = await Job.findOne({ "applications._id": id });
    if (!job) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Update the specific application status
    const result = await Job.updateOne(
      { "applications._id": id },
      { 
        $set: { 
          "applications.$.status": "declined",
          "applications.$.updatedAt": new Date(),
          status: "declined",
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Application not found or already updated" });
    }
    const updatedJob = await Job.findOne({ "applications._id": id }).lean();
    res.json({ success: true, message: "Application declined successfully", jobId: updatedJob?._id, jobStatus: updatedJob?.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
