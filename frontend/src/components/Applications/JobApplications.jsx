import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  ExternalLink
} from 'lucide-react';
// TODO: Replace with real API once available
import { useAuth } from '../../contexts/AuthContext';
import { formatINR, formatBudgetRange } from '../../utils/currency.js';

export function JobApplications({ freelancerId, showAll = false }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        // Placeholder: no applications API implemented yet; keep empty
        setApplications([]);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [freelancerId, user?.id, showAll]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'withdrawn':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Briefcase className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Job Applications</h2>
              <p className="text-sm text-gray-600">
                Total applications: <span className="font-semibold">{applications.length}</span>
              </p>
            </div>
          </div>
          {!showAll && applications.length > 10 && (
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          )}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center">
          <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-500">You haven't applied to any jobs yet. Start browsing opportunities!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {application.job?.title || 'Unknown Project'}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {application.job?.description || 'No description available'}
                        </p>
                        {application.job?.budgetType && (
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <span className="capitalize">{application.job.budgetType}</span>
                            {application.job.budgetMin && application.job.budgetMax && (
                              <span className="ml-1">
                                {application.job.budgetType === 'hourly' 
                                  ? `${formatINR(application.job.budgetMin)}-${formatINR(application.job.budgetMax)}/hr`
                                  : formatBudgetRange(application.job.budgetMin, application.job.budgetMax)
                                }
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {application.employer?.fullName || 'Private Employer'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(application.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {formatStatus(application.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {application.job && (
                        <a
                          href={`/jobs/${application.job.id}`}
                          className="text-gray-600 hover:text-gray-700 p-1 rounded"
                          title="View Job"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Job Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Project Title</label>
                    <p className="text-gray-900">{selectedApplication.job?.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-900">{selectedApplication.job?.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Budget Type</label>
                      <p className="text-gray-900 capitalize">{selectedApplication.job?.budgetType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Budget Range</label>
                      <p className="text-gray-900">
                        ${selectedApplication.job?.budgetMin} - ${selectedApplication.job?.budgetMax}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Application</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cover Letter</label>
                    <p className="text-gray-900">{selectedApplication.coverLetter || 'No cover letter provided'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Proposed Rate</label>
                      <p className="text-gray-900">{selectedApplication.proposedRate ? formatINR(selectedApplication.proposedRate) : 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Estimated Duration</label>
                      <p className="text-gray-900">{selectedApplication.estimatedDuration || 'Not specified'} days</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Application Date</label>
                      <p className="text-gray-900">{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="flex items-center">
                        {getStatusIcon(selectedApplication.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                          {formatStatus(selectedApplication.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employer Information */}
              {selectedApplication.employer && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Employer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedApplication.employer.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Location</label>
                      <p className="text-gray-900">{selectedApplication.employer.location || 'Not specified'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Projects</label>
                        <p className="text-gray-900">{selectedApplication.employer.totalProjects}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Rating</label>
                        <p className="text-gray-900">{selectedApplication.employer.totalRating}/5</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
