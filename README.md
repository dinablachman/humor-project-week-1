# Humor project

A Next.js 16 app backed by Supabase. Anyone can browse the movie list on the home page. Signing in with Google creates a profile row, asks for a first and last name, and unlocks the members-only `/dashboard` and `/profile` pages.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the two values from Supabase > Project Settings > API
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How auth works

1. `/login` has one button. Its Server Action (`src/app/actions/auth.ts`) calls `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: "<origin>/auth/callback" })` and redirects the browser to Google.
2. Google sends the user to Supabase, Supabase sends them to `/auth/callback?code=...`.
3. `src/app/auth/callback/route.ts` exchanges the code for a session (PKCE) and writes the auth cookies. If the profile has no first or last name yet it redirects to `/onboarding`, otherwise to `/dashboard`.
4. `src/proxy.ts` runs on every request. It refreshes expired tokens and redirects anonymous visitors away from `/dashboard`, `/profile`, and `/onboarding`.
5. Pages and Server Actions call `requireUser()` or `requireCompleteProfile()` from `src/lib/auth.ts`, so the proxy is a fast path, not the only check.

## One-time setup

Everything below happens in dashboards and only needs doing once. The order matters.

### 1. Database: profiles table, trigger, and avatar bucket

In the Supabase dashboard open SQL Editor, paste the whole of `supabase/profiles.sql`, and run it. It creates:

- `public.profiles` with nullable `first_name`, `last_name`, `avatar_url`, and `favorite_movie`.
- A trigger on `auth.users` that inserts a profile row the first time someone signs in.
- Row level security policies so a user can only read or edit their own row.
- A public Storage bucket called `avatars` with policies that let each user write only inside their own folder.

The script is idempotent, so running it twice is harmless. Movies live in `supabase/movies.sql` from the previous assignment.

### 2. Google: create an OAuth client

1. Go to [console.cloud.google.com](https://console.cloud.google.com), pick or create a project.
2. Google Auth Platform (or APIs & Services) > OAuth consent screen. Choose External, give the app a name and your email. While the app is in Testing mode, add yourself under Test users.
3. Credentials > Create credentials > OAuth client ID > Web application.
4. Under Authorized redirect URIs add exactly one entry, Supabase's callback:

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   The project ref is the first part of `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the Client ID and Client secret.

### 3. Supabase: turn on the Google provider

1. Dashboard > Authentication > Sign In / Providers > Google. Switch it on, paste the Client ID and Client secret, save.
2. Dashboard > Authentication > URL Configuration.
   - Site URL: your production URL, for example `https://your-app.vercel.app`.
   - Redirect URLs: add every place the app runs, each ending in `/auth/callback`:

     ```
     http://localhost:3000/auth/callback
     https://your-app.vercel.app/auth/callback
     https://*-your-vercel-team.vercel.app/auth/callback
     ```

     The wildcard line covers Vercel preview deployments.

Two different "redirect" settings are involved and they are easy to mix up. Google gets Supabase's `/auth/v1/callback`. Supabase's allow list gets the app's `/auth/callback`.

### 4. Vercel

- The existing project keeps working; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only environment variables.
- Settings > Deployment Protection: turn it off so the site opens in an incognito window.
- Each push to `main` deploys. Submit the commit-specific deployment URL from the Deployments tab.

## Project layout

```
src/
  proxy.ts                      route protection + token refresh
  lib/
    auth.ts                     data access layer: getCurrentUser, requireUser, ...
    types.ts                    Movie and Profile types
    supabase/
      client.ts                 browser client (Client Components)
      server.ts                 server client (Server Components, Actions, Route Handlers)
      proxy.ts                  updateSession() used by src/proxy.ts
  app/
    page.tsx                    movies list + gated members card
    login/page.tsx              Google sign-in
    auth/callback/route.ts      finishes the OAuth flow
    onboarding/page.tsx         asks for first/last name after first login
    dashboard/page.tsx          members-only route
    profile/page.tsx            edit names, favorite movie, upload a photo
    actions/auth.ts             signInWithGoogle, signOut
    actions/profile.ts          completeOnboarding, updateProfile, setAvatar, removeAvatar
  components/                   header, forms, avatar uploader
supabase/
  movies.sql                    assignment 2
  profiles.sql                  assignment 3 (this one)
```

Avatar images never touch the database. The browser uploads straight to the `avatars` bucket at `<user id>/<timestamp>.<ext>`, then a Server Action stores the public URL on the profile and deletes the previous file.
