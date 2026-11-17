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
| `assets/drafts.js`, `assets/needsyou.js` | Finds a draft's `[[ADD YOUR ...]]` blanks and fills them in |
| `assets/deals.js`, `assets/goals.js` | Brand deal stages and alerts; weekly goal counting |
| `assets/charts.js` | The charts |
| `supabase/schema.sql` | Database tables and the admin-only security rules |
| `scripts/collect.mjs` | The twice-daily collector (Cloudflare, Kit, YouTube) |
| `tests/` | `npm test` |

The page tells search engines not to index it (`noindex` and `robots.txt`).

## TechByDave AI

The **TechByDave AI** page is a chat assistant that knows your brand and sees a summary of your current numbers, ideas and drafts. It runs on **Google Gemini's free tier** by default, with Claude as an optional paid upgrade. API keys never touch the browser: they live in a Supabase Edge Function (`supabase/functions/ask-claude`) that only signed-in dashboard admins can call.

Setup (once):
1. Get a free key at **aistudio.google.com → Get API key**.
2. Supabase → **Edge Functions → Secrets**: add `GEMINI_API_KEY`. (Optional: add `ANTHROPIC_API_KEY` too, to use the Claude models in the picker.)
3. The function is deployed from `supabase/functions/ask-claude/index.ts` (Edge Functions → ask-claude → Code). Its "Verify JWT with legacy secret" setting is off because the function checks admin access itself.

**Attach pictures and videos:** tap 📎, paste a screenshot (Ctrl+V) or drag files onto the chat. Photos and screenshots are shrunk before sending. Videos are sent as about 12 still frames with their timestamps (no sound), which is enough for feedback on the hook, captions, pacing, framing and cover. Pictures stay for the current visit only; saved chats keep small thumbnails.

Gemini's free tier is rate-limited, and Google may use free-tier requests to improve its products, so don't paste anything private you wouldn't want used that way.

## Post to socials

The **Post** page uploads a photo or video once and publishes it to the accounts you pick (Instagram, TikTok, YouTube, X, Pinterest and more), now or on a schedule. **Suggest with AI** writes a title, caption and hashtags tailored to each platform from what you type and a frame of your video. Everything stays editable.

Posting goes through [Zernio](https://zernio.com), whose apps are already approved by each network, so posts are public immediately (your own unaudited apps would be stuck private on YouTube and TikTok). The `social-post` Edge Function holds the keys; only signed-in admins can use it.

Setup (once):
1. Sign up at zernio.com, connect your accounts, and create an API key.
2. Supabase → **Edge Functions → Secrets**: add `ZERNIO_API_KEY`. (`GEMINI_API_KEY`, already there, powers the suggestions.)
3. Deploy `supabase/functions/social-post/index.ts` as a function named `social-post`, with "Verify JWT with legacy secret" off.
4. Run the "Backup upload bucket" part of `supabase/schema.sql`.

**The $0 setup:** connect only TikTok and YouTube in Zernio (its two free accounts). Instagram then posts directly through your own Meta app: add `IG_ACCESS_TOKEN` (a token with `instagram_content_publish`) to Supabase secrets. Direct Instagram posts go out right away and can't be scheduled.

Cost: the first 2 connected accounts are free, then $6/month each. X also bills about $0.015 per post ($0.20 if it contains a link); the page warns you.

## Deals and goals

**Brand deals** (its own page) tracks every brand from first email to getting paid: Talking → Agreed → Product on the way → Making content → Posted → Paid. Cards flag deals that are overdue, due within 3 days, posted but unpaid, or quiet for 7 days ("Contacted today" resets the nudge).

**This week** (Overview) shows weekly goals that reset every Monday. Posts, hands-on reviews (posts with `type: review`), new newsletter subscribers and website visits count themselves; anything else gets a +1 button. Tap **Edit goals** to change them.

**Needs you** (Overview) lists deals that need attention and every blog draft still waiting on you.

Setup (once): run the "Brand deals" and "Weekly goals" parts at the end of `supabase/schema.sql` in Supabase → SQL Editor. It also adds four starter goals and the brands you were already talking to.

## Notes

The **Notes** page is a notebook for plans, scripts and DMs. It understands simple formatting (`#` headings, `-` lists, `**bold**`), and anything inside a ``` block gets a **Copy** button, which is handy for messages you paste into Instagram. Notes save as you type, can be pinned to the top, and are searchable. Setup: run the "Notes" part at the end of `supabase/schema.sql`.

## Fill in drafts from the dashboard

Tap a draft in **Needs you** (or the calendar) to fill in its blanks: your take, verdict, photo and the rest. Photos are resized and added to the blog's `images/` folder. When nothing's left, the draft goes live at the next 9:00am publish, or tap **Publish now**.

Saving needs a GitHub token, kept in Supabase so it never reaches the browser:
1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name it `TechByDave dashboard`, pick an expiry (1 year is fine), and under **Repository access** choose **Only select repositories → techbydave/techbydave**.
3. Under **Permissions → Repository permissions**, set **Contents: Read and write** and **Actions: Read and write**. Generate it and copy it.
4. Supabase → **Edge Functions → Secrets**: add `BLOG_GITHUB_TOKEN` with the token as its value.

The `blog-drafts` function (`supabase/functions/blog-drafts/index.ts`) is deployed with "Verify JWT with legacy secret" off, like the others. Without the token, the form still opens and offers "Edit on GitHub".
