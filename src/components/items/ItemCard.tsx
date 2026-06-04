import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, Eye } from 'lucide-react';
import type { Item } from '../../types';
import {
  formatRelativeTime,
  formatDate,
  getCategoryLabel,
  getCategoryIcon,
  getImageUrl,
  truncate,
  cn,
} from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const imageUrl = getImageUrl(item.image_url);
  const isLost = item.type === 'lost';

  return (
    <Link
      to={`/items/${item.id}`}
      className="group block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">{getCategoryIcon(item.category)}</span>
            <span className="text-xs text-slate-400 font-medium">{getCategoryLabel(item.category)}</span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              'px-2.5 py-1 text-xs font-bold rounded-full',
              isLost
                ? 'bg-red-500 text-white'
                : 'bg-blue-600 text-white'
            )}
          >
            {isLost ? 'LOST' : 'FOUND'}
          </span>
        </div>

        {/* Status badge */}
        {item.status !== 'active' && (
          <div className="absolute top-3 right-3">
            <span className={cn(
              'px-2.5 py-1 text-xs font-bold rounded-full',
              item.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
            )}>
              {item.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {item.title}
          </h3>
          <span className="text-lg flex-shrink-0">{getCategoryIcon(item.category)}</span>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {truncate(item.description, 100)}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} className="flex-shrink-0" />
            <span>{formatDate(item.date_occurred)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <User size={10} className="text-white" />
            </div>
            <span className="text-xs text-slate-400">
              {item.is_anonymous ? 'Anonymous' : (item.profiles?.full_name?.split(' ')[0] ?? 'User')}
            </span>
          </div>
          <span className="text-xs text-slate-300">{formatRelativeTime(item.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
