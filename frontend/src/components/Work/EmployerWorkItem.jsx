import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { User, ExternalLink, Github, Mail, Phone } from "lucide-react";

export function EmployerWorkItem({ job, onStatusChange }) {
  const { profile } = useAuth();
  const [freelancer, setFreelancer] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [jobStatus, setJobStatus] = useState(job.status);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const accepted = Array.isArray(job.applications)
    ? job.applications.find((a) => a?.status === "accepted")
    : null;
  const freelancerId = accepted?.freelancerId;

  useEffect(() => {
    const load = async () => {
      if (!freelancerId) return;
      try {
        const u = await http("GET", `/users/${freelancerId}`);
        setFreelancer(u);
      } catch (e) {
        console.error("Failed to load freelancer", e);
      }
      try {
        const latest = await http("GET", `/jobs/${job.id}`);
        const arr = Array.isArray(latest?.submissions) ? latest.submissions : [];
        const sub = arr.find((s) => String(s.freelancerId) === String(freelancerId)) || null;
        setSubmission(sub);
      } catch (e) {
        console.error("Failed to load submission", e);
      }
    };
    load();
  }, [freelancerId, job.id]);

  const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "");

  const updateStatus = async (next) => {
    try {
      setSaving(true);
      await http("PATCH", `/jobs/${job.id}`, { status: next });
      setJobStatus(next);
      if (typeof onStatusChange === 'function') onStatusChange(next);
      try { localStorage.setItem('jobStatusChanged', String(Date.now())); } catch {}
    } catch (e) {
      console.error(`Failed to set status ${next}`, e);
      alert(`Failed to set status to ${next}`);
    } finally {
      setSaving(false);
    }
  };

  const completeJob = async () => {
    try {
      setSaving(true);
      // 1) Create employer review on freelancer profile
      if (freelancerId && profile?.id) {
        await http("POST", `/users/${freelancerId}/reviews`, {
          jobId: job.id,
          employerId: profile.id,
          rating: Number(reviewRating),
          comment: reviewComment || undefined,
        });
      }
      // 2) Mark job as completed
      await http("PATCH", `/jobs/${job.id}`, { status: "completed" });
      setJobStatus("completed");
      if (typeof onStatusChange === 'function') onStatusChange('completed');
      setConfirmComplete(false);
      try { localStorage.setItem('jobStatusChanged', String(Date.now())); } catch {}
      
    } catch (e) {
      console.error("Failed to mark job completed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Left: Submission */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">SUBMISSION</h2>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            {submission ? (
              <div className="space-y-3 text-sm">
                {submission.createdAt && (
                  <div className="text-xs text-gray-500">Submitted on {fmtDateTime(submission.createdAt)}</div>
                )}
                {submission.deployLink && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                    <a
                      href={submission.deployLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 break-all"
                    >
                      {submission.deployLink}
                    </a>
                  </div>
                )}
                {submission.githubLink && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-gray-600" />
                    <a
                      href={submission.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 break-all"
                    >
                      {submission.githubLink}
                    </a>
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Description</div>
                  <div className="text-gray-900 whitespace-pre-wrap max-h-56 overflow-auto border rounded p-3 bg-white">
                    {submission.description || "—"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Submission is not done.</div>
            )}
          </div>
        </div>

        {/* Right: Job + Freelancer + Actions */}
        <div className="lg:col-span-1">
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Job</h3>
            <Link to={`/jobs/${job.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
              {job.title}
            </Link>
            {accepted?.createdAt && (
              <div className="text-xs text-gray-500 mt-1">Accepted on {fmtDateTime(accepted.createdAt)}</div>
            )}
            {jobStatus && (() => {
              const base = 'mt-2 inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ';
              const variant = jobStatus === 'completed'
                ? 'text-green-700 bg-green-50 border-green-200'
                : jobStatus === 'cancelled'
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-gray-700 bg-gray-50 border-gray-200';
              return (
                <div className={`${base}${variant}`}>
                  {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
                </div>
              );
            })()}
          </div>

          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Freelancer</h3>
            {freelancer ? (
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{freelancer?.profile?.fullName || freelancer?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{freelancer?.profile?.email || freelancer?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{freelancer?.profile?.phone || "—"}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Loading freelancer...</div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between gap-3">
            {/* Left: Status Controls */}
            <div className="flex items-center gap-2">
              {/* Cancel */}
              {jobStatus !== 'completed' && jobStatus !== 'cancelled' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmCancel(true)}
                  className="px-3 py-1.5 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
              {/* Complete */}
              {jobStatus !== 'cancelled' && (
                <button
                  type="button"
                  disabled={jobStatus === 'completed'}
                  onClick={() => setConfirmComplete(true)}
                  className={`px-3 py-1.5 rounded-md text-sm text-white ${jobStatus === 'completed' ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {jobStatus === 'completed' ? 'Completed' : 'Complete'}
                </button>
              )}
            </div>

            {/* Right: Navigation / Contact */}
            <div className="flex items-center gap-2">
              <Link
                to={`/jobs/${job.id}`}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                View Job
              </Link>
              {freelancer && (
                <a
                  href={freelancer?.profile?.phone ? `https://wa.me/${String(freelancer.profile.phone).replace(/\D/g, "")}` : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                  onClick={(e) => { if (!freelancer?.profile?.phone) e.preventDefault(); }}
                >
                  Contact
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      {confirmComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add a review and complete</h3>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700 space-y-3">
              <p className="text-gray-700">Please provide a quick review for the freelancer before completing.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Fair</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Very Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share brief feedback about the work quality, communication, and timeliness."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500">Your review will be added to the freelancer's profile.</p>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button onClick={() => setConfirmComplete(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={completeJob} disabled={saving} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">{saving ? 'Saving...' : 'Submit Review & Complete'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Job?</h3>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700 space-y-2">
              <p>This will mark the job as cancelled. The freelancer will no longer be able to submit updates.</p>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button onClick={() => setConfirmCancel(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">No, go back</button>
              <button
                onClick={async () => {
                  await updateStatus('cancelled');
                  setConfirmCancel(false);
                }}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? 'Cancelling...' : 'Yes, cancel job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
