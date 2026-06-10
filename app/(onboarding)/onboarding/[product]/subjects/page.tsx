/**
 * /onboarding/[product]/subjects
 * S1-F-05 — AP Subject Selection
 *
 * Route accessed after age gate is complete. Students select their AP courses,
 * which initializes Student Intelligence Profile (SIP) records for tracking
 * mastery, FSRS due dates, and study patterns.
 */
import type { Metadata } from 'next';
import { SubjectSelectionForm } from '@/components/features/auth/SubjectSelectionForm';

export const metadata: Metadata = {
  title: 'Choose Your Subjects — AceOS',
};

export default function SubjectsPage() {
  return <SubjectSelectionForm />;
}
