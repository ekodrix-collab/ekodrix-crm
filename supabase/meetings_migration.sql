-- =============================================
-- MIGRATION: Meeting Scheduler System
-- =============================================

-- =============================================
-- TABLE: meetings
-- =============================================
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- Organizer
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Scheduling
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Google Meet
    meeting_link VARCHAR(500),
    calendar_event_id VARCHAR(500),
    
    -- Classification
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    recurrence VARCHAR(20) DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'bi_weekly', 'monthly')),
    
    -- Optional
    location VARCHAR(500),
    color VARCHAR(20) DEFAULT '#3b82f6',
    
    -- Lead Association (optional)
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: meeting_participants
-- =============================================
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
    
    -- Internal user (nullable for external guests)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- For external guests
    email VARCHAR(255),
    name VARCHAR(200),
    
    -- Role & RSVP
    role VARCHAR(20) DEFAULT 'required' CHECK (role IN ('organizer', 'required', 'optional')),
    rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
    
    -- Timestamps
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure each user/email appears only once per meeting
    UNIQUE(meeting_id, user_id),
    UNIQUE(meeting_id, email)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON meeting_participants(user_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- Everyone can view meetings
CREATE POLICY "Everyone can view meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Everyone can insert meetings" ON meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update meetings" ON meetings FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete meetings" ON meetings FOR DELETE USING (true);

-- Everyone can manage participants
CREATE POLICY "Everyone can view participants" ON meeting_participants FOR SELECT USING (true);
CREATE POLICY "Everyone can insert participants" ON meeting_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update participants" ON meeting_participants FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete participants" ON meeting_participants FOR DELETE USING (true);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- UPDATE NOTIFICATIONS TYPE CHECK
-- =============================================
-- Add 'meeting' and 'meeting_invite' to notifications type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('task', 'lead', 'interaction', 'deal', 'system', 'meeting', 'meeting_invite'));

-- =============================================
-- ADD GOOGLE TOKENS TO USERS (for OAuth)
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP WITH TIME ZONE;
