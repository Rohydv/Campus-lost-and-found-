import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  MessageCircle,
  Flag,
  CheckCircle,
  User,
  Pencil,
  Trash2,
  HandshakeIcon,
} from 'lucide-react';
import { useItem, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { useSendMessage } from '../hooks/useMessages';
import { useCreateClaim, useItemClaims } from '../hooks/useClaims';
import { useCreateComplaint } from '../hooks/useComplaints';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  formatDateTime,
  getCategoryLabel,
  getCategoryIcon,
  getImageUrl,
  getStatusColor,
  getTypeColor,
  cn,
} from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

export function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const { data: item, isLoading, error } = useItem(id!);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const sendMessage = useSendMessage();
  const createClaim = useCreateClaim();
  const createComplaint = useCreateComplaint();
  const { data: claims } = useItemClaims(id!);

  const [messageModal, setMessageModal] = useState(false);
  const [claimModal, setClaimModal] = useState(false);
  const [complaintModal, setComplaintModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [claimText, setClaimText] = useState('');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');

  if (isLoading) return <PageLoader />;
  if (error || !item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500">Item not found.</p>
        <Button variant="secondary" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const imageUrl = getImageUrl(item.image_url);
  const isOwner = user?.id === item.user_id;
  const isLost = item.type === 'lost';

  const handleMarkResolved = async () => {
    try {
      await updateItem.mutateAsync({ id: item.id, updates: { status: 'resolved' } });
      toast.success('Item marked as resolved!');
    } catch {
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success('Item deleted');
      navigate(-1);
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      await sendMessage.mutateAsync({
        item_id: item.id,
        sender_id: user!.id,
        receiver_id: item.user_id,
        content: messageText.trim(),
      });
      setMessageText('');
      setMessageModal(false);
      toast.success('Message sent!');
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleClaim = async () => {
    if (!claimText.trim()) return;
    try {
      await createClaim.mutateAsync({
        item_id: item.id,
        claimant_id: user!.id,
        message: claimText.trim(),
      });
      setClaimText('');
      setClaimModal(false);
      toast.success('Claim submitted! The reporter will review it.');
    } catch {
      toast.error('Failed to submit claim');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Image + Actions */}
        <div className="space-y-4">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-square">
            {imageUrl ? (
              <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <span className="text-6xl">{getCategoryIcon(item.category)}</span>
                <span className="text-sm text-slate-400">{getCategoryLabel(item.category)}</span>
              </div>
            )}
          </div>

          {/* Reporter Info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Reporter</p>
            <div className="flex items-center gap-3">
              <Avatar
                src={item.profiles?.avatar_url}
                name={item.is_anonymous ? 'Anonymous' : item.profiles?.full_name}
                size="lg"
              />
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {item.is_anonymous ? 'Anonymous' : item.profiles?.full_name}
                </p>
                {!item.is_anonymous && item.profiles?.student_id && (
                  <p className="text-xs text-slate-400">ID: {item.profiles.student_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isOwner && user && item.status === 'active' && (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setMessageModal(true)}
                icon={<MessageCircle size={16} />}
              >
                Send Message
              </Button>
              {!isLost && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setClaimModal(true)}
                  icon={<HandshakeIcon size={16} />}
                >
                  Claim This Item
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setComplaintModal(true)}
                icon={<Flag size={16} />}
              >
                Report a Problem
              </Button>
            </div>
          )}

          {/* Owner actions */}
          {(isOwner || isAdmin) && (
            <div className="space-y-2">
              {item.status === 'active' && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleMarkResolved}
                  loading={updateItem.isPending}
                  icon={<CheckCircle size={16} />}
                >
                  Mark as Resolved
                </Button>
              )}
              <Link to={`/post?edit=${item.id}`}>
                <Button variant="ghost" className="w-full" icon={<Pencil size={16} />}>
                  Edit Item
                </Button>
              </Link>
              <Button
                variant="danger"
                className="w-full"
                onClick={handleDelete}
                loading={deleteItem.isPending}
                icon={<Trash2 size={16} />}
              >
                Delete Item
              </Button>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-full text-white',
                  isLost ? 'bg-red-500' : 'bg-blue-600'
                )}
              >
                {isLost ? 'LOST' : 'FOUND'}
              </span>
              <span className={cn('px-3 py-1 text-xs font-semibold rounded-full border', getStatusColor(item.status))}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h1>
            <p className="text-sm text-slate-400">
              Posted {formatDateTime(item.created_at)}
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Description</h2>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* Info Grid */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Location</p>
                  <p className="text-sm text-slate-700 font-medium">{item.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Calendar size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">
                    Date {isLost ? 'Lost' : 'Found'}
                  </p>
                  <p className="text-sm text-slate-700 font-medium">{formatDate(item.date_occurred)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <Mail size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Contact Email</p>
                  <a
                    href={`mailto:${item.contact_email}`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    {item.contact_email}
                  </a>
                </div>
              </div>
              {item.contact_phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Phone size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Phone</p>
                    <a
                      href={`tel:${item.contact_phone}`}
                      className="text-sm text-blue-600 font-medium hover:text-blue-800"
                    >
                      {item.contact_phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Claims (owner only) */}
          {isOwner && !isLost && claims && claims.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                Claims ({claims.length})
              </h2>
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div key={claim.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={claim.profiles?.full_name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{claim.profiles?.full_name}</p>
                          <p className="text-xs text-slate-400">{claim.profiles?.email}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-semibold rounded-full',
                          claim.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          claim.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        )}
                      >
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{claim.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      <Modal open={messageModal} onClose={() => setMessageModal(false)} title="Send a Message">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Send a direct message to the reporter of <strong>"{item.title}"</strong>.
          </p>
          <Textarea
            label="Your Message"
            placeholder="Hi! I think I may have found your item / I believe this is my lost item…"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={5}
          />
          <Button
            className="w-full"
            onClick={handleSendMessage}
            loading={sendMessage.isPending}
            disabled={!messageText.trim()}
          >
            Send Message
          </Button>
        </div>
      </Modal>

      {/* Claim Modal */}
      <Modal open={claimModal} onClose={() => setClaimModal(false)} title="Claim This Item">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Explain why this is your item. The reporter will review your claim and contact you.
          </p>
          <Textarea
            label="Claim Description"
            placeholder="Describe identifying features, when/where you lost it, or other proof of ownership…"
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
            rows={5}
          />
          <Button
            className="w-full"
            onClick={handleClaim}
            loading={createClaim.isPending}
            disabled={!claimText.trim()}
          >
            Submit Claim
          </Button>
        </div>
      </Modal>

      {/* Report/Complaint Modal */}
      <Modal open={complaintModal} onClose={() => setComplaintModal(false)} title="Report a Problem">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Submit a complaint or issue regarding this listing <strong>"{item.title}"</strong>. Admins will review it.
          </p>
          <input
            placeholder="Subject / Title of issue"
            value={complaintTitle}
            onChange={(e) => setComplaintTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <Textarea
            label="Details of Complaint"
            placeholder="Describe what is wrong or any dispute regarding this item (e.g. false listing, claiming user is not owner, abusive description, etc.)..."
            value={complaintDesc}
            onChange={(e) => setComplaintDesc(e.target.value)}
            rows={5}
          />
          <Button
            className="w-full"
            onClick={async () => {
              if (!complaintTitle.trim() || !complaintDesc.trim()) return;
              try {
                await createComplaint.mutateAsync({
                  user_id: user!.id,
                  item_id: item.id,
                  title: complaintTitle.trim(),
                  description: complaintDesc.trim(),
                });
                setComplaintModal(false);
                setComplaintTitle('');
                setComplaintDesc('');
                toast.success('Report submitted! Admins will review it.');
              } catch {
                toast.error('Failed to submit report');
              }
            }}
            loading={createComplaint.isPending}
            disabled={!complaintTitle.trim() || !complaintDesc.trim()}
          >
            Submit Report
          </Button>
        </div>
      </Modal>
    </div>
  );
}
