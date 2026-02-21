import * as z from 'zod';

// ==========================================
// LEAD VALIDATIONS
// ==========================================

export const leadSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be less than 200 characters'),

  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .or(z.literal('')),

  company_name: z
    .string()
    .max(200, 'Company name must be less than 200 characters')
    .optional()
    .or(z.literal('')),

  designation: z
    .string()
    .max(100, 'Designation must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  instagram_handle: z
    .string()
    .max(100, 'Instagram handle must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  whatsapp_number: z
    .string()
    .max(20, 'WhatsApp number must be less than 20 characters')
    .optional()
    .or(z.literal('')),

  facebook_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  linkedin_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  source: z.enum([
    'instagram',
    'facebook',
    'whatsapp',
    'call',
    'referral',
    'website',
    'linkedin',
    'email',
    'other',
  ], {
    required_error: 'Please select a lead source',
  }),

  source_details: z
    .string()
    .max(500, 'Source details must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  project_type: z
    .string()
    .optional()
    .or(z.literal('')),

  budget_range: z
    .string()
    .optional()
    .or(z.literal('')),

  timeline: z
    .string()
    .optional()
    .or(z.literal('')),

  requirements: z
    .string()
    .max(2000, 'Requirements must be less than 2000 characters')
    .optional()
    .or(z.literal('')),

  assigned_to: z
    .string()
    .uuid('Invalid user ID')
    .optional()
    .or(z.literal('')),

  priority: z
    .enum(['hot', 'warm', 'cold'])
    .optional()
    .default('warm'),

  tags: z
    .array(z.string())
    .optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

// ==========================================
// INTERACTION VALIDATIONS
// ==========================================

export const interactionSchema = z.object({
  lead_id: z
    .string()
    .uuid('Invalid lead ID'),

  type: z.enum([
    'call',
    'whatsapp',
    'instagram_dm',
    'facebook_message',
    'email',
    'meeting',
    'video_call',
    'proposal_sent',
    'note',
  ], {
    required_error: 'Please select an interaction type',
  }),

  direction: z
    .enum(['inbound', 'outbound'])
    .optional(),

  summary: z
    .string()
    .min(5, 'Summary must be at least 5 characters')
    .max(2000, 'Summary must be less than 2000 characters'),

  outcome: z
    .enum([
      'positive',
      'negative',
      'neutral',
      'no_answer',
      'callback_requested',
      'follow_up_needed',
    ])
    .optional(),

  call_duration: z
    .number()
    .min(0, 'Duration cannot be negative')
    .optional(),

  meeting_location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  meeting_link: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  new_status: z
    .enum([
      'new',
      'contacted',
      'interested',
      'follow_up_later',
      'no_money',
      'not_interested',
      'no_reply',
      'negotiating',
      'converted',
      'lost',
    ])
    .optional(),

  schedule_follow_up: z
    .boolean()
    .default(false),

  follow_up_date: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type InteractionFormValues = z.infer<typeof interactionSchema>;

// ==========================================
// TASK VALIDATIONS
// ==========================================

export const taskSchema = z.object({
  lead_id: z
    .string()
    .uuid('Invalid lead ID')
    .optional()
    .or(z.literal('')),

  assigned_to: z
    .string()
    .uuid('Please select a team member'),

  type: z.enum([
    'follow_up_call',
    'follow_up_message',
    'send_proposal',
    'meeting',
    'demo',
    'video_call',
    'send_contract',
    'collect_payment',
    'other',
  ], {
    required_error: 'Please select a task type',
  }),

  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(300, 'Title must be less than 300 characters'),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),

  due_date: z
    .string()
    .min(1, 'Please select a due date'),

  due_time: z
    .string()
    .optional()
    .or(z.literal('')),

  priority: z
    .enum(['high', 'medium', 'low'])
    .optional()
    .default('medium'),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

// ==========================================
// DEAL VALIDATIONS
// ==========================================

export const dealSchema = z.object({
  lead_id: z
    .string()
    .uuid('Invalid lead ID')
    .optional()
    .or(z.literal('')),

  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(300, 'Title must be less than 300 characters'),

  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal('')),

  deal_value: z
    .number()
    .min(0, 'Deal value cannot be negative')
    .max(100000000, 'Deal value is too large'),

  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .default('USD'),

  stage: z
    .enum(['proposal', 'negotiation', 'contract_sent', 'won', 'lost'])
    .default('proposal'),

  probability: z
    .number()
    .min(0, 'Probability must be between 0 and 100')
    .max(100, 'Probability must be between 0 and 100')
    .default(50),

  expected_close_date: z
    .string()
    .optional()
    .or(z.literal('')),

  owner_id: z
    .string()
    .uuid('Invalid user ID')
    .optional()
    .or(z.literal('')),
});

export type DealFormValues = z.infer<typeof dealSchema>;

// ==========================================
// USER VALIDATIONS
// ==========================================

export const userSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),

  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),

  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .or(z.literal('')),

  role: z
    .enum(['admin', 'member'])
    .optional()
    .default('member'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

// ==========================================
// PAYMENT VALIDATIONS
// ==========================================

export const paymentSchema = z.object({
  deal_id: z
    .string()
    .uuid('Invalid deal ID'),

  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0'),

  payment_date: z
    .string()
    .min(1, 'Please select a payment date'),

  payment_method: z
    .string()
    .max(50, 'Payment method must be less than 50 characters')
    .optional()
    .or(z.literal('')),

  reference_number: z
    .string()
    .max(100, 'Reference number must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Validate phone number
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Clean phone number for storage
export function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
}

// Clean and normalize email
export function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}