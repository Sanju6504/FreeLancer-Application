import React, { useEffect, useState } from "react";
import { http } from "../../services/http";

export function EditProjectModal({ project, freelancerId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    technologies: "",
    duration: "",
    budget: "",
    completedAt: "",
    projectUrl: "",
    githubUrl: "",
    clientName: "",
    isPublic: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project) return;
    setForm({
      title: project.title || "",
      description: project.description || "",
      technologies: Array.isArray(project.technologies) ? project.technologies.join(", ") : "",
      duration: project.duration || "",
      budget: project.budget ?? "",
      completedAt: project.completedAt ? new Date(project.completedAt).toISOString().slice(0, 10) : "",
      projectUrl: project.projectUrl || "",
      githubUrl: project.githubUrl || "",
      clientName: project.clientName || "",
      isPublic: project.isPublic !== false,
    });
  }, [project]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description,
        technologies: form.technologies.split(",").map((s) => s.trim()).filter(Boolean),
        duration: form.duration || undefined,
        budget: form.budget === "" ? undefined : Number(form.budget),
        completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : undefined,
        projectUrl: form.projectUrl || undefined,
        githubUrl: form.githubUrl || undefined,
        clientName: form.clientName || undefined,
        isPublic: !!form.isPublic,
      };
      let updated;
      if (project._source === 'embedded' && freelancerId) {
        // Update embedded project under user profile
        updated = await http("PUT", `/users/${freelancerId}/projects/${project._id || project.id}` , {
          title: payload.title,
          description: payload.description,
          technologies: payload.technologies,
          duration: payload.duration,
          budget: payload.budget,
          completedAt: payload.completedAt,
          projectUrl: payload.projectUrl,
          githubUrl: payload.githubUrl,
          public: payload.isPublic,
        });
        // users route returns { success, project }
        if (updated && updated.project) {
          updated = { ...updated.project, _source: 'embedded' };
        }
      } else {
        // Update collection-based project
        updated = await http("PUT", `/projects/${project._id || project.id}`, payload);
        if (updated) updated._source = 'collection';
      }
      if (onSaved) onSaved(updated);
      onClose();
    } catch (e) {
      console.error("Failed to save project", e);
      alert(e?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Project</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="px-5 py-4 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technologies (comma separated)</label>
              <input name="technologies" value={form.technologies} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input name="duration" value={form.duration} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (INR)</label>
              <input name="budget" type="number" value={form.budget} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
              <input name="completedAt" type="date" value={form.completedAt} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
              <input name="projectUrl" value={form.projectUrl} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <input name="githubUrl" value={form.githubUrl} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input name="clientName" value={form.clientName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} />
              Public in portfolio
            </label>
          </div>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}
