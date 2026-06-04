import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <MapPin size={16} className="text-white" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-white text-sm block">Campus</span>
                <span className="text-blue-400 font-bold text-sm block -mt-1">Lost & Found</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Helping students reunite with their lost belongings. Report, search, and recover items on campus with ease.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <ExternalLink size={16} />
              </a>
              <a href="mailto:lostandfound@university.edu" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Browse</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/lost', label: 'Lost Items' },
                { to: '/found', label: 'Found Items' },
                { to: '/post', label: 'Report an Item' },
                { to: '/dashboard', label: 'My Dashboard' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Mail size={14} />
                lostandfound@university.edu
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Phone size={14} />
                +1 (555) 000-0000
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin size={14} />
                Student Services, Room 101
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Campus Lost & Found. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
