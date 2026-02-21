-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: users (Team Members)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    daily_target INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: leads (Main Lead Data)
-- =============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(200),
    designation VARCHAR(100),
    
    -- Social Handles
    instagram_handle VARCHAR(100),
    facebook_url VARCHAR(500),
    whatsapp_number VARCHAR(20),
    linkedin_url VARCHAR(500),
    website VARCHAR(500),
    
    -- Classification
    source VARCHAR(50) NOT NULL CHECK (source IN ('instagram', 'facebook', 'whatsapp', 'call', 'referral', 'website', 'linkedin', 'email', 'other')),
    source_details TEXT,
    
    status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'follow_up_later', 'no_money', 'not_interested', 'no_reply', 'negotiating', 'converted', 'lost')),
    
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('hot', 'warm', 'cold')),
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Project Details
    project_type VARCHAR(100),
    budget_range VARCHAR(50),
    timeline VARCHAR(50),
    requirements TEXT,
    
    -- Tracking
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    next_follow_up_date DATE,
    follow_up_count INTEGER DEFAULT 0,
    
    -- Conversion
    converted_at TIMESTAMP WITH TIME ZONE,
    deal_value DECIMAL(12,2),
    lost_reason TEXT,
    
    -- Tags
    tags TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =============================================
-- TABLE: interactions (Communication History)
-- =============================================
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    
    type VARCHAR(30) NOT NULL CHECK (type IN ('call', 'whatsapp', 'instagram_dm', 'facebook_message', 'email', 'meeting', 'video_call', 'proposal_sent', 'note')),
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    
    summary TEXT NOT NULL,
    outcome VARCHAR(50) CHECK (outcome IN ('positive', 'negative', 'neutral', 'no_answer', 'callback_requested', 'follow_up_needed')),
    
    call_duration INTEGER,
    meeting_location VARCHAR(500),
    meeting_link VARCHAR(500),
    
    status_before VARCHAR(30),
    status_after VARCHAR(30),
    
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: tasks (Follow-ups & Meetings)
-- =============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) NOT NULL,
    created_by UUID REFERENCES users(id),
    
    type VARCHAR(30) NOT NULL CHECK (type IN ('follow_up_call', 'follow_up_message', 'send_proposal', 'meeting', 'demo', 'send_contract', 'collect_payment', 'other')),
    
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    due_date DATE NOT NULL,
    due_time TIME,
    
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'rescheduled')),
    
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    
    reminder_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: deals (Revenue Tracking)
-- =============================================
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    deal_value DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    stage VARCHAR(30) DEFAULT 'proposal' CHECK (stage IN ('proposal', 'negotiation', 'contract_sent', 'won', 'lost')),
    probability INTEGER DEFAULT 50,
    expected_close_date DATE,
    
    won_date DATE,
    lost_date DATE,
    lost_reason TEXT,
    
    amount_received DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'complete')),
    
    owner_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: payments
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: notifications (Added for App Feature)
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('task', 'lead', 'interaction', 'deal', 'system')),
    read BOOLEAN DEFAULT false,
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up_date);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_whatsapp ON leads(whatsapp_number);
CREATE INDEX idx_leads_instagram ON leads(instagram_handle);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- =============================================
-- UNIQUE CONSTRAINTS FOR DUPLICATE PREVENTION
-- =============================================
CREATE UNIQUE INDEX idx_unique_phone ON leads(phone) WHERE phone IS NOT NULL AND phone != '';
CREATE UNIQUE INDEX idx_unique_email ON leads(email) WHERE email IS NOT NULL AND email != '';
CREATE UNIQUE INDEX idx_unique_whatsapp ON leads(whatsapp_number) WHERE whatsapp_number IS NOT NULL AND whatsapp_number != '';
CREATE UNIQUE INDEX idx_unique_instagram ON leads(instagram_handle) WHERE instagram_handle IS NOT NULL AND instagram_handle != '';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all users
CREATE POLICY "Users can view all team members" ON users FOR SELECT USING (true);

-- Policy: Leads access
CREATE POLICY "Everyone can view leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Everyone can insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update leads" ON leads FOR UPDATE USING (true);

-- Policy: Interactions access
CREATE POLICY "Everyone can view interactions" ON interactions FOR SELECT USING (true);
CREATE POLICY "Everyone can insert interactions" ON interactions FOR INSERT WITH CHECK (true);

-- Policy: Tasks access
CREATE POLICY "Everyone can view tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Everyone can insert tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update tasks" ON tasks FOR UPDATE USING (true);

-- Policy: Deals access
CREATE POLICY "Everyone can view deals" ON deals FOR SELECT USING (true);
CREATE POLICY "Everyone can insert deals" ON deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update deals" ON deals FOR UPDATE USING (true);

-- Policy: Payments access
CREATE POLICY "Everyone can view payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Everyone can insert payments" ON payments FOR INSERT WITH CHECK (true);

-- Policy: Notifications access (Personal only)
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically create user profile after Auth Signup
-- This handles the "user create" flow correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- =============================================
-- TRIGGERS
-- =============================================

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auth sync
-- Note: This trigger should be enabled in your Supabase project
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA
-- =============================================
-- Note: Create users through the Supabase Auth Dashboard or the Team Management UI
-- to ensure they are properly registered in the auth system.

