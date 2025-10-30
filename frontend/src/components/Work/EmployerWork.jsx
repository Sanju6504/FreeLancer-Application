import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { Clipboard } from "lucide-react";
import { EmployerWorkItem } from "./EmployerWorkItem";

export function EmployerWork() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | accepted | completed | cancelled
  // Using per-item component; no modals in this container

  const load = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    try {
      const data = await http("GET", `/jobs?employerId=${profile.id}`);
      const list = Array.isArray(data) ? data : [];
      // Keep only jobs that have an accepted application
      const withAccepted = list
        .map((job) => {
          const apps = Array.isArray(job.applications) ? job.applications : [];
          const accepted = apps.find((a) => a?.status === "accepted");
          return accepted ? { ...job, _acceptedApp: accepted } : null;
        })
        .filter(Boolean);
      setJobs(withAccepted);
    } catch (e) {
      console.error("Failed to load employer work", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
    // Poll periodically to pick up status changes (e.g., freelancer cancellation)
    const id = setInterval(load, 20000);
    // Listen for cross-tab notifications (e.g., freelancer cancel triggers a localStorage flag)
    const onStorage = (e) => {
      if (e.key === 'workRefresh') {
        load();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', onStorage);
    };
  }, [load]);

  // No helpers needed here; moved into item component

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Derived filtered list
  const normalized = search.trim().toLowerCase();
  const filtered = jobs.filter((j) => {
    const s = (j.status || '').toLowerCase();
    const statusOk = statusFilter === 'all' ? true : s === statusFilter;
    const text = `${j.title || ''}`.toLowerCase();
    const searchOk = normalized === '' ? true : text.includes(normalized);
    return statusOk && searchOk;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work</h1>
        <p className="text-gray-600 mt-1">Accepted jobs and quick access to contact and submissions.</p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='all'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>All</button>
          <button onClick={() => setStatusFilter('accepted')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='accepted'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Accepted</button>
          <button onClick={() => setStatusFilter('completed')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='completed'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Completed</button>
          <button onClick={() => setStatusFilter('cancelled')} className={`px-3 py-1.5 rounded-full border ${statusFilter==='cancelled'?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancelled</button>
        </div>
        <div className="sm:ml-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title..."
            className="w-full sm:w-72 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border">
          <Clipboard className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600">No accepted jobs yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((job) => (
            <EmployerWorkItem
              key={job.id}
              job={job}
              onStatusChange={(status) => {
                setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status } : j)));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
