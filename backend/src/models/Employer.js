import mongoose from "mongoose";

const EmployerProfileSchema = new mongoose.Schema(
  {
    // Core identity
    fullName: { type: String, required: true },
    title: { type: String, default: "" },
    avatarUrl: { type: String },

    // Contact & links
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },

    // About
    bio: { type: String, default: "" },

    // Metrics
    activeJobs: { type: Number, default: 0 },
    totalApplications: { type: Number, default: 0 },
    activeProjects: { type: Number, default: 0 },
    draftJobs: { type: Number, default: 0 },
  },
  { _id: false }
);

const EmployerSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String }, // optional here; auth handled by User collection
    role: { type: String, default: "employer" },
    profile: { type: EmployerProfileSchema, required: true },
  },
  { timestamps: true }
);

export const Employer = mongoose.models.Employer || mongoose.model("Employer", EmployerSchema);
