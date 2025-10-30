import mongoose from "mongoose";

const ProjectSubSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    technologies: { type: [String], default: [] },
    duration: { type: String },
    budget: { type: Number },
    completedAt: { type: Date },
    projectUrl: { type: String },
    githubUrl: { type: String },
    public: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProfileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    phone: { type: String },
    fullName: { type: String, required: true },
    role: { type: String, enum: ["freelancer", "employer"], required: true },
    avatarUrl: String,
    title: String,
    bio: String,
    hourlyRate: Number,
    location: String,
    website: String,
    linkedin: String,
    github: String,
    skills: { type: [String], default: [] },
    projects: { type: [ProjectSubSchema], default: [] },
    // Reviews received by the freelancer from employers
    reviews: {
      type: [
        new mongoose.Schema(
          {
            jobId: { type: String, required: true },
            employerId: { type: String, required: true },
            rating: { type: Number, min: 1, max: 5, required: true },
            comment: { type: String },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    // Dashboard metrics
    activeProjects: { type: Number, default: 0 },
    pendingApplications: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0.0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["freelancer", "employer"], required: true },
    profile: { type: ProfileSchema, required: true },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
