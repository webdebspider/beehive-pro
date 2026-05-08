# Changelog

All notable changes to **Beehive Pro+** are documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
where applicable. Entries are written in plain English from the user's
perspective so non-developers (beta testers, future-you, etc.) can read
them and understand what changed.

<!--
  ════════════════════════════════════════════════════════════════════════
  HOW TO MAINTAIN THIS FILE — A NOTE FROM PAST-DEB TO FUTURE-DEB
  ════════════════════════════════════════════════════════════════════════

  Whenever you finish a batch of changes (typically right before an EAS
  build), add a new section ABOVE the most recent entry. The newest
  entry always goes at the top.

  ────────────────────────────────────────────────────────────────────────
  STEP 1 — Section header
  ────────────────────────────────────────────────────────────────────────

  Format:
    ## [version-or-status] - YYYY-MM-DD

  Examples:
    ## [Unreleased] - 2026-05-06        ← still working on it, no build yet
    ## [1.0.0-beta.5] - 2026-05-08      ← shipped as beta build #5
    ## [1.0.0] - 2026-06-01             ← first official release
    ## [1.1.0] - 2026-07-15             ← new features added after 1.0
    ## [1.1.1] - 2026-07-20             ← bug fix on 1.1.0

  Versioning cheat sheet (semantic versioning):
    MAJOR.MINOR.PATCH
    MAJOR  = big breaking change (user has to do something different)
    MINOR  = new feature added, but old stuff still works
    PATCH  = bug fix, no new features

  ────────────────────────────────────────────────────────────────────────
  STEP 2 — Group changes under one or more of these headers
  ────────────────────────────────────────────────────────────────────────

  Use ONLY the headers that apply. Skip ones with no entries.

    ### Added       → New features the user can now do
    ### Changed     → Existing features that work differently now
    ### Deprecated  → Features marked for future removal (warn early)
    ### Removed     → Features that no longer exist
    ### Fixed       → Bug fixes
    ### Security    → Security-related changes (privacy, auth, encryption)

  ────────────────────────────────────────────────────────────────────────
  STEP 3 — Write each entry in past-tense, user-focused language
  ────────────────────────────────────────────────────────────────────────

  Good entries describe what the user can now see/do/avoid:
    ✅ "Added satellite map toggle on forage map screen"
    ✅ "Fixed crash when opening hive details with no inspections logged"
    ✅ "Changed inspection date picker to default to today"

  Bad entries describe internal implementation:
    ❌ "Refactored useEffect dependency array in HiveDetails.tsx"
    ❌ "Bumped firebase package to 11.2.1"
    ❌ "Renamed handleSubmit to handleHiveSubmit"

  Internal cleanup is fine to mention but keep it brief — beta testers
  don't care, but future-you might want to know.

  ────────────────────────────────────────────────────────────────────────
  STEP 4 — When you ship an actual EAS build, update the version
  ────────────────────────────────────────────────────────────────────────

  Change the [Unreleased] header to the actual version you're building.
  Then start a new [Unreleased] section above it for the NEXT batch.

  ────────────────────────────────────────────────────────────────────────
  STEP 5 — Commit the changelog with the rest of your batch
  ────────────────────────────────────────────────────────────────────────

  Suggested commit message:
    docs: update changelog for v1.0.0-beta.5

  ════════════════════════════════════════════════════════════════════════
-->

---

## [Unreleased] - 2026-05-06

### Added

- **Global hive registration coverage** expanded to 30+ countries.
  New regions include:
  - **Latin America:** Mexico, Argentina, Brazil, Chile, Uruguay
  - **Asia:** China, India, Japan, South Korea, Turkey
  - **Middle East:** Israel, Egypt
  - **Eastern Europe / Eurasia:** Russia, Ukraine
  - **Africa:** Kenya, Ethiopia, Tanzania (in addition to existing South Africa)
  - **Europe (additional):** Austria, Czech Republic, Denmark, Finland,
    Greece, Hungary, Norway, Poland, Portugal, Romania, Slovakia,
    Slovenia, Sweden
  - **Canada (additional):** Newfoundland and Labrador, Prince Edward Island
- **New `utils/registrationLinks.ts` module.** Registration data now lives
  separately from the UI, so registration URLs and requirements can be
  updated without touching screen code.
- **Satellite / hybrid map toggle** on the forage map screen, for users
  who prefer aerial imagery over standard road maps when planning forage
  zones.
- **X close button** at the top of the "Add Item" modal on the supplies
  screen, for easier one-handed dismissal.

### Changed

- **Health log "Log" button** moved to the bottom of the screen and
  expanded to full width, for better thumb reach on phones.

---

<!--
  ════════════════════════════════════════════════════════════════════════
  EARLIER HISTORY (pre-changelog)
  ════════════════════════════════════════════════════════════════════════

  Builds prior to 2026-05-06 are documented in git commit history only.

  To browse:
    - Run: git log --oneline --all
    - Or visit: https://github.com/webdebspider/beehive-pro/commits/main

  This changelog starts fresh as of 2026-05-06 because the project moved
  fast in its early days and reconstructing precise per-build entries
  would be unreliable. Going forward, every batch of changes gets a
  proper changelog entry.
-->

## Earlier history

Builds prior to 2026-05-06 are documented in **git commit history only**.
To browse them, run `git log --oneline --all` from the repo root, or
visit the [GitHub commits page](https://github.com/webdebspider/beehive-pro/commits/main).

This changelog starts fresh as of **2026-05-06**. The project moved
quickly in its first week, and reconstructing every change retroactively
would be guesswork. From this date forward, every batch of changes gets
its own proper entry above.
