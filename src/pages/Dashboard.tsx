import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  MessageCircle,
  ClipboardList,
  User,
  PlusCircle,
  CheckCircle,
  Trash2,
  Eye,
  Bell,
  TrendingUp,
  AlertOctagon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyItems, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { useMessages, useMarkMessageRead, useSendMessage, useAddReaction, useRemoveReaction } from '../hooks/useMessages';
import { useMyClaims } from '../hooks/useClaims';
import { useMyComplaints, useCreateComplaint } from '../hooks/useComplaints';
import {
  formatRelativeTime,
  formatDate,
  getCategoryIcon,
  getCategoryLabel,
  getStatusColor,
  getTypeColor,
  cn,
} from '../lib/utils';
import { StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { DonutChart, BarChart } from '../components/ui/Charts';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import { MessageBubble } from '../components/ui/MessageBubble';
import type { Message } from '../types';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
  { id: 'items', label: 'My Items', icon: <Package size={16} /> },
  { id: 'messages', label: 'Messages', icon: <MessageCircle size={16} /> },
  { id: 'claims', label: 'Claims', icon: <ClipboardList size={16} /> },
  { id: 'complaints', label: 'Complaints', icon: <AlertOctagon size={16} /> },
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
];

export function Dashboard() {
  const { user, profile, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  const { data: myItems, isLoading: itemsLoading } = useMyItems(user?.id);
  const { data: messages, isLoading: messagesLoading } = useMessages(user?.id);
  const { data: claims, isLoading: claimsLoading } = useMyClaims(user?.id);
  const { data: complaints, isLoading: complaintsLoading } = useMyComplaints(user?.id);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const markRead = useMarkMessageRead();
  const sendMessage = useSendMessage();
  const createComplaint = useCreateComplaint();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [complaintModal, setComplaintModal] = useState(false);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const threadEndRef = React.useRef<HTMLDivElement>(null);

  const setTab = (tab: string) => setSearchParams({ tab });

  // Stats
  const totalItems = myItems?.length ?? 0;
  const activeItems = myItems?.filter((i) => i.status === 'active').length ?? 0;
  const resolvedItems = myItems?.filter((i) => i.status === 'resolved').length ?? 0;
  const expiredItems = myItems?.filter((i) => i.status === 'expired').length ?? 0;
  const lostItems = myItems?.filter((i) => i.type === 'lost').length ?? 0;
  const foundItems = myItems?.filter((i) => i.type === 'found').length ?? 0;
  const itemsWithVisuals = myItems?.filter((i) => i.image_url !== null && i.image_url !== '').length ?? 0;
  const itemsWithoutVisuals = totalItems - itemsWithVisuals;
  const unreadMessages = messages?.filter(
    (m) => m.receiver_id === user?.id && !m.is_read
  ).length ?? 0;

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;
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
      toast.success('Marked as resolved!');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar src={profile?.avatar_url} name={profile?.full_name} size="xl" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {profile?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 text-sm">{profile?.email}</p>
          </div>
        </div>
        <Link to="/post">
          <Button icon={<PlusCircle size={16} />}>Report Item</Button>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'messages' && unreadMessages > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadMessages}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Items"
              value={totalItems}
              icon={<Package size={20} className="text-blue-600" />}
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Active Reports"
              value={activeItems}
              icon={<Bell size={20} className="text-amber-600" />}
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Resolved"
              value={resolvedItems}
              icon={<CheckCircle size={20} className="text-emerald-600" />}
              iconBg="bg-emerald-50"
            />
            <StatCard
              title="Unread Messages"
              value={unreadMessages}
              icon={<MessageCircle size={20} className="text-purple-600" />}
              iconBg="bg-purple-50"
            />
          </div>

          {/* Visual Charts section */}
          {myItems && myItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DonutChart
                title="Status Distribution"
                subtitle="Your reported items by current status"
                data={[
                  { name: 'Active', value: activeItems, color: '#f59e0b' },
                  { name: 'Resolved', value: resolvedItems, color: '#10b981' },
                  { name: 'Expired', value: expiredItems, color: '#ef4444' },
                ]}
              />
              <BarChart
                title="Lost vs Found"
                subtitle="Comparison of your reported categories"
                data={[
                  { name: 'Lost', value: lostItems, color: '#ef4444' },
                  { name: 'Found', value: foundItems, color: '#3b82f6' },
                ]}
              />
              <DonutChart
                title="Visual Verification"
                subtitle="Reports with photos vs no photos"
                data={[
                  { name: 'With Photo', value: itemsWithVisuals, color: '#3b82f6' },
                  { name: 'No Photo', value: itemsWithoutVisuals, color: '#94a3b8' },
                ]}
              />
            </div>
          )}

          {/* Recent items */}
          {myItems && myItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Recent Items</h2>
                <button onClick={() => setTab('items')} className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {myItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(item.date_occurred)} · {item.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-0.5 text-xs font-bold rounded-full text-white', item.type === 'lost' ? 'bg-red-500' : 'bg-blue-600')}>
                        {item.type.toUpperCase()}
                      </span>
                      <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full border', getStatusColor(item.status))}>
                        {item.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Items Tab */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">My Reported Items</h2>
            <span className="text-sm text-slate-400">{totalItems} total</span>
          </div>
          {itemsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : myItems?.length === 0 ? (
            <EmptyState
              icon={<Package size={28} />}
              title="No items reported"
              description="You haven't reported any lost or found items yet."
              action={
                <Link to="/post">
                  <Button icon={<PlusCircle size={16} />}>Report Your First Item</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {myItems!.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                  <div className="flex-1 min-w-0">
                    <Link to={`/items/${item.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate block">
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">{item.location} · {formatDate(item.date_occurred)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 text-xs font-bold rounded-full text-white hidden sm:block', item.type === 'lost' ? 'bg-red-500' : 'bg-blue-600')}>
                      {item.type.toUpperCase()}
                    </span>
                    <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full border', getStatusColor(item.status))}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/items/${item.id}`}>
                      <button className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye size={15} />
                      </button>
                    </Link>
                    {item.status === 'active' && (
                      <button
                        onClick={() => handleMarkResolved(item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Mark as resolved"
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (() => {
        // Group all messages into conversations: key = otherUserId + itemId
        const convMap = new Map<string, {
          key: string;
          otherUser: typeof messages extends (infer T)[] | undefined ? NonNullable<T>['sender'] : never;
          itemId: string;
          itemTitle: string;
          itemType: string;
          latestMsg: NonNullable<typeof messages>[number];
          unreadCount: number;
          anyMsg: NonNullable<typeof messages>[number];
        }>();

        (messages ?? []).forEach((msg) => {
          const isSender = msg.sender_id === user?.id;
          const otherId = isSender ? msg.receiver_id : msg.sender_id;
          const other = isSender ? msg.receiver : msg.sender;
          const key = `${otherId}__${msg.item_id}`;
          const existing = convMap.get(key);
          const isUnread = !msg.is_read && msg.receiver_id === user?.id;

          if (!existing) {
            convMap.set(key, {
              key,
              otherUser: other,
              itemId: msg.item_id,
              itemTitle: msg.items?.title ?? 'Item',
              itemType: msg.items?.type ?? 'unknown',
              latestMsg: msg,
              unreadCount: isUnread ? 1 : 0,
              anyMsg: msg,
            });
          } else {
            if (isUnread) existing.unreadCount++;
            // messages are already sorted newest first, so first one seen is latest
          }
        });

        const conversations = Array.from(convMap.values());

        return (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Messages</h2>
              {conversations.length > 0 && (
                <span className="text-xs text-slate-400">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {messagesLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={<MessageCircle size={28} />}
                title="No messages yet"
                description="Messages you send and receive about items will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-50">
                {conversations.map((conv) => {
                  const hasUnread = conv.unreadCount > 0;
                  return (
                    <div
                      key={conv.key}
                      className={cn(
                        'flex items-center gap-3 px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer',
                        hasUnread && 'bg-blue-50/40'
                      )}
                      onClick={() => {
                        // Mark all unread in this thread
                        (messages ?? []).forEach((m) => {
                          if (!m.is_read && m.receiver_id === user?.id && m.item_id === conv.itemId) {
                            markRead.mutate(m.id);
                          }
                        });
                        setSelectedMessage(conv.anyMsg);
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar name={conv.otherUser?.full_name} size="lg" />
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Name + time */}
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={cn('text-sm truncate', hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800')}>
                            {conv.otherUser?.full_name ?? 'Unknown'}
                          </p>
                          <span className={cn('text-[11px] flex-shrink-0', hasUnread ? 'text-blue-600 font-semibold' : 'text-slate-400')}>
                            {formatRelativeTime(conv.latestMsg.created_at)}
                          </span>
                        </div>

                        {/* Item tag */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white',
                            conv.itemType === 'lost' ? 'bg-red-500' : 'bg-blue-600'
                          )}>
                            {conv.itemType.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-blue-600 truncate font-medium">{conv.itemTitle}</span>
                        </div>

                        {/* Latest message preview */}
                        <p className={cn('text-xs truncate', hasUnread ? 'text-slate-700 font-medium' : 'text-slate-400')}>
                          {conv.latestMsg.sender_id === user?.id ? 'You: ' : ''}{conv.latestMsg.content}
                        </p>
                      </div>

                      {/* Chevron */}
                      <div className="text-slate-300 flex-shrink-0">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">My Claims</h2>
          </div>
          {claimsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : claims?.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={28} />}
              title="No claims submitted"
              description="When you claim a found item, it will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {claims!.map((claim) => (
                <div key={claim.id} className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {claim.items && (
                        <Link
                          to={`/items/${claim.item_id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 truncate"
                        >
                          {claim.items.title}
                        </Link>
                      )}
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-semibold rounded-full ml-auto flex-shrink-0',
                          claim.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          claim.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        )}
                      >
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{claim.message}</p>
                    <p className="text-xs text-slate-300 mt-1">{formatRelativeTime(claim.created_at)}</p>
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
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Complaints & Support Tickets</h2>
              <p className="text-xs text-slate-400 mt-0.5">Report issues or problems faced during the recovery process to the admin.</p>
            </div>
            <Button size="sm" onClick={() => setComplaintModal(true)}>
              File a Complaint
            </Button>
          </div>
          {complaintsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : complaints?.length === 0 ? (
            <EmptyState
              icon={<AlertOctagon size={28} className="text-slate-400" />}
              title="No complaints filed"
              description="If you run into any issues during the lost & found process, file a complaint to notify admins."
              action={
                <Button size="sm" onClick={() => setComplaintModal(true)}>
                  File Your First Complaint
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {complaints!.map((comp) => (
                <div key={comp.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                        {comp.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{comp.description}</p>
                      {comp.items && (
                        <div className="mt-2.5 flex items-center gap-1 text-[11px] text-blue-600">
                          <span>Linked Item:</span>
                          <Link to={`/items/${comp.item_id}`} className="font-semibold hover:underline">
                            {comp.items.title}
                          </Link>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-300 mt-2">{formatRelativeTime(comp.created_at)}</p>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-full border',
                        comp.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}
                    >
                      {comp.status === 'pending' ? 'Pending Admin Review' : 'Resolved'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Complaint Modal */}
      <Modal
        open={complaintModal}
        onClose={() => {
          setComplaintModal(false);
          setComplaintTitle('');
          setComplaintDesc('');
        }}
        title="File a Complaint"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Submit your problem. Admins will review it and follow up as soon as possible.
          </p>
          <input
            placeholder="Complaint Subject / Title"
            value={complaintTitle}
            onChange={(e) => setComplaintTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <Textarea
            placeholder="Describe the issue or problem in detail. Mention what went wrong, and include any username or details..."
            value={complaintDesc}
            onChange={(e) => setComplaintDesc(e.target.value)}
            rows={5}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setComplaintModal(false);
                setComplaintTitle('');
                setComplaintDesc('');
              }}
            >
              Cancel
            </Button>
            <Button
              loading={createComplaint.isPending}
              disabled={!complaintTitle.trim() || !complaintDesc.trim()}
              onClick={async () => {
                if (!complaintTitle.trim() || !complaintDesc.trim()) return;
                try {
                  await createComplaint.mutateAsync({
                    user_id: user!.id,
                    title: complaintTitle.trim(),
                    description: complaintDesc.trim(),
                  });
                  setComplaintModal(false);
                  setComplaintTitle('');
                  setComplaintDesc('');
                  toast.success('Complaint filed successfully');
                } catch {
                  toast.error('Failed to submit complaint');
                }
              }}
            >
              Submit Complaint
            </Button>
          </div>
        </div>
      </Modal>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <ProfileSettings profile={profile} onUpdate={updateProfile} />
      )}

      {/* Conversation Thread Modal */}
      {selectedMessage && (
        <Modal
          open={!!selectedMessage}
          onClose={() => {
            setSelectedMessage(null);
            setReplyText('');
            setReplyingTo(null);
          }}
          title={`Conversation about ${selectedMessage.items?.title ?? 'Item'}`}
        >
          <div className="flex flex-col h-[560px]">
            {/* Thread Header */}
            <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                Item:{' '}
                <Link
                  to={`/items/${selectedMessage.item_id}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {selectedMessage.items?.title}
                </Link>
              </span>
              <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                {selectedMessage.items?.type}
              </span>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
              {(() => {
                const otherPartyId =
                  selectedMessage.sender_id === user?.id
                    ? selectedMessage.receiver_id
                    : selectedMessage.sender_id;

                const threadMessages = (messages ?? [])
                  .filter(
                    (m) =>
                      m.item_id === selectedMessage.item_id &&
                      ((m.sender_id === user?.id && m.receiver_id === otherPartyId) ||
                        (m.sender_id === otherPartyId && m.receiver_id === user?.id))
                  )
                  .slice()
                  .reverse();

                return (
                  <>
                    {threadMessages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMe={msg.sender_id === user?.id}
                        currentUserId={user!.id}
                        onReply={(m) => setReplyingTo(m)}
                        onAddReaction={(msgId, emoji) =>
                          addReaction.mutate({ messageId: msgId, userId: user!.id, emoji })
                        }
                        onRemoveReaction={(msgId, emoji) =>
                          removeReaction.mutate({ messageId: msgId, userId: user!.id, emoji })
                        }
                      />
                    ))}
                    <div ref={threadEndRef} />
                  </>
                );
              })()}
            </div>

            {/* Reply Input */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {/* Quoted reply context bar */}
              {replyingTo && (
                <div className="flex items-start gap-2 bg-blue-50 border-l-4 border-blue-400 rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-blue-600">
                      Replying to {replyingTo.sender_id === user?.id ? 'yourself' : (replyingTo.sender?.full_name ?? 'them')}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{replyingTo.content}</p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-400 hover:text-red-500 mt-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <Textarea
                placeholder={replyingTo ? 'Write your reply...' : 'Type a message...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    (e.target as HTMLElement).closest('div')?.querySelector('button[data-send]')?.dispatchEvent(new MouseEvent('click'));
                  }
                }}
                rows={3}
                className="w-full text-sm"
              />
              <div className="flex gap-2 justify-between items-center">
                <p className="text-[11px] text-slate-400">Ctrl+Enter to send</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMessage(null);
                      setReplyText('');
                      setReplyingTo(null);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    data-send
                    variant="primary"
                    size="sm"
                    loading={sendMessage.isPending}
                    disabled={!replyText.trim()}
                    onClick={async () => {
                      if (!replyText.trim() || !selectedMessage) return;
                      const receiverId =
                        selectedMessage.sender_id === user?.id
                          ? selectedMessage.receiver_id
                          : selectedMessage.sender_id;
                      try {
                        await sendMessage.mutateAsync({
                          item_id: selectedMessage.item_id,
                          sender_id: user!.id,
                          receiver_id: receiverId,
                          content: replyText.trim(),
                          reply_to_id: replyingTo?.id ?? null,
                        });
                        setReplyText('');
                        setReplyingTo(null);
                        toast.success('Message sent');
                        setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                      } catch {
                        toast.error('Failed to send message');
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfileSettings({
  profile,
  onUpdate,
}: {
  profile: ReturnType<typeof useAuth>['profile'];
  onUpdate: ReturnType<typeof useAuth>['updateProfile'];
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [studentId, setStudentId] = useState(profile?.student_id ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ full_name: fullName, student_id: studentId, phone });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-lg">
      <h2 className="font-semibold text-slate-900 mb-6">Profile Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Student ID</label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. STU2024001"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
          <input
            value={profile?.email ?? ''}
            disabled
            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
        </div>
        <Button onClick={handleSave} loading={saving} className="w-full">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
