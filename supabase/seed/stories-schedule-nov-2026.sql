-- Instagram Story days (Nov 27 to Dec 1, 2026). Safe to run more than once.

insert into public.ideas (title, notes, platform, status, due)
select * from (values
($tbd$Remove Instagram from Metricool$tbd$, $tbd$Metricool still has copies of every post. If its Instagram connection comes back, they would post twice. Posts now run from Buffer (to Dec 4) and Zernio (Dec 5 to Jan 1).$tbd$, 'Instagram', 'planned', '2026-11-26'::date),
($tbd$10:05 am: post the poll Story$tbd$, $tbd$Services Stories auto-post at 10:00 am (Zernio).
1. Post story-services-3-poll.jpg from the zip and add a Poll sticker: Yes / Not yet.
2. Add today's 3 Stories to a new Highlight "Services" with highlight-services.jpg as the cover.
Missed the morning? Post it at lunch or 7 to 9 pm, same day.$tbd$, 'Instagram', 'planned', '2026-11-27'::date),
($tbd$10:05 am: post the question Story$tbd$, $tbd$Process Story auto-posts at 10:00 am (Zernio).
1. Post story-process-2-question.jpg and add a Questions sticker: "Ask me anything".
2. Add today's 2 Stories to a new Highlight "Process" with highlight-process.jpg as the cover.$tbd$, 'Instagram', 'planned', '2026-11-28'::date),
($tbd$10:05 am: post the quote link Story$tbd$, $tbd$Prices Story auto-posts at 10:00 am (Zernio).
1. Post story-prices-2-quote-link.jpg and add a Link sticker: webcreator.techbydave.com
2. Add today's 2 Stories to a new Highlight "Prices" with highlight-prices.jpg as the cover.$tbd$, 'Instagram', 'planned', '2026-11-29'::date),
($tbd$Add Stories to the Work Highlight$tbd$, $tbd$2 Work Stories auto-post at 10:00 am (Zernio). Add both to a new Highlight "Work" with highlight-work.jpg as the cover.$tbd$, 'Instagram', 'planned', '2026-11-30'::date),
($tbd$Add Stories to the About Highlight$tbd$, $tbd$2 About Stories auto-post at 10:00 am (Zernio). Add both to a new Highlight "About" with highlight-about.jpg as the cover.$tbd$, 'Instagram', 'planned', '2026-12-01'::date)
) as v(title, notes, platform, status, due)
where not exists (select 1 from public.ideas where title = $tbd$10:05 am: post the poll Story$tbd$ and due = '2026-11-27');

update public.ideas
set notes = $tbd$Replaced: the Stories are now scheduled in Zernio, one Highlight per day from Nov 27 to Dec 1. See those days on the calendar.$tbd$,
    status = 'posted'
where title = $tbd$Post highlight Stories + covers$tbd$ and due = '2026-11-25';

select title, due from public.ideas where due between '2026-11-26' and '2026-12-01' and platform = 'Instagram' order by due;
