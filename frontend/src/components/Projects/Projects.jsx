import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/currency.js';

export function Projects({ userId, userRole, showAll = false }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'

  useEffect(() => {
    // Placeholder: no projects API yet; show empty list
    setProjects([]);
  }, [userId, userRole, showAll, filter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserProfile = (_id) => undefined; // not available without users API

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {!showAll && projects.length > 0 && (
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-500">
            {filter === 'all' ? 'No projects available.' : `No ${filter} projects found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const employer = getUserProfile(project.employerId);
            const freelancer = getUserProfile(project.freelancerId);
            
            return (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{project.title}</h3>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1 capitalize">{project.status}</span>
                  </div>
                </div>

                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                )}

                <div className="space-y-3">
                  {project.budget && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="font-medium">{formatINR(project.budget)}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>
                      {userRole === 'employer' 
                        ? `Freelancer: ${freelancer?.fullName || 'Unknown'}`
                        : `Client: ${employer?.fullName || 'Unknown'}`
                      }
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Started: {new Date(project.startedAt).toLocaleDateString()}</span>
                  </div>

                  {project.completedAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span>Completed: {new Date(project.completedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.title}</h2>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                    {getStatusIcon(selectedProject.status)}
                    <span className="ml-2 capitalize">{selectedProject.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="ml-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedProject.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedProject.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h3>
                  <div className="space-y-3">
                    {selectedProject.budget && (
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Budget</span>
                          <p className="font-medium">{formatINR(selectedProject.budget)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Started</span>
                        <p className="font-medium">{new Date(selectedProject.startedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {selectedProject.completedAt && (
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Completed</span>
                          <p className="font-medium">{new Date(selectedProject.completedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Team</h3>
                  <div className="space-y-3">
                    {getUserProfile(selectedProject.employerId) && (
                      <div className="flex items-center">
                        <User className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Client</span>
                          <p className="font-medium">{getUserProfile(selectedProject.employerId)?.fullName}</p>
                        </div>
                      </div>
                    )}
                    
                    {getUserProfile(selectedProject.freelancerId) && (
                      <div className="flex items-center">
                        <User className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Freelancer</span>
                          <p className="font-medium">{getUserProfile(selectedProject.freelancerId)?.fullName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedProject.status === 'active' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
