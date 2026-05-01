-- Migration to update constraints for lead sources and task types
-- This adds 'meta_ads' to lead sources and 'video_call' to task types

-- 1. Update Leads Source Constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check CHECK (source IN ('instagram', 'facebook', 'whatsapp', 'call', 'referral', 'website', 'linkedin', 'email', 'meta_ads', 'other'));

-- 2. Update Leads Priority Default and Constraint
-- The schema had 'medium' as default but it wasn't in the allowed values
ALTER TABLE leads ALTER COLUMN priority SET DEFAULT 'warm';
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_priority_check;
ALTER TABLE leads ADD CONSTRAINT leads_priority_check CHECK (priority IN ('hot', 'warm', 'cold'));

-- 3. Update Tasks Type Constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type IN ('follow_up_call', 'follow_up_message', 'send_proposal', 'meeting', 'demo', 'video_call', 'send_contract', 'collect_payment', 'other'));
