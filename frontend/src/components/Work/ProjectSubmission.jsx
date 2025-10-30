import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { ArrowLeft, UploadCloud } from "lucide-react";

export function ProjectSubmission() {
  const { id } = useParams(); // job id
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [form, setForm] = useState({ deployLink: "", githubLink: "", description: "" });
  const [existing, setExisting] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!id || !profile?.id) { setLoading(false); return; }
      try {
        const job = await http("GET", `/jobs/${id}`);
        const mySub = Array.isArray(job?.submissions)
          ? job.submissions.find((s) => String(s.freelancerId) === String(profile.id))
          : null;
        if (mySub) {
          setExisting(mySub);
          setForm({
            deployLink: mySub.deployLink || "",
            githubLink: mySub.githubLink || "",
            description: mySub.description || "",
          });
        }
      } catch (e) {
        console.error("Failed to fetch job/submission", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, profile?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const doSubmit = async () => {
    if (!id || !profile?.id) return;
    setSubmitting(true);
    try {
      const payload = {
        freelancerId: profile.id,
        deployLink: form.deployLink || undefined,
        githubLink: form.githubLink || undefined,
        description: form.description || undefined,
      };
      if (existing) {
        await http("PUT", `/jobs/${id}/submissions`, payload);
      } else {
        await http("POST", `/jobs/${id}/submissions`, payload);
      }
      setConfirmOpen(false);
      navigate("/work");
    } catch (e) {
      console.error("Failed to submit project", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link to="/work" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Work
        </Link>
      </div>
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <UploadCloud className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">{existing ? 'Update your submission' : 'Submit your work'}</h1>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Deployed Link</label>
            <input
              type="url"
              name="deployLink"
              placeholder="https://your-app.example.com"
              value={form.deployLink}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub Repository</label>
            <input
              type="url"
              name="githubLink"
              placeholder="https://github.com/user/repo"
              value={form.githubLink}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={5}
              placeholder="Briefly describe what you built, how to run it, and anything the client should know."
              value={form.description}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? (existing ? 'Updating...' : 'Submitting...') : (existing ? 'Update' : 'Submit')}
            </button>
          </div>
        </form>
        )}
      </div>
      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{existing ? 'Confirm update' : 'Confirm submission'}</h3>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Deployed Link</div>
                <div className="text-gray-900 break-words">{form.deployLink || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">GitHub Repository</div>
                <div className="text-gray-900 break-words">{form.githubLink || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Description</div>
                <div className="text-gray-900 whitespace-pre-wrap max-h-40 overflow-auto border rounded p-2 bg-gray-50">{form.description || '—'}</div>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={doSubmit} disabled={submitting} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{existing ? 'Update Final' : 'Submit Final'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
