// ==========================================
// USER TYPES
// ==========================================

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  daily_target: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// LEAD TYPES
// ==========================================

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'follow_up_later'
  | 'no_money'
  | 'not_interested'
  | 'no_reply'
  | 'negotiating'
  | 'converted'
  | 'lost';

export type LeadSource =
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'call'
  | 'referral'
  | 'website'
  | 'linkedin'
  | 'email'
  | 'other';

export type LeadPriority = 'hot' | 'warm' | 'cold';

export interface Lead {
  id: string;

  // Basic Info
  name: string;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  designation?: string | null;

  // Social Handles
  instagram_handle?: string | null;
  facebook_url?: string | null;
  whatsapp_number?: string | null;
  linkedin_url?: string | null;
  website?: string | null;

  // Classification
  source: LeadSource;
  source_details?: string | null;
  status: LeadStatus;
  priority: LeadPriority;

  // Assignment
  assigned_to?: string | null;
  assigned_at?: string | null;

  // Project Details
  project_type?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  requirements?: string | null;

  // Tracking
  last_contacted_at?: string | null;
  next_follow_up_date?: string | null;
  follow_up_count: number;

  // Conversion
  converted_at?: string | null;
  deal_value?: number | null;
  lost_reason?: string | null;

  // Tags
  tags?: string[] | null;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string | null;

  // Joined fields (from relations)
  assigned_user?: User | null;
  created_by_user?: User | null;
  interactions_count?: number;
  tasks_count?: number;
}

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  designation?: string;
  instagram_handle?: string;
  facebook_url?: string;
  whatsapp_number?: string;
  linkedin_url?: string;
  website?: string;
  source: LeadSource;
  source_details?: string;
  project_type?: string;
  budget_range?: string;
  timeline?: string;
  requirements?: string;
  assigned_to?: string;
  priority?: LeadPriority;
  tags?: string[];
}

// ==========================================
// INTERACTION TYPES
// ==========================================

export type InteractionType =
  | 'call'
  | 'whatsapp'
  | 'instagram_dm'
  | 'facebook_message'
  | 'email'
  | 'meeting'
  | 'video_call'
  | 'proposal_sent'
  | 'note';

export type InteractionDirection = 'inbound' | 'outbound';

export type InteractionOutcome =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'no_answer'
  | 'callback_requested'
  | 'follow_up_needed';

export interface Interaction {
  id: string;
  lead_id: string;
  user_id: string;

  type: InteractionType;
  direction?: InteractionDirection | null;

  summary: string;
  outcome?: InteractionOutcome | null;

  call_duration?: number | null; // in seconds
  meeting_location?: string | null;
  meeting_link?: string | null;

  status_before?: LeadStatus | null;
  status_after?: LeadStatus | null;

  attachments?: Attachment[] | null;

  created_at: string;

  // Joined fields
  user?: User | null;
  lead?: Lead | null;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface InteractionFormData {
  lead_id: string;
  type: InteractionType;
  direction?: InteractionDirection;
  summary: string;
  outcome?: InteractionOutcome;
  call_duration?: number;
  meeting_location?: string;
  meeting_link?: string;
  new_status?: LeadStatus;
  schedule_follow_up?: boolean;
  follow_up_date?: string;
}

// ==========================================
// TASK TYPES
// ==========================================

export type TaskType =
  | 'follow_up_call'
  | 'follow_up_message'
  | 'send_proposal'
  | 'meeting'
  | 'demo'
  | 'video_call'
  | 'send_contract'
  | 'collect_payment'
  | 'other';

export type TaskStatus = 'pending' | 'completed' | 'cancelled' | 'rescheduled';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  lead_id?: string | null;
  assigned_to: string;
  created_by?: string | null;

  type: TaskType;
  title: string;
  description?: string | null;

  due_date: string;
  due_time?: string | null;

  priority: TaskPriority;
  status: TaskStatus;

  completed_at?: string | null;
  completion_notes?: string | null;

  reminder_sent: boolean;

  created_at: string;
  updated_at: string;

  // Joined fields
  lead?: Lead | null;
  assigned_user?: User | null;
  created_by_user?: User | null;
}

export interface TaskFormData {
  lead_id?: string;
  assigned_to: string;
  type: TaskType;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority?: TaskPriority;
}

// ==========================================
// DEAL TYPES
// ==========================================

export type DealStage = 'proposal' | 'negotiation' | 'contract_sent' | 'won' | 'lost';

export type PaymentStatus = 'pending' | 'partial' | 'complete';

export interface Deal {
  id: string;
  lead_id?: string | null;

  title: string;
  description?: string | null;

  deal_value: number;
  currency: string;

  stage: DealStage;
  probability: number;
  expected_close_date?: string | null;

  won_date?: string | null;
  lost_date?: string | null;
  lost_reason?: string | null;

  amount_received: number;
  payment_status: PaymentStatus;

  owner_id?: string | null;

  created_at: string;
  updated_at: string;

  // Joined fields
  lead?: Lead | null;
  owner?: User | null;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  deal_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  created_at: string;
}

// ==========================================
// MEETING TYPES
// ==========================================

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type RSVPStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

export type ParticipantRole = 'organizer' | 'required' | 'optional';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly';

export interface Meeting {
  id: string;

  // Basic Info
  title: string;
  description?: string | null;

  // Organizer
  organizer_id: string;

  // Scheduling
  start_time: string;
  end_time: string;
  timezone: string;

  // Google Meet
  meeting_link?: string | null;
  calendar_event_id?: string | null;

  // Classification
  status: MeetingStatus;
  recurrence: RecurrenceType;

  // Optional
  location?: string | null;
  color: string;

  // Lead Association
  lead_id?: string | null;

  // Metadata
  created_at: string;
  updated_at: string;

  // Joined fields
  organizer?: User | null;
  participants?: MeetingParticipant[];
  lead?: Lead | null;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id?: string | null;
  email?: string | null;
  name?: string | null;
  role: ParticipantRole;
  rsvp_status: RSVPStatus;
  invited_at: string;
  responded_at?: string | null;

  // Joined fields
  user?: User | null;
}

export interface MeetingFormData {
  title: string;
  description?: string;
  start_date: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  generate_meet_link?: boolean;
  location?: string;
  color?: string;
  recurrence?: RecurrenceType;
  lead_id?: string;
  participants: ParticipantInput[];
}

export interface ParticipantInput {
  user_id?: string;
  email?: string;
  name?: string;
  role: ParticipantRole;
}

// ==========================================
// DASHBOARD TYPES
// ==========================================

export interface DashboardStats {
  newLeadsThisWeek: number;
  newLeadsChange: number;
  todayTasks: number;
  overdueTasks: number;
  todayMeetings: number;
  pipelineValue: number;
  pipelineChange: number;
  conversionRate: number;
  conversionChange: number;
  totalLeads: number;
  totalConverted: number;
}

export interface LeadFunnelData {
  status: LeadStatus;
  count: number;
  value: number;
}

export interface TeamMemberStats {
  user: User;
  totalLeads: number;
  convertedLeads: number;
  todayTasks: number;
  completedTasks: number;
  revenue: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  deals: number;
}
// ==========================================
// NOTIFICATION TYPES
// ==========================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task' | 'lead' | 'interaction' | 'deal' | 'system' | 'meeting' | 'meeting_invite';
  read: boolean;
  related_id?: string;
  created_at: string;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  existingLead?: Lead;
  message?: string;
}

// ==========================================
// FILTER TYPES
// ==========================================

export interface LeadFilters {
  status?: LeadStatus | 'all';
  source?: LeadSource | 'all';
  assigned_to?: string | 'all';
  priority?: LeadPriority | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TaskFilters {
  status?: TaskStatus | 'all';
  type?: TaskType | 'all';
  assigned_to?: string | 'all';
  priority?: TaskPriority | 'all';
  dateFrom?: string;
  dateTo?: string;
}

// ==========================================
// FORM VALIDATION
// ==========================================

export interface ValidationError {
  field: string;
  message: string;
}

// ==========================================
// SUPABASE DATABASE TYPES
// ==========================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'follow_up_count'>;
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>;
      };
      interactions: {
        Row: Interaction;
        Insert: Omit<Interaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Interaction, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'reminder_sent'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      deals: {
        Row: Deal;
        Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'amount_received'>;
        Update: Partial<Omit<Deal, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>;
      };
    };
  };
}