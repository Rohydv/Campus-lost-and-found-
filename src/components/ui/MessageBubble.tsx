import React, { useState, useRef, useEffect } from 'react';
import { Reply, SmilePlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Message, MessageReaction } from '../../types';

const EMOJI_LIST = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

function groupReactions(reactions: MessageReaction[] = []) {
  const map: Record<string, { count: number; users: string[]; userIds: string[] }> = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [], userIds: [] };
    map[r.emoji].count++;
    if (r.profiles?.full_name) map[r.emoji].users.push(r.profiles.full_name);
    map[r.emoji].userIds.push(r.user_id);
  }
  return Object.entries(map).map(([emoji, val]) => ({ emoji, ...val }));
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  currentUserId: string;
  onReply: (msg: Message) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  readOnly?: boolean;
}

export function MessageBubble({
  message,
  isMe,
  currentUserId,
  onReply,
  onAddReaction,
  onRemoveReaction,
  readOnly = false,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [hovering, setHovering] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const reactions = groupReactions(message.message_reactions);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const handleEmojiClick = (emoji: string) => {
    const myReaction = message.message_reactions?.find(
      (r) => r.user_id === currentUserId && r.emoji === emoji
    );
    if (myReaction) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
    setShowPicker(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn('flex group', isMe ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowPicker(false); }}
    >
      <div className={cn('flex flex-col max-w-[80%]', isMe ? 'items-end' : 'items-start')}>

        {/* Action bar: reply + emoji — visible on hover */}
        {!readOnly && (
          <div
            className={cn(
              'flex items-center gap-1 mb-1 transition-all duration-150',
              isMe ? 'flex-row-reverse' : 'flex-row',
              hovering ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-1'
            )}
          >
            <button
              onClick={() => onReply(message)}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors"
              title="Reply"
            >
              <Reply size={13} />
            </button>
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setShowPicker((p) => !p)}
                className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300 shadow-sm transition-colors"
                title="React"
              >
                <SmilePlus size={13} />
              </button>
              {/* Emoji Picker Popup */}
              {showPicker && (
                <div
                  className={cn(
                    'absolute bottom-full mb-2 flex items-center gap-1 bg-white border border-slate-200 rounded-2xl shadow-xl px-2 py-1.5 z-50',
                    isMe ? 'right-0' : 'left-0'
                  )}
                >
                  {EMOJI_LIST.map((emoji) => {
                    const myReacted = message.message_reactions?.some(
                      (r) => r.user_id === currentUserId && r.emoji === emoji
                    );
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className={cn(
                          'text-xl hover:scale-125 transition-transform rounded-lg p-0.5',
                          myReacted && 'bg-blue-50 ring-2 ring-blue-400'
                        )}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* The bubble itself */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
            isMe
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
          )}
        >
          {/* Quoted reply preview */}
          {message.reply_to && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-xl px-3 py-2 mb-2 border-l-4 text-xs',
                isMe
                  ? 'bg-blue-700/50 border-blue-300 text-blue-100'
                  : 'bg-slate-100 border-blue-400 text-slate-500'
              )}
            >
              <div className="min-w-0">
                <p className={cn('font-semibold text-[11px] mb-0.5', isMe ? 'text-blue-200' : 'text-blue-600')}>
                  {message.reply_to.sender?.full_name ?? 'Unknown'}
                </p>
                <p className="leading-tight line-clamp-2 break-words">
                  {message.reply_to.content}
                </p>
              </div>
            </div>
          )}

          {/* Sender name for read-only (admin) view */}
          {readOnly && !isMe && (
            <p className="text-[11px] font-semibold text-blue-600 mb-1">
              {message.sender?.full_name}
            </p>
          )}

          {/* Message content */}
          <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

          {/* Timestamp */}
          <span
            className={cn(
              'text-[10px] mt-1.5 block',
              isMe ? 'text-blue-200 text-right' : 'text-slate-400 text-right'
            )}
          >
            {formatTime(message.created_at)}
          </span>
        </div>

        {/* Reaction pills */}
        {reactions.length > 0 && (
          <div className={cn('flex flex-wrap gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
            {reactions.map(({ emoji, count, userIds }) => {
              const iReacted = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  onClick={() => !readOnly && handleEmojiClick(emoji)}
                  className={cn(
                    'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all',
                    iReacted
                      ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                    readOnly && 'cursor-default pointer-events-none'
                  )}
                  title={reactions.find((r) => r.emoji === emoji)?.users.join(', ')}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span>{count}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
