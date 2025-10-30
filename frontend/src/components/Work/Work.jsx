import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, DollarSign, Clock, Phone, Mail, MessageCircle, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { formatINR } from "../../utils/currency.js";

export function Work() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactJob, setContactJob] = useState(null);
  const [employerContact, setEmployerContact] = useState(null); // { email, phone, fullName }
  const [confirmCancelJob, setConfirmCancelJob] = useState(null);
  const [savingCancel, setSavingCancel] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'accepted' | 'completed' | 'cancelled' | 'all'

  useEffect(() => {
    const load = async () => {
      try {
        const id = profile?.id;
        if (!id) return;
        const all = await http("GET", `/jobs?appliedBy=${id}`);
        setJobs(Array.isArray(all) ? all : []);
      } catch (e) {
        console.error("Failed to load work jobs", e);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  // When contact modal opens, fetch employer contact from Employers table
  useEffect(() => {
    const loadEmployer = async () => {
      if (!contactOpen || !contactJob?.employerId) { setEmployerContact(null); return; }
      try {
        const emp = await http('GET', `/users/${contactJob.employerId}?type=employer`);
        const p = emp?.profile || {};
        setEmployerContact({
          email: emp?.email || p?.email || '',
          phone: p?.phone || '',
          fullName: p?.fullName || '',
        });
      } catch (e) {
        console.error('Failed to load employer contact', e);
        setEmployerContact(null);
      }
    };
    loadEmployer();
  }, [contactOpen, contactJob?.employerId]);

  const phoneDigits = useMemo(() => {
    const raw = employerContact?.phone || '';
    return raw.replace(/\D/g, '');
  }, [employerContact?.phone]);

  const waLink = phoneDigits ? `https://wa.me/${phoneDigits}` : null;
  const mailLink = (jobTitle) => (employerContact?.email ? `mailto:${employerContact.email}?subject=${encodeURIComponent("Regarding job: " + (jobTitle || ""))}` : null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Derived filtered list
  const filteredJobs = (Array.isArray(jobs) ? jobs : []).filter((job) => {
    const apps = Array.isArray(job.applications) ? job.applications : [];
    const myAccepted = apps.some((a) => a?.freelancerId === profile?.id && a?.status === 'accepted');
    const s = String(job.status).toLowerCase();
    const isCompleted = s === 'completed';
    const isCancelled = s === 'cancelled';
    if (statusFilter === 'accepted') return myAccepted && !isCompleted && !isCancelled;
    if (statusFilter === 'completed') return myAccepted && isCompleted;
    if (statusFilter === 'cancelled') return myAccepted && isCancelled;
    // all: accepted (not completed/cancelled) + completed + cancelled
    return (myAccepted && !isCompleted && !isCancelled) || isCompleted || isCancelled;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work</h1>
        <p className="text-gray-600 mt-1">Accepted jobs and collaboration rooms with employers.</p>
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <button onClick={() => setStatusFilter('accepted')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='accepted'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Accepted</button>
        <button onClick={() => setStatusFilter('completed')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='completed'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Completed</button>
        <button onClick={() => setStatusFilter('cancelled')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='cancelled'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancelled</button>
        <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='all'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>All</button>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600">No jobs to show for this filter.</p>
        </div>
      ) : (
        <>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Accepted Jobs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 min-h-[14rem] h-full">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{job.description}</p>
                </div>
                {String(job.status).toLowerCase() === 'completed' ? (
                  <span className="inline-flex items-center text-green-700 bg-green-50 border border-green-200 text-xs font-medium px-2 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Completed
                  </span>
                ) : String(job.status).toLowerCase() === 'cancelled' ? (
                  <span className="inline-flex items-center text-red-700 bg-red-50 border border-red-200 text-xs font-medium px-2 py-1 rounded-full">
                    Cancelled
                  </span>
                ) : (
                  <span className="inline-flex items-center text-green-700 bg-green-50 border border-green-200 text-xs font-medium px-2 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accepted
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-600 mr-1" />
                  {typeof job.budgetMin === "number" || typeof job.budgetMax === "number"
                    ? `${job.budgetMin ? formatINR(job.budgetMin) : ""}${job.budgetMin && job.budgetMax ? " - " : ""}${job.budgetMax ? formatINR(job.budgetMax) : job.budgetMin ? "+" : ""}`
                    : "Budget TBD"}
                </div>
                {job.durationWeeks ? (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-600 mr-1" />
                    {job.durationWeeks} weeks
                  </div>
                ) : (
                  <div className="hidden sm:flex" />
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-600 mr-1" />
                  Updated {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Submission details (if any) */}
              {Array.isArray(job.submissions) && job.submissions.find((s) => s.freelancerId === profile?.id) && (
                (() => {
                  const mySub = job.submissions.find((s) => s.freelancerId === profile?.id);
                  return (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Your Submission</div>
                      <div className="text-sm text-gray-700 space-y-2">
                        {mySub.deployLink && (
                          <div>
                            <span className="text-gray-600">Deployed: </span>
                            <a href={mySub.deployLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 break-all">{mySub.deployLink}</a>
                          </div>
                        )}
                        {mySub.githubLink && (
                          <div>
                            <span className="text-gray-600">GitHub: </span>
                            <a href={mySub.githubLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 break-all">{mySub.githubLink}</a>
                          </div>
                        )}
                        {mySub.description && (
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Description</div>
                            <div className="text-gray-900 whitespace-pre-wrap max-h-40 overflow-auto border rounded p-3 bg-white">{mySub.description}</div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">Submitted {mySub.createdAt ? new Date(mySub.createdAt).toLocaleString() : ''}</div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Footer */}
              <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100">
                {/* Left: Actions (Submit / Cancel) */}
                <div className="flex items-center gap-2">
                  {!(String(job.status).toLowerCase() === 'completed' || String(job.status).toLowerCase() === 'cancelled') && (
                    <button
                      type="button"
                      onClick={() => navigate(`/work/${job.id}/submit`)}
                      className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {Array.isArray(job.submissions) && job.submissions.find((s) => s.freelancerId === profile?.id) ? 'Update Submission' : 'Submit'}
                    </button>
                  )}
                  {!(String(job.status).toLowerCase() === 'completed' || String(job.status).toLowerCase() === 'cancelled') && (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelJob(job)}
                      className="px-3 py-1.5 rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/jobs/${job.id}`}
                    state={{ from: 'work' }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Job
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setContactJob(job); setContactOpen(true); }}
                    className="px-3 py-1.5 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Contact Modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
                {contactJob?.title && (
                  <p className="text-xs text-gray-500">For: {contactJob.title}</p>
                )}
              </div>
              <button onClick={() => setContactOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-800">{employerContact?.phone || 'No employer phone found'}</div>
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-0.5">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-800">{employerContact?.email || 'No employer email found'}</div>
                  
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={() => setContactOpen(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancelJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Job?</h3>
              <button onClick={() => setConfirmCancelJob(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700 space-y-2">
              <p>Are you sure you want to cancel this job? This will mark the job as cancelled and you will no longer be able to submit updates.</p>
              {confirmCancelJob?.title && (
                <p className="text-xs text-gray-500">Job: <span className="font-medium text-gray-800">{confirmCancelJob.title}</span></p>
              )}
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button onClick={() => setConfirmCancelJob(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">No, go back</button>
              <button
                onClick={async () => {
                  try {
                    setSavingCancel(true);
                    await http('PATCH', `/jobs/${confirmCancelJob.id}`, { status: 'cancelled' });
                    setJobs((prev) => prev.map((j) => (j.id === confirmCancelJob.id ? { ...j, status: 'cancelled' } : j)));
                    // Notify other tabs/pages (e.g., Employer Work) to refresh immediately
                    try { localStorage.setItem('workRefresh', String(Date.now())); } catch {}
                    setConfirmCancelJob(null);
                  } catch (e) {
                    console.error('Failed to cancel job', e);
                    alert('Failed to cancel job');
                  } finally {
                    setSavingCancel(false);
                  }
                }}
                disabled={savingCancel}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {savingCancel ? 'Cancelling...' : 'Yes, cancel job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
