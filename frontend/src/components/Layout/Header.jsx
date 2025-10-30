import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase,
  User,
  LogOut,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAdminAuth } from "../../contexts/AdminAuthContext";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { admin, signOut: adminSignOut } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dashboardPath = "/dashboard";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
    }
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
    }`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              FreelanceHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          {admin ? (
            // Admin is logged in: show only Dashboard
            <>
              <nav className="hidden lg:flex items-center space-x-1">
                <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")}>
                  Dashboard
                </Link>
                <Link to="/admin/jobs" className={navLinkClass("/admin/jobs")}>
                  Browse Jobs
                </Link>
              </nav>
              <div className="hidden lg:flex items-center space-x-4">
                <button
                  onClick={async () => {
                    await adminSignOut();
                    navigate("/");
                  }}
                  className="inline-flex items-center px-3 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </button>
              </div>
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </>
          ) : user && profile ? (
            <>
              <nav className="hidden lg:flex items-center space-x-1">
                <Link
                  to={dashboardPath}
                  className={navLinkClass(dashboardPath)}
                >
                  Dashboard
                </Link>

                <Link
                  to={user?.role === "employer" ? "/employer/jobs" : "/jobs"}
                  className={navLinkClass(user?.role === "employer" ? "/employer/jobs" : "/jobs")}
                >
                  {user?.role === "employer" ? "Manage Jobs" : "Browse Jobs"}
                </Link>

                {user?.role === "freelancer" && (
                  <>
                    <Link
                      to={`/freelancer/${profile?.id}`}
                      className={navLinkClass(`/freelancer/${profile?.id}`)}
                    >
                      Portfolio
                    </Link>
                    <Link to="/applied-jobs" className={navLinkClass("/applied-jobs")}>
                      Applied Jobs
                    </Link>
                    <Link to="/work" className={navLinkClass("/work")}>
                      Work
                    </Link>
                  </>
                )}

                {user?.role === "employer" && (
                  <>
                    <Link
                      to="/freelancers"
                      className={navLinkClass("/freelancers")}
                    >
                      Find Freelancers
                    </Link>
                    <Link to="/work" className={navLinkClass("/work")}>
                      Work
                    </Link>
                    <Link
                      to="/create-job"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Post Job
                    </Link>
                  </>
                )}
              </nav>

              {/* Right side - Profile actions */}
              <div className="hidden lg:flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {profile.fullName?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{profile.fullName}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Guest Navigation */
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/login"
                className="text-gray-700 hover:text-purple-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin
              </Link>
              <Link
                to="/auth/signin"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && admin && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              <Link
                to="/admin/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/admin/dashboard")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/jobs"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/admin/jobs")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Jobs
              </Link>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    adminSignOut();
                    navigate("/");
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
        {isMenuOpen && user && profile && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              <Link
                to={dashboardPath}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(dashboardPath)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>

              <Link
                to={user?.role === "employer" ? "/employer/jobs" : "/jobs"}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(user?.role === "employer" ? "/employer/jobs" : "/jobs")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {user?.role === "employer" ? "Manage Jobs" : "Browse Jobs"}
              </Link>

              {user?.role === "freelancer" && (
                <>
                  <Link
                    to={`/freelancer/${profile?.id}`}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(`/freelancer/${profile?.id}`)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                  <Link
                    to="/applied-jobs"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive("/applied-jobs")
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Applied Jobs
                  </Link>
                  <Link
                    to="/work"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive("/work")
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Work
                  </Link>
                </>
              )}

              {user?.role === "employer" && (
                <>
                  <Link
                    to="/freelancers"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive("/freelancers")
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find Freelancers
                  </Link>
                  <Link
                    to="/work"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive("/work")
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Work
                  </Link>
                  <Link
                    to="/create-job"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Post Job
                  </Link>
                </>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
