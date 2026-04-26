/**
 * flags.config.ts
 * Feature flag configuration.
 * Application code calls lib/providers/flags — never reads env vars for flags directly.
 *
 * Add new flags here as the suite expands.
 */
export const flagsConfig = {
  provider: (process.env.FLAGS_PROVIDER ?? 'env') as 'env' | 'posthog' | 'launchdarkly',

  flags: {
    // Phase 1 — ScoreBoost AP
    scoreBoostAp:         process.env.FLAG_SCORE_BOOST_AP          !== 'false',
    googleOAuth:          process.env.FLAG_GOOGLE_OAUTH             !== 'false',
    parentalConsent:      process.env.FLAG_PARENTAL_CONSENT         !== 'false',

    // Phase 2 — GradeGuard (disabled until Phase 2)
    gradeGuard:           process.env.FLAG_GRADE_GUARD              === 'true',

    // Phase 3 — StudySensei (disabled until Phase 3)
    studySensei:          process.env.FLAG_STUDY_SENSEI             === 'true',

    // Phase 4 — SmartPack (disabled until Phase 4)
    smartPack:            process.env.FLAG_SMART_PACK               === 'true',
    cleverSso:            process.env.FLAG_CLEVER_SSO               === 'true',
  },
} as const;

export type FeatureFlag = keyof typeof flagsConfig.flags;
