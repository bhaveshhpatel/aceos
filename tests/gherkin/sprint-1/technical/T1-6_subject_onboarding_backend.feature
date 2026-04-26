# Story: TS1-06 — Subject Selection Backend & SIP Initialization
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Integration (primary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/integration/api/onboarding.test.ts → 'POST /api/onboarding/subjects saves subjects to profile'
# Scenario 2 → tests/integration/api/onboarding.test.ts → 'SIP mastery_map initialized with subject keys'
# Scenario 3 → tests/integration/api/onboarding.test.ts → 'rejects subjects not in allowed list'
# Scenario 4 → tests/integration/api/onboarding.test.ts → 'requires at least 1 subject'
# Scenario 5 → tests/integration/api/onboarding.test.ts → 'caps subjects at maximum allowed'

Feature: Subject Selection Backend & SIP Initialization
  As the platform
  I need to persist a student's subject choices and initialize their SIP
  So that all downstream features have a structured baseline to work from

  Background:
    Given a verified student "student-a" with a valid session
    And the allowed AP subjects list is defined in config

  Scenario: Subject selection saves ap_subjects array to student_profiles
    Given student-a sends a POST to "/api/onboarding/subjects" with ["AP US History", "AP Chemistry"]
    When the request is processed
    Then the response status is 200
    And the student_profiles row for student-a has ap_subjects = ["AP US History", "AP Chemistry"]

  Scenario: SIP mastery_map is initialized with a key per selected subject
    Given student-a selects ["AP US History", "AP Chemistry"]
    When the onboarding subject save completes
    Then mastery_map in student_profiles contains a key "AP US History"
    And mastery_map contains a key "AP Chemistry"
    And each subject key has value {} (empty object awaiting diagnostic)

  Scenario: Subject selection rejects subjects not in the allowed list
    Given student-a sends ["AP US History", "AP Underwater Basket Weaving"]
    When the POST request is processed
    Then the response status is 400
    And the response body contains error code "VALIDATION_ERROR"
    And the invalid subject name is identified in the error details

  Scenario: Subject selection requires at least one subject
    Given student-a sends an empty array []
    When the POST request is processed
    Then the response status is 400
    And the error details state a minimum of 1 subject is required

  Scenario: Subject selection enforces a maximum of 6 subjects
    Given student-a sends 7 subjects
    When the POST request is processed
    Then the response status is 400
    And the error details state a maximum of 6 subjects is allowed
