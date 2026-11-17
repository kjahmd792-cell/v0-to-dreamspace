<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Pharmacy writes (profile save, order create, order cancel) go through SECURITY DEFINER SQL functions called from `src/lib/pharmacy.functions.ts`; pharmacy tables only grant SELECT to signed-in users. Why: stock reservation must be atomic and users must not edit stock or totals directly.
- New pharmacy accounts get their catalog copied from `public.pharmacy_catalog_seed`. Why: preserves the original per-account catalog behavior without client-supplied products.
- Company-workspace tables and `legacy_user_map` are server-only (RLS on, no policies). Why: they hold imported records from the original platform and the company UI is still a browser-only demo.
- Imported users get accounts without passwords and claim them via the forgot-password email flow. Why: old password hashes are never migrated; email ownership is proven by the reset link.
- The company/driver/pharmacy demo views (`WholesaleApp`) keep all state in memory and the delivery OTP in localStorage, as in the source. Why: they are a sales demo, not persisted features.
- App styling is plain CSS classes in `src/wholesale.css` imported by `src/styles.css`; shadcn tokens in `src/styles.css` mirror that palette. Why: keeps visual parity with the original app.
