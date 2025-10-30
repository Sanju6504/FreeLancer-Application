import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Users,
  Calendar,
  Briefcase,
} from "lucide-react";
import { http } from "../../services/http.js";
import { useAuth } from "../../contexts/AuthContext";
import { formatINR } from "../../utils/currency.js";

export function JobDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    if (id) {
      fetchJobDetail();
    }
  }, [id]);

  const fetchJobDetail = async () => {
    if (!id) return;

    try {
      const jobData = await http("GET", `/jobs/${id}`);
      setJob(jobData);

      if (jobData && profile?.role === "employer") {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const backTo = location.state?.from === 'admin'
    ? '/admin/dashboard'
    : location.state?.from === 'applied'
    ? '/applied-jobs'
    : location.state?.from === 'work'
    ? '/work'
    : (profile?.role === "employer" ? "/employer/jobs" : "/jobs");

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={backTo}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {job.employer && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      <span className="text-sm font-medium">
                        {job.employer.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{job.employer.fullName}</span>
                    {job.employer.totalRating > 0 && (
                      <div className="flex items-center ml-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1">
                          {job.employer.totalRating.toFixed(1)}
                        </span>
                        <span className="ml-1 text-gray-500">
                          ({job.employer.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className="px-3 py-1 text-sm font-medium rounded-full text-gray-900">
                {job.budgetType === "fixed" ? "Fixed Price" : "Hourly Rate"}
              </span>
              {profile?.role === "freelancer" && (
                (() => {
                  const hasApplied = Array.isArray(job.applications)
                    ? job.applications.some((a) => a.freelancerId === profile.id)
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
                })()
              )}
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-semibold">
                  {job.budgetMin && job.budgetMax
                    ? `${formatINR(job.budgetMin)} - ${formatINR(
                        job.budgetMax
                      )}`
                    : job.budgetMin
                    ? `${formatINR(job.budgetMin)}+`
                    : "Budget TBD"}
                </p>
              </div>
            </div>

            {job.durationWeeks && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{job.durationWeeks} weeks</p>
                </div>
              </div>
            )}

            {job.experienceLevel && (
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Experience Level</p>
                  <p className="font-semibold capitalize">
                    {job.experienceLevel}
                  </p>
                </div>
              </div>
            )}

            {job.location && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{job.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="font-semibold">{job.applicationsCount}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Posted</p>
                <p className="font-semibold">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Job Description
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>
      </div>

      {/* Employer Info */}
      {job.employer && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About the Client
          </h2>
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl font-medium">
                {job.employer.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {job.employer.fullName}
              </h3>
              {job.employer.title && (
                <p className="text-gray-600 mb-2">{job.employer.title}</p>
              )}
              {job.employer.bio && (
                <p className="text-gray-700 mb-3">{job.employer.bio}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {job.employer.totalRating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span>
                      {job.employer.totalRating.toFixed(1)} (
                      {job.employer.totalReviews} reviews)
                    </span>
                  </div>
                )}
                <span>{job.employer.totalProjects} projects completed</span>
                {job.employer.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{job.employer.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications (Employers only) */}
      {profile?.role === "employer" && Array.isArray(job.applications) && job.applications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications ({job.applicationsCount || job.applications.length})</h2>
          <div className="space-y-3">
            {job.applications.map((app, idx) => (
              <div key={app._id || idx} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Freelancer</div>
                  <div className="font-medium">{app.freelancerName || app.freelancerId}</div>
                  <div className="mt-1 text-sm text-gray-600 flex gap-4">
                    {app.proposedRate != null && (
                      <span>Proposed: <span className="font-medium">{formatINR(app.proposedRate)}</span></span>
                    )}
                    {app.estimatedDuration != null && (
                      <span>Duration: <span className="font-medium">{app.estimatedDuration} weeks</span></span>
                    )}
                    {app.createdAt && (
                      <span>Applied: <span className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</span></span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedApplication(app)}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Application Details</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Freelancer</div>
                <div className="font-medium">{selectedApplication.freelancerName || selectedApplication.freelancerId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Cover Letter</div>
                <p className="mt-1 whitespace-pre-wrap text-gray-800">{selectedApplication.coverLetter}</p>
              </div>
              {selectedApplication.experience && (
                <div>
                  <div className="text-sm text-gray-600">Relevant Experience</div>
                  <p className="mt-1 whitespace-pre-wrap text-gray-800">{selectedApplication.experience}</p>
                </div>
              )}
              {selectedApplication.approach && (
                <div>
                  <div className="text-sm text-gray-600">Proposed Approach</div>
                  <p className="mt-1 whitespace-pre-wrap text-gray-800">{selectedApplication.approach}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Proposed Rate</div>
                  <div className="font-medium">{selectedApplication.proposedRate != null ? formatINR(selectedApplication.proposedRate) : "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="font-medium">{selectedApplication.estimatedDuration != null ? `${selectedApplication.estimatedDuration} weeks` : "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Applied On</div>
                  <div className="font-medium">{selectedApplication.createdAt ? new Date(selectedApplication.createdAt).toLocaleString() : "—"}</div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations for Employers */}
      {profile?.role === "employer" && recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recommended Freelancers
            <span className="ml-2 text-sm font-normal text-blue-600">
              AI-Powered
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((freelancer) => (
              <div
                key={freelancer.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {freelancer.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {freelancer.fullName}
                    </h3>
                    {freelancer.title && (
                      <p className="text-sm text-gray-600 mb-1">
                        {freelancer.title}
                      </p>
                    )}
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                      {freelancer.totalRating > 0 && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                          <span>{freelancer.totalRating.toFixed(1)}</span>
                        </div>
                      )}
                      <span>{freelancer.totalProjects} projects</span>
                      {freelancer.hourlyRate && (
                        <span>{formatINR(freelancer.hourlyRate)}/hr</span>
                      )}
                    </div>
                    {freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {freelancer.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {freelancer.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{freelancer.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Link
                    to={`/freelancers/${freelancer.id}`}
                    className="flex-1 text-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Profile
                  </Link>
                  <button className="flex-1 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                    Invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
