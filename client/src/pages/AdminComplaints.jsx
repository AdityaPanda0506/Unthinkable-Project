import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ComplaintTimeline from '../components/ComplaintTimeline';
import {
  Search,
  X,
  FileEdit,
  UserPlus,
  AlertTriangle,
  ClipboardList,
  Trash2,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';

const AdminComplaints = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const initialSelectedId = queryParams.get('id');
  const initialSearch = queryParams.get('search') || '';
  const initialStatus = queryParams.get('status') || '';

  // Core States
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState(initialSearch);
  const [filterStatus, setFilterStatus] = useState(initialStatus === 'overdue' ? '' : initialStatus);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(initialStatus === 'overdue');

  // Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Update Form State
  const [updateForm, setUpdateForm] = useState({
    status: '',
    priority: '',
    assignedToId: '',
    notes: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/complaints');
      setComplaints(res.data);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axiosClient.get('/admin/dashboard');
      setStaffList(res.data.staffList || []);
    } catch (error) {
      console.error('Failed to load staff list:', error);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchStaff();
  }, []);

  // Modal query synchronizer
  useEffect(() => {
    if (initialSelectedId && complaints.length > 0) {
      openManagementModal(initialSelectedId);
    }
  }, [initialSelectedId, complaints]);

  const openManagementModal = async (id) => {
    setModalOpen(true);
    setModalLoading(true);
    setUpdateSuccess(false);

    try {
      const res = await axiosClient.get(`/complaints/${id}`);
      setSelectedComplaint(res.data);
      setUpdateForm({
        status: res.data.status,
        priority: res.data.priority,
        assignedToId: res.data.assignedToId || '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to fetch details:', error);
      closeModal();
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedComplaint(null);
    const params = new URLSearchParams(location.search);
    params.delete('id');
    navigate({ search: params.toString() });
  };

  const handleFilterReset = () => {
    setSearch('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterCategory('');
    setFilterOverdue(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateSuccess(false);

    try {
      // 1. Status/Assignee PATCH
      if (
        updateForm.status !== selectedComplaint.status ||
        updateForm.assignedToId !== (selectedComplaint.assignedToId || '')
      ) {
        await axiosClient.patch(`/complaints/${selectedComplaint.id}/status`, {
          status: updateForm.status,
          assignedToId: updateForm.assignedToId || null,
          adminNote: updateForm.notes.trim() || undefined,
        });
      }

      // 2. Priority PATCH
      if (updateForm.priority !== selectedComplaint.priority) {
        await axiosClient.patch(`/complaints/${selectedComplaint.id}/priority`, {
          priority: updateForm.priority,
          adminNote: updateForm.notes.trim() || undefined,
        });
      }

      setUpdateForm((prev) => ({ ...prev, notes: '' }));
      setUpdateSuccess(true);
      
      // Refresh list & modal details
      await fetchComplaints();
      const res = await axiosClient.get(`/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(res.data);
    } catch (error) {
      console.error('Failed to update complaint details:', error);
      alert(error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this complaint and all logs?')) {
      try {
        await axiosClient.delete(`/complaints/${id}`);
        closeModal();
        fetchComplaints();
      } catch (error) {
        console.error('Failed to delete complaint:', error);
      }
    }
  };

  // Local client side filtering logic
  const filteredComplaints = complaints.filter((c) => {
    if (filterOverdue && !c.isOverdue) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterCategory && c.category !== filterCategory) return false;

    if (search.trim()) {
      const query = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(query);
      const matchDesc = c.description.toLowerCase().includes(query);
      const matchName = c.resident?.name?.toLowerCase().includes(query);
      const matchFlat = c.resident?.flatNumber?.toLowerCase().includes(query);
      
      return matchTitle || matchDesc || matchName || matchFlat;
    }

    return true;
  });

  const getOverdueDays = (createdAt) => {
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const diffMs = Math.abs(now - created);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  // Sort complaints so that isOverdue === true is rendered at the top
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="min-h-screen bg-sand-light pb-16 text-charcoal">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Complaints Dashboard</h1>
          <p className="text-charcoal-muted text-sm mt-1 font-semibold">Audit active issues, assign maintenance technicians, and log resolutions.</p>
        </div>

        {/* Filters Toolbar */}
        <section className="bg-white border border-charcoal-border rounded-md mb-5 overflow-hidden shadow-sm">
          <div className="filter-bar">

            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search resident, flat or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input w-full pl-9"
              />
            </div>

            {/* Status Select */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {/* Priority Select */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            {/* Category Select */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Lift">Lift</option>
              <option value="Security">Security</option>
              <option value="General">General</option>
            </select>

            {/* SLA Overdue toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal-muted select-none ml-auto">
              <input
                type="checkbox"
                checked={filterOverdue}
                onChange={(e) => setFilterOverdue(e.target.checked)}
                className="rounded border-charcoal-border text-red-800 w-4 h-4"
              />
              <span className={filterOverdue ? 'text-red-700 font-bold' : ''}>SLA Overdue</span>
            </label>

            <button
              onClick={handleFilterReset}
              className="text-xs font-bold text-navy hover:text-navy-hover transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>

          </div>
        </section>

        {/* Complaints Table */}
        <section className="bg-white border border-charcoal-border rounded-md shadow-sm overflow-hidden animate-fade-in">

          {/* Table meta row */}
          {!loading && sortedComplaints.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-charcoal-border bg-sand-light/30">
              <span className="text-xs text-charcoal-muted font-semibold">
                Showing <span className="font-bold text-charcoal">{sortedComplaints.length}</span> complaints
              </span>
              <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">
                Click any row to manage
              </span>
            </div>
          )}

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-charcoal-muted">
              <div className="animate-spin rounded-full h-9 w-9 border-2 border-charcoal-border border-t-navy"></div>
              <span className="text-sm font-semibold">Fetching complaints registry…</span>
            </div>
          ) : sortedComplaints.length === 0 ? (
            <div className="p-16 text-center text-charcoal-muted">
              <ClipboardList className="w-12 h-12 mx-auto text-sand-muted mb-3" />
              <h4 className="font-bold text-charcoal">No Complaints Match Filters</h4>
              <p className="text-xs text-charcoal-muted mt-1 font-semibold">Adjust search fields or filters above.</p>
            </div>
          ) : (
            <div className="pro-table-wrap" style={{borderRadius: 0, border: 'none'}}>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Resident &amp; Flat</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th className="text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedComplaints.map((complaint, idx) => {
                    const overdueDays = getOverdueDays(complaint.createdAt);

                    return (
                      <tr
                        key={complaint.id}
                        onClick={() => openManagementModal(complaint.id)}
                        className={`cursor-pointer group ${complaint.isOverdue ? 'row-overdue' : ''}`}
                        style={{ animationDelay: `${idx * 28}ms` }}
                      >
                        <td className="font-mono text-[11px] text-charcoal-muted group-hover:text-navy transition-colors">
                          #{complaint.id.substring(0, 8)}
                        </td>
                        <td>
                          <div className="font-semibold text-charcoal">{complaint.resident?.name}</div>
                          <div className="text-[11px] text-charcoal-muted mt-0.5">Flat {complaint.resident?.flatNumber}</div>
                        </td>
                        <td>
                          <span className="px-2.5 py-1 bg-sand-light border border-charcoal-border rounded text-[11px] text-charcoal font-semibold">
                            {complaint.category}
                          </span>
                        </td>
                        <td className="font-semibold text-charcoal max-w-[200px]">
                          <span className="block truncate">{complaint.title}</span>
                        </td>
                        <td>
                          <PriorityBadge priority={complaint.priority} />
                        </td>
                        <td>
                          <StatusBadge status={complaint.status} />
                        </td>
                        <td>
                          {complaint.status === 'RESOLVED' ? (
                            <span className="text-sage font-semibold text-[11px]">Completed</span>
                          ) : complaint.isOverdue ? (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm animate-pulse-slow">
                              {overdueDays}d overdue
                            </span>
                          ) : (
                            <span className="text-charcoal-muted text-[11px] font-medium">On Track</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end">
                            <ArrowUpRight className="w-4 h-4 text-charcoal-muted group-hover:text-navy transition-colors" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal Overlay */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white border border-charcoal-border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-slide-up my-8 max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-charcoal-border flex justify-between items-center bg-sand-light/40">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-charcoal-muted font-mono">#{selectedComplaint?.id}</span>
                    {selectedComplaint?.isOverdue && (
                      <span className="bg-red-50 border border-red-200 text-red-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        SLA Overdue Alert
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-navy tracking-tight mt-1">
                    {modalLoading ? 'Loading Details...' : selectedComplaint?.title}
                  </h3>
                </div>

                <button
                  onClick={closeModal}
                  className="p-2 text-charcoal-muted hover:text-charcoal rounded-xl hover:bg-sand transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalLoading ? (
                <div className="p-16 flex flex-col items-center justify-center gap-2 text-charcoal-muted flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-navy"></div>
                  <span className="font-semibold">Fetching audits and metadata...</span>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Details & Timeline (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Description Details</h4>
                      <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap mt-1.5 font-semibold">
                        {selectedComplaint?.description}
                      </p>
                    </div>

                    {selectedComplaint?.photoUrl && (
                      <div>
                        <h4 className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider mb-2">Resident Attachment</h4>
                        <a
                          href={selectedComplaint.photoUrl.startsWith('/') ? `http://localhost:5000${selectedComplaint.photoUrl}` : selectedComplaint.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-lg border border-charcoal-border rounded-2xl overflow-hidden hover:opacity-95 transition-opacity"
                        >
                          <img
                            src={selectedComplaint.photoUrl.startsWith('/') ? `http://localhost:5000${selectedComplaint.photoUrl}` : selectedComplaint.photoUrl}
                            alt="Attachment"
                            className="w-full max-h-60 object-cover"
                          />
                        </a>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="border-t border-charcoal-border pt-6">
                      <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-4">Audit History Trail</h4>
                      <ComplaintTimeline history={selectedComplaint?.history || []} />
                    </div>
                  </div>

                  {/* Right Column: Update Actions Form (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Resident Info Box */}
                    <div className="bg-sand-light border border-charcoal-border rounded-2xl p-5 text-xs space-y-3.5">
                      <h4 className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Submitting Resident</h4>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-charcoal font-bold border border-charcoal-border">
                          {selectedComplaint?.resident?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-charcoal">{selectedComplaint?.resident?.name}</div>
                          <div className="text-charcoal-muted mt-0.5 font-semibold">Flat {selectedComplaint?.resident?.flatNumber}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-charcoal-border/50">
                        <div>
                          <span className="text-[10px] text-charcoal-muted">Email Contact</span>
                          <div className="text-charcoal font-bold mt-0.5">{selectedComplaint?.resident?.email}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-charcoal-muted">Phone Contact</span>
                          <div className="text-charcoal font-bold mt-0.5">{selectedComplaint?.resident?.phone || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Form updates */}
                    <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-navy flex items-center gap-1.5">
                        <FileEdit className="w-4 h-4 text-navy" />
                        Execute Action & Audit
                      </h4>

                      {updateSuccess && (
                        <div className="bg-sage-light border border-sage/30 text-sage text-xs font-bold rounded-xl p-3">
                          Complaint details updated successfully!
                        </div>
                      )}

                      <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        
                        {/* Status Select */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Status State</label>
                          <select
                            value={updateForm.status}
                            onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                            className="w-full bg-white border border-charcoal-border rounded-xl py-2.5 px-3 text-xs text-charcoal focus:outline-none focus:border-navy"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </div>

                        {/* Priority Select */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Priority SLA Level</label>
                          <select
                            value={updateForm.priority}
                            onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}
                            className="w-full bg-white border border-charcoal-border rounded-xl py-2.5 px-3 text-xs text-charcoal focus:outline-none focus:border-navy"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>

                        {/* Staff Assignment */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider flex items-center gap-1">
                            <UserPlus className="w-3 h-3 text-charcoal-muted" />
                            Assign Administrator/Staff
                          </label>
                          <select
                            value={updateForm.assignedToId}
                            onChange={(e) => setUpdateForm({ ...updateForm, assignedToId: e.target.value })}
                            className="w-full bg-white border border-charcoal-border rounded-xl py-2.5 px-3 text-xs text-charcoal focus:outline-none focus:border-navy"
                          >
                            <option value="">Unassigned / Reviewing</option>
                            {staffList.map((staff) => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name} (Admin)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Note textarea */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Action / Resolution Note</label>
                          <textarea
                            rows={3}
                            value={updateForm.notes}
                            onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                            placeholder="Add action logs or resolution details..."
                            className="w-full bg-white border border-charcoal-border rounded-xl py-2 px-3 text-xs text-charcoal focus:outline-none focus:border-navy placeholder-sand-muted"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={updateLoading}
                            className="flex-1 bg-navy hover:bg-navy-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl py-3 shadow-sm tracking-wide active:translate-y-0.5 transition-all"
                          >
                            {updateLoading ? 'Saving...' : 'Apply Changes'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteComplaint(selectedComplaint.id)}
                            className="p-3 bg-red-50 hover:bg-red-800 border border-red-200 text-red-850 hover:text-white rounded-xl transition-all"
                            title="Delete Complaint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </form>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminComplaints;
