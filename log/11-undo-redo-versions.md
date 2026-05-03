# 11 — Redo after undo (keep forward snapshots)

## Problem

`POST /api/lp/[id]/versions` (revert) **deleted** all `LandingPageVersion` rows with `version > target`, so the redo stack was destroyed and the editor could not move forward again.

## Done

- **`versions/route.ts`**: Removed `deleteMany` for `version > v` on revert. Navigating to an older snapshot no longer erases newer rows.
- **`/api/chat` + `PATCH /api/lp/[id]`** (content save): Before archiving the current state, **delete** rows with `version > currentVersion` so a new save after an undo does not hit `@@unique([landingPageId, version])` (replaces the old “forward branch” with a new linear history, same as git).

## Note

If the user **undos** and then **saves** (agent or editor), newer snapshot rows are removed as part of that save—redo to the *pre-undo* branch is no longer possible for those versions (expected “branch cut”).

## Update — redo still empty (`nextVersion`)

The **live** draft only lived on `LandingPage`; there was often **no** `LandingPageVersion` row with `version === currentVersion`, so after undo there was **no** snapshot with `version > current` for the UI. **`versions/route` POST** now **materializes** the current head (replace row `version === currentVersion`) **before** loading the target snapshot — see **`src/app/api/lp/[id]/versions/route.ts`**.
