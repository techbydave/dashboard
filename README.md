# TechByDave Dashboard

Your private mission control at **dashboard.techbydave.com**: website traffic, followers on every platform, newsletter growth, and a content calendar that shows your real blog drafts and posts next to your own ideas.

| Section | What's on it |
| --- | --- |
| **Overview** | Total audience, website visits, newsletter subscribers and posts published, each with change over 7, 30 or 90 days. A website-visits chart (hover for each day, or open the table view). A card per platform. "Up next": what's due soon and which drafts still need your take. |
| **Calendar** | A month view of published posts (✓), drafts (✎) and ideas (✦), pulled live from the `techbydave/techbydave` repo. Drag an unscheduled idea onto a day to schedule it. Tap a day to see everything on it, or turn any post into a Short idea. |
| **Ideas** | A board with Ideas → Planned → Making it → Posted. Drag cards between columns. |
| **Weekly check-in** | A 30-second form for the apps without a free API (TikTok, X, Pinterest). |

## Where the numbers come from

| Source | How | Cost |
| --- | --- | --- |
| Website visits and page views | Cloudflare Web Analytics (already on your site), collected twice a day | Free |
| Newsletter subscribers | Kit, collected twice a day | Free |
| YouTube subscribers, views, videos | YouTube Data API, collected twice a day | Free |
| Google searches: clicks, impressions, position, top searches and pages | Google Search Console API, collected twice a day (Google runs 2 to 3 days behind) | Free |
| Instagram followers | Instagram API, collected twice a day (token renews itself) | Free |
| TikTok, X, Pinterest followers | Your weekly check-in | Free |
| Drafts and posts | Read straight from your public blog repo | Free |

The dashboard is connected to the Supabase project **techbydave-dashboard** (its public address and key are in `config.js`).

## Setup (about 25 minutes, one time)

### 1. Create the database and your login
1. At [supabase.com](https://supabase.com), create a **new project** called `techbydave-dashboard` (free plan).
2. Paste everything from [`supabase/schema.sql`](supabase/schema.sql) into **SQL Editor → New query** and click **Run**. It approves **dave@techbydave.com** as the only account that can see the data.
3. **Authentication → Sign In / Providers → Email:** turn **off** "Allow new users to sign up". Only you get in.
4. **Authentication → Users → Add user → Create new user:** enter `dave@techbydave.com` and your password, and tick **Auto Confirm User**. The password lives only in Supabase, never in this repo.
5. **Authentication → URL Configuration:** set **Site URL** to `https://dashboard.techbydave.com` and add the same address under **Redirect URLs**. This makes "Forgot password?" work.
6. Optional but recommended: **Authentication → Emails → SMTP Settings**. Use host `smtp.resend.com`, port `465`, user `resend`, password = a Resend API key, and sender `noreply@techbydave.com`, so password-reset emails come from your domain.

Even if someone found a way to make an account, the database only shows data to dave@techbydave.com.

### 2. Get the API keys
- **Cloudflare:** go to [dash.cloudflare.com](https://dash.cloudflare.com) → **My Profile → API Tokens → Create Token → Custom token**. Give it the permission **Account → Account Analytics → Read** and create it. Your **Account ID** is on your account's home page (right-hand side).
- **Kit:** use the same V4 API key as your blog's newsletter digest.
- **YouTube:** go to [console.cloud.google.com](https://console.cloud.google.com), create a project, enable **YouTube Data API v3**, then **Credentials → Create credentials → API key**. Restrict the key to the YouTube Data API.
- **Google Search Console** (same Google Cloud project is fine):
  1. **APIs & Services → Library**, search **Google Search Console API**, click **Enable**.
  2. **IAM & Admin → Service Accounts → Create service account.** Name it `dashboard`, skip the optional role steps, click **Done**.
  3. Open the new service account → **Keys → Add key → Create new key → JSON**. A `.json` file downloads. Treat it like a password.
  4. Copy the service account's email (it looks like `dashboard@your-project.iam.gserviceaccount.com`).
  5. In [Search Console](https://search.google.com/search-console), pick the techbydave.com property → **Settings → Users and permissions → Add user**, paste that email, permission **Restricted**, **Add**.

### 3. Add them to this repo
**Settings → Secrets and variables → Actions**

**Variables** tab:

| Name | Value |
| --- | --- |
| `CF_ACCOUNT_ID` | Your Cloudflare Account ID |
| `SITE_HOST` | `techbydave.com` (optional; this is the default) |
| `YOUTUBE_HANDLE` | `techby_dave` (optional; this is the default) |
| `GSC_SITE` | Optional. Only if your property isn't `sc-domain:techbydave.com` or `https://techbydave.com/` (both are tried automatically) |

**Secrets** tab (keep private):

| Name | Value |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `CF_API_TOKEN` | The Cloudflare token from step 2 |
| `KIT_API_KEY` | Your Kit V4 API key |
| `YOUTUBE_API_KEY` | The YouTube API key from step 2 |
| `GSC_SERVICE_ACCOUNT` | Open the downloaded `.json` file in a text editor and paste **all** of it |

Any key you leave out is just skipped, so you can add them one at a time.

### 4. Put it on dashboard.techbydave.com
1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. At your domain's DNS provider, add a record: **CNAME**, name `dashboard`, target `techbydave.github.io`.
3. **Settings → Pages → Custom domain:** enter `dashboard.techbydave.com`, save, then tick **Enforce HTTPS** once it's offered.
4. **Actions → Deploy dashboard → Run workflow.**

### 5. Fill it with numbers
**Actions → Collect analytics → Run workflow.** After that it runs on its own about 6am and 6pm Toronto time. Then sign in and do your first **Weekly check-in**.

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `assets/` | The dashboard (plain HTML, CSS and JavaScript, no build step) |
| `assets/metrics.js` | The maths: growth, period comparisons, calendar grid |
| `assets/content.js` | Reads drafts and posts from the blog repo |
| `assets/charts.js` | The charts |
| `supabase/schema.sql` | Database tables and the admin-only security rules |
| `scripts/collect.mjs` | The twice-daily collector (Cloudflare, Kit, YouTube) |
| `tests/` | `npm test` |

The page tells search engines not to index it (`noindex` and `robots.txt`).
