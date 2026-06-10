-- Create student_intelligence_profiles table
CREATE TABLE public.student_intelligence_profiles (
    student_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    ap_subjects TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    mastery_map JSONB NOT NULL DEFAULT '{}'::JSONB,
    predicted_ap_scores JSONB NOT NULL DEFAULT '{}'::JSONB,
    gpa JSONB NOT NULL DEFAULT '{}'::JSONB,
    ace_rank JSONB NOT NULL DEFAULT '{}'::JSONB,
    study_patterns JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.student_intelligence_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view their own SIP data
CREATE POLICY "Students can view their own SIP data." ON public.student_intelligence_profiles
FOR SELECT USING (auth.uid() = student_id);

-- Policy: Allow authenticated users to insert their own SIP data
CREATE POLICY "Students can insert their own SIP data." ON public.student_intelligence_profiles
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Policy: Allow authenticated users to update their own SIP data
CREATE POLICY "Students can update their own SIP data." ON public.student_intelligence_profiles
FOR UPDATE USING (auth.uid() = student_id);

-- Policy: Allow authenticated users to delete their own SIP data
CREATE POLICY "Students can delete their own SIP data." ON public.student_intelligence_profiles
FOR DELETE USING (auth.uid() = student_id);

-- Function to update `updated_at` column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update `updated_at` on each update
CREATE TRIGGER update_student_intelligence_profiles_updated_at
BEFORE UPDATE ON public.student_intelligence_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
