import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    technologies: [{ type: String }],
    duration: String, // e.g., "3 months"
    budget: Number,
    completedAt: Date,
    images: [String], // URLs to project images
    projectUrl: String, // Live project URL
    githubUrl: String, // GitHub repository URL
    clientName: String,
    isPublic: { type: Boolean, default: true }, // Whether to show in portfolio
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", ProjectSchema);
