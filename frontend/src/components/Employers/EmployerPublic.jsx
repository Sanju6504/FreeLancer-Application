import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../../services/http";
import { MapPin, Briefcase, Mail, Loader2 } from "lucide-react";

export function EmployerPublic() {
  const { id } = useParams();
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await http("GET", `/employers/${id}`);
        setEmployer(data);
      } catch (e) {
        setError(e?.message || "Failed to load employer");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  if (error || !employer) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Employer Not Found</h1>
          <p className="text-gray-600 mb-4">{error || "We couldn't find this employer."}</p>
          <Link to="/admin/dashboard" className="text-blue-600 hover:text-blue-700">← Back</Link>
        </div>
      </div>
    );
  }

  const profile = employer.profile || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
            {(profile.fullName || employer.fullName || "E").charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{profile.fullName || employer.fullName || "Employer"}</h1>
            {profile.title && (
              <div className="mt-1 text-gray-600 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> {profile.title}
              </div>
            )}
            <div className="mt-1 text-gray-600 flex items-center gap-4">
              {employer.email && (
                <span className="inline-flex items-center"><Mail className="w-4 h-4 mr-1" />{employer.email}</span>
              )}
              {profile.location && (
                <span className="inline-flex items-center"><MapPin className="w-4 h-4 mr-1" />{profile.location}</span>
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="text-xs text-gray-500">Active Jobs</div>
            <div className="text-xl font-semibold text-gray-900">{profile.activeJobs ?? 0}</div>
          </div>
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="text-xs text-gray-500">Total Applications</div>
            <div className="text-xl font-semibold text-gray-900">{profile.totalApplications ?? 0}</div>
          </div>
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="text-xs text-gray-500">Active Projects</div>
            <div className="text-xl font-semibold text-gray-900">{profile.activeProjects ?? 0}</div>
          </div>
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="text-xs text-gray-500">Draft Jobs</div>
            <div className="text-xl font-semibold text-gray-900">{profile.draftJobs ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
