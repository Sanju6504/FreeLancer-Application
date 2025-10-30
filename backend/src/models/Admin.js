import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, default: "admin" },
    profile: {
      fullName: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Admin = mongoose.model("Admin", AdminSchema);
