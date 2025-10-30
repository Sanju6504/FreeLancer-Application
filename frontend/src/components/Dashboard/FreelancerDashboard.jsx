import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, DollarSign, Star, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { http } from '../../services/http.js';

export function FreelancerDashboard({ applications, projects, metricsOverride }) {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    pendingApplications: 0,
    totalRating: 0,
    completedProjects: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // If parent provides metrics, use them and skip backend fetch
  useEffect(() => {
    if (metricsOverride) {
      setMetrics(metricsOverride);
    }
  }, [metricsOverride]);

  useEffect(() => {
    if (metricsOverride) return; // parent controls metrics
    const loadMetrics = async () => {
      if (!user) return;
      setLoadingMetrics(true);
      try {
        const m = await http('GET', `/users/${user._id || user.id}/metrics`);
        setMetrics(m);
      } catch (err) {
        // non-blocking: keep defaults if request fails
        console.error('Failed to load dashboard metrics:', err.message);
      } finally {
        setLoadingMetrics(false);
      }
    };
    loadMetrics();
  }, [user, metricsOverride]);

  const activeProjectsList = projects.filter(p => p.status === 'active');
  const completedProjectsList = projects.filter(p => p.status === 'completed');
  const pendingApplicationsList = applications.filter(a => a.status === 'pending');
  const acceptedApplications = applications.filter(a => a.status === 'accepted');

  const stats = [
    { name: 'Active Projects', value: metrics.activeProjects ?? 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Pending Applications', value: metrics.pendingApplications ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Total Rating', value: (metrics.totalRating?.toFixed?.(1)) || Number(metrics.totalRating ?? 0).toFixed(1), icon: Star, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Completed Projects', value: metrics.completedProjects ?? 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.fullName}</h1>
        <p className="text-gray-600 mt-2">Here's an overview of your freelance activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="">
        {/* Applied Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Applied Jobs</h2>
              <Link
                to="/jobs"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications yet</p>
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  Start applying to jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{application.job?.title}</h3>
                    </div>
                    <Link
                      to={`/jobs/${application.job?.id}`}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View Job
                    </Link>
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
            to="/jobs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Browse Jobs</p>
              <p className="text-sm text-gray-600">Find new opportunities</p>
            </div>
          </Link>
          <Link
            to={`/freelancer/${profile?.id}`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Update Portfolio</p>
              <p className="text-sm text-gray-600">Showcase your work</p>
            </div>
          </Link>
          <Link
            to="/profile/freelancer"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Star className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Edit Profile</p>
              <p className="text-sm text-gray-600">Update your information</p>
            </div>
          </Link>
          <Link
            to="/work"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">View Projects</p>
              <p className="text-sm text-gray-600">Track your progress</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
