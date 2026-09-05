-- =========================================================
-- EKODRIX HUB: DATABASE MIGRATION
-- Project Management + Client CRM + Credential Vault System
-- =========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- TABLE: clients (Clients & Enquiries)
-- =========================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(30),
    email VARCHAR(255),
    whatsapp VARCHAR(30),
    
    -- Status pipeline
    status VARCHAR(50) DEFAULT 'enquiry' CHECK (status IN ('enquiry', 'discussion', 'confirmed', 'active', 'completed', 'lost')),
    source VARCHAR(50) DEFAULT 'other' CHECK (source IN ('referral', 'website', 'facebook', 'instagram', 'whatsapp', 'walk_in', 'linkedin', 'call', 'other')),
    
    enquiry_date DATE DEFAULT CURRENT_DATE,
    confirmed_date DATE,
    
    -- Client requirements before/during onboarding
    requirements TEXT,
    
    -- Structured list of items/features promised to client
    -- Example: [{"item": "E-commerce website", "deadline": "2026-10-01", "estimated_cost": 100000, "status": "confirmed"}]
    promised_items JSONB DEFAULT '[]'::jsonb,
    
    notes TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: projects (Agency Projects & Technical Meta)
-- =========================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(50) DEFAULT 'website' CHECK (project_type IN ('website', 'ecommerce', 'app', 'saas', 'landing_page', 'branding', 'other')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    
    -- Technical & Maintenance Ownership
    technical_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Key Dates
    start_date DATE DEFAULT CURRENT_DATE,
    deadline DATE,
    deployment_date DATE,
    renewal_date DATE,
    domain_expiry_date DATE,
    completed_date DATE,
    
    -- Project Financials (Private to project/client pages - NOT on Dashboard)
    quoted_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Infrastructure & Maintenance Costing
    monthly_infra_cost DECIMAL(10,2) DEFAULT 0,
    annual_amc DECIMAL(12,2) DEFAULT 0,
    
    payment_terms VARCHAR(50) DEFAULT '50_50',
    payment_notes TEXT,
    
    description TEXT,
    scope_of_work TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: project_vaults (Credential & Asset Vault)
-- =========================================================
CREATE TABLE IF NOT EXISTS project_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    
    vault_type VARCHAR(50) NOT NULL,
    label VARCHAR(150) NOT NULL,
    
    url TEXT,
    username TEXT,
    password_encrypted TEXT,
    api_key TEXT,
    access_token TEXT,
    ssh_key TEXT,
    
    additional_data JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    
    is_filled BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: followups (Central Interaction & Discussion Logger)
-- =========================================================
CREATE TABLE IF NOT EXISTS followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    followup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'whatsapp', 'meeting', 'email', 'visit', 'video_call')),
    
    -- Core discussion details
    discussion_notes TEXT NOT NULL,
    client_response TEXT,
    our_commitment TEXT,
    
    outcome VARCHAR(50) DEFAULT 'interested' CHECK (outcome IN ('interested', 'not_interested', 'need_time', 'confirmed', 'follow_later', 'closed', 'completed')),
    
    next_followup_date DATE,
    next_followup_notes TEXT,
    
    done_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: project_payments (Payment Logs)
-- =========================================================
CREATE TABLE IF NOT EXISTS project_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    transaction_id VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: project_checklist (Milestones & Handover Checklist)
-- =========================================================
CREATE TABLE IF NOT EXISTS project_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    
    item_name VARCHAR(255) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INDEXES FOR FAST QUERYING
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tech_owner ON projects(technical_owner_id);

CREATE INDEX IF NOT EXISTS idx_project_vaults_project_id ON project_vaults(project_id);
CREATE INDEX IF NOT EXISTS idx_project_vaults_type ON project_vaults(vault_type);

CREATE INDEX IF NOT EXISTS idx_followups_client_id ON followups(client_id);
CREATE INDEX IF NOT EXISTS idx_followups_project_id ON followups(project_id);
CREATE INDEX IF NOT EXISTS idx_followups_next_date ON followups(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_followups_is_completed ON followups(is_completed);

CREATE INDEX IF NOT EXISTS idx_project_payments_project_id ON project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_checklist_project_id ON project_checklist(project_id);

-- =========================================================
-- TRIGGERS FOR updated_at
-- =========================================================
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_vaults_updated_at BEFORE UPDATE ON project_vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow all authenticated users to delete clients" ON clients FOR DELETE USING (true);

CREATE POLICY "Allow all authenticated users to read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow all authenticated users to delete projects" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow all authenticated users to read project_vaults" ON project_vaults FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert project_vaults" ON project_vaults FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update project_vaults" ON project_vaults FOR UPDATE USING (true);
CREATE POLICY "Allow all authenticated users to delete project_vaults" ON project_vaults FOR DELETE USING (true);

CREATE POLICY "Allow all authenticated users to read followups" ON followups FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert followups" ON followups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update followups" ON followups FOR UPDATE USING (true);
CREATE POLICY "Allow all authenticated users to delete followups" ON followups FOR DELETE USING (true);

CREATE POLICY "Allow all authenticated users to read project_payments" ON project_payments FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert project_payments" ON project_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update project_payments" ON project_payments FOR UPDATE USING (true);
CREATE POLICY "Allow all authenticated users to delete project_payments" ON project_payments FOR DELETE USING (true);

CREATE POLICY "Allow all authenticated users to read project_checklist" ON project_checklist FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert project_checklist" ON project_checklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update project_checklist" ON project_checklist FOR UPDATE USING (true);
CREATE POLICY "Allow all authenticated users to delete project_checklist" ON project_checklist FOR DELETE USING (true);
