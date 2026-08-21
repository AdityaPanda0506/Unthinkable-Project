import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import {
  Wrench,
  AlertTriangle,
  Clock,
  Search,
  ArrowRight,
  Bell,
  Sliders,
  CheckCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // States
  const [dashboardData, setDashboardData] = useState({
    totalComplaints: 0,
    countsByStatus: { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 },
    countsByCategory: {},
    overdueCount: 0,
    overdueList: [],
    recentComplaints: [],
    totalResidents: 0,
    thresholdDays: 3,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Settings Modal State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState(3);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const fetchMetrics = async () => {
    try {
      const res = await axiosClient.get('/admin/dashboard');
      setDashboardData(res.data);
      setNewThreshold(res.data.thresholdDays || 3);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/admin/complaints?search=${encodeURIComponent(search)}`);
  };

  const handleAdjustThreshold = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    try {
      await axiosClient.put('/admin/dashboard/threshold', { threshold: newThreshold });
      setSettingsSuccess(true);
      setTimeout(() => {
        setSettingsOpen(false);
        setSettingsSuccess(false);
      }, 1000);
      fetchMetrics();
    } catch (error) {
      console.error('Failed to update threshold:', error);
      alert(error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-light flex items-center justify-center text-charcoal-muted flex-col gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-navy"></div>
        <span className="text-sm font-semibold">Loading admin control center...</span>
      </div>
    );
  }

  // Categories parsing and percentages calculation
  const totalCategoryTickets = Object.values(dashboardData.countsByCategory).reduce((a, b) => a + b, 0) || 1;
  const categoriesList = Object.entries(dashboardData.countsByCategory).map(([cat, val]) => {
    const formattedName = cat.charAt(0) + cat.slice(1).toLowerCase();
    const percent = Math.round((val / totalCategoryTickets) * 100);
    return { name: formattedName, val, percent };
  });
  categoriesList.sort((a, b) => b.val - a.val);

  return (
    <div className="min-h-screen bg-sand-light pb-16 text-charcoal">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-navy tracking-tight">Admin Control Center</h1>
            <p className="text-charcoal-muted text-sm mt-1 font-semibold">Operational metrics and SLA thresholds overview.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
              <input
                type="text"
                placeholder="Search flat or user name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-charcoal-border rounded-xl py-2 pl-9 pr-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy"
              />
            </div>
            <button type="submit" className="bg-navy hover:bg-navy-hover text-white rounded-xl px-4 py-2 text-sm font-semibold tracking-wide shadow-sm transition-colors">
              Filter
            </button>
          </form>
        </div>

        {/* SLA Warning Banner */}
        {dashboardData.overdueCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-start justify-between gap-4 animate-pulse-slow shadow-sm">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-750 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-800">Overdue SLA Warning</h3>
                <p className="text-xs text-red-700 mt-1 font-semibold">
                  There are <strong>{dashboardData.overdueCount} complaints</strong> that remain unresolved beyond the current <strong>{dashboardData.thresholdDays}-day SLA threshold</strong>.
                </p>
                
                <div className="flex gap-4 mt-3 flex-wrap">
                  {dashboardData.overdueList.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      to={`/admin/complaints?id=${item.id}`}
                      className="text-[10px] font-bold bg-red-100/50 hover:bg-red-100 border border-red-200 text-red-800 rounded px-2 py-0.5 flex items-center gap-1 transition-all"
                    >
                      Flat {item.resident?.flatNumber}: {item.title.substring(0, 15)}...
                      <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            <Link
              to="/admin/complaints?status=overdue"
              className="text-xs font-bold text-red-800 hover:text-white bg-red-100 hover:bg-red-800 border border-red-200 rounded-xl px-3.5 py-2 transition-all shrink-0 self-center"
            >
              View Overdue
            </Link>
          </div>
        )}

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-charcoal-border rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Total Tickets</span>
            <h3 className="text-3xl font-extrabold text-navy mt-2">{dashboardData.totalComplaints}</h3>
          </div>
          <div className="bg-white border border-charcoal-border rounded-2xl p-5 shadow-sm border-l-4 border-l-navy">
            <span className="text-[10px] font-bold text-navy uppercase tracking-wider">Open</span>
            <h3 className="text-3xl font-extrabold text-navy mt-2">{dashboardData.countsByStatus.OPEN}</h3>
          </div>
          <div className="bg-white border border-charcoal-border rounded-2xl p-5 shadow-sm border-l-4 border-l-sand-muted">
            <span className="text-[10px] font-bold text-charcoal uppercase tracking-wider">In Progress</span>
            <h3 className="text-3xl font-extrabold text-charcoal mt-2">{dashboardData.countsByStatus.IN_PROGRESS}</h3>
          </div>
          <div className="bg-white border border-charcoal-border rounded-2xl p-5 shadow-sm border-l-4 border-l-sage">
            <span className="text-[10px] font-bold text-sage uppercase tracking-wider">Resolved</span>
            <h3 className="text-3xl font-extrabold text-sage mt-2">{dashboardData.countsByStatus.RESOLVED}</h3>
          </div>
          <div className="bg-white border border-charcoal-border rounded-2xl p-5 shadow-sm col-span-2 lg:col-span-1 border-l-4 border-l-red-500 shadow-red-500/5">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Overdue
            </span>
            <h3 className="text-3xl font-extrabold text-red-800 mt-2">{dashboardData.overdueCount}</h3>
          </div>
        </div>

        {/* Columns Grid: Categories Volume and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Categorical Breakdown Bars (7 cols) */}
          <section className="lg:col-span-7 bg-white border border-charcoal-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-navy mb-6 border-b border-charcoal-border pb-3">
              Categorical Breakdown
            </h3>

            {categoriesList.length === 0 ? (
              <div className="text-xs text-charcoal-muted text-center py-10">No data available</div>
            ) : (
              <div className="space-y-4.5">
                {categoriesList.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-charcoal">{cat.name}</span>
                      <span className="text-charcoal-muted">{cat.val} tickets ({cat.percent}%)</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-sand-light h-2.5 rounded-full overflow-hidden border border-charcoal-border/50">
                      <div
                        className="bg-navy h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions (5 cols) */}
          <section className="lg:col-span-5 bg-white border border-charcoal-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy mb-6 border-b border-charcoal-border pb-3">
                Quick Portal Actions
              </h3>
              
              <div className="space-y-3">
                <Link
                  to="/notices"
                  className="w-full flex items-center justify-between bg-white border border-charcoal-border hover:border-navy rounded-xl p-3.5 text-charcoal hover:text-navy transition-all text-xs font-bold shadow-sm group"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-charcoal-muted group-hover:text-navy" />
                    Broadcast Society Notice
                  </span>
                  <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/admin/complaints?status=overdue"
                  className="w-full flex items-center justify-between bg-white border border-charcoal-border hover:border-red-500/40 rounded-xl p-3.5 text-charcoal hover:text-red-800 transition-all text-xs font-bold shadow-sm group"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-charcoal-muted group-hover:text-red-500" />
                    View Overdue SLA List
                  </span>
                  <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  onClick={() => setSettingsOpen(true)}
                  className="w-full flex items-center justify-between bg-white border border-charcoal-border hover:border-navy rounded-xl p-3.5 text-charcoal hover:text-navy transition-all text-xs font-bold shadow-sm group text-left"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-charcoal-muted group-hover:text-navy" />
                    Adjust Overdue SLA Threshold
                  </span>
                  <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-charcoal-border flex justify-between items-center text-[10px] text-charcoal-muted font-bold">
              <span>Active Residents: {dashboardData.totalResidents || 0}</span>
              <span>Current SLA: {dashboardData.thresholdDays || 3} Days</span>
            </div>
          </section>

        </div>

        {/* Recent complaints table feed */}
        <section className="bg-white border border-charcoal-border rounded-2xl shadow-sm">
          <div className="p-6 flex items-center justify-between border-b border-charcoal-border">
            <div>
              <h3 className="text-base font-bold text-navy">Recent Complaints Feed</h3>
              <p className="text-xs text-charcoal-muted mt-0.5 font-semibold">Quick overview of complaints logged by society residents.</p>
            </div>
            <Link
              to="/admin/complaints"
              className="text-xs font-bold text-navy hover:text-navy-hover flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Manage All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {dashboardData.recentComplaints.length === 0 ? (
            <div className="p-12 text-center text-charcoal-muted text-sm font-semibold">
              No registered complaints.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-charcoal-border bg-sand-light/50 text-[10px] text-charcoal-muted font-bold uppercase tracking-wider">
                    <th className="py-4.5 px-6">Complaint</th>
                    <th className="py-4.5 px-6">Resident</th>
                    <th className="py-4.5 px-6">Flat</th>
                    <th className="py-4.5 px-6">SLA Health</th>
                    <th className="py-4.5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border/50 text-xs text-charcoal">
                  {dashboardData.recentComplaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      onClick={() => navigate(`/admin/complaints?id=${complaint.id}`)}
                      className="hover:bg-sand/20 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-bold text-charcoal group-hover:text-navy transition-colors truncate">
                          {complaint.title}
                        </div>
                        <div className="text-[10px] text-charcoal-muted truncate mt-0.5 font-semibold">
                          {complaint.category} • {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-charcoal">
                        {complaint.resident?.name}
                      </td>
                      <td className="py-4 px-6 text-charcoal-muted font-semibold">
                        {complaint.resident?.flatNumber}
                      </td>
                      <td className="py-4 px-6">
                        {complaint.status === 'RESOLVED' ? (
                          <span className="text-sage font-bold">Completed</span>
                        ) : complaint.isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-red-800 font-bold">
                            <Clock className="w-3.5 h-3.5 animate-pulse-slow" />
                            Overdue
                          </span>
                        ) : (
                          <span className="text-charcoal-muted font-semibold">On Track</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <StatusBadge status={complaint.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Adjust Overdue SLA Threshold Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
          <div className="bg-white border border-charcoal-border rounded-3xl w-full max-w-md shadow-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <Sliders className="w-5 h-5 text-navy" />
                Adjust SLA Threshold
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-charcoal-muted hover:text-charcoal p-1 rounded-lg hover:bg-sand"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {settingsSuccess && (
              <div className="bg-sage-light border border-sage/30 text-sage rounded-xl p-3 text-xs mb-4 flex items-center gap-2 font-bold animate-pulse">
                <CheckCircle className="w-4 h-4" />
                SLA threshold days updated!
              </div>
            )}

            <form onSubmit={handleAdjustThreshold} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">Threshold limit (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(parseInt(e.target.value))}
                  className="w-full bg-white border border-charcoal-border rounded-xl py-3 px-4 text-sm text-charcoal focus:outline-none focus:border-navy"
                />
                <p className="text-[10px] text-charcoal-muted leading-normal font-semibold">
                  Define the maximum number of days a maintenance complaint can remain open before triggering the admin warning banner.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="flex-1 bg-white border border-charcoal-border hover:bg-sand text-charcoal text-xs font-bold rounded-xl py-3 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex-1 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-xl py-3 shadow-md tracking-wide active:translate-y-0.5 transition-all"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
