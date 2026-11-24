-- Unfinished work (Nov 24, 2026): 1 pinned note + 18 calendar items. Safe to run more than once.

insert into public.notes (title, body, pinned)
select $tbd$Unfinished work (Nov 24)$tbd$, $tbd$# Unfinished work

Everything below is also on your **Calendar** with a date. Tap an item there to tick it off.

## 1. Aunty Rosemond (counselling client)
- [ ] Ask her to pick the domain: **ronagapecounselling.com** or **ronfamilycounselling.com**
- [ ] Ask if you can show her website in your portfolio and on Instagram (the Work highlight mentions a "Counselling practice")
- [ ] Buy the domain she picks. You pay at checkout (Namecheap, same as techbydave.com)
- [ ] Create an empty GitHub repo **techbydave/ron-dashboard**, then tell Claude "push the ron dashboard". The code is ready
- [ ] Give Claude access to **techbydave/Rosemondrepo** (GitHub → Settings → Applications → Claude → Repository access)
- [ ] Set up the client dashboard: new Supabase project, Resend domain for her email, DNS record for dashboard.ronagapecounselling.com (README in the ron-dashboard code walks through it)

## 2. WebCreator (freelance)
- [ ] Fiverr: create the seller profile and your gigs using the **Freelance Kit** doc
- [ ] Upwork: create the profile (use the Freelance Kit doc) and send your first 5 proposals
- [ ] Set up the other platforms listed in the Freelance Kit
- [ ] GitHub → techbydave/webcreator → Settings → Pages: tick **Enforce HTTPS** if it isn't on yet

## 3. Instagram (@webcreator.dave)
Already scheduled in Metricool: 17 photo posts (Nov 24 to Jan 1) and 3 Reels (Nov 27, Dec 3, Dec 9).
- [ ] Before Thu Nov 26: check the price post (says "Prices in USD") is still right
- [ ] Before Fri Nov 27: watch the 3 Reels with sound. Swap in a trending sound if you don't like the music
- [ ] Post the 11 highlight Stories in this order: About → Work → Process → Prices → Services, with the stickers (poll, question, link), and set the 5 covers
- [ ] Reply to anyone who comments **BOOK** or DMs **CHECK**

## 4. TechByDave blog
- [ ] Answer today's 2 news drafts: Amazon Black Friday timing, Pixel 11 Black Friday deals
- [ ] Answer Thursday's 2 news drafts (they arrive Thu 5am)
- [ ] 10 older drafts still need your "My take" (Nov 5 to Nov 23), then they publish
- [ ] Film video idea #1 **Fake Black Friday deals: the 10-second test** before Black Friday (Nov 27). Script is in video-ideas/ in the techbydave repo
- [ ] Film video ideas #2 (the $899.99 green Xbox) and #3 (Apple HomeView's real price)
$tbd$, true
where not exists (select 1 from public.notes where title = $tbd$Unfinished work (Nov 24)$tbd$);

insert into public.ideas (title, notes, platform, status, due)
select * from (values
($tbd$Answer today's 2 news drafts$tbd$, $tbd$drafts/2026-11-24-amazon-black-friday-2026-when-the-best-deals-drop.md
drafts/2026-11-24-pixel-11-black-friday-deals-which-one-is-worth-it.md
Replace each [[ADD YOUR ANSWER]] with your own answer. They publish once nothing is left in [[ ]].$tbd$, 'Blog', 'planned', '2026-11-24'::date),
($tbd$Check the Instagram price post$tbd$, $tbd$Post 6 goes out Thu Nov 26 at 12:30 pm. It says Starter $349, Business Online $899, Care Plan $39/month, prices in USD. Edit it in Metricool if anything changed.$tbd$, 'Instagram', 'planned', '2026-11-24'::date),
($tbd$Ask Aunty Rosemond: domain + portfolio$tbd$, $tbd$1. Which domain: ronagapecounselling.com or ronfamilycounselling.com?
2. OK to show her website in my portfolio and on Instagram?$tbd$, 'Client', 'planned', '2026-11-25'::date),
($tbd$Film: Fake Black Friday deals$tbd$, $tbd$Video idea #1, "the 10-second test". Script and hook: video-ideas/01-fake-black-friday-deals.md in the techbydave repo. Post before Black Friday (Nov 27).$tbd$, 'YouTube', 'planned', '2026-11-25'::date),
($tbd$Post highlight Stories + covers$tbd$, $tbd$Order: About → Work → Process → Prices → Services.
Stickers: About 2 = link to webcreator.techbydave.com/about.html · Work 1 = link to webcreator.techbydave.com · Process 2 = question · Prices 2 = link to webcreator.techbydave.com/contact · Services 3 = poll (Yes / Not yet).
Covers: highlight-*.png from the zip.$tbd$, 'Instagram', 'planned', '2026-11-25'::date),
($tbd$Turn on Enforce HTTPS for WebCreator$tbd$, $tbd$GitHub → techbydave/webcreator → Settings → Pages → tick Enforce HTTPS (if it isn't already on).$tbd$, 'WebCreator', 'planned', '2026-11-25'::date),
($tbd$Watch the 3 Reels with sound$tbd$, $tbd$First Reel goes out Fri Nov 27 at 6:30 pm. If you don't like the background music, swap in a trending sound in Metricool or Instagram.$tbd$, 'Instagram', 'planned', '2026-11-26'::date),
($tbd$Answer Thursday's 2 news drafts$tbd$, $tbd$They land in drafts/ at 5am. Fill in every [[ADD YOUR ANSWER]].$tbd$, 'Blog', 'planned', '2026-11-26'::date),
($tbd$Buy the counselling domain$tbd$, $tbd$Once Aunty Rosemond picks. Buy it at Namecheap (you pay at checkout), then tell Claude to connect it.$tbd$, 'Client', 'planned', '2026-11-26'::date),
($tbd$Create repo techbydave/ron-dashboard$tbd$, $tbd$Create it empty on GitHub (no README), then tell Claude "push the ron dashboard". The code is already built.$tbd$, 'Client', 'planned', '2026-11-27'::date),
($tbd$Give Claude access to Rosemondrepo$tbd$, $tbd$GitHub → Settings → Applications → Claude → Repository access → add techbydave/Rosemondrepo.$tbd$, 'Client', 'planned', '2026-11-27'::date),
($tbd$Set up Fiverr profile + gigs$tbd$, $tbd$Use the Freelance Kit doc for your profile, gigs and pricing.$tbd$, 'WebCreator', 'planned', '2026-11-28'::date),
($tbd$Set up Upwork + send 5 proposals$tbd$, $tbd$Use the Freelance Kit doc for your profile and pricing. Apply to small-business website jobs.$tbd$, 'WebCreator', 'planned', '2026-11-29'::date),
($tbd$Finish "My take" on older drafts (1/2)$tbd$, $tbd$5 of the 10 waiting drafts (Nov 5 to Nov 12): Arduview, ROG Xbox Ally X, Lomography MC-A, Coros Pace 4, Arlo doorbell.$tbd$, 'Blog', 'planned', '2026-11-30'::date),
($tbd$Set up the client dashboard$tbd$, $tbd$New Supabase project, Resend domain for her email, DNS record for dashboard.ronagapecounselling.com. Follow the README in ron-dashboard, or ask Claude to walk you through it.$tbd$, 'Client', 'planned', '2026-12-01'::date),
($tbd$Finish "My take" on older drafts (2/2)$tbd$, $tbd$The other 5 (Nov 13 to Nov 23): Sony MDR-3R, iPhone 15 Plus, Klipsch Stratos HP-2, Pixel Tag, Bose QuietComfort 2nd gen.$tbd$, 'Blog', 'planned', '2026-12-02'::date),
($tbd$Film: the $899.99 green Xbox$tbd$, $tbd$Video idea #2. Script: video-ideas/02-xbox-series-x25-worth-it.md$tbd$, 'YouTube', 'planned', '2026-12-04'::date),
($tbd$Film: Apple HomeView's real price$tbd$, $tbd$Video idea #3. Script: video-ideas/03-apple-homeview-real-price.md$tbd$, 'YouTube', 'planned', '2026-12-07'::date)
) as v(title, notes, platform, status, due)
where not exists (select 1 from public.ideas where title = $tbd$Answer today's 2 news drafts$tbd$ and due = '2026-11-24');
