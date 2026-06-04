import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  Shield,
  MapPin,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnreadCount } from '../../hooks/useMessages';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount(user?.id);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/lost', label: 'Lost Items' },
    { to: '/found', label: 'Found Items' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <MapPin size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-slate-900 text-sm block">Campus</span>
              <span className="text-blue-600 font-bold text-sm block -mt-1">Lost & Found</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusCircle size={15} />}
                  onClick={() => navigate('/post')}
                >
                  Report Item
                </Button>

                 {/* Notifications */}
                 <Link
                   to="/dashboard?tab=messages"
                   className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer z-10 block"
                 >
                   <Bell size={18} />
                   {unreadCount > 0 && (
                     <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                       {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                   )}
                 </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
                    <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">
                      {profile?.full_name?.split(' ')[0] ?? 'Account'}
                    </span>
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 z-20">
                        <div className="px-4 py-3 border-b border-slate-50">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {profile?.full_name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                        </div>
                        <button
                          onClick={() => { navigate('/dashboard'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard size={15} className="text-slate-400" />
                          Dashboard
                        </button>
                        <button
                          onClick={() => { navigate('/dashboard?tab=profile'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User size={15} className="text-slate-400" />
                          Profile Settings
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { navigate('/admin'); setProfileOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Shield size={15} className="text-slate-400" />
                            Admin Panel
                          </button>
                        )}
                        <div className="border-t border-slate-50 mt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Join Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <Link
                to="/post"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                + Report Item
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => { navigate('/register'); setMobileOpen(false); }}>
                Join Free
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
