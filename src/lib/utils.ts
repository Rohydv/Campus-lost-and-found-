import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { ItemCategory, ItemStatus, ItemType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateTime(date: string): string {
  return format(new Date(date), 'MMM d, yyyy • h:mm a');
}

export const ITEM_CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'documents', label: 'Documents & ID' },
  { value: 'keys', label: 'Keys' },
  { value: 'bags', label: 'Bags & Backpacks' },
  { value: 'books', label: 'Books & Notes' },
  { value: 'sports', label: 'Sports Equipment' },
  { value: 'other', label: 'Other' },
];

export const CAMPUS_LOCATIONS = [
  'Main Library',
  'Student Union',
  'Science Building',
  'Engineering Hall',
  'Arts Center',
  'Gymnasium',
  'Cafeteria',
  'Parking Lot A',
  'Parking Lot B',
  'Dormitory Block A',
  'Dormitory Block B',
  'Lecture Hall 1',
  'Lecture Hall 2',
  'Administration Building',
  'Medical Center',
  'Sports Complex',
  'Auditorium',
  'Computer Lab',
  'Campus Garden',
  'Other',
];

export function getCategoryLabel(category: ItemCategory): string {
  return ITEM_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function getStatusColor(status: ItemStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'resolved':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'expired':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function getTypeColor(type: ItemType): string {
  return type === 'lost'
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-blue-100 text-blue-700 border-blue-200';
}

export function getCategoryIcon(category: ItemCategory): string {
  const icons: Record<ItemCategory, string> = {
    electronics: '💻',
    clothing: '👕',
    accessories: '⌚',
    documents: '📄',
    keys: '🔑',
    bags: '🎒',
    books: '📚',
    sports: '⚽',
    other: '📦',
  };
  return icons[category] ?? '📦';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${supabaseUrl}/storage/v1/object/public/item-images/${path}`;
}
