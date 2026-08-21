import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ComplaintTimeline from '../components/ComplaintTimeline';
import { FileText, Plus, AlertCircle, CheckCircle, Eye, ChevronDown, ChevronUp, X, UploadCloud, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

const ResidentDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard & List States
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, RESOLVED
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Form Fields & Submission States
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Plumbing',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      const res = await axiosClient.get('/complaints/my');
      setComplaints(res.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSubmitError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setSubmitError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSubmitError('Only image files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setSubmitError('');
    }
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    setIsSubmitting(true);

    if (!form.title.trim() || !form.description.trim()) {
      setSubmitError('Title and description are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('category', form.category);
      if (photoFile) {
        data.append('photo', photoFile);
      }

      await axiosClient.post('/complaints', data);

      // Clear Form & Close
      setForm({ title: '', description: '', category: 'Plumbing' });
      setPhotoFile(null);
      setPhotoPreview(null);
      setSubmitSuccess(true);
      setFormOpen(false);
      
      // Refresh list
      fetchComplaints();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle drawer and fetch history details
  const handleToggleExpand = async (id) => {
    if (expandedComplaintId === id) {
      setExpandedComplaintId(null);
      setComplaintDetails(null);
      return;
    }

    setExpandedComplaintId(id);
    setDetailsLoading(true);
    setComplaintDetails(null);

    try {
      const res = await axiosClient.get(`/complaints/${id}`);
      setComplaintDetails(res.data);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      setExpandedComplaintId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filters logic: ALL | ACTIVE | RESOLVED
  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'ACTIVE') {
      return c.status === 'OPEN' || c.status === 'IN_PROGRESS';
    }
    if (activeTab === 'RESOLVED') {
      return c.status === 'RESOLVED';
    }
    return true;
  });

  const getRelativeDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const getFullPhotoUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:5000${url}` : url;
  };

  return (
    <div className="min-h-screen bg-sand-light pb-16 text-charcoal">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-navy tracking-tight">Resident Dashboard</h1>
            <p className="text-charcoal-muted text-sm mt-1 font-semibold">Submit maintenance complaints and track resolution status in real-time.</p>
          </div>
          
          <button
            id="raise-complaint-form"
            onClick={() => {
              setFormOpen(!formOpen);
              setSubmitSuccess(false);
              setSubmitError('');
            }}
            className="flex items-center gap-1.5 bg-navy hover:bg-navy-hover text-white rounded-xl px-5 py-3 text-sm font-bold shadow-sm active:translate-y-0.5 transition-all"
          >
            <Plus className="w-4.5 h-4.5 text-sand-light" />
            File Maintenance Request
          </button>
        </div>

        {/* Collapsible New Complaint Form */}
        {formOpen && (
          <section className="bg-white border border-charcoal-border rounded-3xl p-6 mb-8 shadow-sm max-w-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Plus className="w-5 h-5 text-navy" />
                Submit New Complaint
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="text-charcoal-muted hover:text-charcoal p-1 rounded-lg hover:bg-sand transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 bg-rose-550/10 border border-rose-500/20 rounded-xl p-3.5 mb-5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="font-semibold">{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">Issue Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-charcoal-border rounded-xl py-3 px-4 text-sm text-charcoal focus:outline-none focus:border-navy"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Lift">Lift</option>
                  <option value="Security">Security</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">Issue Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={form.title}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-charcoal-border rounded-xl py-3 px-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy"
                  placeholder="Brief summary of the issue..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">Description Details</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={form.description}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-charcoal-border rounded-xl py-3 px-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy"
                  placeholder="Describe the problem, location, wings, etc..."
                />
              </div>

              {/* Drag and drop image dropzone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">Attach Photo (Optional)</label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-charcoal-border hover:border-navy rounded-2xl p-6 text-center cursor-pointer relative bg-sand/40 transition-all"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {photoPreview ? (
                    <div className="relative inline-block mt-2">
                      <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-charcoal-border shadow-inner" />
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="absolute -top-2 -right-2 bg-navy text-white p-1 rounded-full shadow hover:bg-navy-hover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <UploadCloud className="w-9 h-9 text-charcoal-muted" />
                      <span className="text-xs font-bold text-charcoal">Click to upload or drag & drop</span>
                      <span className="text-[10px] text-charcoal-muted">JPEG, PNG, WEBP files up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 bg-white hover:bg-sand text-charcoal border border-charcoal-border rounded-xl py-3.5 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-navy hover:bg-navy-hover text-white rounded-xl py-3.5 font-bold text-sm tracking-wide shadow-md active:translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    'File Complaint'
                  )}
                </button>
              </div>

            </form>
          </section>
        )}

        {/* Success Alert */}
        {submitSuccess && (
          <div className="flex items-start gap-2.5 bg-sage-light border border-sage/30 rounded-2xl p-4 mb-8 text-xs text-sage max-w-2xl animate-fade-in shadow-sm">
            <CheckCircle className="w-5 h-5 shrink-0 text-sage" />
            <div>
              <h4 className="font-bold">Complaint Submitted Successfully</h4>
              <p className="mt-0.5 text-charcoal-muted font-semibold">Our management desk has been notified. You can check the details and status below.</p>
            </div>
          </div>
        )}

        {/* Complaints Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-charcoal-border pb-4 gap-4">
            <h2 className="text-xl font-extrabold text-navy flex items-center gap-2 pl-1">
              <FileText className="w-5 h-5 text-navy" />
              My Complaints History
            </h2>

            {/* Tabs */}
            <div className="flex bg-white border border-charcoal-border p-1.5 rounded-xl text-xs font-bold gap-1 select-none shadow-sm">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-4.5 py-2 rounded-lg transition-all duration-300 ${activeTab === 'ALL' ? 'bg-navy text-white shadow-sm' : 'text-charcoal-muted hover:text-charcoal'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-4.5 py-2 rounded-lg transition-all duration-300 ${activeTab === 'ACTIVE' ? 'bg-navy text-white shadow-sm' : 'text-charcoal-muted hover:text-charcoal'}`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-4.5 py-2 rounded-lg transition-all duration-300 ${activeTab === 'RESOLVED' ? 'bg-navy text-white shadow-sm' : 'text-charcoal-muted hover:text-charcoal'}`}
              >
                Resolved
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-charcoal-muted gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-navy"></div>
              <span className="font-semibold">Fetching complaints history...</span>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white border border-charcoal-border rounded-2xl p-16 text-center text-charcoal-muted shadow-sm">
              <HelpCircle className="w-12 h-12 mx-auto text-sand-muted mb-3" />
              <h4 className="font-bold text-charcoal">No Complaints Logged</h4>
              <p className="text-xs text-charcoal-muted mt-1 font-semibold">There are no complaints under this tab filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredComplaints.map((complaint) => {
                const isExpanded = expandedComplaintId === complaint.id;

                return (
                  <div
                    key={complaint.id}
                    className={`
                      bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm
                      ${isExpanded ? 'border-navy shadow-md' : 'border-charcoal-border'}
                    `}
                  >
                    {/* Header click */}
                    <div
                      onClick={() => handleToggleExpand(complaint.id)}
                      className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-sand/35 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-widest bg-sand-light px-2 py-0.5 border border-charcoal-border rounded">
                            {complaint.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-charcoal truncate">{complaint.title}</h4>
                          <PriorityBadge priority={complaint.priority} />
                        </div>
                        <p className="text-xs text-charcoal-muted mt-1.5 truncate max-w-xl font-medium">
                          {complaint.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        <StatusBadge status={complaint.status} />
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-charcoal-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-charcoal-muted" />
                        )}
                      </div>
                    </div>

                    {/* Expand details drawer */}
                    {isExpanded && (
                      <div className="border-t border-charcoal-border p-5 bg-sand-light/20 space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          
                          <div className="md:col-span-7 space-y-4">
                            <div>
                              <h5 className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Details Description</h5>
                              <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap mt-1.5 font-semibold">
                                {complaint.description}
                              </p>
                            </div>

                            {complaint.photoUrl && (
                              <div>
                                <h5 className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider mb-2">Attachment</h5>
                                <div
                                  onClick={() => setLightboxUrl(getFullPhotoUrl(complaint.photoUrl))}
                                  className="group relative inline-block w-40 h-40 border border-charcoal-border rounded-xl overflow-hidden cursor-pointer shadow bg-white"
                                >
                                  <img
                                    src={getFullPhotoUrl(complaint.photoUrl)}
                                    alt="Preview thumbnail"
                                    className="w-full h-full object-cover group-hover:scale-103 transition-all duration-300"
                                  />
                                  <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye className="w-4.5 h-4.5" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-5 bg-sand-light border border-charcoal-border rounded-2xl p-4.5 space-y-4 h-fit text-xs text-charcoal">
                            <div>
                              <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Assigned Staff</span>
                              <p className="text-charcoal font-bold mt-0.5">
                                {complaint.assignedTo?.name || 'Unassigned / Reviewing'}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Registered Date</span>
                              <p className="text-charcoal mt-0.5 font-semibold">
                                {getRelativeDate(complaint.createdAt)}
                              </p>
                            </div>

                            {complaint.resolvedAt && (
                              <div>
                                <span className="text-[10px] font-bold text-sage uppercase tracking-wider">Resolved Date</span>
                                <p className="text-sage font-bold mt-0.5">
                                  {getRelativeDate(complaint.resolvedAt)}
                                </p>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Audit Timeline */}
                        <div className="border-t border-charcoal-border pt-5">
                          <h5 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-4">Complaint Logs Lifecycle</h5>
                          {detailsLoading ? (
                            <div className="text-xs text-charcoal-muted flex items-center gap-1.5 py-4">
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-t border-navy"></div>
                              Loading logs...
                            </div>
                          ) : (
                            <ComplaintTimeline history={complaintDetails?.history || []} />
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-navy/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh]">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-sand rounded-full bg-navy border border-navy-hover"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxUrl} alt="Enlarged Lightbox" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-charcoal-border" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
