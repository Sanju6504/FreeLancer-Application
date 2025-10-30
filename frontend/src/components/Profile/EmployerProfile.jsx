import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Globe, Linkedin, Github, Edit, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileEdit } from './ProfileEdit';
import { http } from '../../services/http.js';

export function EmployerProfile() {
  const { profile, reloadProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      try {
        setLoading(true);
        const latest = await http('GET', `/users/${profile.id}?type=employer`);
        const p = latest?.profile || {};
        setData({
          id: latest._id || latest.id,
          role: 'employer',
          fullName: p.fullName || '',
          email: latest.email || p.email || '',
          phone: p.phone || '',
          title: p.title || '',
          location: p.location || '',
          website: p.website || '',
          linkedin: p.linkedin || '',
          github: p.github || '',
          bio: p.bio || '',
          avatarUrl: p.avatarUrl,
        });
      } catch (e) {
        console.error('Failed to load employer profile', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  const handleSave = async (updated) => {
    try {
      const core = {
        email: updated.email || data?.email || '',
        phone: updated.phone,
        fullName: updated.fullName || data?.fullName || '',
        title: updated.title,
        location: updated.location,
        website: updated.website,
        linkedin: updated.linkedin,
        github: updated.github,
        bio: updated.bio,
      };
      const saved = await http('PUT', `/users/${profile.id}/profile?type=employer`, core);
      setData({ id: saved.id || profile.id, role: 'employer', email: core.email, ...saved.profile });
      await reloadProfile();
      setEditing(false);
    } catch (e) {
      console.error('Failed to update employer profile', e);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {(data.fullName || data.email || 'U').split(' ').filter(Boolean).map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.fullName || '—'}</h1>
              <p className="text-lg text-gray-600 mb-2">{data.title || '—'}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{data.location || '—'}</div>
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Edit className="h-4 w-4 mr-2" /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-600 leading-relaxed">{data.bio || 'No bio available.'}</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-3 text-gray-400" />{data.email || '—'}</div>
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
