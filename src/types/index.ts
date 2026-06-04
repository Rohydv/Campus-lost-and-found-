export type UserRole = 'student' | 'admin';
export type ItemType = 'lost' | 'found';
export type ItemStatus = 'active' | 'resolved' | 'expired';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export type ItemCategory =
  | 'electronics'
  | 'clothing'
  | 'accessories'
  | 'documents'
  | 'keys'
  | 'bags'
  | 'books'
  | 'sports'
  | 'other';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  student_id: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  date_occurred: string;
  status: ItemStatus;
  image_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  item_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
  items?: Pick<Item, 'id' | 'title' | 'type'>;
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  message: string;
  status: ClaimStatus;
  created_at: string;
  items?: Pick<Item, 'id' | 'title' | 'type' | 'status'>;
  profiles?: Profile;
}

export interface ItemFilters {
  type?: ItemType;
  category?: ItemCategory;
  status?: ItemStatus;
  search?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface DashboardStats {
  totalLost: number;
  totalFound: number;
  totalResolved: number;
  myItems: number;
  myMessages: number;
  myClaims: number;
}

export interface AdminStats {
  totalUsers: number;
  totalItems: number;
  totalLost: number;
  totalFound: number;
  totalResolved: number;
  totalActive: number;
  recentItems: Item[];
}

export interface Complaint {
  id: string;
  user_id: string;
  item_id: string | null;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  created_at: string;
  profiles?: Profile;
  items?: Pick<Item, 'id' | 'title' | 'type'>;
}
