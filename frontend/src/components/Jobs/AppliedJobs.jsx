import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { formatINR } from "../../utils/currency";

export function AppliedJobs() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | accepted | declined

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      try {
        const data = await http("GET", `/jobs?appliedBy=${encodeURIComponent(profile.id)}`);
        setJobs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load applied jobs", e);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Derive my-application date per job for accurate sorting and display
  const jobsWithMyApp = Array.isArray(jobs)
    ? jobs.map((job) => {
        const myApp = Array.isArray(job.applications)
          ? job.applications.find((a) => a.freelancerId === profile?.id)
          : null;
        const appliedAt = myApp?.createdAt ? new Date(myApp.createdAt) : (job.updatedAt ? new Date(job.updatedAt) : new Date(job.createdAt));
        const myStatus = myApp?.status || job.status || 'pending';
        return { ...job, _myAppliedAt: appliedAt, _myApp: myApp, _myStatus: myStatus };
      })
    : [];

  // Sort by most recent application first
  const sorted = jobsWithMyApp.sort((a, b) => (b._myAppliedAt?.getTime?.() || 0) - (a._myAppliedAt?.getTime?.() || 0));

  // Status counts: treat 'applied' as 'pending'
  const counts = sorted.reduce(
    (acc, j) => {
      const s = (j?._myApp?.status || j?._myStatus || 'applied').toLowerCase();
      if (s === 'accepted') acc.accepted++;
      else if (s === 'declined') acc.declined++;
      else if (s === 'applied' || s === 'pending') acc.pending++;
      else acc.pending++;
      return acc;
    },
    { pending: 0, accepted: 0, declined: 0 }
  );

  // Apply status filter (pending includes 'applied')
  const filtered = sorted.filter((j) => {
    if (statusFilter === 'all') return true;
    const s = (j?._myApp?.status || j?._myStatus || 'applied').toLowerCase();
    if (statusFilter === 'pending') return s === 'pending' || s === 'applied';
    return s === statusFilter;
  });

  // Pagination (based on filtered)
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paged = filtered.slice(start, end);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applied Jobs</h1>
        <p className="text-gray-600">Jobs you have applied to</p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-lg">
          <p className="text-gray-600">You haven't applied to any jobs yet.</p>
          <Link to="/jobs" className="mt-3 inline-block text-blue-600 hover:text-blue-700">Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => { setStatusFilter('all'); setPage(1); }} className={`px-3 py-1.5 rounded-full border ${statusFilter==='all'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>All</button>
            <button onClick={() => { setStatusFilter('pending'); setPage(1); }} className={`px-3 py-1.5 rounded-full border ${statusFilter==='pending'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Pending ({counts.pending})</button>
            <button onClick={() => { setStatusFilter('accepted'); setPage(1); }} className={`px-3 py-1.5 rounded-full border ${statusFilter==='accepted'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Accepted ({counts.accepted})</button>
            <button onClick={() => { setStatusFilter('declined'); setPage(1); }} className={`px-3 py-1.5 rounded-full border ${statusFilter==='declined'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Declined ({counts.declined})</button>
          </div>
          {paged.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link to={`/jobs/${job.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {job.title}
                  </Link>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                      {job.budgetMin && job.budgetMax
                        ? `${formatINR(job.budgetMin)} - ${formatINR(job.budgetMax)}`
                        : job.budgetMin
                        ? `${formatINR(job.budgetMin)}+`
                        : "Budget TBD"}
                    </div>
                    {job.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Applied on {job._myAppliedAt ? job._myAppliedAt.toLocaleDateString() : new Date(job.updatedAt || job.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Your Application (compact) */}
                  {job._myApp && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">Your Application</div>
                      <div className="text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
                        {job._myApp.proposedRate != null && (
                          <span>Proposed: <span className="font-medium">{formatINR(job._myApp.proposedRate)}</span></span>
                        )}
                        {job._myApp.estimatedDuration != null && (
                          <span>Duration: <span className="font-medium">{job._myApp.estimatedDuration} weeks</span></span>
                        )}
                      </div>
                      {job._myApp.coverLetter && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{job._myApp.coverLetter}</p>
                      )}
                    </div>
                  )}

                </div>
                <div className="flex items-center gap-2">
                  
                  {/* Job status */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    String(job.status).toLowerCase() === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    String(job.status).toLowerCase() === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    String(job.status).toLowerCase() === 'closed' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                    String(job.status).toLowerCase() === 'paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    String(job.status).toLowerCase() === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {job.status ? (job.status.charAt(0).toUpperCase() + job.status.slice(1)) : 'Open'}
                  </span>
                  <Link
                    to={`/jobs/${job.id}`}
                    state={{ from: 'applied' }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                Showing {start + 1}-{Math.min(end, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-md border text-sm ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-md border text-sm ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
