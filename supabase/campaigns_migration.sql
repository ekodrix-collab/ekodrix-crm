-- =============================================
-- TABLE: campaigns (Campaign Management)
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100), -- eCommerce, Website redesign, Branding, Landing pages, Business websites, etc.
    source VARCHAR(100), -- Platform: Meta Ads, Instagram Ads, WhatsApp Marketing, organic, etc.
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planned', 'active', 'paused', 'completed')),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INTEGRATION: Link leads to campaigns
-- =============================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- Create index for faster campaign queries
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) FOR CAMPAIGNS
-- =============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage campaigns
CREATE POLICY "Everyone can view campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Everyone can insert campaigns" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update campaigns" ON campaigns FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete campaigns" ON campaigns FOR DELETE USING (true);

-- =============================================
-- TRIGGERS: Automated timestamp management
-- =============================================
CREATE TRIGGER update_campaigns_updated_at 
BEFORE UPDATE ON campaigns 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
