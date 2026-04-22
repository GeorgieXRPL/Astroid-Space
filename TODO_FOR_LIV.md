# Astroid - your TODO list

Hi. This is the "do this in order, you can't get it wrong" list for
launching the site. Each step is small. If a step says "wait", actually
wait - DNS is slow.

Time estimate from zero to live, doing one thing at a time: about 4 hours
(most of that is waiting for DNS to propagate).

---

## Stage 0 - things to have open

- The `Astroid/` folder in your code editor (Cursor).
- A terminal at the project root.
- A password manager (1Password / Bitwarden / Apple Passwords / anything
  that isn't a sticky note).
- A web browser.
- Your domain registrar login (wherever you bought `astroid.space`).

---

## Stage 1 - the email address (15 minutes + DNS wait)

You need `security@astroid.space` to work because it's published in
`/.well-known/security.txt`. The cheapest, cleanest option is
**Cloudflare Email Routing**. Free, no inbox limits, takes 10 minutes.

### 1.1 Move DNS to Cloudflare

1. Go to https://dash.cloudflare.com and sign up (free).
2. Click **Add a site**, type `astroid.space`, pick the **Free** plan.
3. Cloudflare will scan your existing DNS records and show you two
   nameservers like `liv.ns.cloudflare.com` and `bob.ns.cloudflare.com`.
   **Copy those.**
4. Log into wherever you bought `astroid.space`. Find the section called
   "Nameservers" or "DNS settings". Replace the existing nameservers
   with the two Cloudflare gave you. Save.
5. **Wait.** This is the slow part. It takes anywhere from 5 minutes to
   24 hours. Cloudflare will email you when it's done.

### 1.2 Set up the email forwarder

Once Cloudflare confirms your domain is active:

1. In the Cloudflare dashboard, click your domain → **Email** →
   **Email Routing** → **Get started**. Click **Add records and enable**.
2. Click **Destination addresses** → **Add destination address**. Type
   the email address you actually read (e.g. your Gmail). Cloudflare
   sends a verification email - click the link.
3. Click **Routing rules** → **Create address**:
   - Custom address: `security`
   - Action: **Send to an email**
   - Destination: pick your verified address
   - Save.
4. Repeat for: `hello`, `abuse`. (You don't have to, but it's nice.)
5. Toggle the **Catch-all address** to **Send to an email** so anything
   you forgot still reaches you.

### 1.3 Test it

Send an email from any other account to `security@astroid.space`. It
should arrive in your inbox within a minute. If it doesn't, give DNS
another hour and try again.

### 1.4 Add DMARC (so spammers can't fake your address)

In Cloudflare → **DNS** → **Records** → **Add record**:

- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=reject; rua=mailto:security@astroid.space; aspf=s; adkim=s`
- TTL: Auto
- Save.

You're done with email.

---

## Stage 2 - protect the domain itself (5 minutes)

These records tell the world "only these certificate authorities can
issue HTTPS certs for astroid.space, anyone else is lying."

In Cloudflare → **DNS** → **Records** → **Add record**, add THREE records:

| Type | Name        | Value                                                | Notes |
|------|-------------|------------------------------------------------------|-------|
| CAA  | `astroid.space` | Flags `0`, Tag `issue`, Value `letsencrypt.org`     | Allows Let's Encrypt |
| CAA  | `astroid.space` | Flags `0`, Tag `issue`, Value `pki.goog`            | Allows Google Trust (Vercel uses this) |
| CAA  | `astroid.space` | Flags `0`, Tag `iodef`, Value `mailto:security@astroid.space` | Email me if anyone tries to issue a cert outside this list |

### ⏸ DEFERRED - finish DNSSEC after launch

DNSSEC is two steps: enable signing at Cloudflare AND publish the DS record
at Namecheap (your registrar). The Cloudflare side is done; the Namecheap
side is blocked because the DNSSEC toggle is unavailable while using
external nameservers in the standard self-service UI.

**To finish later (15 min, any time after launch):**

1. Open https://namecheap.com → **Domain List** → **MANAGE** astroid.space
   → **Advanced DNS** tab → scroll to **DNSSEC**.
2. If the toggle is now clickable, fill in the form using these values
   from Cloudflare → **DNS** → **Settings** → **DNSSEC** → click **DS
   Record**:
   - Key Tag (number)
   - Algorithm: `13 - ECDSAP256SHA256`
   - Digest Type: `2 - SHA-256`
   - Digest: the long hex string
3. If the toggle is still locked, click the live-chat bubble (bottom-right
   of the Namecheap dashboard) and say:
   *"I want to add a DS record for astroid.space. Nameservers are at
   Cloudflare. Values: Key Tag X, Algorithm 13, Digest Type 2, Digest
   ABC..."*
   They add it manually within ~10 minutes.
4. Verify at https://dnssec-analyzer.verisignlabs.com → astroid.space.
   All four rows should be green.

**⚠ Once enabled, never switch nameservers without first turning DNSSEC
OFF at Namecheap and waiting 24h.** Otherwise your site goes dark for
everyone with DNSSEC-validating resolvers (most ISPs).

DNSSEC is defense-in-depth, not a launch blocker. The site is fully
secure without it. Most major sites don't run it.

---

## Stage 3 - generate your secret keys (2 minutes)

You need two random secrets. Open a terminal and run these one at a
time. Copy the output of each into your password manager **before
moving on**. If you lose them, you can regenerate, but live sessions
will all log out.

On Mac/Linux/Git Bash on Windows:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

On Windows PowerShell:

```powershell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

Label them in your password manager:
- **Astroid ADMIN_TOKEN** - first value
- **Astroid ADMIN_COOKIE_SECRET** - second value (must be DIFFERENT)

---

## Stage 4 - set up the database (Supabase, 20 minutes)

The site currently keeps everything in memory, which means the moment
the server restarts, every named star and wish disappears. We're going
to swap in Supabase (free Postgres database in the cloud).

### 4.1 Create a Supabase project

1. Go to https://supabase.com and sign up (free, GitHub login is
   easiest).
2. Click **New project**. Name it `astroid`. Pick a strong DB password
   (Supabase generates one - save it in your password manager labelled
   **Astroid SUPABASE DB PASSWORD**). Pick the region closest to where
   you'll deploy (probably `us-east-1` for Vercel default).
3. Wait ~2 minutes for the project to provision.

### 4.2 Run the schema

1. In the Supabase dashboard, left sidebar → **SQL Editor** → **New
   query**.
2. Open the file `supabase/schema.sql` from this repo. Copy its entire
   contents into the SQL editor. Click **Run**.
3. You should see "Success. No rows returned." Refresh the **Table
   Editor** in the left sidebar. You should see four tables: `stars`,
   `wishes`, `coloring_submissions`, `charity_nominations`, plus a
   `rejection_log` table.

### 4.3 Create the storage bucket for coloring images

1. Left sidebar → **Storage** → **New bucket**.
2. Name: `coloring`
3. **Public bucket**: ON (so the gallery can show them without auth)
4. File size limit: `2 MB`
5. Allowed MIME types: `image/png, image/jpeg, image/webp`
6. Create.

### 4.4 Grab your API keys

1. Left sidebar → **Project Settings** (gear icon) → **API Keys**
   (Supabase recently moved this from "API" to its own section).
2. Copy **two** values into your password manager:
   - **Astroid SUPABASE_URL** - the `Project URL` field (looks like
     `https://abcdefghij.supabase.co`).
   - **Astroid SUPABASE_SERVICE_ROLE_KEY** - the **Secret key** (starts
     with `sb_secret_...`). Click the eye / Reveal icon to see the full
     value. **Never paste this anywhere public - it bypasses all
     security rules. Treat it like the master password to your data.**

   You can ignore the **Publishable key** (`sb_publishable_...`). Our
   server-side code never uses it - only the secret key talks to
   Supabase, and the secret key bypasses RLS so we don't need a public
   one. (If you ever build a browser feature that hits Supabase
   directly, you'd grab the publishable key then.)

   > Naming note: Supabase recently renamed the keys. "Secret key"
   > replaced "service_role"; "Publishable key" replaced "anon". The
   > behavior is identical. Our env var stays named
   > `SUPABASE_SERVICE_ROLE_KEY` for clarity in the codebase, but its
   > value is the new `sb_secret_...` string.

---

## Stage 5 - deploy to Vercel (20 minutes)

### 5.1 Push the code to GitHub

If you haven't already:

```bash
cd "c:\Users\justa\OneDrive\Desktop\For Liv\Astroid"
git init
git add .
git commit -m "Initial Astroid"
```

Create a new GitHub repo (call it `astroid`, make it **private**), then:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/astroid.git
git branch -M main
git push -u origin main
```

### 5.2 Connect to Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New** → **Project** → import your `astroid` repo.
3. Framework: **Next.js** (auto-detected).
4. Click **Environment Variables** and add **all of these** (paste from
   password manager - make sure no trailing spaces):

   | Name                          | Value                                  |
   |-------------------------------|----------------------------------------|
   | `NEXT_PUBLIC_SITE_URL`        | `https://astroid.space`                |
   | `ADMIN_TOKEN`                 | (from stage 3)                         |
   | `ADMIN_COOKIE_SECRET`         | (from stage 3)                         |
   | `TRUSTED_PROXY`               | `1`                                    |
   | `SUPABASE_URL`                | (from stage 4.4)                       |
   | `SUPABASE_SERVICE_ROLE_KEY`   | (from stage 4.4)                       |
   | `STORAGE_BACKEND`             | `supabase`                             |

   For each one, scope to **Production** only (not Preview, not
   Development).

5. Click **Deploy**. First deploy takes ~3 minutes.

### 5.3 Hook up the domain

1. After deploy succeeds, go to **Project Settings** → **Domains**.
2. Add `astroid.space` and `www.astroid.space`.
3. Vercel shows you DNS records to add. Go back to Cloudflare → **DNS**
   → **Records** and add them. **Important**: set the proxy status
   (orange/grey cloud) to **DNS only** (grey cloud) for the records
   Vercel asks you to add. Vercel needs to see real client IPs.
4. Wait 2 minutes for SSL to issue.

### 5.4 Smoke test

In a fresh browser tab, visit each of these and confirm they load:

- https://astroid.space - front page with the 3D star field
- https://astroid.space/sky - sky page
- https://astroid.space/wishes - wish wall
- https://astroid.space/coloring - coloring studio
- https://astroid.space/charity - charity page
- https://astroid.space/.well-known/security.txt - your security contact
- https://astroid.space/robots.txt - should disallow `/admin`
- https://astroid.space/sitemap.xml - list of public pages
- https://astroid.space/admin - should show a login screen, NOT a
  dashboard

Try naming a star with a fake name like "Test Star". It should say
"queued for review". Then go to `/admin`, paste your `ADMIN_TOKEN`, and
you should see it in the queue. Approve it. Refresh `/sky` - your star
should now show.

---

## Stage 6 - turn on the safety nets (10 minutes)

### 6.1 Submit to HSTS preload (one-way decision - only do once you're sure)

This makes browsers refuse to ever load your site over plain HTTP. Once
you submit, removing yourself takes weeks.

1. Wait 7 days after launch to make sure nothing's broken.
2. Then visit https://hstspreload.org, enter `astroid.space`, follow
   the wizard.

### 6.2 Check your security grade

Visit each and you should get an A or A+:

- https://securityheaders.com/?q=astroid.space
- https://www.ssllabs.com/ssltest/analyze.html?d=astroid.space
- https://internet.nl/site/astroid.space

If anything's red, take a screenshot and ask me.

### 6.3 Bookmark these

- `https://astroid.space/admin` - moderation queue (check daily for
  the first month, then weekly)
- Cloudflare dashboard → Email Routing - see who's emailing you
- Supabase dashboard → Table Editor → `rejection_log` - see what
  the content filter caught
- Vercel dashboard → Logs - see runtime errors
- GitHub → Pull Requests - review Dependabot's weekly security
  patches and merge if CI is green

---

## Stage 7 - what to do every day / week / month

### Every day (first month, then weekly)

- Visit `/admin`, work through the queue. Reject anything weird, even
  if you can't say exactly why. The site is for kids.

### Every week

- Look at GitHub Pull Requests for Dependabot updates. If CI is green
  and the changelog looks fine, merge.
- Glance at Supabase usage in the dashboard. Free tier is 500MB DB +
  1GB storage - plenty for the first year.

### Every 90 days

- Regenerate `ADMIN_TOKEN`. Steps:
  1. Generate a new value (Stage 3 commands).
  2. Update it in Vercel → Project Settings → Environment Variables.
  3. Redeploy (Vercel → Deployments → click latest → Redeploy).
  4. All admin sessions log out. Log back in with the new token.

### When you change the rules

- Editing the content blocklist? `app/lib/contentFilter.ts`.
- Changing rate limits? `app/lib/rateLimit.ts` → `RATE_LIMITS`.
- Changing pending caps? `app/lib/storage.ts` → `PENDING_CAPS`.

---

## What to do if something goes wrong

| Problem | What to do |
|---------|------------|
| Site is down | Check Vercel dashboard → Deployments. Latest one red? Roll back to the previous green deploy: click it → "Promote to Production". |
| Someone's spamming the wish wall | Check `/admin`. If volume is huge, lower the wish rate limit in `app/lib/rateLimit.ts` (e.g. from 8/hour to 2/hour) and redeploy. |
| Admin token leaked / suspect compromise | Stage 7 "every 90 days" steps, immediately. Then check the `rejection_log` and Supabase tables for anything odd. |
| Email forwarder stops delivering | Cloudflare → Email Routing → check destination address still verified. Re-verify if needed. |
| Got a security report email | Reply within 72 hours. Don't post the details publicly until you've fixed it. Credit the reporter (with their permission). |
| Free tier limits hit | Supabase shows usage in the dashboard. If you're close, upgrade the project to the $25/month Pro plan. Vercel free is 100GB bandwidth/month - should be plenty. |

---

## You don't need to do these unless you want to

- **Add Cloudflare Turnstile** (CAPTCHA without the puzzles) - only if
  bot abuse becomes a real problem.
- **Add a real image moderation API** (Cloudflare AI, AWS Rekognition,
  Sightengine) - see `IMAGE_MODERATION.md` for instructions.
- **Switch certificates from SVG to PDF** - only if people complain.
- **Multilingual support** - only if you actually get non-English
  traffic.

That's it. If you do everything in this file in order, the site is
launched, secure, and maintainable. Welcome to operating a real website.
