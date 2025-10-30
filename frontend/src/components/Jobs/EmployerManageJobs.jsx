import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Clock, DollarSign, Eye, X, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { formatINR } from "../../utils/currency.js";

export function EmployerManageJobs() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appsJob, setAppsJob] = useState(null); // job selected to view applications
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, job: null });
  const navigate = useNavigate();

  // Title-only search: type then click Search/press Enter
  const [titleInput, setTitleInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user || user.role !== "employer") return;
    fetchJobs(profile?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, profile?.id]);

  const fetchJobs = async (employerId) => {
    if (!employerId) return;
    setLoading(true);
    try {
      const url = `/jobs?employerId=${encodeURIComponent(employerId)}`;
      const data = await http("GET", url);
      // Show all their jobs (open + draft), but you can tweak if needed
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load employer jobs", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => j.title?.toLowerCase().includes(q));
  }, [jobs, searchTerm]);

  if (user?.role !== "employer") {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-gray-600">
        Only employers can manage jobs.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-600 mt-2">Search and manage your job postings</p>
        </div>
        <Link
          to="/create-job"
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Post New Job
        </Link>
      </div>

      {/* Title-only search with button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by job title..."
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setSearchTerm(titleInput);
                }
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setSearchTerm(titleInput)}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filtered.length} of {jobs.length} jobs
        </p>
      </div>

      {/* Job list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No jobs found</div>
        ) : (
          filtered.map((job) => (
            <div key={job.id} className="bg-white rounded-lg border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        job.status === "open"
                          ? "bg-green-100 text-green-800"
                          : job.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  {job.location && (
                    <div className="flex items-center text-sm text-gray-600 gap-4">
                      <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{job.location}</span>
                      <span className="flex items-center"><Clock className="h-4 w-4 mr-1" />{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}

  {/* Confirm Delete Modal */}
  {confirmDelete.open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Delete Job</h3>
          <button
            onClick={() => setConfirmDelete({ open: false, job: null })}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-gray-700">
          Are you sure you want to delete the job "{confirmDelete.job?.title}"? This action cannot be undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => setConfirmDelete({ open: false, job: null })}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const job = confirmDelete.job;
              if (!job?.id) return;
              try {
                await http('DELETE', `/jobs/${job.id}`);
                setJobs((prev) => prev.filter((j) => String(j.id) !== String(job.id)));
                setConfirmDelete({ open: false, job: null });
              } catch (e) {
                alert('Failed to delete job');
              }
            }}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  )}
                  <div className="mt-2 text-sm text-gray-700 line-clamp-2">{job.description}</div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center text-green-600">
                      <DollarSign className="h-5 w-5 mr-1" />
                      <span className="font-semibold">
                        {job.budgetMin && job.budgetMax
                          ? `${formatINR(job.budgetMin)} - ${formatINR(job.budgetMax)}`
                          : job.budgetMin
                          ? `${formatINR(job.budgetMin)}+`
                          : "Budget TBD"}
                      </span>
                    </div>
                    {typeof job.applicationsCount === "number" && (
                      <span className="text-sm text-gray-600">{job.applicationsCount} applications</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/employer/jobs/${job.id}`)}
                    className="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ open: true, job })}
                    className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Applications Modal */}
      {appsJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Applications — {appsJob.title}</h3>
              <button
                onClick={() => {
                  setAppsJob(null);
                  setSelectedApplication(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appsJob.applications.map((app, idx) => (
                <div key={app._id || idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Freelancer</div>
                  <div className="font-medium break-all">{app.freelancerId}</div>
                  <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    {app.proposedRate != null && (
                      <span>Proposed: <span className="font-medium">{formatINR(app.proposedRate)}</span></span>
                    )}
                    {app.estimatedDuration != null && (
                      <span>Duration: <span className="font-medium">{app.estimatedDuration} wks</span></span>
                    )}
                    {app.createdAt && (
                      <span>Applied: <span className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</span></span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedApplication(app)}
                    className="mt-3 inline-flex px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Details within modal */}
            {selectedApplication && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Application Details</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Freelancer</div>
                    <div className="font-medium break-all">{selectedApplication.freelancerId}</div>
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
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
