import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Clock, DollarSign, Star } from "lucide-react";
import { http } from "../../services/http.js";
import { useAuth } from "../../contexts/AuthContext";
import { formatINR } from "../../utils/currency.js";

export function JobList() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // applied search term
  const isEmployer = user?.role === "employer";
  // Separate input state for employer flow so typing doesn't filter until clicking Search
  const [titleInput, setTitleInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  // Removed budget filter per requirements
  const [experienceLevel, setExperienceLevel] = useState("");
  // For freelancers: keep pending input values; only apply on Search
  const [pendingTitle, setPendingTitle] = useState("");
  const [pendingExperience, setPendingExperience] = useState("");

  useEffect(() => {
    fetchJobs(isEmployer ? profile?.id : undefined);
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployer, profile?.id]);

  const fetchSkills = async () => {
    setSkills([]);
  };

  const fetchJobs = async (employerId) => {
    try {
      const url = employerId ? `/jobs?employerId=${encodeURIComponent(employerId)}` : "/jobs";
      const jobsData = await http("GET", url);
      // Keep all jobs here; we'll filter for visibility later so freelancers
      // can still see jobs they applied to even if status is pending
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // For freelancers, show ALL jobs regardless of status
  const visibleJobs = isEmployer ? jobs : jobs;

  const filteredJobs = visibleJobs.filter((job) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = isEmployer
      ? job.title.toLowerCase().includes(q)
      : job.title.toLowerCase().includes(q); // title-only search for freelancers

    const matchesSkills =
      selectedSkills.length === 0 ||
      job.skills?.some((skill) => selectedSkills.includes(skill.id));

    const matchesExperience = !experienceLevel || job.experienceLevel === experienceLevel;

    return matchesSearch && matchesSkills && matchesExperience;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
            <p className="text-gray-600 mt-2">
              Find your next freelance opportunity
            </p>
          </div>
          {profile?.role === "employer" && (
            <Link
              to="/jobs/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Post New Job
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-end">
          {/* Job Title */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Job title</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={isEmployer ? "Search by job title..." : "Search by job title..."}
                value={isEmployer ? titleInput : pendingTitle}
                onChange={(e) => (isEmployer ? setTitleInput(e.target.value) : setPendingTitle(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (isEmployer) {
                      setSearchTerm(titleInput);
                    } else {
                      setSearchTerm(pendingTitle);
                      setExperienceLevel(pendingExperience);
                    }
                  }
                }}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Experience */}
          {!isEmployer && (
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
              <select
                value={pendingExperience}
                onChange={(e) => setPendingExperience(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              >
                <option value="">Any experience</option>
                <option value="entry">Entry</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          )}

          {/* Search Button */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-transparent mb-2 select-none">Search</label>
            <button
              type="button"
              onClick={() => {
                if (isEmployer) {
                  setSearchTerm(titleInput);
                } else {
                  setSearchTerm(pendingTitle);
                  setExperienceLevel(pendingExperience);
                }
              }}
              className="w-full lg:w-auto px-4 py-2.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredJobs.length} of {visibleJobs.length} jobs
        </p>
      </div>

      {/* Job Cards */}
      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No jobs found matching your criteria
            </p>
            <p className="text-gray-400">Try adjusting your search filters</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-900"
                    >
                      {job.budgetType === "fixed" ? "Fixed Price" : "Hourly"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    {job.employer && (
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-medium">
                            {job.employer.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{job.employer.fullName}</span>
                        {job.employer.totalRating > 0 && (
                          <div className="flex items-center ml-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1">
                              {job.employer.totalRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {job.description}
                  </p>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.slice(0, 6).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {job.skills.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          +{job.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-green-600">
                        <DollarSign className="h-5 w-5 mr-1" />
                        <span className="font-semibold">
                          {job.budgetMin && job.budgetMax
                            ? `${formatINR(job.budgetMin)} - ${formatINR(
                                job.budgetMax
                              )}`
                            : job.budgetMin
                            ? `${formatINR(job.budgetMin)}+`
                            : "Budget TBD"}
                        </span>
                      </div>
                      {job.experienceLevel && (
                        <span className="text-sm text-gray-600 capitalize">
                          {job.experienceLevel} Level
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        {job.applicationsCount} applications
                      </span>
                      {/* View Job Button */}
                      <Link
                        to={`/jobs/${job.id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View Job
                      </Link>
                      {profile?.role === "freelancer" && (() => {
                        const hasApplied = Array.isArray(job.applications)
                          ? job.applications.some((a) => a.freelancerId === profile?.id)
                          : false;
                        // If user already applied OR job is not open, show a disabled status button
                        if (hasApplied || job.status !== 'open') {
                          const label = hasApplied
                            ? (job.status === 'pending' ? 'Pending' : job.status.charAt(0).toUpperCase() + job.status.slice(1))
                            : job.status.charAt(0).toUpperCase() + job.status.slice(1);
                          const colorClasses =
                            label === 'Accepted'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : label === 'Declined'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : label === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-gray-100 text-gray-500 border-gray-300';
                          return (
                            <button
                              disabled
                              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md cursor-not-allowed ${colorClasses}`}
                            >
                              {label}
                            </button>
                          );
                        }
                        // Otherwise allow applying
                        return (
                          <Link
                            to={`/jobs/${job.id}/apply`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Apply Now
                          </Link>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
