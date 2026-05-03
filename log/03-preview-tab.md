# 03 — Preview tab shows draft LP

## Planned

- Make generated landing page visible in the editor Preview tab without relying on the public URL.
- Refresh preview after the agent persists content.

## Done

- **`LpEditor`**: **Preview** is a section **above** the tabs (not inside Radix `TabsContent`), with a visible frame and `min-h`. Tabs default to **Agent**; Public URL only when published.
- **`AgentChat`**: `useChat({ maxSteps: 12, onFinish })` calls `onAssistantTurnComplete` → parent `load()` so preview/version list reload after each assistant turn (including tool saves).
- **`LpRenderer`**: optional `variant="embedded"` (no `min-h-screen` in editor); empty `sections` shows a clear placeholder instead of a blank strip.
- **Public URL** button only when `status === "published"`.

## Update — preview not visible in tab

- **Removed Preview as a Radix tab**; the draft **Preview** is a fixed **section above** the Agent / Tags / History tabs (avoids `TabsContent` + `hidden` / `forceMount` edge cases). Container has `min-h-[420px]`, border, and scroll.
- **LpRenderer** embedded: theme fallbacks for `background` / `fontFamily` / text color; `min-h-[400px]` on the root.

## Update — fake public URLs + empty-looking preview

- **`lpAgentSystem`**: Explicit rules—no invented “view it here” URLs; drafts live in the **Preview** frame above the chat; public links only after **Publish** in-app.
- **`saveOrUpdateLandingPage`**: `normalizeSavedLpContent` merges default sections when the model saves **`sections: []`** so the preview is never structurally empty; tool result includes `nextStepForAssistant` for the model.
- **`LpRenderer`**: Hero `<h1>` inherits body text color (`safeText`) instead of forcing `theme.text` (avoids white-on-white when theme colors clash).

## Update — LP “not always visible” (contrast + Shadcn Button)

- **`lib/lp-theme.ts`**: `resolveLpTheme()` enforces minimum contrast for body text vs background and avoids near-white **primary** (CTA) colors.
- **`LpRenderer`**: Uses resolved colors; hero/CTA use **plain `<a>` / `<button>`** with `backgroundColor` so Shadcn **`Button`** default (`bg-zinc-900`) cannot override theme fills; placeholders for empty headline / empty feature bullets.
- **`/api/chat`**: `applyResolvedTheme()` runs on every save so stored JSON matches readable colors.
