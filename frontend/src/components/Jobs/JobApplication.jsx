import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, DollarSign, Clock } from "lucide-react";
import { http } from "../../services/http.js";
import { useAuth } from "../../contexts/AuthContext";
import { formatINR } from "../../utils/currency.js";

export function JobApplication() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: "",
    experience: "",
    approach: "",
    proposedRate: "",
    estimatedDuration: "",
  });

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    if (!id) return;

    try {
      const jobData = await http("GET", `/jobs/${id}`);
      setJob(jobData);
      if (jobData?.budgetMin) {
        setFormData((prev) => ({
          ...prev,
          proposedRate: jobData.budgetMin?.toString() || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!job || !profile) return;

    setSubmitting(true);
    try {
      await http("POST", "/applications", {
        jobId: job.id,
        freelancerId: profile.id,
        coverLetter: formData.coverLetter,
        experience: formData.experience || undefined,
        approach: formData.approach || undefined,
        proposedRate: formData.proposedRate
          ? parseFloat(formData.proposedRate)
          : undefined,
        estimatedDuration: formData.estimatedDuration
          ? parseInt(formData.estimatedDuration)
          : undefined,
      });

      navigate(`/jobs/${job.id}`, {
        state: { message: "Application submitted successfully!" },
      });
    } catch (error) {
      alert(error?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const backTo = profile?.role === "employer" ? "/employer/jobs" : "/jobs";

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Job Not Found
          </h1>
          <Link to={backTo} className="text-blue-600 hover:text-blue-700">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.role !== "freelancer") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Only freelancers can apply to jobs.
          </p>
          <Link to={backTo} className="text-blue-600 hover:text-blue-700">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Details
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply to Job</h1>
        <p className="text-gray-600">
          Submit your application for "{job.title}"
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Letter */}
              <div>
                <label
                  htmlFor="coverLetter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Cover Letter *
                </label>
                <textarea
                  id="coverLetter"
                  required
                  rows={8}
                  value={formData.coverLetter}
                  onChange={(e) =>
                    setFormData({ ...formData, coverLetter: e.target.value })
                  }
                  placeholder="Explain why you're the perfect fit for this job. Highlight your relevant experience and skills..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 100 characters. Be specific about your experience and
                  approach.
                </p>
              </div>

              {/* Experience (optional) */}
              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Relevant Experience (optional)
                </label>
                <textarea
                  id="experience"
                  rows={4}
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  placeholder="Summarize similar projects or years of experience relevant to this job."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Approach (optional) */}
              <div>
                <label
                  htmlFor="approach"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Proposed Approach (optional)
                </label>
                <textarea
                  id="approach"
                  rows={4}
                  value={formData.approach}
                  onChange={(e) =>
                    setFormData({ ...formData, approach: e.target.value })
                  }
                  placeholder="Outline how you plan to deliver this project (milestones, tools, communication)."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Proposed Rate */}
              <div>
                <label
                  htmlFor="proposedRate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Proposed{" "}
                  {job.budgetType === "hourly" ? "Hourly Rate" : "Project Rate"}{" "}
                  (₹)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="proposedRate"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.proposedRate}
                    onChange={(e) =>
                      setFormData({ ...formData, proposedRate: e.target.value })
                    }
                    placeholder={
                      job.budgetType === "hourly" ? "50.00" : "5000.00"
                    }
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {job.budgetMin && job.budgetMax && (
                  <p className="text-sm text-gray-500 mt-1">
                    Client's budget:{" "}
                    {job.budgetMin && job.budgetMax
                      ? `${formatINR(job.budgetMin)} - ${formatINR(
                          job.budgetMax
                        )}`
                      : "Not specified"}
                  </p>
                )}
              </div>

              {/* Estimated Duration */}
              <div>
                <label
                  htmlFor="estimatedDuration"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Estimated Duration (weeks)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="estimatedDuration"
                    type="number"
                    min="1"
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDuration: e.target.value,
                      })
                    }
                    placeholder="4"
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {job.durationWeeks && (
                  <p className="text-sm text-gray-500 mt-1">
                    Client's expected duration: {job.durationWeeks} weeks
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !formData.coverLetter.trim()}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Job Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Job Summary
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{job.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                  {job.description}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Budget</span>
                  <span className="font-medium">
                    {job.budgetMin && job.budgetMax
                      ? `${formatINR(job.budgetMin)} - ${formatINR(
                          job.budgetMax
                        )}`
                      : job.budgetMin
                      ? `${formatINR(job.budgetMin)}+`
                      : "Budget TBD"}
                  </span>
                </div>

                {job.durationWeeks && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-medium">
                      {job.durationWeeks} weeks
                    </span>
                  </div>
                )}

                {job.experienceLevel && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="font-medium capitalize">
                      {job.experienceLevel}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Applications</span>
                  <span className="font-medium">{job.applicationsCount}</span>
                </div>
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Required Skills
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
