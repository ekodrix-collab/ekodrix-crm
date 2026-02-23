// Lead Statuses
export const LEAD_STATUSES = {
  new: {
    label: 'New',
    color: 'bg-slate-500',
    textColor: 'text-slate-500',
    bgLight: 'bg-slate-100',
    description: 'Not yet contacted'
  },
  contacted: {
    label: 'Contacted',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    bgLight: 'bg-blue-100',
    description: 'Initial contact made'
  },
  interested: {
    label: 'Interested',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    bgLight: 'bg-green-100',
    description: 'Showing interest in services'
  },
  follow_up_later: {
    label: 'Follow-up Later',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    bgLight: 'bg-yellow-100',
    description: 'Asked to contact later'
  },
  no_money: {
    label: 'No Budget',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
    bgLight: 'bg-orange-100',
    description: 'Interested but no budget now'
  },
  not_interested: {
    label: 'Not Interested',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    bgLight: 'bg-red-100',
    description: 'Declined services'
  },
  no_reply: {
    label: 'No Reply',
    color: 'bg-gray-400',
    textColor: 'text-gray-400',
    bgLight: 'bg-gray-100',
    description: 'Not responding to contact attempts'
  },
  negotiating: {
    label: 'Negotiating',
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
    bgLight: 'bg-purple-100',
    description: 'In discussion about deal'
  },
  converted: {
    label: 'Converted',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-500',
    bgLight: 'bg-emerald-100',
    description: 'Successfully converted to client'
  },
  lost: {
    label: 'Lost',
    color: 'bg-red-700',
    textColor: 'text-red-700',
    bgLight: 'bg-red-100',
    description: 'Deal lost'
  },
} as const;

export type LeadStatusKey = keyof typeof LEAD_STATUSES;

// Lead Sources
export const LEAD_SOURCES = {
  instagram: {
    label: 'Instagram',
    icon: 'Instagram',
    color: 'text-pink-500',
    bgColor: 'bg-pink-100'
  },
  facebook: {
    label: 'Facebook',
    icon: 'Facebook',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'MessageCircle',
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  call: {
    label: 'Phone Call',
    icon: 'Phone',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  referral: {
    label: 'Referral',
    icon: 'Users',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  website: {
    label: 'Website',
    icon: 'Globe',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'Linkedin',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  email: {
    label: 'Email',
    icon: 'Mail',
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  },
  other: {
    label: 'Other',
    icon: 'MoreHorizontal',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100'
  },
} as const;

export type LeadSourceKey = keyof typeof LEAD_SOURCES;

// Lead Priorities
export const PRIORITIES = {
  hot: {
    label: 'Hot',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    emoji: '🔥',
    description: 'High potential, act now'
  },
  warm: {
    label: 'Warm',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
    emoji: '🌡️',
    description: 'Good potential, follow up'
  },
  cold: {
    label: 'Cold',
    color: 'bg-blue-300',
    textColor: 'text-blue-400',
    emoji: '❄️',
    description: 'Low priority, nurture'
  },
} as const;

export type PriorityKey = keyof typeof PRIORITIES;

// Task Types
export const TASK_TYPES = {
  follow_up_call: {
    label: 'Follow-up Call',
    icon: 'Phone',
    color: 'text-blue-500'
  },
  follow_up_message: {
    label: 'Follow-up Message',
    icon: 'MessageSquare',
    color: 'text-green-500'
  },
  send_proposal: {
    label: 'Send Proposal',
    icon: 'FileText',
    color: 'text-purple-500'
  },
  meeting: {
    label: 'Meeting',
    icon: 'Calendar',
    color: 'text-orange-500'
  },
  demo: {
    label: 'Demo',
    icon: 'Monitor',
    color: 'text-indigo-500'
  },
  video_call: {
    label: 'Video Call',
    icon: 'Video',
    color: 'text-indigo-500'
  },
  send_contract: {
    label: 'Send Contract',
    icon: 'FileSignature',
    color: 'text-teal-500'
  },
  collect_payment: {
    label: 'Collect Payment',
    icon: 'IndianRupee',
    color: 'text-emerald-500'
  },
  other: {
    label: 'Other',
    icon: 'MoreHorizontal',
    color: 'text-gray-500'
  },
} as const;

export type TaskTypeKey = keyof typeof TASK_TYPES;

// Task Status
export const TASK_STATUSES = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500'
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-500',
    textColor: 'text-green-500'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500',
    textColor: 'text-red-500'
  },
  rescheduled: {
    label: 'Rescheduled',
    color: 'bg-blue-500',
    textColor: 'text-blue-500'
  },
} as const;

export type TaskStatusKey = keyof typeof TASK_STATUSES;

// Meeting Statuses
export const MEETING_STATUSES = {
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-green-500',
    textColor: 'text-green-500',
  },
  completed: {
    label: 'Completed',
    color: 'bg-slate-500',
    textColor: 'text-slate-500',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500',
    textColor: 'text-red-500',
  },
} as const;

export type MeetingStatusKey = keyof typeof MEETING_STATUSES;

// RSVP Statuses
export const RSVP_STATUSES = {
  pending: { label: 'Pending', color: 'text-yellow-500', icon: 'Clock' },
  accepted: { label: 'Accepted', color: 'text-green-500', icon: 'CheckCircle' },
  declined: { label: 'Declined', color: 'text-red-500', icon: 'XCircle' },
  tentative: { label: 'Tentative', color: 'text-blue-500', icon: 'HelpCircle' },
} as const;

export type RSVPStatusKey = keyof typeof RSVP_STATUSES;

// Participant Roles
export const PARTICIPANT_ROLES = {
  organizer: { label: 'Organizer', color: 'text-purple-500' },
  required: { label: 'Required', color: 'text-blue-500' },
  optional: { label: 'Optional', color: 'text-slate-400' },
} as const;

// Recurrence Options
export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
] as const;

// Meeting Colors
export const MEETING_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#22c55e', label: 'Green' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6366f1', label: 'Indigo' },
] as const;

// Meeting Duration Presets (minutes)
export const MEETING_DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
] as const;

// Interaction Types
export const INTERACTION_TYPES = {
  call: {
    label: 'Phone Call',
    icon: 'Phone',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'MessageCircle',
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  instagram_dm: {
    label: 'Instagram DM',
    icon: 'Instagram',
    color: 'text-pink-500',
    bgColor: 'bg-pink-100'
  },
  facebook_message: {
    label: 'Facebook Message',
    icon: 'Facebook',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  email: {
    label: 'Email',
    icon: 'Mail',
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  },
  meeting: {
    label: 'Meeting',
    icon: 'Users',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  video_call: {
    label: 'Video Call',
    icon: 'Video',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100'
  },
  proposal_sent: {
    label: 'Proposal Sent',
    icon: 'FileText',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100'
  },
  note: {
    label: 'Note',
    icon: 'StickyNote',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
} as const;

export type InteractionTypeKey = keyof typeof INTERACTION_TYPES;

// Interaction Outcomes
export const INTERACTION_OUTCOMES = {
  positive: {
    label: 'Positive',
    color: 'text-green-500',
    icon: 'ThumbsUp'
  },
  negative: {
    label: 'Negative',
    color: 'text-red-500',
    icon: 'ThumbsDown'
  },
  neutral: {
    label: 'Neutral',
    color: 'text-gray-500',
    icon: 'Minus'
  },
  no_answer: {
    label: 'No Answer',
    color: 'text-yellow-500',
    icon: 'PhoneMissed'
  },
  callback_requested: {
    label: 'Callback Requested',
    color: 'text-blue-500',
    icon: 'PhoneCallback'
  },
  follow_up_needed: {
    label: 'Follow-up Needed',
    color: 'text-orange-500',
    icon: 'Clock'
  },
} as const;

export type InteractionOutcomeKey = keyof typeof INTERACTION_OUTCOMES;

// Budget Ranges
export const BUDGET_RANGES = [
  { value: 'under_5k', label: 'Under ₹5,000', min: 0, max: 5000 },
  { value: '5k_15k', label: '₹5,000 - ₹15,000', min: 5000, max: 15000 },
  { value: '15k_30k', label: '₹15,000 - ₹30,000', min: 15000, max: 30000 },
  { value: '30k_50k', label: '₹30,000 - ₹50,000', min: 30000, max: 50000 },
  { value: '50k_100k', label: '₹50,000 - ₹100,000', min: 50000, max: 100000 },
  { value: 'over_100k', label: 'Over ₹100,000', min: 100000, max: null },
] as const;

// Project Types
export const PROJECT_TYPES = [
  { value: 'resellerpro', label: 'Resellerpro (SaaS)', icon: 'Zap' },
  { value: 'mobile_app', label: 'Mobile App', icon: 'Smartphone' },
  { value: 'web_app', label: 'Web Application', icon: 'Monitor' },
  { value: 'website', label: 'Website', icon: 'Globe' },
  { value: 'ecommerce', label: 'E-commerce', icon: 'ShoppingCart' },
  { value: 'crm_development', label: 'CRM Development', icon: 'Database' },
  { value: 'custom_software', label: 'Custom Software', icon: 'Code' },
  { value: 'api_integration', label: 'API Integration', icon: 'Plug' },
  { value: 'ui_ux_design', label: 'UI/UX Design', icon: 'Palette' },
  { value: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
  { value: 'consulting', label: 'Consulting', icon: 'MessageSquare' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
] as const;

// Timeline Options
export const TIMELINE_OPTIONS = [
  { value: 'urgent', label: 'Urgent (ASAP)', days: 7 },
  { value: '2_weeks', label: '2 Weeks', days: 14 },
  { value: '1_month', label: '1 Month', days: 30 },
  { value: '2_months', label: '2 Months', days: 60 },
  { value: '3_months', label: '3 Months', days: 90 },
  { value: 'flexible', label: 'Flexible', days: null },
] as const;

// Deal Stages
export const DEAL_STAGES = {
  proposal: {
    label: 'Proposal',
    color: 'bg-blue-500',
    order: 1
  },
  negotiation: {
    label: 'Negotiation',
    color: 'bg-yellow-500',
    order: 2
  },
  contract_sent: {
    label: 'Contract Sent',
    color: 'bg-purple-500',
    order: 3
  },
  won: {
    label: 'Won',
    color: 'bg-green-500',
    order: 4
  },
  lost: {
    label: 'Lost',
    color: 'bg-red-500',
    order: 5
  },
} as const;

export type DealStageKey = keyof typeof DEAL_STAGES;

// Lost Reasons
export const LOST_REASONS = [
  { value: 'price_too_high', label: 'Price too high' },
  { value: 'chose_competitor', label: 'Chose competitor' },
  { value: 'timeline_mismatch', label: 'Timeline didn\'t match' },
  { value: 'requirements_not_met', label: 'Requirements not met' },
  { value: 'budget_cut', label: 'Budget cut / Project cancelled' },
  { value: 'no_response', label: 'No response / Ghosted' },
  { value: 'trust_issues', label: 'Trust / Communication issues' },
  { value: 'decision_maker_left', label: 'Decision maker left' },
  { value: 'other', label: 'Other' },
] as const;

// User Roles
export const USER_ROLES = {
  admin: {
    label: 'Admin',
    description: 'Full access to all features',
    permissions: ['all']
  },
  member: {
    label: 'Member',
    description: 'Can manage leads and tasks',
    permissions: ['leads', 'tasks', 'interactions']
  },
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  lead_assigned: 'New lead assigned',
  task_due: 'Task due',
  task_overdue: 'Task overdue',
  meeting_reminder: 'Meeting reminder',
  lead_converted: 'Lead converted',
  payment_received: 'Payment received',
} as const;

export const APP_NAME = 'Ekodrix CRM';
export const APP_DESCRIPTION = 'Modern CRM for agencies and service businesses';

// App Configuration
export const APP_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  followUpDays: [1, 3, 7, 14, 30],
  workingHours: {
    start: 9,
    end: 18,
  },
  defaultDailyTarget: 10,
} as const;

// Navigation Items
export const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { name: 'Leads', href: '/leads', icon: 'Users' },
  { name: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
  { name: 'Meetings', href: '/meetings', icon: 'Calendar' },
  { name: 'Deals', href: '/deals', icon: 'IndianRupee' },
  { name: 'Reports', href: '/reports', icon: 'BarChart3' },
] as const;

// Quick Filters for Leads
export const LEAD_QUICK_FILTERS = [
  { key: 'all', label: 'All Leads' },
  { key: 'new', label: 'New' },
  { key: 'interested', label: 'Interested' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'hot', label: '🔥 Hot' },
  { key: 'today', label: 'Today\'s Tasks' },
  { key: 'overdue', label: 'Overdue' },
] as const;