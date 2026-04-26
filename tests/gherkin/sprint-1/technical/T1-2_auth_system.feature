# Story: TS1-02 — Auth System (Supabase Auth)
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Integration (primary) + E2E smoke
# Story Source: docs/phase-1/epic-1/Sprint_1_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/integration/api/auth.test.ts → 'POST /api/auth/signup creates user and profile'
# Scenario 2 → tests/integration/api/auth.test.ts → 'getUser() used not getSession()'
# Scenario 3 → tests/integration/api/auth.test.ts → 'unauthenticated request to protected route returns 401'
# Scenario 4 → tests/integration/api/auth.test.ts → 'Google OAuth creates student_profiles row'
# Scenario 5 → tests/unit/auth/guards.test.ts → 'auth guard redirects unauthenticated users'

Feature: Authentication System
  As a student
  I need a secure authentication system
  So that my session is verified server-side on every protected request

  Background:
    Given the test Supabase auth instance is clean

  Scenario: Email signup creates both auth.users and student_profiles rows atomically
    Given a valid signup payload with email "newstudent@test.com" and password "SecurePass123!"
    When a POST request is sent to "/api/auth/signup"
    Then the response status is 201
    And a row exists in auth.users with email "newstudent@test.com"
    And a corresponding row exists in student_profiles with the same id

  Scenario: Protected API routes use getUser() not getSession() for auth verification
    Given the server-side auth check implementation
    When the auth check code is statically analysed for any route under app/api/
    Then no route calls supabase.auth.getSession() to validate identity
    And all routes call supabase.auth.getUser() when checking authentication

  Scenario: Unauthenticated request to a protected route is rejected with 401
    Given no Authorization header or session cookie is present in the request
    When a GET request is sent to "/api/student/profile"
    Then the response status is 401
    And the response body contains error code "UNAUTHORIZED"
    And no student data is returned

  Scenario: Expired session is rejected and not silently served
    Given a request with an expired JWT token in the Authorization header
    When a GET request is sent to "/api/student/profile"
    Then the response status is 401
    And the response body contains error code "SESSION_EXPIRED"

  Scenario: Google OAuth signup creates a student_profiles row via database trigger
    Given a user completes Google OAuth and lands on the callback URL
    When the OAuth callback is processed and the user is created in auth.users
    Then a row exists in student_profiles for that user's id
    And the row has email matching the Google account email
