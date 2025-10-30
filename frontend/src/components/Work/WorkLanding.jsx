import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Work } from "./Work";
import { EmployerWork } from "./EmployerWork";

// Decides what to show at /work based on the user's role
export function WorkLanding() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "freelancer") {
    return <Work />;
  }
  // Employer view: accepted jobs with contact and submission
  return <EmployerWork />;
}
