# Supabase setup — Phase 1 (auth + user profile + credits schema)

Follow these steps once. Total time: ~20–30 minutes including Google OAuth.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → sign up / log in.
2. **New project** → name it `optimus-ai` (or similar).
3. Pick a database password (save it somewhere — you won't need it for the app itself but it's useful for direct DB access).
4. Pick the region closest to your users.
5. Wait ~1 min for the project to provision.

---

## 2. Grab your API keys

1. In the Supabase dashboard → **Settings → API**.
2. Copy these two values:
   - **Project URL** (e.g. `https://xxxxxxxxxxx.supabase.co`)
   - **anon public** key (the long string starting with `eyJ...`) — NOT the `service_role` key

---

## 3. Add the keys to Vercel

1. Vercel dashboard → your `optimus-ai` project → **Settings → Environment Variables**.
2. Add two new variables (available in all environments):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | (paste your Project URL) |
   | `VITE_SUPABASE_ANON_KEY` | (paste your anon public key) |

3. Trigger a redeploy (push any commit, or in Vercel use **Deployments → … → Redeploy**).

---

## 4. Create the database schema

1. In Supabase → **SQL Editor → New query**.
2. Open `supabase/migrations/001_initial_schema.sql` from this repo.
3. Copy the entire contents → paste into the SQL editor → **Run**.
4. You should see success messages for each CREATE TABLE / CREATE POLICY / CREATE FUNCTION.

What this creates:
- `profiles` — app-side user details
- `credits` — per-user balance; new users get **1 trial credit** automatically
- `subscriptions` — Stripe subscription state (populated in Phase 2)
- `saved_videos`, `saved_scripts`, `watchlist` — user-scoped content (we migrate localStorage into these in Phase 2)
- Row-level-security policies so users can only read/write their own rows
- A trigger that runs `handle_new_user()` on every signup
- A `spend_credit()` RPC the backend will call before each paid AI action

---

## 5. Enable Google sign-in

1. Supabase dashboard → **Authentication → Providers → Google**.
2. Toggle **Enable Google provider** on.
3. You'll need a Google OAuth Client ID + Secret — get one from <https://console.cloud.google.com>:
   - Create a new project (or use an existing one).
   - **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Add the **Authorized redirect URI** shown in the Supabase Google provider panel (looks like `https://xxxxx.supabase.co/auth/v1/callback`).
4. Paste the Client ID + Secret back into Supabase's Google provider settings → **Save**.

---

## 6. Enable Apple sign-in (optional, do when ready)

Apple requires an Apple Developer Program membership ($99/yr). Skip this until you're ready to ship to App Store — magic link + Google cover you for now.

When ready:
1. Supabase → **Authentication → Providers → Apple**.
2. Follow the link in the provider panel to configure Sign in with Apple in your Apple Developer account.
3. Paste the generated JWT into Supabase → **Save**.

(Apple's Sign in with Apple setup is finicky — budget 45 min the first time.)

---

## 7. Configure the magic link email template (optional)

Supabase's default template is fine but generic. To polish it:

1. **Authentication → Email Templates → Magic Link**.
2. Customise the subject / body — swap "Supabase" for "Optimus.AI" and tweak copy.

---

## 8. Test it

After the redeploy:

1. Open the app — you should see the **Sign in to continue** page.
2. Enter an email → **Send magic link**.
3. Check your inbox → click the link → you should land back in the app signed in.
4. Go to **My Account** → your email should appear at the top, with a **Sign out** button.
5. Back in Supabase → **Database → Tables → credits** — you should see a row for your new user with `balance = 1`.

If any of those fail, check:
- Vercel → latest deployment → Function logs for auth errors.
- Supabase → **Authentication → Users** — does your user appear?
- Browser console for Supabase client errors.

---

## What's next (Phase 2)

Once Phase 1 is solid, we wire:
- `/api/remix-script` and `/api/generate-script` to call `spend_credit()` before each Claude call (return 402 "out of credits" if balance is 0).
- Stripe checkout from the My Account page (subscription tiers + credit top-up).
- Stripe webhook → updates `subscriptions` and tops up `credits.balance` monthly.
- Out-of-credits modal with upgrade CTA.
- localStorage → Supabase migration for saved scripts / videos / watchlist so users see their data across devices.
