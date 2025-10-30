import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { ArrowLeft } from "lucide-react";

export function EmployerJobEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    budgetType: "fixed",
    budgetMin: "",
    budgetMax: "",
    durationWeeks: "",
    experienceLevel: "",
    location: "",
    remoteAllowed: true,
    relevantExperience: "",
    proposedApproach: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await http("GET", `/jobs/${id}`);
        setJob(data);
        setForm({
          title: data.title || "",
          description: data.description || "",
          budgetType: data.budgetType || "fixed",
          budgetMin: data.budgetMin ?? "",
          budgetMax: data.budgetMax ?? "",
          durationWeeks: data.durationWeeks ?? "",
          experienceLevel: data.experienceLevel || "",
          location: data.location || "",
          remoteAllowed: typeof data.remoteAllowed === 'boolean' ? data.remoteAllowed : true,
          relevantExperience: data.relevantExperience || "",
          proposedApproach: data.proposedApproach || "",
        });
      } catch (e) {
        console.error("Failed to load job for edit", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const canEdit = useMemo(() => {
    const role = profile?.role || user?.role;
    const ownerId = profile?.id || user?.id;
    return role === 'employer' && job && ownerId && String(job.employerId) === String(ownerId);
  }, [job, profile, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        budgetType: form.budgetType,
        budgetMin: form.budgetMin === "" ? null : Number(form.budgetMin),
        budgetMax: form.budgetMax === "" ? null : Number(form.budgetMax),
        durationWeeks: form.durationWeeks === "" ? null : Number(form.durationWeeks),
        experienceLevel: form.experienceLevel || undefined,
        location: form.location || undefined,
        remoteAllowed: !!form.remoteAllowed,
        relevantExperience: form.relevantExperience || undefined,
        proposedApproach: form.proposedApproach || undefined,
      };
      await http("PATCH", `/jobs/${id}`, payload);
      navigate(`/employer/jobs/${id}`);
    } catch (e) {
      console.error("Failed to save job", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not authorized to edit this job</h1>
          <Link to="/employer/jobs" className="text-blue-600 hover:text-blue-700">← Back to Manage Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
      </div>
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Edit Job</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={6}
              value={form.description}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Type</label>
              <select
                name="budgetType"
                value={form.budgetType}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (weeks)</label>
              <input
                type="number"
                min="0"
                name="durationWeeks"
                value={form.durationWeeks}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Min</label>
              <input
                type="number"
                min="0"
                name="budgetMin"
                value={form.budgetMin}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Max</label>
              <input
                type="number"
                min="0"
                name="budgetMax"
                value={form.budgetMax}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience Level</label>
              <select
                name="experienceLevel"
                value={form.experienceLevel}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select</option>
                <option value="entry">Entry</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input id="remoteAllowed" type="checkbox" name="remoteAllowed" checked={form.remoteAllowed} onChange={handleChange} />
              <label htmlFor="remoteAllowed" className="text-sm text-gray-700">Remote allowed</label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Relevant Experience (optional)</label>
              <textarea
                name="relevantExperience"
                rows={3}
                value={form.relevantExperience}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Proposed Approach (optional)</label>
              <textarea
                name="proposedApproach"
                rows={3}
                value={form.proposedApproach}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate(`/employer/jobs/${id}`)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
