import mongoose from "mongoose";

const SkillSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    category: String,
  },
  { _id: false }
);

const ApplicationSchema = new mongoose.Schema(
  {
    freelancerId: { type: String, required: true },
    coverLetter: { type: String, required: true },
    experience: { type: String },
    approach: { type: String },
    proposedRate: { type: Number },
    estimatedDuration: { type: Number }, // in weeks
    status: {
      type: String,
      enum: ["applied", "accepted", "declined"],
      default: "applied"
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const SubmissionSchema = new mongoose.Schema(
  {
    freelancerId: { type: String, required: true },
    deployLink: { type: String },
    githubLink: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const JobSchema = new mongoose.Schema(
  {
    employerId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    budgetType: { type: String, enum: ["fixed", "hourly"], required: true },
    budgetMin: Number,
    budgetMax: Number,
    durationWeeks: Number,
    status: {
      type: String,
      enum: ["open", "pending", "accepted", "declined", "completed", "paused", "cancelled"],
      default: "open",
    },
    location: String,
    remoteAllowed: { type: Boolean, default: true },
    experienceLevel: {
      type: String,
      enum: ["entry", "intermediate", "expert"],
    },
    // Optional employer-provided guidance fields
    relevantExperience: { type: String },
    proposedApproach: { type: String },
    applicationsCount: { type: Number, default: 0 },
    applications: { type: [ApplicationSchema], default: [] },
    skills: [SkillSchema],
    submissions: { type: [SubmissionSchema], default: [] },
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", JobSchema);
