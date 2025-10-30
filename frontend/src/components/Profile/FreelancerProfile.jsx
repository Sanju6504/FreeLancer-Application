import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Globe, Linkedin, Github, Edit, Tag, Phone, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatINR } from '../../utils/currency.js';
import { ProfileEdit } from './ProfileEdit';
import { http } from '../../services/http.js';

export function FreelancerProfile() {
  const { profile, reloadProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      try {
        setLoading(true);
        const latest = await http('GET', `/users/${profile.id}`);
        const p = latest?.profile || {};
        setData({
          id: latest._id || latest.id,
          role: p.role || 'freelancer',
          fullName: p.fullName || latest.fullName || '',
          email: p.email || latest.email || '',
          phone: p.phone || '',
          title: p.title || '',
          location: p.location || '',
          website: p.website || '',
          linkedin: p.linkedin || '',
          github: p.github || '',
          bio: p.bio || '',
          hourlyRate: p.hourlyRate,
          skills: Array.isArray(p.skills) ? p.skills : [],
          reviews: Array.isArray(p.reviews) ? p.reviews : [],
          totalRating: typeof p.totalRating === 'number' ? p.totalRating : undefined,
        });
      } catch (e) {
        console.error('Failed to load freelancer profile', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  const handleSave = async (updated) => {
    try {
      const core = {
        email: updated.email,
        phone: updated.phone,
        fullName: updated.fullName,
        title: updated.title,
        location: updated.location,
        website: updated.website,
        linkedin: updated.linkedin,
        github: updated.github,
        bio: updated.bio,
        hourlyRate: typeof updated.hourlyRate === 'number' ? updated.hourlyRate : undefined,
      };
      const saved = await http('PUT', `/users/${profile.id}/profile`, core);
      // Save skills if provided
      if (Array.isArray(updated.skills)) {
        await http('PUT', `/users/${profile.id}/skills`, { skills: updated.skills });
        saved.profile.skills = updated.skills;
      }
      const p = saved.profile || saved;
      setData({
        id: saved.id || profile.id,
        role: p.role || 'freelancer',
        fullName: p.fullName || '',
        email: p.email || '',
        phone: p.phone || '',
        title: p.title || '',
        location: p.location || '',
        website: p.website || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        bio: p.bio || '',
        hourlyRate: p.hourlyRate,
        skills: Array.isArray(p.skills) ? p.skills : [],
        reviews: Array.isArray(p.reviews) ? p.reviews : [],
        totalRating: typeof p.totalRating === 'number' ? p.totalRating : undefined,
      });
      await reloadProfile();
      setEditing(false);
    } catch (e) {
      console.error('Failed to update freelancer profile', e);
      alert('Failed to update profile');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const avgRating = typeof data.totalRating === 'number'
    ? data.totalRating
    : (Array.isArray(data.reviews) && data.reviews.length > 0
        ? data.reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / data.reviews.length
        : 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {(data.fullName || data.email || 'U').split(' ').filter(Boolean).map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.fullName}</h1>
              <p className="text-lg text-gray-600 mb-2">{data.title}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{data.location}</div>
                {typeof data.hourlyRate === 'number' && (
                  <div className="flex items-center">
                    <span className="font-medium text-green-600">{formatINR(data.hourlyRate)}/hr</span>
                  </div>
                )}
                {avgRating > 0 && (
                  <div className="flex items-center text-yellow-600">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    <span className="font-medium">{avgRating.toFixed(1)}</span>
                    <span className="ml-1 text-gray-500">({Array.isArray(data.reviews) ? data.reviews.length : 0} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Edit className="h-4 w-4 mr-2" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-600 leading-relaxed">{data.bio || 'No bio available.'}</p>
          </div>
          {Array.isArray(data.skills) && data.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, idx) => (
                  <span key={`${skill}-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-100">
                    <Tag className="w-3 h-3" /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-3 text-gray-400" />{data.email}</div>
              {data.phone && (<div className="flex items-center text-sm text-gray-600"><Phone className="h-4 w-4 mr-3 text-gray-400" />{data.phone}</div>)}
              {data.website && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="h-4 w-4 mr-3 text-gray-400" />
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Website</a>
                </div>
              )}
              {data.linkedin && (
                <div className="flex items-center text-sm text-gray-600">
                  <Linkedin className="h-4 w-4 mr-3 text-gray-400" />
                  <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">LinkedIn</a>
                </div>
              )}
              {data.github && (
                <div className="flex items-center text-sm text-gray-600">
                  <Github className="h-4 w-4 mr-3 text-gray-400" />
                  <a href={data.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">GitHub</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <ProfileEdit profile={data} onClose={() => setEditing(false)} onSave={handleSave} />
      )}
    </div>
  );
}
