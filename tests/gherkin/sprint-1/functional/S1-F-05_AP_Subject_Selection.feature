# Automation Mapping:
# - Given: User is 18+ or has parental consent, on subject selection screen
# - When: User selects AP subjects from list
# - Then: Subject selections saved to user_ap_subjects table, SIP initialized
# Unit tests: __tests__/components/subject-selection.test.ts
# Integration: tests/integration/supabase/subject-selection.test.ts
# E2E: tests/e2e/onboarding-flow.spec.ts (Playwright)

Feature: AP Subject Selection
  As a student
  I want to select which AP subjects I'm taking
  So that AceOS personalizes my study plan and recommendations

  Background:
    Given the student has completed age gate and/or parental consent
    And they are on the subject selection screen
    And the following 6 subjects are available:
      | Subject |
      | AP Chemistry |
      | AP Biology |
      | AP US History |
      | AP World History |
      | AP English Language |
      | AP Calculus AB |

  Scenario: Student selects one AP subject
    When the student clicks "AP Chemistry"
    And clicks "Continue"
    Then "AP Chemistry" is marked as selected (checkmark visible)
    And they are redirected to the dashboard
    And a user_ap_subjects record is created with ap_subject_id for AP Chemistry
    And the SIP (Student Intelligence Profile) is initialized for AP Chemistry
    And a welcome message appears "Great! You've selected AP Chemistry. Ready to improve your score?"

  Scenario: Student selects multiple AP subjects
    When the student clicks "AP Chemistry"
    And clicks "AP Biology"
    And clicks "AP Calculus AB"
    And clicks "Continue"
    Then all three subjects are marked selected
    And the dashboard shows all three subjects
    And separate SIP records are initialized for each subject
    And the daily queue starts with questions from all three subjects

  Scenario: At least one subject must be selected
    When the student clicks "Continue" without selecting any subject
    Then the button is disabled (grayed out)
    And a message appears "Please select at least one AP subject"

  Scenario: Student can deselect a subject before confirming
    When the student clicks "AP Chemistry" (selecting it)
    And then clicks "AP Chemistry" again (deselecting it)
    Then the checkmark disappears
    And the subject is no longer selected
    And they can continue to the next step

  Scenario: Subject selection is persisted in Supabase
    Given a student has selected "AP US History" and "AP World History"
    When they refresh the page
    Then both subjects remain selected
    And the SIP data for both subjects is intact
    And they can proceed to the dashboard

  Scenario: Student can change subjects later from dashboard settings
    Given a student has selected "AP Chemistry"
    And they access the dashboard
    When they navigate to Settings → AP Subjects
    And add "AP Biology"
    Then "AP Biology" is added to their subject list
    And a new SIP record is initialized for AP Biology
    And the daily study queue includes questions from both subjects

  Scenario: Subject list is FERPA-compliant and encrypted
    When a student's subject selections are stored in Supabase
    Then the user_ap_subjects table has RLS policies enforced
    And students can only see their own selected subjects
    And parents can see their child's subjects only with explicit consent
    And the subject data is not sent to any AI provider unencrypted
