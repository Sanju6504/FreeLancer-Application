import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, DollarSign, Tag } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function FreelancerList() {
  const { profile } = useAuth();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [minBudgetInput, setMinBudgetInput] = useState("");
  const [maxBudgetInput, setMaxBudgetInput] = useState("");
  const [skillQueries, setSkillQueries] = useState([]);
  const [minBudget, setMinBudget] = useState(undefined);
  const [maxBudget, setMaxBudget] = useState(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:4000/api') + '/users?role=freelancer');
      const data = await res.json();
      setFreelancers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const matchesSearch =
      freelancer.fullName.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
      freelancer.title?.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
      freelancer.bio?.toLowerCase().includes(appliedSearchTerm.toLowerCase());

    let matchesSkillQuery = true;
    if (Array.isArray(skillQueries) && skillQueries.length > 0) {
      const skillArr = Array.isArray(freelancer.skills) ? freelancer.skills.map((s) => String(s).toLowerCase()) : [];
      matchesSkillQuery = skillQueries.some((q) => skillArr.some((s) => s.includes(q)));
    }

    let matchesBudget = true;
    const budgetProvided = (minBudget != null && minBudget !== "") || (maxBudget != null && maxBudget !== "");
    const rate = freelancer.hourlyRate;
    if (budgetProvided && typeof rate !== 'number') {
      matchesBudget = false;
    }
    if (matchesBudget && minBudget != null && minBudget !== "" && typeof rate === 'number') {
      matchesBudget = rate >= Number(minBudget);
    }
    if (matchesBudget && maxBudget != null && maxBudget !== "" && typeof rate === 'number') {
      matchesBudget = rate <= Number(maxBudget);
    }

    return matchesSearch && matchesSkillQuery && matchesBudget;
  });

  // Sorting (default: Name A->Z)
  const sortedFreelancers = [...filteredFreelancers].sort(
    (a, b) => (a.fullName || '').localeCompare(b.fullName || '')
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedFreelancers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedFreelancers = sortedFreelancers.slice(start, start + pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Freelancers</h1>
        <p className="text-gray-600 mt-2">
          Discover talented professionals for your projects
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Skill (e.g., React, JavaScript)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min Rate"
              value={minBudgetInput}
              onChange={(e) => setMinBudgetInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              min="0"
              placeholder="Max Rate"
              value={maxBudgetInput}
              onChange={(e) => setMaxBudgetInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setAppliedSearchTerm(searchTerm);
                const queries = skillInput
                  .split(',')
                  .map((q) => q.trim().toLowerCase())
                  .filter((q) => q.length > 0);
                setSkillQueries(queries);
                const minVal = minBudgetInput === "" ? undefined : Number(minBudgetInput);
                const maxVal = maxBudgetInput === "" ? undefined : Number(maxBudgetInput);
                if (minVal != null && maxVal != null && !Number.isNaN(minVal) && !Number.isNaN(maxVal) && maxVal < minVal) {
                  setMinBudget(maxVal);
                  setMaxBudget(minVal);
                } else {
                  setMinBudget(minVal);
                  setMaxBudget(maxVal);
                }
                setPage(1);
              }}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredFreelancers.length} of {freelancers.length} freelancers
        </p>
      </div>

      {/* Freelancer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFreelancers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No freelancers found matching your criteria
            </p>
            <p className="text-gray-400">Try adjusting your search filters</p>
          </div>
        ) : (
          pagedFreelancers.map((freelancer) => (
            <div
              key={freelancer.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {freelancer.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">{freelancer.fullName}</h3>
                    {(typeof freelancer.totalRating === 'number' && freelancer.totalRating > 0) && (
                      <span className="inline-flex items-center text-500 text-sm">
                        <Star className="h-4 w-4 fill-400 stroke-400 mr-1" /> {freelancer.totalRating.toFixed(1)}{typeof freelancer.reviewsCount === 'number' ? ` (${freelancer.reviewsCount})` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{freelancer.title || '—'}</p>
                  {/* Skills (max 3 + more) */}
                  {Array.isArray(freelancer.skills) && freelancer.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {freelancer.skills.slice(0, 3).map((s, i) => (
                        <span key={`${s}-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-100">
                          <Tag className="w-3 h-3" /> {s}
                        </span>
                      ))}
                      {freelancer.skills.length > 3 && (
                        <span className="text-xs text-gray-500">+{freelancer.skills.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600">
                  <DollarSign className="h-5 w-5 mr-1" />
                  <span className="font-semibold">{typeof freelancer.hourlyRate === 'number' ? `${freelancer.hourlyRate}/hr` : 'Rate TBD'}</span>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/freelancer/${freelancer.id}`}
                    state={{ from: 'freelancers' }}
                    className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Profile
                  </Link>
                  {profile?.role === "employer" && (
                    <button className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                      Invite
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredFreelancers.length > pageSize && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="px-3 py-1.5 border rounded-md disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          <button
            className="px-3 py-1.5 border rounded-md disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
