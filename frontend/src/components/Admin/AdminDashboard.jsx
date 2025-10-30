import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { http } from "../../services/http";
import { Users, Briefcase, Building2, Loader2, ExternalLink } from "lucide-react";

const PAGE_SIZE = 10;

export function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [freelancers, setFreelancers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [f, e, j] = await Promise.all([
          http("GET", "/users?role=freelancer"),
          http("GET", "/employers"),
          http("GET", "/jobs"),
        ]);
        setFreelancers(Array.isArray(f) ? f : []);
        setEmployers(Array.isArray(e) ? e : []);
        setJobs(Array.isArray(j) ? j : []);
      } catch (err) {
        console.error("Failed to load admin data", err);
        setFreelancers([]);
        setEmployers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derived metrics
  const metrics = useMemo(() => {
    const fCount = freelancers.length;
    const eCount = employers.length;
    const jCount = jobs.length;
    return { fCount, eCount, jCount };
  }, [freelancers, employers, jobs]);

  // ----- Analytics data prep -----
  const avgApplications = useMemo(() => {
    if (!jobs.length) return 0;
    const total = jobs.reduce((s, j) => s + (Array.isArray(j.applications) ? j.applications.length : 0), 0);
    return Number((total / jobs.length).toFixed(2));
  }, [jobs]);

  const jobsLast30Days = useMemo(() => {
    // Count jobs per day for last 30 days
    const days = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return { key, label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 };
    });
    const index = new Map(days.map((d, i) => [d.key, i]));
    for (const j of jobs) {
      const created = j.createdAt ? new Date(j.createdAt) : null;
      if (!created) continue;
      const key = created.toISOString().slice(0, 10);
      if (index.has(key)) days[index.get(key)].count++;
    }
    return days;
  }, [jobs]);
  const jobsLast30DaysCount = useMemo(() => jobsLast30Days.reduce((s, d) => s + d.count, 0), [jobsLast30Days]);

  const topJobsByApps = useMemo(() => {
    const arr = jobs
      .map((j) => ({ title: j.title || "Untitled", apps: Array.isArray(j.applications) ? j.applications.length : 0 }))
      .sort((a, b) => b.apps - a.apps)
      .slice(0, 5)
      .map((x) => ({ name: x.title.length > 18 ? x.title.slice(0, 18) + "…" : x.title, apps: x.apps }));
    return arr;
  }, [jobs]);

  const topSkills = useMemo(() => {
    const freq = new Map();
    for (const f of freelancers) {
      const skills = Array.isArray(f.profile?.skills) ? f.profile.skills : [];
      for (const s of skills) {
        const name = typeof s === 'string' ? s : s?.name;
        if (!name) continue;
        const key = String(name).trim();
        if (!key) continue;
        freq.set(key, (freq.get(key) || 0) + 1);
      }
    }
    const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return sorted.map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, count }));
  }, [freelancers]);

  const budgetDistribution = useMemo(() => {
    const buckets = [
      { label: "< ₹10k", test: (min, max) => (min ?? 0) < 10000 && (max ?? 0) <= 10000, value: 0 },
      { label: "₹10k–₹50k", test: (min, max) => (max ?? 0) > 10000 && (max ?? 0) <= 50000, value: 0 },
      { label: "₹50k–₹100k", test: (min, max) => (max ?? 0) > 50000 && (max ?? 0) <= 100000, value: 0 },
      { label: "> ₹100k", test: (min, max) => (max ?? 0) > 100000, value: 0 },
    ];
    for (const j of jobs) {
      const min = typeof j.budgetMin === 'number' ? j.budgetMin : undefined;
      const max = typeof j.budgetMax === 'number' ? j.budgetMax : undefined;
      const b = buckets.find((b) => b.test(min, max));
      if (b) b.value++;
    }
    return buckets;
  }, [jobs]);
  const totalApplications = useMemo(() => jobs.reduce((s, j) => s + (Array.isArray(j.applications) ? j.applications.length : 0), 0), [jobs]);
  const mostActiveEmployers = useMemo(() => {
    const map = new Map();
    for (const j of jobs) {
      const id = j.employerId ? String(j.employerId) : null;
      if (!id) continue;
      map.set(id, (map.get(id) || 0) + 1);
    }
    const arr = Array.from(map.entries())
      .map(([id, count]) => {
        const emp = employers.find((e) => String(e.id) === id);
        const name = emp?.profile?.fullName || emp?.fullName || id;
        return { id, name, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return arr;
  }, [jobs, employers]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-5 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome {admin?.profile?.fullName || admin?.email}</p>
      </div>

      {/* Analytics (numbers only) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Avg. Applications per Job</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{avgApplications}</div>
          <div className="text-xs text-gray-500 mt-1">from {jobs.length} jobs</div>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Jobs in last 30 days</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{jobsLast30DaysCount}</div>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Total Applications</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{totalApplications}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Budget distribution (numbers) */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-sm font-semibold text-gray-900 mb-3">Budget distribution</div>
          <div className="space-y-2">
            {budgetDistribution.map((b) => (
              <div key={b.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{b.label}</span>
                <span className="font-semibold text-gray-900">{b.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top jobs by applications (numbers) */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-sm font-semibold text-gray-900 mb-3">Top jobs by applications</div>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            {topJobsByApps.map((j, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span className="text-gray-700 truncate pr-2">{j.name}</span>
                <span className="font-semibold text-gray-900">{j.apps}</span>
              </li>
            ))}
            {topJobsByApps.length === 0 && <div className="text-gray-500">No data</div>}
          </ol>
        </div>
      </div>

      {/* Most active employers */}
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="text-sm font-semibold text-gray-900 mb-3">Most active employers (by jobs)</div>
        <ol className="space-y-2 text-sm list-decimal list-inside">
          {mostActiveEmployers.map((e) => (
            <li key={e.id} className="flex items-center justify-between">
              <span className="text-gray-700 truncate pr-2">{e.name}</span>
              <span className="font-semibold text-gray-900">{e.count}</span>
            </li>
          ))}
          {mostActiveEmployers.length === 0 && <div className="text-gray-500">No data</div>}
        </ol>
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Freelancers</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.fCount}</div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Employers</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.eCount}</div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Jobs</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.jCount}</div>
          </div>
        </div>
      </div>


      {/* Freelancers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Freelancers</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
            </div>
          ) : freelancers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No freelancers found</div>
          ) : (
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {freelancers.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.profile?.fullName || row.fullName || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.profile?.title || row.title || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.email || row.profile?.email || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" to={`/freelancers/${row.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Employers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Employers</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
            </div>
          ) : employers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No employers found</div>
          ) : (
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employers.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.profile?.fullName || row.fullName || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.profile?.title || row.title || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.email || row.profile?.email || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" to={`/employers/${row.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No jobs found</div>
          ) : (
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicants</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Applicant</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((row) => {
                  const employerId = row.employerId ? String(row.employerId) : "";
                  const employer = employers.find((e) => String(e.id) === employerId);
                  const employerName = employer?.profile?.fullName || employer?.fullName || "—";
                  const apps = Array.isArray(row.applications) ? row.applications : [];
                  const applicantsCount = apps.length;
                  const topApp = apps[0];
                  const topApplicantName = topApp?.freelancerName || "—";
                  const topApplicantId = topApp?.freelancerId;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-2 py-2 text-sm text-gray-900">{row.title || "—"}</td>
                      <td className="px-2 py-2 text-sm text-gray-600">{employerName}</td>
                      <td className="px-2 py-2 text-sm text-gray-600">{applicantsCount}</td>
                      <td className="px-2 py-2 text-sm text-gray-600">
                        {topApplicantId ? (
                          <Link className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700" to={`/freelancers/${topApplicantId}`}>
                            {topApplicantName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Link className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" to={`/jobs/${row.id}`} state={{ from: 'admin' }}>
                          View Job
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
