import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Globe, Linkedin, Github, Calendar, DollarSign, CheckCircle, XCircle, Tag, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";
import { formatINR } from "../../utils/currency.js";
import { EditProjectModal } from "../Projects/EditProjectModal";

export function FreelancerPortfolio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ open: false, type: null, application: null });
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillsList, setSkillsList] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);
  const commonSkills = [
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Docker",
  ];
  
  // Get application details from location state (passed from employer job detail)
  const applicationData = location.state?.application;
  const jobData = location.state?.job;

  useEffect(() => {
    if (id) {
      fetchFreelancerData();
      fetchFreelancerProjects();
      if (profile?.role === "employer") {
        fetchFreelancerApplications();
      }
    }
  }, [id, profile?.role]);

  const fetchFreelancerData = async () => {
    try {
      const data = await http("GET", `/users/${id}`);
      setFreelancer(data);
      // Merge embedded projects from user profile into projects list (public only)
      const embedded = Array.isArray(data?.profile?.projects)
        ? data.profile.projects.filter((p) => p.public !== false).map((p) => ({ ...p, _source: 'embedded' }))
        : [];
      setProjects((prev) => {
        const existingIds = new Set(prev.map((p) => String(p._id || p.id || '')));
        const toAdd = embedded.filter((p) => !existingIds.has(String(p._id || p.id || '')));
        return [...prev, ...toAdd];
      });
    } catch (e) {
      console.error("Failed to load freelancer data", e);
    }
  };

  const fetchFreelancerProjects = async () => {
    try {
      const data = await http("GET", `/projects/freelancer/${id}`);
      const collection = Array.isArray(data) ? data.map((p) => ({ ...p, _source: 'collection' })) : [];
      // Merge collection projects with any existing embedded projects already in state
      setProjects((prev) => {
        const existingIds = new Set(prev.map((p) => String(p._id || p.id || '')));
        const toAdd = collection.filter((p) => !existingIds.has(String(p._id || p.id || '')));
        return [...prev, ...toAdd];
      });
    } catch (e) {
      console.error("Failed to load projects", e);
      // Do not clear existing embedded projects on failure
    } finally {
      setLoading(false);
    }
  };

  const fetchFreelancerApplications = async () => {
    try {
      // Get all jobs posted by current employer that have applications from this freelancer
      const jobsData = await http("GET", `/jobs?employerId=${profile.id}`);
      const freelancerApps = [];
      
      jobsData.forEach(job => {
        if (job.applications && job.applications.length > 0) {
          const apps = job.applications.filter(app => app.freelancerId === id);
          apps.forEach(app => {
            freelancerApps.push({
              ...app,
              jobTitle: job.title,
              jobId: job.id
            });
          });
        }
      });
      
      setApplications(freelancerApps);
    } catch (e) {
      console.error("Failed to load freelancer applications", e);
      setApplications([]);
    }
  };

  const handleAcceptApplication = async (application) => {
    try {
      const appId = application?._id || applicationData?._id;
      if (!appId) {
        alert("No application selected");
        return;
      }
      await http("PUT", `/applications/${appId}/accept`);
      alert("Application accepted successfully!");
      // Refresh applications list
      if (profile?.role === "employer") {
        fetchFreelancerApplications();
      }
    } catch (e) {
      console.error("Failed to accept application", e);
      alert("Failed to accept application");
    }
  };

  const handleDeclineApplication = async (application) => {
    try {
      const appId = application?._id || applicationData?._id;
      if (!appId) {
        alert("No application selected");
        return;
      }
      await http("PUT", `/applications/${appId}/decline`);
      alert("Application declined successfully!");
      // Refresh applications list
      if (profile?.role === "employer") {
        fetchFreelancerApplications();
      }
    } catch (e) {
      console.error("Failed to decline application", e);
      alert("Failed to decline application");
    }
  };

  const handleEditSkills = () => {
    const existing = Array.isArray(freelancer?.profile?.skills) ? freelancer.profile.skills : [];
    setSkillsList(existing);
    setNewSkill("");
    setEditingSkills(true);
  };
  
  const addSkill = (value) => {
    const s = (value ?? newSkill).trim();
    if (!s) return;
    setSkillsList((prev) => {
      // de-dupe case-insensitive
      const lower = prev.map((x) => x.toLowerCase());
      return lower.includes(s.toLowerCase()) ? prev : [...prev, s];
    });
    setNewSkill("");
  };
  
  const removeSkill = (skill) => {
    setSkillsList((prev) => prev.filter((x) => x !== skill));
  };
  
  const handleSaveSkills = async () => {
    try {
      setSavingSkills(true);
      const skills = skillsList.filter((s) => s && s.trim().length > 0);
      const resp = await http('PUT', `/users/${id}/skills`, { skills });
      const updatedSkills = Array.isArray(resp?.skills) ? resp.skills : skills;
      setFreelancer((prev) => ({
        ...prev,
        profile: { ...(prev?.profile || {}), skills: updatedSkills },
      }));
      setEditingSkills(false);
    } catch (e) {
      console.error('Failed to save skills', e);
      alert('Failed to save skills');
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Freelancer Not Found</h1>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-700">← Go Back</button>
        </div>
      </div>
    );
  }

  const isOwner = profile?.role === 'freelancer' && String(profile?.id) === String(id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {location.state?.from === 'freelancers' && (
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/freelancers')}
            className="inline-flex items-center px-3 py-1.5 rounded-md  text-blue-600 text-sm  hover:bg-gray-50"
          >
            ← Back to Find Freelancers
          </button>
          {isOwner && (
            <button
              onClick={() => navigate('/projects/new')}
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              + Add Project
            </button>
          )}
        </div>
      )}
      

      

      {/* Freelancer Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              {freelancer.profile?.avatarUrl ? (
                <img src={freelancer.profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {freelancer.profile?.fullName?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{freelancer.profile?.fullName}</h1>
              {freelancer.profile?.title && (
                <p className="text-lg text-gray-600 mb-2">{freelancer.profile.title}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                {freelancer.profile?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {freelancer.profile.location}
                  </div>
                )}
                {freelancer.profile?.totalRating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    {freelancer.profile.totalRating.toFixed(1)}
                  </div>
                )}
                {freelancer.profile?.hourlyRate && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {formatINR(freelancer.profile.hourlyRate)}/hour
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {freelancer.profile?.website && (
                  <a href={freelancer.profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {freelancer.profile?.linkedin && (
                  <a href={freelancer.profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {freelancer.profile?.github && (
                  <a href={freelancer.profile.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>
              {/* Contact */}
              {(freelancer.profile?.email || freelancer.profile?.phone) && (
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  {freelancer.profile?.email && (
                    <span className="inline-flex items-center"><Mail className="h-4 w-4 mr-1 text-gray-500" />{freelancer.profile.email}</span>
                  )}
                  {freelancer.profile?.phone && (
                    <span className="inline-flex items-center"><Phone className="h-4 w-4 mr-1 text-gray-500" />{freelancer.profile.phone}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {freelancer.profile?.bio && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-700">{freelancer.profile.bio}</p>
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="mt-6 pt-4 border-t border-gray-200 mb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
          {isOwner && !editingSkills && (
            <button
              onClick={handleEditSkills}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
        {!editingSkills ? (
          Array.isArray(freelancer.profile?.skills) && freelancer.profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {freelancer.profile.skills.map((skill, idx) => (
                <span key={`${skill}-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-100">
                  <Tag className="w-3 h-3" /> {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">{isOwner ? 'Add your skills to showcase your expertise.' : 'No skills listed.'}</div>
          )
        ) : (
          <div className="space-y-3">
            {/* Current skills with remove */}
            {skillsList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-100">
                    <Tag className="w-3 h-3" /> {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                      aria-label={`Remove ${skill}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Add new skill */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill (Enter or comma)"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => addSkill()}
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {/* Quick add suggestions */}
            <div className="flex flex-wrap gap-2">
              {commonSkills.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 border"
                >
                  + {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveSkills}
                disabled={savingSkills}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingSkills ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingSkills(false)}
                disabled={savingSkills}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Context (if viewing from job application) */}
      {applicationData && jobData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-blue-900">Application for: {jobData.title}</h3>
            {profile?.role === "employer" && (!applicationData.status || applicationData.status === 'applied') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmAction({ open: true, type: 'decline', application: applicationData })}
                  className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50 flex items-center"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </button>
                <button
                  onClick={() => setConfirmAction({ open: true, type: 'accept', application: applicationData })}
                  className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Proposed Rate:</span>
              <span className="ml-2 font-medium">{applicationData.proposedRate ? formatINR(applicationData.proposedRate) : "—"}</span>
            </div>
            <div>
              <span className="text-blue-700">Duration:</span>
              <span className="ml-2 font-medium">{applicationData.estimatedDuration ? `${applicationData.estimatedDuration} weeks` : "—"}</span>
            </div>
            <div>
              <span className="text-blue-700">Applied:</span>
              <span className="ml-2 font-medium">{applicationData.createdAt ? new Date(applicationData.createdAt).toLocaleDateString() : "—"}</span>
            </div>
          </div>
          {applicationData.coverLetter && (
            <div className="mt-4 pt-3 border-t border-blue-200">
              <div className="text-sm text-blue-700 font-medium mb-1">Cover Letter:</div>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{applicationData.coverLetter}</p>
            </div>
          )}
          {applicationData.experience && (
            <div className="mt-3">
              <div className="text-sm text-blue-700 font-medium mb-1">Relevant Experience:</div>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{applicationData.experience}</p>
            </div>
          )}
          {applicationData.approach && (
            <div className="mt-3">
              <div className="text-sm text-blue-700 font-medium mb-1">Proposed Approach:</div>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{applicationData.approach}</p>
            </div>
          )}
        </div>
      )}

      {/* Applications List (for employers accessing directly) */}
      {profile?.role === "employer" && !applicationData && applications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications from this Freelancer</h2>
          <div className="space-y-3">
            {applications.map((app, idx) => (
              <div key={app._id || idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{app.jobTitle}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <span>Proposed Rate:</span>
                        <span className="ml-2 font-medium">{app.proposedRate ? formatINR(app.proposedRate) : "—"}</span>
                      </div>
                      <div>
                        <span>Duration:</span>
                        <span className="ml-2 font-medium">{app.estimatedDuration ? `${app.estimatedDuration} weeks` : "—"}</span>
                      </div>
                      <div>
                        <span>Applied:</span>
                        <span className="ml-2 font-medium">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                    {app.status && (
                      <div className="mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {(!app.status || app.status === 'applied') && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setConfirmAction({ open: true, type: 'decline', application: app })}
                        className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50 flex items-center"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </button>
                      <button
                        onClick={() => setConfirmAction({ open: true, type: 'accept', application: app })}
                        className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </button>
                    </div>
                  )}
                </div>
                {app.coverLetter && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 font-medium mb-1">Cover Letter:</div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.coverLetter}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        
        {isOwner && (
          <button
            onClick={() => navigate('/projects/new')}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            + Add Project
          </button>
        )}
      </div>

      {/* Portfolio/Projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Portfolio & Projects</h2>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project._id || project.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                  {isOwner && (project._source === 'collection' || project._source === 'embedded') && (project._id || project.id) && (
                    <div className="flex items-center gap-2 -mt-1">
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-label="Edit project"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ open: true, type: 'deleteProject', project })}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                        aria-label="Delete project"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.technologies.map((tech, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  {project.duration && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {project.duration}
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatINR(project.budget)}
                    </div>
                  )}
                </div>
                {project.completedAt && (
                  <div className="text-xs text-gray-500 mb-2">
                    Completed: {new Date(project.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No projects to display yet.</div>
        )}
      </div>
      {/* Reviews Section */}
      {Array.isArray(freelancer.profile?.reviews) && freelancer.profile.reviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
            <div className="text-sm text-gray-600">
              {freelancer.profile.totalRating != null && (
                <span className="inline-flex items-center text-yellow-600">
                  <Star className="h-4 w-4 mr-1 fill-current" />
                  {Number(freelancer.profile.totalRating).toFixed(1)}
                </span>
              )}
              <span className="ml-2 text-gray-500">({freelancer.profile.reviews.length} reviews)</span>
            </div>
          </div>
          <div className="space-y-3">
            {freelancer.profile.reviews.map((rev, idx) => (
              <div key={rev._id || idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-600">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`h-4 w-4 ${n <= (Number(rev.rating)||0) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}</div>
                </div>
                {rev.comment && (
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{rev.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction.open && confirmAction.type === 'deleteProject' && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-bold text-gray-900">Delete Project</h3>
        <button
          onClick={() => setConfirmAction({ open: false, type: null, project: null })}
          className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>
      <p className="mt-2 text-gray-700 text-base">
        Are you sure you want to delete this project? This action cannot be undone.
      </p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={() => setConfirmAction({ open: false, type: null, project: null })}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            const proj = confirmAction.project;
            if (!proj || !(proj._id || proj.id)) return;
            try {
              const projId = proj._id || proj.id;
              // Decide endpoint based on data source
              const endpoint = proj._source === 'collection'
                ? `/projects/${projId}`
                : `/users/${id}/projects/${projId}`;
              await http('DELETE', endpoint);
              setProjects((prev) => prev.filter((p) => String(p._id||p.id) !== String(projId)));
              setConfirmAction({ open: false, type: null, project: null });
            } catch (err) {
              alert('Failed to delete project');
            }
          }}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
        >
          Confirm Delete
        </button>
      </div>
    </div>
  </div>
)}

{confirmAction.open && (confirmAction.type === 'accept' || confirmAction.type === 'decline') && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {confirmAction.type === 'accept' ? 'Accept Application' : 'Decline Application'}
        </h3>
        <button
          onClick={() => setConfirmAction({ open: false, type: null, application: null })}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      <p className="mt-3 text-gray-700">
        {confirmAction.type === 'accept'
          ? 'Are you sure you want to accept this application? The job status will be updated to Accepted.'
          : 'Are you sure you want to decline this application? The job status will be updated to Declined.'}
      </p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={() => setConfirmAction({ open: false, type: null, application: null })}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            const app = confirmAction.application;
            try {
              if (confirmAction.type === 'accept') {
                await handleAcceptApplication(app);
              } else {
                await handleDeclineApplication(app);
              }
              setConfirmAction({ open: false, type: null, application: null });
            } catch (e) {
              console.error('Failed to update application', e);
            }
          }}
          className={`px-4 py-2 rounded-md text-white ${confirmAction.type === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {confirmAction.type === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}
        </button>
      </div>
    </div>
  </div>
)}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          freelancerId={id}
          onClose={() => setEditingProject(null)}
          onSaved={(updated) => {
            setProjects((prev) => prev.map((p) => (String(p._id||p.id) === String(updated._id||updated.id) ? { ...p, ...updated } : p)));
          }}
        />
      )}
    </div>
  );
}
