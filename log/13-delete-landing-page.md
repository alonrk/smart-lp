# 13 — Delete landing page (UI + API)

## Planned

- Expose deletion in the product; `DELETE /api/lp/[id]` already existed but returned 200 even when nothing was deleted.

## Done

- **`src/app/api/lp/[id]/route.ts`**: `DELETE` returns **404** when no row was removed (wrong id / not owner).
- **`src/app/app/delete-lp-action.ts`**: Server action **`deleteLandingPage(id)`** with auth + `revalidatePath("/app")`.
- **`src/components/app/delete-lp-button.tsx`**: Trash control on the dashboard list with confirm + pending state.
- **`src/app/app/page.tsx`**: Per-card delete button beside each LP link.
- **`src/app/app/lp/[id]/lp-editor.tsx`**: **Delete** button (destructive style) → `fetch` `DELETE` → `router.push("/app")` + `refresh`.

Prisma cascades **`LandingPageVersion`** when the parent **`LandingPage`** is removed.
