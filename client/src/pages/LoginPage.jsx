import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Mail, Lock, User as UserIcon, Home, Phone, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'RESIDENT',
    flatNumber: '',
    phone: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/resident/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMsg('');
  };

  const handleTabChange = (tab) => {
    setIsLoginTab(tab);
    setErrorMsg('');
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'RESIDENT',
      flatNumber: '',
      phone: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (isLoginTab) {
      const res = await login(formData.email, formData.password);
      if (!res.success) {
        setErrorMsg(res.error);
        setSubmitting(false);
      }
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        setErrorMsg('Please fill in name, email, and password.');
        setSubmitting(false);
        return;
      }
      if (formData.role === 'RESIDENT' && !formData.flatNumber) {
        setErrorMsg('Flat number is required for residents.');
        setSubmitting(false);
        return;
      }

      const res = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        flatNumber: formData.role === 'RESIDENT' ? formData.flatNumber : null,
        phone: formData.phone,
      });

      if (!res.success) {
        setErrorMsg(res.error);
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-light px-4 py-12 relative overflow-hidden">
      
      <div className="max-w-md w-full z-10">
        
        {/* Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-navy p-3 rounded-2xl text-white shadow-md mb-3">
            <Wrench className="w-6 h-6 text-sand-light" />
          </div>
          <h2 className="text-3xl font-extrabold text-navy tracking-tight">SocietyPulse Tracker</h2>
          <p className="text-sm text-charcoal-muted mt-1.5 font-semibold">Society Maintenance & Bulletin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-charcoal-border rounded-3xl shadow-sm overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-charcoal-border bg-sand-light/50">
            <button
              onClick={() => handleTabChange(true)}
              className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors ${
                isLoginTab
                  ? 'text-navy bg-white border-b-2 border-navy'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange(false)}
              className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors ${
                !isLoginTab
                  ? 'text-navy bg-white border-b-2 border-navy'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Register
            </button>
          </div>

          <div className="p-8">
            {errorMsg && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-6 text-sm text-rose-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {!isLoginTab && (
                <>
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-charcoal-muted tracking-wider uppercase">Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-charcoal-muted" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-white border border-charcoal-border rounded-xl py-3 pl-10 pr-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Role selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-charcoal-muted tracking-wider uppercase">Register As</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'RESIDENT' })}
                        className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                          formData.role === 'RESIDENT'
                            ? 'bg-navy text-white border-navy'
                            : 'bg-white border-charcoal-border text-charcoal hover:bg-sand'
                        }`}
                      >
                        Resident
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                        className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                          formData.role === 'ADMIN'
                            ? 'bg-navy text-white border-navy'
                            : 'bg-white border-charcoal-border text-charcoal hover:bg-sand'
                        }`}
                      >
                        Admin/Staff
                      </button>
                    </div>
                  </div>

                  {/* Flat Wing */}
                  {formData.role === 'RESIDENT' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-charcoal-muted tracking-wider uppercase">Flat / Wing Number</label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-charcoal-muted" />
                        <input
                          type="text"
                          name="flatNumber"
                          required
                          value={formData.flatNumber}
                          onChange={handleChange}
                          className="w-full bg-white border border-charcoal-border rounded-xl py-3 pl-10 pr-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy transition-colors"
                          placeholder="A-402"
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-charcoal-muted tracking-wider uppercase">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-charcoal-muted" />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-white border border-charcoal-border rounded-xl py-3 pl-10 pr-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy transition-colors"
                        placeholder="e.g. 9876543210"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Shared Fields */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-muted tracking-wider uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-charcoal-muted" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-charcoal-border rounded-xl py-3 pl-10 pr-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy transition-colors"
                    placeholder="you@domain.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-muted tracking-wider uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-charcoal-muted" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-charcoal-border rounded-xl py-3 pl-10 pr-4 text-sm text-charcoal placeholder-sand-muted focus:outline-none focus:border-navy transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-navy hover:bg-navy-hover text-white rounded-xl py-3.5 font-bold text-sm tracking-wide shadow-sm active:translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isLoginTab ? 'Sign In to Portal' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
