# Story: S1-F-05 — Student Onboarding: AP Subject Selection
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/onboarding/subject-selection.spec.ts → 'all 6 subjects displayed'
# Scenario 2 → tests/e2e/onboarding/subject-selection.spec.ts → 'zero selection blocked'
# Scenario 3 → tests/e2e/onboarding/subject-selection.spec.ts → 'max 4 subjects enforced'
# Scenario 4 → tests/integration/db/subjects.test.ts → 'subject rows and SIP created'
# Scenario 5 → tests/e2e/onboarding/subject-selection.spec.ts → 'redirected to dashboard'
# Scenario 6 → tests/e2e/onboarding/subject-selection.spec.ts → 'onboarding not revisitable'

Feature: AP Subject Selection During Onboarding
  As a newly registered student
  I want to select the AP subjects I am currently taking
  So that AceOS can set up my Student Intelligence Profile

  Scenario: All 6 Phase 1 AP subjects are displayed unselected
    Given a student who has completed email verification and any required consent
    When they arrive at /onboarding/subjects
    Then exactly 6 AP subject cards are displayed
    And each card shows the subject name, type badge (TEXT or VISUAL), and exam date
    And no subject is pre-selected

  Scenario: Zero subject selection is blocked
    Given a student on the subject selection screen with no subjects selected
    When they click Continue
    Then the message "Please select at least one AP subject to continue" is displayed
    And no navigation occurs
    And no database write occurs

  Scenario: Selecting a 5th subject is blocked with tooltip
    Given a student has already selected 4 subjects
    When they attempt to select a 5th subject
    Then the 5th subject card does not become selected
    And a message appears: "You can add more subjects later from your dashboard"

  Scenario: Selecting subjects creates database records and initializes SIP
    Given a student selects AP Chemistry and AP US History
    When they click Continue
    Then 2 rows exist in subject_selections with the correct student_id and subject codes
    And a student_intelligence_profiles record exists for the student
    And student_intelligence_profiles.ap_subjects contains ['AP_CHEM', 'AP_USHISTORY']
    And student_intelligence_profiles.predicted_ap_scores is an empty object

  Scenario: Student is redirected to dashboard after valid selection
    Given a student selects at least 1 subject
    When they click Continue
    Then they are redirected to /dashboard
    And the dashboard displays their selected subjects

  Scenario: Completed onboarding cannot be revisited
    Given a student who has already completed subject selection
    When they navigate directly to /onboarding/subjects
    Then they are redirected to /dashboard
