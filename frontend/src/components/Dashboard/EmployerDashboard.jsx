import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Eye, Plus, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { http } from '../../services/http.js';

export function EmployerDashboard({ jobs, applications, projects }) {
  const { user, profile } = useAuth();

  // Metrics sourced from backend
  const [employerJobs, setEmployerJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    const loadJobs = async () => {
      if (!profile?.id || user?.role !== 'employer') return;
      setLoadingJobs(true);
      try {
        const list = await http('GET', `/jobs?employerId=${encodeURIComponent(profile.id)}`);
        setEmployerJobs(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Failed to load employer jobs', e);
        setEmployerJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };
    loadJobs();
    // Refresh on focus/visibility/storage signals (status changes)
    const onFocus = () => loadJobs();
    const onVisibility = () => { if (document.visibilityState === 'visible') loadJobs(); };
    const onStorage = (e) => { if (e.key === 'jobStatusChanged' || e.key === 'workRefresh') loadJobs(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, [profile?.id, user?.role]);

  // Derive live counts from employerJobs
  const totalApplicationsCount = (Array.isArray(employerJobs) ? employerJobs : []).reduce((sum, j) => sum + (Array.isArray(j.applications) ? j.applications.length : 0), 0);

  // Derive accepted projects from employerJobs only: has at least one application with status 'accepted'
  const acceptedProjects = (Array.isArray(employerJobs) ? employerJobs : []).filter((job) => {
    const apps = Array.isArray(job.applications) ? job.applications : [];
    return apps.some(a => String(a.status || '').trim().toLowerCase() === 'accepted');
  });
  // Active Projects = accepted but job.status not completed
  const activeAcceptedProjects = acceptedProjects.filter(j => String(j.status || '').toLowerCase() !== 'completed');
  // Completed Projects = accepted and job.status completed
  const completedAcceptedProjects = acceptedProjects.filter(j => String(j.status || '').toLowerCase() === 'completed');

  const stats = [
    {
      name: 'Total Applications',
      value: totalApplicationsCount,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: 'Completed Projects',
      value: completedAcceptedProjects.length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ];

  // Flatten recent applications and pending count for the badge/list
  const allApps = (Array.isArray(employerJobs) ? employerJobs : []).flatMap((job) => {
    const apps = Array.isArray(job.applications) ? job.applications : [];
    return apps.map(a => ({
      id: a._id || `${job.id}:${a.freelancerId}`,
      status: a.status,
      created_at: a.createdAt,
      jobTitle: job.title,
      freelancer: a.freelancerName || a.freelancerId,
    }));
  }).sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
  const pendingApplicationsCount = allApps.filter(a => String(a.status||'').toLowerCase() === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.fullName}</h1>
            <p className="text-gray-600 mt-2">Manage your job postings and hiring pipeline</p>
          </div>
          <Link
            to="/create-job"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Link>
        </div>
      </div>

      {/* Stats Grid (from DB) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Job Postings</h2>
              <Link
                to="/employer/jobs"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {employerJobs.length === 0 ? (
              <div className="text-center py-6">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No jobs posted yet</p>
                <Link
                  to="/create-job"
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  Post your first job
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {employerJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">
                        {(Array.isArray(job.applications) ? job.applications.length : (job.applications_count || 0))} applications
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              {pendingApplicationsCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {pendingApplicationsCount} pending
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            {allApps.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allApps.slice(0, 5).map((application) => (
                  <div key={application.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{application.freelancer}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{application.jobTitle}</p>
                    <p className="text-xs text-gray-500">
                      Applied {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/create-job"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Post New Job</p>
              <p className="text-sm text-gray-600">Find great freelancers</p>
            </div>
          </Link>
          <Link
            to="/freelancers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Browse Freelancers</p>
              <p className="text-sm text-gray-600">Invite talented professionals</p>
            </div>
          </Link>
          <Link
            to="/employer/jobs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Jobs</p>
              <p className="text-sm text-gray-600">View all postings</p>
            </div>
          </Link>
          <Link
            to="/work"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Track Projects</p>
              <p className="text-sm text-gray-600">Monitor progress</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
