import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import NoticeCard from '../components/NoticeCard';
import { Plus, Pin, AlertCircle, CheckCircle, Newspaper, Bell } from 'lucide-react';

const NoticeBoardPage = () => {
  const { user } = useAuth();
  
  // States
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    content: '',
    isImportant: false,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchNotices = async () => {
    try {
      const res = await axiosClient.get('/notices');
      setNotices(res.data);
    } catch (error) {
      console.error('Failed to load notices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg('Title and content are required.');
      setSubmitting(false);
      return;
    }

    try {
      await axiosClient.post('/notices', form);
      setForm({ title: '', content: '', isImportant: false });
      setSuccessMsg('Notice posted successfully! Residents have been notified.');
      fetchNotices();
    } catch (error) {
      console.error('Failed to create notice:', error);
      setErrorMsg(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await axiosClient.delete(`/notices/${id}`);
        fetchNotices();
      } catch (error) {
        console.error('Failed to delete notice:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-sand-light pb-16 text-charcoal">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Society Notice Board</h1>
          <p className="text-charcoal-muted text-sm mt-1 font-semibold">Official bulletins, regulatory announcements, and community updates.</p>
        </div>

        {/* NoticeBoard Grid Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Post Notice Form (Admins only) */}
          {user?.role === 'ADMIN' && (
            <section className="lg:col-span-5 bg-white border border-charcoal-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-navy mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-navy" />
                Create Announcement
              </h2>

              {errorMsg && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 bg-sage-light border border-sage/30 text-sage rounded-xl p-3 text-xs mb-4">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">Notice Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-charcoal-border rounded-xl py-2.5 px-3.5 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy transition-colors"
                    placeholder="e.g. Schedule Water Tank Cleaning"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">Notice Content</label>
                  <textarea
                    name="content"
                    required
                    rows={6}
                    value={form.content}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-charcoal-border rounded-xl py-2.5 px-3.5 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy transition-colors"
                    placeholder="Provide details about announcements..."
                  />
                </div>

                {/* Checkbox (isImportant) */}
                <div className="flex items-center gap-2 pt-1 select-none">
                  <input
                    type="checkbox"
                    id="isImportant"
                    name="isImportant"
                    checked={form.isImportant}
                    onChange={handleInputChange}
                    className="rounded bg-white border-charcoal-border text-navy focus:ring-navy focus:ring-offset-sand-light w-4.5 h-4.5 cursor-pointer"
                  />
                  <label htmlFor="isImportant" className="text-xs text-charcoal-muted font-bold cursor-pointer flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-charcoal-muted" />
                    Mark as Important (Pins to top & emails all residents)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 bg-navy hover:bg-navy-hover text-white rounded-xl py-3 font-semibold text-sm tracking-wide shadow-sm active:translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Bulletin'}
                </button>

              </form>
            </section>
          )}

          {/* Notices stream */}
          <section className={`${user?.role === 'ADMIN' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            <div className="flex items-center gap-2 pl-1 mb-2">
              <Newspaper className="w-5 h-5 text-navy" />
              <h2 className="text-lg font-extrabold text-navy">Active Notices</h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-charcoal-muted gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-navy"></div>
                <span className="text-sm font-semibold">Loading notice board...</span>
              </div>
            ) : notices.length === 0 ? (
              <div className="bg-white border border-charcoal-border rounded-2xl p-12 text-center text-charcoal-muted shadow-sm">
                <Bell className="w-10 h-10 mx-auto text-sand-muted mb-3 animate-bounce" />
                <h4 className="font-bold text-charcoal">Notice Board Empty</h4>
                <p className="text-xs text-charcoal-muted mt-1 font-semibold">There are currently no active announcements posted.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {notices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default NoticeBoardPage;
