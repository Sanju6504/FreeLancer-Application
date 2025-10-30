// src/App.jsx
import React from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import { Layout } from "./components/Layout/Layout";
import { SignUp } from "./components/Auth/SignUp";
import { SignIn } from "./components/Auth/SignIn";
import { ForgotPassword } from "./components/Auth/ForgotPassword";
import { ResetPassword } from "./components/Auth/ResetPassword";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { JobList } from "./components/Jobs/JobList";
import { EmployerManageJobs } from "./components/Jobs/EmployerManageJobs";
import { EmployerJobDetail } from "./components/Jobs/EmployerJobDetail";
import { JobDetail } from "./components/Jobs/JobDetail";
import { JobApplication } from "./components/Jobs/JobApplication";
import { CreateJob } from "./components/Jobs/CreateJob";
import { FreelancerList } from "./components/Freelancers/FreelancerList";
import { FreelancerPortfolio } from "./components/Freelancer/FreelancerPortfolio";
import { Portfolio } from "./components/Portfolio/Portfolio";
import { Projects } from "./components/Projects/Projects";
import { NewProject } from "./components/Projects/NewProject";
import { Work } from "./components/Work/Work";
import { WorkLanding } from "./components/Work/WorkLanding";
import { WorkRoom } from "./components/Work/WorkRoom";
import { ProjectSubmission } from "./components/Work/ProjectSubmission";
import { EmployerJobEdit } from "./components/Jobs/EmployerJobEdit";
import { EmployerProfile } from "./components/Profile/EmployerProfile";
import { FreelancerProfile } from "./components/Profile/FreelancerProfile";
import { Toaster } from "react-hot-toast";
import { AppliedJobs } from "./components/Jobs/AppliedJobs";
import { AdminLogin } from "./components/Admin/AdminLogin";
import { AdminDashboard } from "./components/Admin/AdminDashboard";
import { EmployerPublic } from "./components/Employers/EmployerPublic";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { admin } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If admin session exists, allow access to protected pages (read-only use cases)
  // Admin has its own token; we treat admin as authenticated for viewing pages.

  let hasToken = false;
  try {
    hasToken = !!localStorage.getItem("auth_token");
  } catch {}
  let hasAdminToken = false;
  try {
    hasAdminToken = !!localStorage.getItem("admin_token");
  } catch {}
  return (user && hasToken) || (admin && hasAdminToken) ? <>{children}</> : <Navigate to="/auth/signin" />;
}

function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  let hasToken = false;
  try {
    hasToken = !!localStorage.getItem("admin_token");
  } catch {}
  return admin && hasToken ? <>{children}</> : <Navigate to="/admin/login" />;
}

function RoleAwareProfileRoute() {
  const { user } = useAuth();
  if (user?.role === "employer") {
    return <Navigate to="/profile/employer" replace />;
  }
  return <Navigate to="/profile/freelancer" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const { admin } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If admin is logged in, send to admin dashboard
  let hasAdminToken = false;
  try {
    hasAdminToken = !!localStorage.getItem("admin_token");
  } catch {}
  if (admin && hasAdminToken) return <Navigate to="/admin/dashboard" />;

  // Only treat as authenticated if we have both user and token
  let hasToken = false;
  try {
    hasToken = !!localStorage.getItem("auth_token");
  } catch {}

  return user && hasToken ? <Navigate to="/" /> : <>{children}</>;
}

function RoleAwareJobsRoute() {
  const { user } = useAuth();
  if (user?.role === "employer") {
    return <Navigate to="/employer/jobs" replace />;
  }
  return <JobList />;
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
              Hire smarter. Work faster.
              <span className="block text-blue-600">
                Your Freelance marketplace.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10">
              Discover vetted talent and quality projects. Secure payments,
              transparent reviews, and tools that help you get work done.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                Get started — it’s free
              </a>
              <a
                href="/auth/signin"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 transition-colors"
              >
                I already have an account
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust/Stats */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="p-6 bg-white rounded-xl border shadow-sm">
              <p className="text-3xl font-bold text-gray-900">10k+</p>
              <p className="text-gray-500 text-sm">Active freelancers</p>
            </div>
            <div className="p-6 bg-white rounded-xl border shadow-sm">
              <p className="text-3xl font-bold text-gray-900">5k+</p>
              <p className="text-gray-500 text-sm">Jobs posted</p>
            </div>
            <div className="p-6 bg-white rounded-xl border shadow-sm">
              <p className="text-3xl font-bold text-gray-900">4.9/5</p>
              <p className="text-gray-500 text-sm">Avg. rating</p>
            </div>
            <div className="p-6 bg-white rounded-xl border shadow-sm">
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-gray-500 text-sm">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            Why choose us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                🔍
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart matching</h3>
              <p className="text-gray-600">
                AI recommendations match skills to job requirements to save your
                time.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                🛡️
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Secure & transparent
              </h3>
              <p className="text-gray-600">
                Escrow-style payments, milestones, and verified reviews build
                trust.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                ⚡
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Built-in productivity
              </h3>
              <p className="text-gray-600">
                Messaging, file sharing, and task boards keep work moving
                quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Popular categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              "Web Dev",
              "Mobile Apps",
              "Data & AI",
              "Design",
              "Marketing",
              "Writing",
            ].map((c) => (
              <div
                key={c}
                className="px-4 py-3 rounded-lg border bg-blue-50 text-blue-700 text-center font-medium hover:bg-blue-100 transition-colors"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                t: "Create your account",
                d: "Sign up in minutes as a freelancer or employer.",
              },
              {
                t: "Post or find jobs",
                d: "Publish a job or apply to curated opportunities.",
              },
              {
                t: "Collaborate & pay",
                d: "Track milestones and pay securely once done.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="p-8 bg-white rounded-2xl border shadow-sm"
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  0{i + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.t}</h3>
                <p className="text-gray-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <div className="p-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to get started?
            </h3>
            <p className="opacity-90 mb-6">
              Join thousands of professionals accelerating their work with
              FreelanceHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/auth/signup"
                className="px-6 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50"
              >
                Create account
              </a>
              <a
                href="/auth/signin"
                className="px-6 py-3 rounded-lg border border-white/70 hover:bg-white/10"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600">
              &copy; {new Date().getFullYear()} FreelanceHub. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Admin */}
          <Route
            path="/admin/login"
            element={
              <Layout>
                <AdminLogin />
              </Layout>
            }
          />
          {/* Public Employer Profile */}
          <Route
            path="/employers/:id"
            element={
              <Layout>
                <EmployerPublic />
              </Layout>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <ProtectedAdminRoute>
                <Layout>
                  <JobList />
                </Layout>
              </ProtectedAdminRoute>
            }
          />
          {/* Home: marketing/landing */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />

          {/* Preserve marketing home under /welcome */}
          <Route
            path="/welcome"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <PublicRoute>
                <Layout>
                  <SignUp />
                </Layout>
              </PublicRoute>
            }
          />
          <Route
            path="/auth/signin"
            element={
              <PublicRoute>
                <Layout>
                  <SignIn />
                </Layout>
              </PublicRoute>
            }
          />
          <Route
            path="/auth/forgot"
            element={
              <PublicRoute>
                <Layout>
                  <ForgotPassword />
                </Layout>
              </PublicRoute>
            }
          />
          <Route
            path="/auth/reset"
            element={
              <PublicRoute>
                <Layout>
                  <ResetPassword />
                </Layout>
              </PublicRoute>
            }
          />

          {/* Dashboard: role-based rendering handled by Dashboard component */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleAwareJobsRoute />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employer/jobs"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployerManageJobs />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employer/jobs/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployerJobDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployerJobEdit />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs/:id/apply"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobApplication />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-job"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateJob />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/freelancers"
            element={
              <ProtectedRoute>
                <Layout>
                  <FreelancerList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Layout>
                  <Portfolio showAll={true} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Projects showAll={true} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewProject />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Backward-compatible /profile route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleAwareProfileRoute />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Explicit role-based profile routes */}
          <Route
            path="/profile/employer"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployerProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/freelancer"
            element={
              <ProtectedRoute>
                <Layout>
                  <FreelancerProfile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/freelancer/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <FreelancerPortfolio />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Public Freelancer Portfolio page */}
          <Route
            path="/freelancers/:id"
            element={
              <Layout>
                <FreelancerPortfolio />
              </Layout>
            }
          />

          <Route
            path="/applied-jobs"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppliedJobs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/work"
            element={
              <ProtectedRoute>
                <Layout>
                  <WorkLanding />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/work/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <WorkRoom />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/work/:id/submit"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectSubmission />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </Router>
      </AuthProvider>
    </AdminAuthProvider>
  );
}

export default App;
