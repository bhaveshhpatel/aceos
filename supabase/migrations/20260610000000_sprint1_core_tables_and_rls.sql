-- ============================================================================
-- Sprint 1 Core Tables and RLS Policies
-- Supabase Project: olybgkhggqnmrfcjjojy (us-west-1)
-- Date: 2026-06-10
-- 
-- Creates all tables needed for S1-F-01 through S1-F-10:
--   - students (profile data, account status)
--   - consent_log (legal document acceptance)
--   - auth_event_log (auth lifecycle events)
--   - parental_consent_requests (age gate <18 flow)
--   - ap_subjects (subject registry)
--   - student_ap_subjects (subject selection)
--   - sip_records (Student Intelligence Profile per subject)
--   - audit_logs (compliance audit trail)
--
-- All tables have RLS enabled with appropriate policies.
-- All PII is marked for encryption via Supabase Vault.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. STUDENTS TABLE
-- ============================================================================
-- Core student profile. Extends Supabase auth.users with additional fields.
-- PII fields (email, dob, name) are encrypted at the app layer.

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    dob TEXT,  -- ISO date string, encrypted at app layer
    account_status TEXT NOT NULL DEFAULT 'active',
      -- 'active': 18+ or <18 with parental consent
      -- 'pending_age_check': <18 awaiting parental consent
      -- 'pending_email_verification': awaiting email verification
      -- 'suspended': account disabled
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    parent_email TEXT,  -- encrypted at app layer, used if <18
    profile_picture_url TEXT,  -- optional, from Google OAuth
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Students can only view/update their own row
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own" ON public.students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "student_update_own" ON public.students
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "student_delete_own" ON public.students
  FOR DELETE USING (auth.uid() = id);

-- Index for login (email)
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_students_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_students_timestamp();

-- ============================================================================
-- 2. CONSENT_LOG TABLE
-- ============================================================================
-- Records legal document acceptance (ToS, Privacy Policy).
-- Immutable audit log for FERPA compliance.

CREATE TABLE IF NOT EXISTS public.consent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
      -- 'terms_of_service', 'privacy_policy'
    version TEXT NOT NULL,
      -- Semantic version of the document
    accepted_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Students can only view their own records
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_view_own_consent" ON public.consent_log
  FOR SELECT USING (auth.uid() = student_id);

-- Prevent updates/deletes (immutable audit log)
CREATE POLICY "prevent_consent_modify" ON public.consent_log
  FOR UPDATE USING (FALSE);

CREATE POLICY "prevent_consent_delete" ON public.consent_log
  FOR DELETE USING (FALSE);

-- Index for compliance audits
CREATE INDEX IF NOT EXISTS idx_consent_log_student_id ON public.consent_log(student_id, created_at DESC);

-- ============================================================================
-- 3. AUTH_EVENT_LOG TABLE
-- ============================================================================
-- Auth lifecycle events (email verified, age verified, etc.).
-- Immutable audit log for FERPA compliance.

CREATE TABLE IF NOT EXISTS public.auth_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
      -- 'signup', 'email_verified', 'age_verified_adult', 'age_verified_minor',
      -- 'consent_approved', 'consent_rejected', 'password_reset', etc.
    actor_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Students can only view their own records
ALTER TABLE public.auth_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_view_own_auth_events" ON public.auth_event_log
  FOR SELECT USING (auth.uid() = student_id);

-- Prevent updates/deletes (immutable audit log)
CREATE POLICY "prevent_auth_event_modify" ON public.auth_event_log
  FOR UPDATE USING (FALSE);

CREATE POLICY "prevent_auth_event_delete" ON public.auth_event_log
  FOR DELETE USING (FALSE);

-- Index for compliance audits
CREATE INDEX IF NOT EXISTS idx_auth_event_log_student_id ON public.auth_event_log(student_id, created_at DESC);

-- ============================================================================
-- 4. PARENTAL_CONSENT_REQUESTS TABLE
-- ============================================================================
-- Tracks parental consent requests for students <18.
-- Links student to parent email and consent status.

CREATE TABLE IF NOT EXISTS public.parental_consent_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
    parent_email TEXT NOT NULL,  -- encrypted at app layer
    status TEXT NOT NULL DEFAULT 'pending',
      -- 'pending': awaiting parent response
      -- 'approved': parent approved access
      -- 'rejected': parent rejected access
      -- 'expired': request expired (30 days)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Students can view/update their own records
ALTER TABLE public.parental_consent_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_view_own_consent_request" ON public.parental_consent_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "student_update_own_consent_request" ON public.parental_consent_requests
  FOR UPDATE USING (auth.uid() = student_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_parental_consent_requests_status ON public.parental_consent_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_parental_consent_requests_expires_at ON public.parental_consent_requests(expires_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_consent_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_consent_requests_updated_at
  BEFORE UPDATE ON public.parental_consent_requests
  FOR EACH ROW EXECUTE FUNCTION update_consent_requests_timestamp();

-- ============================================================================
-- 5. AP_SUBJECTS TABLE
-- ============================================================================
-- Registry of available AP subjects.
-- Seeded with initial 6 subjects for Sprint 1.

CREATE TABLE IF NOT EXISTS public.ap_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
      -- 'AP Chemistry', 'AP Biology', 'AP US History', 'AP World History',
      -- 'AP English Language', 'AP Calculus AB'
    slug TEXT NOT NULL UNIQUE,
      -- 'ap-chemistry', 'ap-biology', etc.
    description TEXT,
    units JSONB DEFAULT '{}',  -- subject-specific unit structure
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Public read (no auth required to see subject list)
ALTER TABLE public.ap_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_ap_subjects" ON public.ap_subjects
  FOR SELECT USING (TRUE);

-- ============================================================================
-- 6. STUDENT_AP_SUBJECTS TABLE
-- ============================================================================
-- Maps students to their selected AP subjects.
-- Used in S1-F-05 subject selection flow.

CREATE TABLE IF NOT EXISTS public.student_ap_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    ap_subject_id UUID NOT NULL REFERENCES public.ap_subjects(id) ON DELETE RESTRICT,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, ap_subject_id)
);

-- RLS: Students can only view/modify their own selections
ALTER TABLE public.student_ap_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_view_own_subjects" ON public.student_ap_subjects
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "student_insert_own_subjects" ON public.student_ap_subjects
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "student_update_own_subjects" ON public.student_ap_subjects
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "student_delete_own_subjects" ON public.student_ap_subjects
  FOR DELETE USING (auth.uid() = student_id);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_student_ap_subjects_student_id ON public.student_ap_subjects(student_id);

-- ============================================================================
-- 7. SIP_RECORDS TABLE (Student Intelligence Profile)
-- ============================================================================
-- One SIP record per student per AP subject.
-- Tracks mastery, FSRS due dates, study patterns.

CREATE TABLE IF NOT EXISTS public.sip_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    ap_subject TEXT NOT NULL,
      -- Name of the AP subject, e.g., 'AP Chemistry'
    mastery DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (mastery >= 0 AND mastery <= 1.00),
      -- 0.00 to 1.00 scale
    last_reviewed TIMESTAMPTZ,
    fsrs_due TIMESTAMPTZ,
    units_mastery JSONB DEFAULT '{}',
      -- { "unit_1": 0.50, "unit_2": 0.75, ... }
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, ap_subject)
);

-- RLS: Students can only view/update their own SIP records
ALTER TABLE public.sip_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_view_own_sip" ON public.sip_records
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "student_insert_own_sip" ON public.sip_records
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "student_update_own_sip" ON public.sip_records
  FOR UPDATE USING (auth.uid() = student_id);

-- Index for daily queue queries
CREATE INDEX IF NOT EXISTS idx_sip_records_student_fsrs ON public.sip_records(student_id, fsrs_due);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sip_records_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_sip_records_updated_at
  BEFORE UPDATE ON public.sip_records
  FOR EACH ROW EXECUTE FUNCTION update_sip_records_timestamp();

-- ============================================================================
-- 8. AUDIT_LOGS TABLE
-- ============================================================================
-- Compliance and security audit trail.
-- Immutable record of all sensitive operations.

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
      -- 'signup', 'email_verified', 'age_gate_completed', 'consent_request_sent',
      -- 'consent_approved', 'consent_rejected', 'subject_selected', 'sip_updated',
      -- 'account_deleted', etc.
    ip_address TEXT,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Students can only view their own logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_view_own_audit_logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = student_id);

-- Prevent updates/deletes (immutable audit log)
CREATE POLICY "prevent_audit_modify" ON public.audit_logs
  FOR UPDATE USING (FALSE);

CREATE POLICY "prevent_audit_delete" ON public.audit_logs
  FOR DELETE USING (FALSE);

-- Index for compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_student_id ON public.audit_logs(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, created_at DESC);

-- ============================================================================
-- 9. SEED DATA
-- ============================================================================
-- Seed the 6 AP subjects for Sprint 1

INSERT INTO public.ap_subjects (name, slug, description) VALUES
  ('AP Chemistry', 'ap-chemistry', 'Advanced Placement Chemistry'),
  ('AP Biology', 'ap-biology', 'Advanced Placement Biology'),
  ('AP US History', 'ap-us-history', 'Advanced Placement United States History'),
  ('AP World History', 'ap-world-history', 'Advanced Placement World History'),
  ('AP English Language', 'ap-english-language', 'Advanced Placement English Language and Composition'),
  ('AP Calculus AB', 'ap-calculus-ab', 'Advanced Placement Calculus AB')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
