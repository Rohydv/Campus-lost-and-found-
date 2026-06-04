import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Eye,
  Shield,
  AlertOctagon,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAllItems, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { useAllClaims, useUpdateClaimStatus, useDeleteClaim } from '../hooks/useClaims';
import { useAllComplaints, useUpdateComplaintStatus, useDeleteComplaint } from '../hooks/useComplaints';
import { useAllMessages } from '../hooks/useMessages';
import { MessageBubble } from '../components/ui/MessageBubble';
import {
  formatDate,
  formatRelativeTime,
  getCategoryIcon,
  getStatusColor,
  cn,
} from '../lib/utils';
import { StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { DonutChart, BarChart, HorizontalBarList } from '../components/ui/Charts';
import type { Profile } from '../types';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'items', label: 'All Items' },
  { id: 'users', label: 'Users' },
  { id: 'claims', label: 'Claims' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'chats', label: 'Chats' },
];

function useAllUsers() {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

function usePromoteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'student' | 'admin' }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allUsers'] }),
  });
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: allItems, isLoading: itemsLoading } = useAllItems();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const { data: allClaims, isLoading: claimsLoading } = useAllClaims();
  const { data: allComplaints, isLoading: complaintsLoading } = useAllComplaints();
  const { data: allMessages, isLoading: messagesLoading } = useAllMessages();
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const promoteUser = usePromoteUser();
  const updateClaimStatus = useUpdateClaimStatus();
  const deleteClaim = useDeleteClaim();
  const updateComplaintStatus = useUpdateComplaintStatus();
  const deleteComplaint = useDeleteComplaint();

  const totalItems = allItems?.length ?? 0;
  const totalLost = allItems?.filter((i) => i.type === 'lost').length ?? 0;
  const totalFound = allItems?.filter((i) => i.type === 'found').length ?? 0;
  const totalResolved = allItems?.filter((i) => i.status === 'resolved').length ?? 0;
  const totalUsers = allUsers?.length ?? 0;
  const activeItems = allItems?.filter((i) => i.status === 'active').length ?? 0;
  const expiredItems = allItems?.filter((i) => i.status === 'expired').length ?? 0;
  const itemsWithVisuals = allItems?.filter((i) => i.image_url !== null && i.image_url !== '').length ?? 0;
  const itemsWithoutVisuals = totalItems - itemsWithVisuals;

  const categories = ['electronics', 'clothing', 'accessories', 'documents', 'keys', 'other'];
  const categoryCounts = categories.map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: allItems?.filter(i => i.category === cat).length ?? 0,
    color: cat === 'electronics' ? '#3b82f6' :
           cat === 'clothing' ? '#10b981' :
           cat === 'accessories' ? '#8b5cf6' :
           cat === 'documents' ? '#f59e0b' :
           cat === 'keys' ? '#ec4899' : '#64748b',
    icon: <span className="text-sm mr-1">{getCategoryIcon(cat as any)}</span>
  })).sort((a, b) => b.value - a.value);

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      await deleteItem.mutateAsync(id);
      toast.success('Item deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleMarkResolved = async (id: string) => {
    try {
      await updateItem.mutateAsync({ id, updates: { status: 'resolved' } });
      toast.success('Marked as resolved');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleMarkExpired = async (id: string) => {
    try {
      await updateItem.mutateAsync({ id, updates: { status: 'expired' } });
      toast.success('Marked as expired');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await promoteUser.mutateAsync({ id: userId, role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleUpdateClaimStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateClaimStatus.mutateAsync({ id, status });
      toast.success(`Claim status updated to ${status}`);
    } catch {
      toast.error('Failed to update claim');
    }
  };

  const handleDeleteClaim = async (id: string) => {
    if (!window.confirm('Delete this claim permanently?')) return;
    try {
      await deleteClaim.mutateAsync(id);
      toast.success('Claim deleted successfully');
    } catch {
      toast.error('Failed to delete claim');
    }
  };

  const handleResolveComplaint = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
    try {
      await updateComplaintStatus.mutateAsync({ id, status: nextStatus });
      toast.success(`Complaint status updated to ${nextStatus}`);
    } catch {
      toast.error('Failed to update complaint status');
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!window.confirm('Delete this complaint permanently?')) return;
    try {
      await deleteComplaint.mutateAsync(id);
      toast.success('Complaint deleted successfully');
    } catch {
      toast.error('Failed to delete complaint');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-blue-600 text-white">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">Platform management and moderation</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1',
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total Users" value={totalUsers} icon={<Users size={20} className="text-blue-600" />} iconBg="bg-blue-50" />
            <StatCard title="Total Items" value={totalItems} icon={<Package size={20} className="text-slate-600" />} iconBg="bg-slate-50" />
            <StatCard title="Active" value={activeItems} icon={<AlertTriangle size={20} className="text-amber-600" />} iconBg="bg-amber-50" />
            <StatCard title="Lost" value={totalLost} icon={<AlertTriangle size={20} className="text-red-600" />} iconBg="bg-red-50" />
            <StatCard title="Found" value={totalFound} icon={<TrendingUp size={20} className="text-blue-600" />} iconBg="bg-blue-50" />
            <StatCard title="Resolved" value={totalResolved} icon={<CheckCircle size={20} className="text-emerald-600" />} iconBg="bg-emerald-50" />
          </div>

          {/* Visual Charts section */}
          {allItems && allItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DonutChart
                title="Status Distribution"
                subtitle="All platform items by current status"
                data={[
                  { name: 'Active', value: activeItems, color: '#f59e0b' },
                  { name: 'Resolved', value: totalResolved, color: '#10b981' },
                  { name: 'Expired', value: expiredItems, color: '#ef4444' },
                ]}
              />
              <BarChart
                title="Lost vs Found"
                subtitle="Comparison of global listings"
                data={[
                  { name: 'Lost Items', value: totalLost, color: '#ef4444' },
                  { name: 'Found Items', value: totalFound, color: '#3b82f6' },
                ]}
              />
              <DonutChart
                title="Visual Verification"
                subtitle="Items with photos vs text-only reports"
                data={[
                  { name: 'With Photo', value: itemsWithVisuals, color: '#10b981' },
                  { name: 'No Photo', value: itemsWithoutVisuals, color: '#94a3b8' },
                ]}
              />
            </div>
          )}

          {/* Category Breakdown */}
          {allItems && allItems.length > 0 && (
            <HorizontalBarList
              title="Items by Category"
              subtitle="Distribution of reported belongings across different categories"
              data={categoryCounts}
            />
          )}

          {/* Recent items table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h2 className="font-semibold text-slate-900">Recent Items</h2>
            </div>
            {itemsLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(allItems ?? []).slice(0, 10).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/items/${item.id}`} className="flex items-center gap-2 text-slate-900 font-medium hover:text-blue-600">
                            <span>{getCategoryIcon(item.category)}</span>
                            <span className="truncate max-w-[200px]">{item.title}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 text-xs font-bold rounded-full text-white', item.type === 'lost' ? 'bg-red-500' : 'bg-blue-600')}>
                            {item.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full border', getStatusColor(item.status))}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(item.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/items/${item.id}`}>
                              <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Eye size={14} />
                              </button>
                            </Link>
                            {item.status === 'active' && (
                              <button
                                onClick={() => handleMarkResolved(item.id)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Resolve"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">All Items ({totalItems})</h2>
          </div>
          {itemsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Reporter</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Posted</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(allItems ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/items/${item.id}`} className="flex items-center gap-2 font-medium text-slate-900 hover:text-blue-600">
                          <span>{getCategoryIcon(item.category)}</span>
                          <span className="max-w-[180px] truncate">{item.title}</span>
                        </Link>
                        <p className="text-xs text-slate-400 ml-7">{item.location}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={item.profiles?.full_name} size="sm" />
                          <div>
                            <p className="text-xs font-medium text-slate-700">{item.profiles?.full_name ?? 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{item.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 text-xs font-bold rounded-full text-white', item.type === 'lost' ? 'bg-red-500' : 'bg-blue-600')}>
                          {item.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full border', getStatusColor(item.status))}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatRelativeTime(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/items/${item.id}`}>
                            <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Eye size={14} />
                            </button>
                          </Link>
                          {item.status === 'active' && (
                            <>
                              <button onClick={() => handleMarkResolved(item.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Resolve">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => handleMarkExpired(item.id)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Expire">
                                <AlertTriangle size={14} />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">All Users ({totalUsers})</h2>
          </div>
          {usersLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Student ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(allUsers ?? []).map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar_url} name={user.full_name} size="md" />
                          <div>
                            <p className="font-medium text-slate-900">{user.full_name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{user.student_id ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2.5 py-1 text-xs font-semibold rounded-full',
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleRole(user.id, user.role)}
                          loading={promoteUser.isPending}
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">All Claims</h2>
          </div>
          {claimsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : allClaims?.length === 0 ? (
            <EmptyState icon={<Package size={28} />} title="No claims yet" description="Item claims will appear here." />
          ) : (
            <div className="divide-y divide-slate-50">
              {(allClaims ?? []).map((claim) => (
                <div key={claim.id} className="p-4 flex items-start gap-4">
                  <Avatar name={claim.profiles?.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{claim.profiles?.full_name}</p>
                      <span className="text-xs text-slate-400">→</span>
                      {claim.items && (
                        <Link to={`/items/${claim.item_id}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {claim.items.title}
                        </Link>
                      )}
                      <span className={cn(
                        'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full',
                        claim.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        claim.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{claim.message}</p>
                    <p className="text-xs text-slate-300 mt-1">{formatRelativeTime(claim.created_at)}</p>

                    <div className="flex gap-2 justify-end mt-2">
                      {claim.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                            className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteClaim(claim.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete Claim
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">All Complaints & Issues</h2>
          </div>
          {complaintsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : allComplaints?.length === 0 ? (
            <EmptyState icon={<AlertOctagon size={28} className="text-slate-400" />} title="No complaints yet" description="Filed complaints will appear here." />
          ) : (
            <div className="divide-y divide-slate-50">
              {(allComplaints ?? []).map((comp) => (
                <div key={comp.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                  <Avatar name={comp.profiles?.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{comp.profiles?.full_name}</p>
                        <p className="text-xs text-slate-400">{comp.profiles?.email}</p>
                      </div>
                      <span className={cn(
                        'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full border',
                        comp.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}>
                        {comp.status === 'pending' ? 'Pending Review' : 'Resolved'}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm font-medium text-slate-800">
                      Subject: {comp.title}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{comp.description}</p>
                    
                    {comp.items && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">Related Item:</span>
                        <Link to={`/items/${comp.item_id}`} className="text-blue-600 font-semibold hover:underline">
                          {comp.items.title}
                        </Link>
                        <span className={cn('px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white', comp.items.type === 'lost' ? 'bg-red-500' : 'bg-blue-600')}>
                          {comp.items.type.toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-[10px] text-slate-300 mt-2">{formatRelativeTime(comp.created_at)}</p>

                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => handleResolveComplaint(comp.id, comp.status)}
                        className={cn(
                          'px-2.5 py-1 text-xs font-semibold border rounded-lg transition-colors',
                          comp.status === 'pending'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        )}
                      >
                        {comp.status === 'pending' ? 'Mark Resolved' : 'Mark Pending'}
                      </button>
                      <button
                        onClick={() => handleDeleteComplaint(comp.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Admin Chats Monitor Tab */}
      {activeTab === 'chats' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-blue-600" />
              <h2 className="font-semibold text-slate-900">All Student Conversations</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Read-only monitor of all messages exchanged between students. Use this to detect misuse or disputes.
            </p>
          </div>

          {messagesLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !allMessages || allMessages.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={28} />}
              title="No conversations yet"
              description="Student conversations will appear here once they start messaging."
            />
          ) : (() => {
            // Group messages by item_id to form threads
            const threads: Record<string, typeof allMessages> = {};
            for (const msg of allMessages) {
              if (!threads[msg.item_id]) threads[msg.item_id] = [];
              threads[msg.item_id].push(msg);
            }

            return (
              <div className="divide-y divide-slate-50">
                {Object.entries(threads)
                  .sort(([, a], [, b]) =>
                    new Date(b[b.length - 1].created_at).getTime() -
                    new Date(a[a.length - 1].created_at).getTime()
                  )
                  .map(([itemId, msgs]) => {
                    const itemTitle = msgs[0]?.items?.title ?? 'Unknown Item';
                    const itemType = msgs[0]?.items?.type ?? 'unknown';
                    const lastMsg = msgs[msgs.length - 1];
                    const participants = Array.from(
                      new Map(
                        msgs.flatMap((m) => [
                          m.sender ? [m.sender.id, m.sender.full_name] : null,
                          m.receiver ? [m.receiver.id, m.receiver.full_name] : null,
                        ].filter(Boolean) as [string, string][])
                      ).values()
                    );
                    const isExpanded = expandedThread === itemId;

                    return (
                      <div key={itemId} className="hover:bg-slate-50 transition-colors">
                        {/* Thread summary row */}
                        <button
                          className="w-full flex items-center gap-4 p-4 text-left"
                          onClick={() => setExpandedThread(isExpanded ? null : itemId)}
                        >
                          <div className="p-2 rounded-xl bg-blue-50">
                            <MessageCircle size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/items/${itemId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-semibold text-blue-600 hover:underline truncate"
                              >
                                {itemTitle}
                              </Link>
                              <span className={cn(
                                'px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white flex-shrink-0',
                                itemType === 'lost' ? 'bg-red-500' : 'bg-blue-600'
                              )}>
                                {itemType.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              👥 {participants.slice(0, 3).join(', ')}{participants.length > 3 ? ` +${participants.length - 3}` : ''}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate italic">
                              "{lastMsg.content}"
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-slate-400">{formatRelativeTime(lastMsg.created_at)}</span>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {msgs.length} msg{msgs.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="ml-2 text-slate-400">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {/* Expanded thread messages — read only */}
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 max-h-96 overflow-y-auto">
                              {msgs.map((msg) => (
                                <MessageBubble
                                  key={msg.id}
                                  message={msg}
                                  isMe={false}  /* admin views all as 'other' to see names */
                                  currentUserId="admin"
                                  onReply={() => {}}
                                  onAddReaction={() => {}}
                                  onRemoveReaction={() => {}}
                                  readOnly
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
