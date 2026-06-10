# Automation Mapping:
# - Given: Product architecture finalized, legal review inputs
# - When: FERPA compliance audit and Content Creation Protocol finalized
# - Then: Documentation complete, SME contractors onboarded, legal sign-off obtained
# Unit tests: tests/unit/ferpa-compliance.test.ts (verify encryption config)
# Integration: tests/integration/ferpa-audit.test.ts (verify data handling)
# Note: This is a technical story without automated tests; verification is manual + code review

Feature: FERPA Compliance & Content Creation Protocol
  As a legal/compliance team member
  I want to ensure all student data handling is FERPA-compliant
  And all content is original (not templated from released AP exams)
  So that AceOS operates legally and ethically

  Background:
    Given an education law attorney is reviewing the product
    And the FERPA requirements are known:
      - Student education records require parental consent for students <18
      - PII (grades, scores, behavioral data) must be encrypted at rest
      - No PII is sent to third-party AI providers without explicit data processing agreements
      - Schools that partner with AceOS must have a Data Processing Agreement (DPA)
    And College Board's copyright policies are known:
      - Released AP exam questions cannot be reproduced
      - CEDs (Course and Exam Descriptions) can be used as structural reference only
      - Content must be original, written from scratch by SME authors
      - No AI-generated questions without full SME rewrite by a human

  Scenario: Privacy Policy is lawyer-reviewed and published
    When the Privacy Policy is written
    Then it must explicitly state:
      - "AceOS collects student grades and academic performance data."
      - "Parental consent is required for students under 18 before any grade data is stored."
      - "Student data is encrypted at rest and never shared with third parties without consent."
      - "Students and parents can request data deletion at any time."
      - "Audit logs track all access to sensitive student data."
    And the policy is reviewed by an education law attorney
    And the policy is published at /privacy-policy
    And the policy is linked on the login page and in onboarding

  Scenario: Terms of Service define acceptable use and data rights
    When the Terms of Service are written
    Then they must include:
      - "AceOS is for educational purposes only. Students or parents must be the data subjects."
      - "Automated data collection (e.g., via web scraping) is prohibited."
      - "AceOS may use de-identified aggregate data for product improvement."
      - "Students and parents retain ownership of their educational records."
    And the ToS are reviewed by an education law attorney
    And acceptance of ToS is required during signup (checkbox before final submission)

  Scenario: Parental Consent form is compliant and trackable
    When the Parental Consent workflow is implemented
    Then:
      - Parents receive an email with a unique consent link (time-limited, 30 days)
      - The consent form explicitly states what data will be collected (grades, mastery scores, study patterns)
      - The form states that consent can be revoked at any time
      - Consents are recorded with timestamp and parent email in parental_consent_requests table
      - Consent status is readable in the SIP dashboard and queryable via RLS

  Scenario: Data Processing Agreement (DPA) template is finalized
    When schools will be onboarded (Phase 4+)
    Then a DPA template exists that defines:
      - What student data AceOS will collect
      - How data is encrypted and protected
      - Vendor responsibilities (AceOS) vs. school responsibilities
      - Data retention and deletion policies (default: delete after student graduates)
      - Audit rights for schools
      - Breach notification procedures (72 hours)
    And the DPA is reviewed by legal counsel
    And the DPA is stored in /docs/legal/dpa-template.md

  Scenario: PII Encryption is implemented and verified
    When student PII fields are defined (email, name, DOB)
    Then:
      - All PII is encrypted using Supabase Vault or pgcrypto
      - Encryption keys are stored in environment variables, never in code
      - Encrypted data is verified in production database via SQL query
      - Only the authenticated user and their consented parents can decrypt and view PII
      - RLS policies enforce this at the database level

  Scenario: AI Data Isolation - no PII sent to AI providers
    When any AI call is made (GPT-4o, Groq, etc.)
    Then:
      - AI prompts contain NO student names, emails, or specific grades
      - AI prompts include only: question text, student response, rubric
      - AI responses are evaluated for any leaked PII before being shown to students
      - Logs never include AI prompts that contain PII
      - All AI calls are documented in a request/response audit log

  Scenario: Content Creation Protocol is defined and signed by SMEs
    When SME contractors are hired to write AP practice questions
    Then they receive and must sign a Content Creation Protocol that states:
      - "No released AP exam question can be used as a direct template or inspiration."
      - "All questions must be original, written from scratch by the SME author."
      - "Authorized reference materials: College Board CED (Course and Exam Description) for structure only (units, skills, point distribution)."
      - "Prohibited materials: Released AP exam questions, released FRQ prompts, released DBQ document sets."
      - "AI-generated question drafts may be used as a starting point, but must be fully rewritten by the SME before use."
      - "Each question draft is tagged with: author name, creation date, source materials referenced."
      - "All SMEs must pass an IP/copyright training before starting work."
    And the Protocol is kept on file with each SME's signed agreement

  Scenario: Audit logging is enabled for all sensitive operations
    When the product is deployed
    Then audit_logs table is populated on these events:
      - User signup
      - Parental consent request sent
      - Parental consent approved/rejected
      - AP subject selected or changed
      - SIP record created or updated
      - FRQ graded
      - Data export requested or completed
      - User account deleted
    And audit logs include: timestamp, user_id, action, ip_address, details (encrypted)
    And audit logs are retained for 7 years (regulatory requirement)

  Scenario: Legal review of entire compliance stack before launch
    When Sprint 1 is complete
    Then an education law attorney performs a final review covering:
      - Privacy Policy & ToS language
      - Parental Consent workflow and implementation
      - PII encryption verification (SQL audit)
      - AI data isolation verification (code review of gateway.ts)
      - Content Creation Protocol and SME agreements
      - Audit logging implementation
      - FERPA requirements checklist (all items green)
    And the attorney provides written sign-off: "AceOS is compliant with FERPA and children's privacy laws as of [date]."
    And this sign-off is filed and referenced in launch communications
