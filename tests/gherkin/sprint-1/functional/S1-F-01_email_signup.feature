# Story: S1-F-01 — Email Sign-Up
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/auth/signup.spec.ts → SignupPage.validEmailSignup()
# Scenario 2 → tests/integration/api/auth.test.ts → 'POST /api/auth/signup duplicate email'
# Scenario 3 → tests/e2e/auth/signup.spec.ts → SignupPage.weakPasswordRejected()
# Scenario 4 → tests/e2e/auth/signup.spec.ts → SignupPage.missingFieldBlocksSubmit()
# Scenario 5 → tests/e2e/auth/signup.spec.ts → SignupPage.invalidDobRejected()
# Scenario 6 → tests/integration/db/profiles.test.ts → 'profiles row created on signup'

Feature: Email Sign-Up
  As a prospective student
  I want to create an AceOS account using my email address and password
  So that I can access the platform without needing a Google account

  Background:
    Given the signup page is loaded at /signup
    And no existing account exists for the test email

  Scenario: Valid registration creates account and sends verification email
    Given a user enters first name "Alex", last name "Smith"
    And they enter email "alex@test.com"
    And they enter password "Password1"
    And they enter date of birth 17 years ago
    And they check the Terms and Privacy Policy checkbox
    When they click Create Account
    Then a new auth.users record is created
    And a profiles record exists with matching id and email
    And an email verification email is sent to "alex@test.com"
    And the user sees the "Check your email" screen

  Scenario: Duplicate email is rejected with inline error
    Given an account already exists for "existing@test.com"
    When a user submits the signup form with email "existing@test.com"
    Then the form shows the error "An account with this email already exists. Sign in instead?"
    And no new auth.users record is created

  Scenario: Password shorter than 8 characters is rejected
    Given a user enters password "Pass1"
    When they submit the signup form
    Then the password field shows a validation error
    And the form does not submit

  Scenario: Password missing uppercase letter is rejected
    Given a user enters password "password1"
    When they submit the signup form
    Then the password field shows a validation error about uppercase requirement
    And the form does not submit

  Scenario: Missing required field blocks form submission
    Given a user leaves the email field empty
    When they attempt to submit the signup form
    Then the email field is highlighted with an inline error
    And the form does not submit
    And no account is created

  Scenario: Future date of birth is rejected
    Given a user enters a date of birth that is in the future
    When they submit the signup form
    Then the DOB field shows "Please enter a valid date of birth"
    And the form does not submit

  Scenario: profiles row is created with correct data after valid signup
    Given a user successfully completes signup with email "newstudent@test.com"
    When the account is created
    Then a profiles row exists with the Supabase auth UID as the primary key
    And profiles.email = "newstudent@test.com"
    And profiles.email is not null
    And RLS permits only that student's own JWT to read the row
    And any other user's JWT returns zero rows for that profile id
