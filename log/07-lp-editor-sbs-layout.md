# 07 — Side-by-side preview + agent, history arrows, tags dialog

## Planned

- Place campaign agent chat **side-by-side** with the live preview (stack on small screens).
- Replace the History tab with **undo/redo** controls that jump to older/newer stored snapshots.
- Move tags & webhooks into a **settings icon** that opens a **modal** instead of a tab.

## Done

- **`src/app/app/lp/[id]/lp-editor.tsx`**: Removed `Tabs`. Added a responsive **grid** (`lg`: preview left, agent right ~300–420px). Header toolbar: grouped **Undo2 / Redo2** (revert to nearest lower/higher `LandingPageVersion` vs `currentVersion`), **Settings2** opens dialog. **Save** in dialog PATCHes tracking and closes on success.
- **`src/components/ui/dialog.tsx`**: Radix dialog wrapper (overlay, content, header/title/description).
- **`src/components/app/agent-chat.tsx`**: Optional **`className`**; card uses **`h-full`** + flexible **`ScrollArea`** on large screens for the side panel.

## Notes

- Undo/redo call the same **`POST /api/lp/[id]/versions`** revert as before (no confirm dialog). After revert to an older version, **newer snapshots may be deleted** server-side, so redo can disappear—same as prior History tab behavior.
