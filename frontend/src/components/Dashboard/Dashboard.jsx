import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FreelancerDashboard } from './FreelancerDashboard';
import { EmployerDashboard } from './EmployerDashboard';
import { http } from '../../services/http.js';

export function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [apps, setApps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  const role = user?.role || profile?.role || user?.profile?.role;

  if (role === 'employer') {
    return (
      <EmployerDashboard jobs={[]} applications={[]} projects={[]} />
    );
  }

  // Freelancer: load applied jobs and build dashboards lists
  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      setLoadingData(true);
      try {
        // Fetch jobs where this freelancer has applied
        const jobs = await http('GET', `/jobs?appliedBy=${encodeURIComponent(profile.id)}`);
        const list = Array.isArray(jobs) ? jobs : [];
        // Build my applications from embedded arrays
        const myApps = [];
        const myProjects = [];
        for (const job of list) {
          const appsArr = Array.isArray(job.applications) ? job.applications : [];
          const mine = appsArr.find(a => String(a.freelancerId) === String(profile.id));
          if (mine) {
            myApps.push({
              id: mine._id || `${job.id}:${profile.id}`,
              status: String(mine.status || 'pending').toLowerCase(),
              created_at: mine.createdAt || job.updatedAt || job.createdAt,
              job: { id: job.id, title: job.title },
            });
          }
          // Treat accepted jobs as active projects; completed status as completed
          const s = String(job.status || '').toLowerCase();
          const accepted = appsArr.some(a => {
            if (String(a.freelancerId) !== String(profile.id)) return false;
            const st = String(a.status || '').trim().toLowerCase();
            return st === 'accepted';
          });
          if (accepted) {
            myProjects.push({
              id: job.id,
              title: job.title,
              budget: job.budgetMax || job.budgetMin,
              employer: job.employer || {},
              status: s === 'completed' ? 'completed' : 'active',
              started_at: job.updatedAt || job.createdAt,
            });
          }
        }
        setApps(myApps);
        setProjects(myProjects);
      } catch (e) {
        console.error('Failed to load dashboard data', e);
        setApps([]);
        setProjects([]);
      } finally {
        setLoadingData(false);
      }
    };
    load();
    // Refresh when window/tab is focused or becomes visible
    const onFocus = () => load();
    const onVisibility = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    // Refresh on cross-tab storage events emitted from status changes
    const onStorage = (e) => {
      if (e.key === 'jobStatusChanged' || e.key === 'workRefresh') {
        load();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, [profile?.id]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Compute metrics based on current lists
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const pendingApplications = apps.filter(a => ['pending','applied'].includes(String(a.status).toLowerCase())).length;
  const metricsOverride = {
    activeProjects,
    pendingApplications,
    completedProjects,
    totalRating: Number(profile?.totalRating || 0),
  };

  return (
    <FreelancerDashboard applications={apps} projects={projects} metricsOverride={metricsOverride} />
  );
}
