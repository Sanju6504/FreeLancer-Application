import React, { useState, useEffect } from "react";
import { ExternalLink, Eye, Calendar, Tag } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { http } from "../../services/http.js";

export function Portfolio({ freelancerId, showAll = false }) {
  const { profile } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const loadAcceptedWork = async () => {
      const id = freelancerId || profile?.id;
      if (!id) return;
      try {
        // Fetch jobs the freelancer has applied to
        const jobs = await http("GET", `/jobs?appliedBy=${id}`);
        // Filter to those where this freelancer's application is accepted
        const accepted = (Array.isArray(jobs) ? jobs : []).filter((job) => {
          const apps = Array.isArray(job.applications) ? job.applications : [];
          return apps.some((a) => a?.freelancerId === id && a?.status === "accepted");
        });
        // Map to display shape for cards
        const items = accepted.map((job) => ({
          id: job.id || job._id,
          title: job.title,
          description: job.description,
          technologies: Array.isArray(job.skills) ? job.skills.map((s) => s.name || s) : [],
          createdAt: job.updatedAt || job.createdAt,
          projectUrl: undefined,
          imageUrl: undefined,
        }));
        setPortfolioItems(showAll ? items : items.slice(0, 6));
      } catch (e) {
        console.error("Failed to load accepted work", e);
        setPortfolioItems([]);
      }
    };
    loadAcceptedWork();
  }, [freelancerId, profile?.id, showAll]);

  const openModal = (item) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Work</h2>
        {!showAll && portfolioItems.length > 0 && (
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All ({portfolioItems.length})
          </button>
        )}
      </div>

      {portfolioItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Portfolio Items
          </h3>
          <p className="text-gray-500">
            Portfolio items will appear here once added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-gray-200 hover:-translate-y-0.5"
              onClick={() => openModal(item)}
            >
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <Eye className="w-12 h-12 text-blue-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(item.technologies) && item.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tech}
                    </span>
                  ))}
                  {Array.isArray(item.technologies) && item.technologies.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{item.technologies.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  {item.projectUrl && <ExternalLink className="w-4 h-4" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Portfolio Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="aspect-video bg-gray-200 relative">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <Eye className="w-16 h-16 text-blue-400" />
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedItem.title}
                    </h2>
                    <p className="text-gray-600">{selectedItem.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Technologies Used
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-4 h-4 mr-1" />
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created:{" "}
                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </div>

                  {selectedItem.projectUrl && (
                    <a
                      href={selectedItem.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Project
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
