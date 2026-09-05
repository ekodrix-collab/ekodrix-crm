// ==========================================
// EKODRIX HUB: CORE TYPES
// ==========================================

export type ClientStatus =
  | 'enquiry'
  | 'discussion'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'lost';

export type ClientSource =
  | 'referral'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'walk_in'
  | 'linkedin'
  | 'call'
  | 'other';

export interface PromisedItem {
  id?: string;
  item: string;
  deadline?: string;
  estimated_cost?: number;
  status: 'discussion' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  status: ClientStatus;
  source: ClientSource;
  enquiry_date?: string | null;
  confirmed_date?: string | null;
  requirements?: string | null;
  promised_items: PromisedItem[];
  notes?: string | null;
  assigned_to?: string | null;
  assigned_user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  projects_count?: number;
  followups_count?: number;
}

export type ProjectType =
  | 'website'
  | 'ecommerce'
  | 'app'
  | 'saas'
  | 'landing_page'
  | 'branding'
  | 'other';

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export interface Project {
  id: string;
  client_id: string;
  client?: Client | null;
  project_name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  
  technical_owner_id?: string | null;
  technical_owner?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;

  start_date?: string | null;
  deadline?: string | null;
  deployment_date?: string | null;
  renewal_date?: string | null;
  domain_expiry_date?: string | null;
  completed_date?: string | null;

  quoted_amount: number;
  final_amount: number;
  paid_amount: number;
  monthly_infra_cost: number;
  annual_amc: number;

  payment_terms?: string | null;
  payment_notes?: string | null;

  description?: string | null;
  scope_of_work?: string | null;

  created_at: string;
  updated_at: string;

  vaults?: ProjectVault[];
  payments?: ProjectPayment[];
  checklist?: ProjectChecklistItem[];
  health?: ProjectHealth;
}

export type VaultType =
  | 'website_admin'
  | 'business_email'
  | 'domain'
  | 'hosting'
  | 'github'
  | 'vercel'
  | 'supabase'
  | 'server'
  | 'cloudinary'
  | 'razorpay'
  | 'database'
  | 'email_service'
  | 'payment_gateway'
  | 'analytics'
  | 'cloud_storage'
  | 'api_keys'
  | 'social_media'
  | 'cpanel'
  | 'ftp'
  | 'cdn'
  | 'monitoring'
  | 'other';

export interface ProjectVault {
  id: string;
  project_id: string;
  vault_type: VaultType;
  label: string;
  url?: string | null;
  username?: string | null;
  password_encrypted?: string | null;
  api_key?: string | null;
  access_token?: string | null;
  ssh_key?: string | null;
  additional_data?: Record<string, any>;
  notes?: string | null;
  is_filled: boolean;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export type InteractionType =
  | 'call'
  | 'whatsapp'
  | 'meeting'
  | 'email'
  | 'visit'
  | 'video_call';

export type FollowupOutcome =
  | 'interested'
  | 'not_interested'
  | 'need_time'
  | 'confirmed'
  | 'follow_later'
  | 'closed'
  | 'completed';

export interface Followup {
  id: string;
  client_id: string;
  client?: Client | null;
  project_id?: string | null;
  project?: Project | null;
  followup_date: string;
  interaction_type: InteractionType;
  discussion_notes: string;
  client_response?: string | null;
  our_commitment?: string | null;
  outcome: FollowupOutcome;
  next_followup_date?: string | null;
  next_followup_notes?: string | null;
  done_by?: string | null;
  done_by_user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  is_completed: boolean;
  created_at: string;
}

export interface ProjectPayment {
  id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ProjectChecklistItem {
  id: string;
  project_id: string;
  item_name: string;
  is_required: boolean;
  is_completed: boolean;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ProjectHealth {
  percentage: number;
  status: 'healthy' | 'warning' | 'risk';
  color: 'green' | 'yellow' | 'red';
  filled: number;
  total: number;
  missing: string[];
}
