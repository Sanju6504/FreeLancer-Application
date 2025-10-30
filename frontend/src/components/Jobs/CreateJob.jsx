import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { http } from "../../services/http.js";
import { useAuth } from "../../contexts/AuthContext";

export function CreateJob() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budgetType: "fixed",
    budgetMin: "",
    budgetMax: "",
    durationWeeks: "",
    location: "",
    remoteAllowed: true,
    experienceLevel: "",
    selectedSkills: [],
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    // In absence of a backend skills catalog, load a curated default list
    const DEFAULT_SKILLS = [
      { id: "js", name: "JavaScript", category: "Programming" },
      { id: "ts", name: "TypeScript", category: "Programming" },
      { id: "react", name: "React", category: "Frontend" },
      { id: "node", name: "Node.js", category: "Backend" },
      { id: "express", name: "Express", category: "Backend" },
      { id: "mongo", name: "MongoDB", category: "Database" },
      { id: "sql", name: "SQL", category: "Database" },
      { id: "aws", name: "AWS", category: "Cloud" },
      { id: "docker", name: "Docker", category: "DevOps" },
      { id: "git", name: "Git", category: "Tools" },
      { id: "html", name: "HTML", category: "Frontend" },
      { id: "css", name: "CSS", category: "Frontend" },
      { id: "next", name: "Next.js", category: "Frontend" },
      { id: "redux", name: "Redux", category: "Frontend" },
      { id: "tailwind", name: "Tailwind CSS", category: "Frontend" },
    ];
    setSkills(DEFAULT_SKILLS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const selectedSkillObjects = skills.filter((skill) =>
        formData.selectedSkills.includes(skill.id)
      );

      await http("POST", "/jobs", {
        employerId: profile.id,
        title: formData.title,
        description: formData.description,
        budgetType: formData.budgetType,
        budgetMin: formData.budgetMin
          ? parseFloat(formData.budgetMin)
          : undefined,
        budgetMax: formData.budgetMax
          ? parseFloat(formData.budgetMax)
          : undefined,
        durationWeeks: formData.durationWeeks
          ? parseInt(formData.durationWeeks)
          : undefined,
        status: "open",
        location: formData.location || undefined,
        remoteAllowed: formData.remoteAllowed,
        experienceLevel: formData.experienceLevel || undefined,
        skills: selectedSkillObjects,
      });

      navigate("/dashboard", {
        state: { message: "Job posted successfully!" },
      });
    } catch (error) {
      alert(error?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skillId) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter((id) => id !== skillId)
        : [...prev.selectedSkills, skillId],
    }));
  };

  const filteredSkills = skills.filter((s) =>
    [s.name, s.category, s.id].some((v) => v?.toLowerCase().includes(skillSearch.toLowerCase()))
  );

  // Create a URL-friendly id from a skill name
  const slugify = (str) =>
    String(str)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);

  const addCustomSkill = (nameInput) => {
    const name = String(nameInput || "").trim();
    if (!name) return;
    const baseId = slugify(name) || `skill-${Date.now()}`;
    let id = baseId;
    // Ensure unique id if it already exists
    let i = 1;
    while (skills.some((s) => s.id === id)) {
      id = `${baseId}-${i++}`;
    }
    // Prevent duplicate by name (case-insensitive)
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      const existing = skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
      setFormData((prev) => ({
        ...prev,
        selectedSkills: prev.selectedSkills.includes(existing.id)
          ? prev.selectedSkills
          : [...prev.selectedSkills, existing.id],
      }));
      return;
    }
    const custom = { id, name, category: "Custom" };
    setSkills((prev) => [custom, ...prev]);
    setFormData((prev) => ({ ...prev, selectedSkills: [id, ...prev.selectedSkills] }));
  };

  const isCustomCandidate = (() => {
    const name = skillSearch.trim().toLowerCase();
    if (!name) return false;
    return !skills.some((s) => s.name.toLowerCase() === name);
  })();

  if (user?.role !== "employer") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">Only employers can post jobs.</p>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Post a New Job
        </h1>
        <p className="text-gray-600">
          Find the perfect freelancer for your project
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Job Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Full Stack Developer for E-commerce Platform"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Job Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Job Description *
            </label>
            <textarea
              id="description"
              required
              rows={8}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the project, requirements, deliverables, and any specific qualifications needed..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Budget */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Budget</h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, budgetType: "fixed" })
                }
                className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  formData.budgetType === "fixed"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Fixed Price Project
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, budgetType: "hourly" })
                }
                className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  formData.budgetType === "hourly"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Hourly Rate
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="budgetMin"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {formData.budgetType === "fixed"
                    ? "Minimum Budget ($)"
                    : "Minimum Hourly Rate ($)"}
                </label>
                <input
                  id="budgetMin"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.budgetMin}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMin: e.target.value })
                  }
                  placeholder={formData.budgetType === "fixed" ? "1000" : "25"}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="budgetMax"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {formData.budgetType === "fixed"
                    ? "Maximum Budget ($)"
                    : "Maximum Hourly Rate ($)"}
                </label>
                <input
                  id="budgetMax"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.budgetMax}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMax: e.target.value })
                  }
                  placeholder={formData.budgetType === "fixed" ? "5000" : "75"}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Timeline & Experience */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Timeline & Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="durationWeeks"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Expected Duration (weeks)
                </label>
                <input
                  id="durationWeeks"
                  type="number"
                  min="1"
                  value={formData.durationWeeks}
                  onChange={(e) =>
                    setFormData({ ...formData, durationWeeks: e.target.value })
                  }
                  placeholder="8"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="experienceLevel"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Experience Level
                </label>
                <select
                  id="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, experienceLevel: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Level</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., New York, NY or leave blank for remote"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.remoteAllowed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remoteAllowed: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Remote work allowed
                </span>
              </label>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills
            </label>
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSkill(skillSearch);
                  setSkillSearch("");
                }
              }}
              placeholder="Search or press Enter to add custom skill..."
              className="mb-4 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isCustomCandidate && (
              <div className="flex justify-end mb-4 -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    addCustomSkill(skillSearch);
                    setSkillSearch("");
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  Add "{skillSearch.trim()}"
                </button>
              </div>
            )}
            <div className="border border-gray-200 rounded-lg p-4 md:p-5 max-h-60 overflow-y-auto bg-gray-50/50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {filteredSkills.map((skill) => (
                  <label key={skill.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedSkills.includes(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {skill.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {formData.selectedSkills.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Selected skills:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedSkills.map((skillId) => {
                    const skill = skills.find((s) => s.id === skillId);
                    return skill ? (
                      <span
                        key={skillId}
                        className="inline-flex items-center px-2.5 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill.name}
                        <button
                          type="button"
                          onClick={() => toggleSkill(skillId)}
                          className="ml-1.5 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-100">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.title.trim() ||
                !formData.description.trim()
              }
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
