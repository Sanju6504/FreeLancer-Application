import React, { useEffect, useState } from "react";
import { Link, Navigate, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Calendar, Briefcase, MapPin, Users, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { formatINR } from "../../utils/currency.js";

export function EmployerJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ open: false, type: null, application: null });
  const role = profile?.role ?? user?.role;

  useEffect(() => {
    if (id) {
      fetchJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJob = async () => {
    try {
      const data = await http("GET", `/jobs/${id}`);
      setJob(data);
    } catch (e) {
      console.error("Failed to load job", e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (role !== "employer") {
    return <Navigate to="/jobs" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <Link to="/employer/jobs" className="text-blue-600 hover:text-blue-700">← Back to Manage Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/employer/jobs" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Manage Jobs
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">Your posting</span>
                {job.status && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                    ${job.status === 'open' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                    ${job.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                    ${job.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                    ${job.status === 'declined' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                  `}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  job.budgetType === "fixed" ? "bg-100 text-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {job.budgetType === "fixed" ? "Fixed Price" : "Hourly Rate"}
              </span>
              <button
                onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                className="px-3 py-1.5 rounded-md border  bg-green-100 border-gray-300 text-gray-700 hover:bg-green-50"
              >
                Edit Job
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-semibold">
                  {job.budgetMin && job.budgetMax
                    ? `${formatINR(job.budgetMin)} - ${formatINR(job.budgetMax)}`
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
                  <p className="font-semibold capitalize">{job.experienceLevel}</p>
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
                <p className="font-semibold">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
      </div>

      {/* Applications for this job */}
      <div className="max-w-5xl bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="max-w-5xl text-xl font-semibold text-gray-900 mb-4">
          Applications ({job.applicationsCount || (Array.isArray(job.applications) ? job.applications.length : 0)})
        </h2>
        {Array.isArray(job.applications) && job.applications.length > 0 ? (
          <div className="space-y-3">
            {job.applications.map((app, idx) => (
              <div key={app._id || idx} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Freelancer</div>
                  <div className="font-medium break-all">{app.freelancerName || app.freelancerId}</div>
                  <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    {app.proposedRate != null && (
                      <span>
                        Proposed: <span className="font-medium">{formatINR(app.proposedRate)}</span>
                      </span>
                    )}
                    {app.estimatedDuration != null && (
                      <span>
                        Duration: <span className="font-medium">{app.estimatedDuration} weeks</span>
                      </span>
                    )}
                    {app.createdAt && (
                      <span>
                        Applied: <span className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div>
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
        ) : (
          <div className="text-gray-600">No applications yet.</div>
        )}
      </div>

      {/* Details modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-8 max-h-[85vh] overflow-y-auto">
            <div className="max-w-5xl flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Application Details</h3>
              <button onClick={() => setSelectedApplication(null)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side: Name and Cover Letter */}
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Freelancer</div>
                  <div className="font-medium break-all">
                    {selectedApplication.freelancerName || selectedApplication.freelancerId}
                  </div>
                  {selectedApplication.freelancerTitle && (
                    <div className="text-sm text-gray-600">{selectedApplication.freelancerTitle}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-600">Cover Letter</div>
                  <p className="mt-1 whitespace-pre-wrap text-gray-800">{selectedApplication.coverLetter}</p>
                </div>
              </div>

              {/* Right side: Other details */}
              <div className="space-y-4">
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
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  navigate(`/freelancer/${selectedApplication.freelancerId}`, {
                    state: {
                      application: selectedApplication,
                      job: job
                    }
                  });
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
              >
                View Portfolio
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmAction({ open: true, type: 'decline', application: selectedApplication })}
                  className="px-4 py-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                >
                  Decline
                </button>
                <button
                  onClick={() => setConfirmAction({ open: true, type: 'accept', application: selectedApplication })}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Dialog */}
      {confirmAction.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction.type === 'accept' ? 'Accept Application' : 'Decline Application'}
              </h3>
              <button
                onClick={() => setConfirmAction({ open: false, type: null, application: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-gray-700">
              {confirmAction.type === 'accept'
                ? 'Are you sure you want to accept this application? The job status will be updated to Accepted.'
                : 'Are you sure you want to decline this application? The job status will be updated to Declined.'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction({ open: false, type: null, application: null })}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const app = confirmAction.application;
                  try {
                    if (confirmAction.type === 'accept') {
                      await http('PUT', `/applications/${app._id}/accept`);
                    } else {
                      await http('PUT', `/applications/${app._id}/decline`);
                    }
                    setConfirmAction({ open: false, type: null, application: null });
                    setSelectedApplication(null);
                    fetchJob();
                  } catch (e) {
                    console.error('Failed to update application', e);
                    alert('Failed to update application');
                  }
                }}
                className={`px-4 py-2 rounded-md text-white ${confirmAction.type === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {confirmAction.type === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
