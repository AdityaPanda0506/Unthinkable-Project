import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Bell, LogOut, LayoutDashboard, FileText, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => `
    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300
    ${isActive(path)
      ? 'bg-navy-hover text-sand-light shadow-inner'
      : 'text-white/80 hover:text-white hover:bg-navy-hover'
    }
  `;

  const handleRaiseComplaintClick = (e) => {
    if (location.pathname !== '/resident/dashboard') {
      navigate('/resident/dashboard');
    }
    // Set immediate scroll execution helper
    setTimeout(() => {
      const element = document.getElementById('raise-complaint-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-navy-hover shadow px-6 py-4 text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
          <div className="bg-white/10 p-2 rounded-xl border border-white/20">
            <Wrench className="w-5 h-5 text-sand-light" />
          </div>
          <span className="text-white font-extrabold tracking-wide">
            SocietyPulse Tracker
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          {user.role === 'ADMIN' ? (
            <>
              <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
              <Link to="/admin/complaints" className={navLinkClass('/admin/complaints')}>
                <Wrench className="w-4 h-4" />
                All Complaints
              </Link>
              <Link to="/notices" className={navLinkClass('/notices')}>
                <Bell className="w-4 h-4" />
                Notice Management
              </Link>
            </>
          ) : (
            <>
              <Link to="/resident/dashboard" className={navLinkClass('/resident/dashboard')}>
                <LayoutDashboard className="w-4 h-4" />
                My Complaints
              </Link>
              <button
                onClick={handleRaiseComplaintClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide text-white/80 hover:text-white hover:bg-navy-hover transition-all"
              >
                <FileText className="w-4 h-4" />
                Raise Complaint
              </button>
              <Link to="/notices" className={navLinkClass('/notices')}>
                <Bell className="w-4 h-4" />
                Notice Board
              </Link>
            </>
          )}
        </div>

        {/* User Identity Details & Action Logout */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-white">{user.name}</span>
            <span className="text-xs mt-0.5">
              {user.role === 'ADMIN' ? (
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-sand-light font-bold text-[10px] uppercase">
                  Admin
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-sand-light font-semibold text-[10px]">
                  Flat {user.flatNumber || 'N/A'}
                </span>
              )}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10"></div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-white/80 hover:text-rose-350 hover:bg-white/5 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu toggle button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/85 hover:text-white rounded-xl focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Options */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/10 space-y-2 animate-fade-in">
          {user.role === 'ADMIN' ? (
            <>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-navy-hover font-semibold text-sm"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/complaints"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-navy-hover font-semibold text-sm"
              >
                All Complaints
              </Link>
              <Link
                to="/notices"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-navy-hover font-semibold text-sm"
              >
                Notice Management
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/resident/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-navy-hover font-semibold text-sm"
              >
                My Complaints
              </Link>
              <button
                onClick={handleRaiseComplaintClick}
                className="w-full text-left block px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-navy-hover font-semibold text-sm"
              >
                Raise Complaint
              </button>
              <Link
                to="/notices"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-navy-hover font-semibold text-sm"
              >
                Notice Board
              </Link>
            </>
          )}

          <div className="h-px bg-white/10 my-2"></div>

          <div className="flex items-center justify-between px-4 py-2">
            <div>
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-white/60">{user.role === 'ADMIN' ? 'Admin' : `Flat ${user.flatNumber || 'N/A'}`}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-300 hover:bg-white/5 font-bold text-xs"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
