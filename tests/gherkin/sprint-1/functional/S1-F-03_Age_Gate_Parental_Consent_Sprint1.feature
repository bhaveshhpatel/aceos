# Automation Mapping:
# - Given: User has signed up, email verified
# - When: User reaches age gate screen (app/(auth)/signup page)
# - Then: Age gate validates DOB, routes to parental consent if <18
# Unit tests: __tests__/components/age-gate.test.ts
# Integration: tests/integration/supabase/parental-consent.test.ts
# E2E: tests/e2e/age-gate-flow.spec.ts (Playwright)

Feature: Age Gate and Parental Consent Initiation (Sprint 1)
  As a young student or parent
  I want to verify my age and (if under 18) get parental consent
  So that AceOS complies with FERPA and user privacy laws

  Background:
    Given the student has verified their email
    And they are on the age gate screen
    And today's date is 2026-06-10

  Scenario: Student 18+ enters age gate - no parental consent needed
    When the student enters date of birth "2006-06-10"
    And clicks "Continue"
    Then the system confirms they are age 18+
    And they are redirected directly to "Select Your AP Subjects"
    And no parental consent email is sent
    And their parental_consent_required field is set to false

  Scenario: Student under 18 enters age gate - parental consent initiated
    When the student enters date of birth "2009-06-10"
    And clicks "Continue"
    Then the system recognizes they are under 18
    And displays "We need your parent's permission to continue"
    And prompts for parent email address
    And creates a parental_consent_request record with status "pending"

  Scenario: Invalid date of birth format is rejected
    When the student enters date of birth "06/10/2009" (invalid format)
    And clicks "Continue"
    Then the form shows "Please use MM/DD/YYYY format"
    And no record is created

  Scenario: Future date of birth is rejected
    When the student enters a future date (e.g., "06/10/2030")
    Then the form shows "Your birth date cannot be in the future"

  Scenario: Student enters parent email for consent
    When the student (age <18) enters parent email "parent@example.com"
    And clicks "Send Consent Request"
    Then a parental_consent_request is created with:
      - student_id = signed-in student
      - parent_email = "parent@example.com"
      - status = "pending"
      - created_at = current timestamp
      - expires_at = current timestamp + 30 days
    And a consent request email is queued (not sent immediately in Sprint 1)
    And the student sees "Parental consent request created. We'll send an email to your parent."
    And the student is shown a "Waiting for parental consent..." screen
    And they cannot proceed to subject selection until consent is granted

  Scenario: Age gate state is persisted across page refreshes
    Given a student has entered their DOB and parent email
    When they refresh the page
    Then the age gate remembers their previous inputs
    And they see the "Waiting for consent..." state
    And the parental_consent_request record is unchanged
