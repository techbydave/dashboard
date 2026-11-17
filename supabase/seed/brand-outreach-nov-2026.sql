-- ---------------------------------------------------------------------------
-- Notes (the Notes page)
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null default '' check (char_length(title) <= 160),
  body       text not null default '' check (char_length(body) <= 100000),
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
drop policy if exists "admin notes" on public.notes;
create policy "admin notes" on public.notes for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.notes to authenticated;
grant all on public.notes to service_role;

-- Brand outreach: 2 notes + 60 calendar items (safe to run once)

insert into public.notes (title, body, pinned) select $tbd$Brand outreach: 6 brands + DMs to send$tbd$, $tbd$These six small-to-mid tech brands regularly work with small creators. Most also run a free-product or ambassador program, which at your size is often faster than a DM. **Send the DM and apply through the program.**

# 1. PITAKA: @ipitaka.global
**Ask for:** a MagEZ case for your iPhone 15 Plus (it ties into your iPhone 15 Plus review).
**Why:** their Brand Ambassador program gives free product samples, a discount code for your audience and sponsored giveaways, and they reply within 3 business days. Apply at ipitaka.com/pages/pitaka-brand-ambassador.
```
Hi PITAKA team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole angle is one question: is it worth it, or a waste? I film all my content on an iPhone 15 Plus and I'm writing a long-term review of it right now. I'd love to test a MagEZ case for it: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

# 2. Ulanzi: @ulanzi_official
**Ask for:** a phone tripod or phone light for your indoor filming setup.
**Why:** Ulanzi runs a Creator Program with a free-kit Seed Program (30 spots per quarter) and monthly new-product tryouts.
```
Hi Ulanzi team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. I shoot all my "worth it or a waste?" Shorts indoors on an iPhone, so phone rigs and lights are exactly what I use every day. I'd love to try one of your phone tripods or lights and show the before/after in my setup: a Short on Instagram, TikTok and YouTube plus a write-up on my site. Happy to apply for the Seed Program too. Media kit: techbydave.com/media-kit.html
```

# 3. SHARGE: @sharge_official
**Ask for:** an ICEMAG MagSafe power bank.
**Why:** SHARGE works with lots of small tech creators. Press contact: marketing@sharge.com.
```
Hi SHARGE team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My channel asks one question about every gadget: is it worth it, or a waste? Your ICEMAG power banks are some of the most eye-catching MagSafe gear out there, and I'd love to put one through a real week of use: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube that you're free to repost. Who should I talk to? Media kit: techbydave.com/media-kit.html
```

# 4. NuPhy: @nuphy.studio
**Ask for:** an Air75 low-profile keyboard for a desk-setup Short.
**Careful:** the real account is nuphy.studio. A fake one, nuphy.studio_ (with an underscore), has been reported.
```
Hi NuPhy team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. I write and edit everything for my site at my desk, and I've been eyeing the Air75 as the keyboard upgrade. I'd love to review one: a desk-setup Short on Instagram, TikTok and YouTube plus a hands-on "worth it or a waste?" review on my site. You'd be free to repost the footage. Who's the right person to talk to? Media kit: techbydave.com/media-kit.html
```

# 5. EarFun (search "EarFun" on Instagram, pick the blue ✓ account)
**Ask for:** EarFun Air Pro 4, as a "cheaper alternative" to your AirPods Pro 3 post.
**Why:** their "Chief Experience Officer" program sends free samples to selected reviewers. Apply at myearfun.com/earfun-experience, and post within 2 weeks of getting it or you're out of future tests.
```
Hi EarFun team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. I just covered the AirPods Pro 3 Black Friday deal, and my readers keep asking about cheaper alternatives that are actually good. I'd love to review the Air Pro 4 as exactly that: a hands-on comparison on my site plus a Short on Instagram, TikTok and YouTube. I can turn it around within two weeks. Media kit: techbydave.com/media-kit.html
```

# 6. SOUNDPEATS (search "SOUNDPEATS" on Instagram, pick the blue ✓ account)
**Ask for:** SOUNDPEATS Air5 Pro.
**Why:** they run creator hashtag campaigns. No reply to the DM? Email marketing@soundpeatsaudio.com.
```
Hi SOUNDPEATS team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel is "worth it or a waste?", and budget earbuds that punch above their price are my favourite kind of story. I'd love to review the Air5 Pro: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube that you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

# To boost your odds
- **Warm up first:** follow each brand and like or comment on 2 or 3 recent posts before you DM. A familiar name gets read.
- **2 or 3 DMs a day**, not all at once, so you can reply properly when brands answer.
- **Track replies:** when a brand answers, add it to **Brand deals** as Talking. The dashboard nudges you to follow up after 7 quiet days.
- **Media kit:** make sure techbydave.com/media-kit.html is up to date before sending. Brands will look at it.
- EarFun and SOUNDPEATS handles weren't confirmed: check for the blue tick (EarFun's @earfun_japan is the Japan account, not the one you want).
$tbd$, true where not exists (select 1 from public.notes where title = $tbd$Brand outreach: 6 brands + DMs to send$tbd$);

insert into public.notes (title, body, pinned) select $tbd$30-day brand DM plan (Nov 17 – Dec 16)$tbd$, $tbd$# 30-day brand DM plan (Nov 17 – Dec 16)

Two brands a day. Each day is also on your **Calendar** (tap the item to see the DM).
Handles marked ✓-check weren't confirmed: search the brand and DM the account with the blue tick.
When a brand replies, add it to **Brand deals** as Talking.


# Tue Nov 17
**PITAKA**: @ipitaka.global
Ask for: a MagEZ case for my iPhone 15 Plus
```
Hi PITAKA team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I film all my content on an iPhone 15 Plus and I'm writing a long-term review of it right now. I'd love to review a MagEZ case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Ulanzi**: @ulanzi_official
Ask for: one of your phone tripods or phone lights
```
Hey Ulanzi! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I shoot all my Shorts indoors on an iPhone, so phone rigs and lights are what I use every day. I'd love to review one of your phone tripods or phone lights: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Wed Nov 18
**SHARGE**: @sharge_official
Ask for: an ICEMAG MagSafe power bank
```
Hi SHARGE team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Your ICEMAG power banks are some of the most eye-catching MagSafe gear out there. I'd love to review an ICEMAG MagSafe power bank: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**NuPhy**: @nuphy.studio
Ask for: an Air75 keyboard
```
Hi NuPhy team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I write and edit everything for my site at my desk, and the Air75 is the upgrade I've been eyeing. I'd love to review an Air75 keyboard: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Thu Nov 19
**EarFun**: search "EarFun" on Instagram, pick the blue ✓ account
Ask for: the EarFun Air Pro 4
```
Hey EarFun! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I just covered the AirPods Pro 3 Black Friday deal, and readers keep asking for cheaper alternatives that are actually good. I'd love to review the EarFun Air Pro 4: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**SOUNDPEATS**: search "SOUNDPEATS" on Instagram, pick the blue ✓ account
Ask for: the Air5 Pro
```
Hi SOUNDPEATS team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Budget earbuds that punch above their price are my favourite kind of story. I'd love to review the Air5 Pro: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Fri Nov 20
**Keychron**: @keychron
Ask for: a wireless keyboard like the K2 HE
```
Hi Keychron team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Desk-setup Shorts are some of my most-watched, and a Keychron is the board people ask about most. I'd love to review a wireless keyboard like the K2 HE: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Satechi**: @satechi
Ask for: a FindAll tracker or an OntheGo charger
```
Hey Satechi! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I just made a Short about trackers that work with Find My, and your FindAll line fits that story perfectly. I'd love to review a FindAll tracker or an OntheGo charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sat Nov 21
**Govee**: @goveeofficial
Ask for: light strips or a desk light for my filming setup
```
Hi Govee team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Lighting is the biggest upgrade in my indoor Shorts, and I'd love a before/after with Govee. I'd love to review light strips or a desk light for my filming setup: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Nanoleaf**: @nanoleaf (check for the blue ✓)
Ask for: Nanoleaf Lines or Shapes for my desk wall
```
Hi Nanoleaf team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm a Toronto creator too, and I'd love to feature a local Toronto brand in my setup. I'd love to review Nanoleaf Lines or Shapes for my desk wall: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sun Nov 22
**Tribit**: search "Tribit" on Instagram, pick the blue ✓ account
Ask for: a StormBox speaker
```
Hey Tribit! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Budget Bluetooth speakers are a perfect 'worth it or a waste?' test. I'd love to review a StormBox speaker: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**1MORE**: search "1MORE" on Instagram, pick the blue ✓ account
Ask for: a pair of your ANC earbuds
```
Hi 1MORE team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I'm building a 'best earbuds under $100' series for my readers. I'd love to review a pair of your ANC earbuds: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Mon Nov 23
**Edifier**: search "Edifier" on Instagram, pick the blue ✓ account
Ask for: a pair of desktop speakers
```
Hi Edifier team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm upgrading my desk setup and want speakers that look as good as they sound. I'd love to review a pair of desktop speakers: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**TOZO**: search "TOZO" on Instagram, pick the blue ✓ account
Ask for: your newest earbuds
```
Hey TOZO! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? My readers love honest takes on budget earbuds that actually last. I'd love to review your newest earbuds: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Tue Nov 24
**INIU**: search "INIU" on Instagram, pick the blue ✓ account
Ask for: a slim power bank
```
Hi INIU team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Power banks are one of my readers' most-bought gadgets, and I test them in real days out. I'd love to review a slim power bank: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**CUKTECH**: search "CUKTECH" on Instagram, pick the blue ✓ account
Ask for: a power bank or GaN charger
```
Hi CUKTECH team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Charging gear with real-world numbers is one of my most popular topics. I'd love to review a power bank or GaN charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Wed Nov 25
**TORRAS**: search "TORRAS" on Instagram, pick the blue ✓ account
Ask for: a MagSafe case for my iPhone 15 Plus
```
Hey TORRAS! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm reviewing my iPhone 15 Plus long-term and want to pair it with a case worth recommending. I'd love to review a MagSafe case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**ESR**: search "ESR" on Instagram, pick the blue ✓ account
Ask for: HaloLock MagSafe accessories
```
Hi ESR team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. MagSafe accessories are a big part of my 'smarter buys' coverage. I'd love to review HaloLock MagSafe accessories: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Thu Nov 26
**UGREEN**: search "UGREEN" on Instagram, pick the blue ✓ account
Ask for: a Nexode GaN charger
```
Hi UGREEN team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm putting together a 'one charger for everything' guide for travel season. I'd love to review a Nexode GaN charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Lisen**: search "Lisen" on Instagram, pick the blue ✓ account
Ask for: a MagSafe car mount or charger
```
Hey Lisen! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Car and desk mounts are a gap in my coverage I'd love to fill with something good. I'd love to review a MagSafe car mount or charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Fri Nov 27
**Nomad**: @nomadgoods (check for the blue ✓)
Ask for: a case or charger
```
Hi Nomad team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Premium accessories that last are exactly what my 'worth it or a waste?' question is for. I'd love to review a case or charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**MOFT**: search "MOFT" on Instagram, pick the blue ✓ account
Ask for: the Snap Phone Tripod Stand
```
Hi MOFT team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? It's exactly the kind of tiny creator tool I'd use filming my Shorts. I'd love to review the Snap Phone Tripod Stand: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sat Nov 28
**Lamicall**: search "Lamicall" on Instagram, pick the blue ✓ account
Ask for: a phone or tablet stand
```
Hey Lamicall! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Desk stands are an easy upgrade my readers ask about. I'd love to review a phone or tablet stand: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Native Union**: @nativeunion (check for the blue ✓)
Ask for: a charging cable or desk charger
```
Hi Native Union team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I love gear that makes a desk look cleaner, and your design is a great fit. I'd love to review a charging cable or desk charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sun Nov 29
**Mous**: @mous (check for the blue ✓)
Ask for: a case for my iPhone 15 Plus
```
Hi Mous team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Drop-tested cases make for great Short content. I'd love to review a case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**totallee**: @totallee (check for the blue ✓)
Ask for: a thin case for my iPhone 15 Plus
```
Hey totallee! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Plenty of my readers want protection without bulk, and that's your whole thing. I'd love to review a thin case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Mon Nov 30
**CASEKOO**: search "CASEKOO" on Instagram, pick the blue ✓ account
Ask for: a MagSafe case for my iPhone 15 Plus
```
Hi CASEKOO team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I'm reviewing the iPhone 15 Plus long-term and want a case pick that's good value. I'd love to review a MagSafe case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**SmallRig**: search "SmallRig" on Instagram, pick the blue ✓ account
Ask for: a phone cage or grip
```
Hi SmallRig team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I film everything on my phone and want to show how a rig levels it up. I'd love to review a phone cage or grip: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Tue Dec 1
**NEEWER**: search "NEEWER" on Instagram, pick the blue ✓ account
Ask for: a small LED light or ring light
```
Hey NEEWER! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Lighting is the biggest upgrade in my indoor Shorts. I'd love to review a small LED light or ring light: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Hohem**: search "Hohem" on Instagram, pick the blue ✓ account
Ask for: a phone gimbal
```
Hi Hohem team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Smooth phone footage is something every small creator asks me about. I'd love to review a phone gimbal: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Wed Dec 2
**Hollyland**: search "Hollyland" on Instagram, pick the blue ✓ account
Ask for: a Lark wireless mic
```
Hi Hollyland team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Clean audio is the biggest weakness in phone videos, and I'd love to show the fix. I'd love to review a Lark wireless mic: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Saramonic**: search "Saramonic" on Instagram, pick the blue ✓ account
Ask for: a wireless mic for my phone
```
Hey Saramonic! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm testing phone mics for small creators who film like I do. I'd love to review a wireless mic for my phone: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Thu Dec 3
**BOYA**: search "BOYA" on Instagram, pick the blue ✓ account
Ask for: a wireless mic for my phone
```
Hi BOYA team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Budget mics that actually sound good are a perfect 'worth it?' story. I'd love to review a wireless mic for my phone: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Lume Cube**: @lumecube (check for the blue ✓)
Ask for: a panel or video conference light
```
Hi Lume Cube team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Lighting makes the biggest difference in my indoor Shorts. I'd love to review a panel or video conference light: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Fri Dec 4
**Moment**: @moment (check for the blue ✓)
Ask for: a mobile lens or phone filter mount
```
Hey Moment! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I shoot on an iPhone and want to show what a real lens adds. I'd love to review a mobile lens or phone filter mount: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**ZHIYUN**: search "ZHIYUN" on Instagram, pick the blue ✓ account
Ask for: a Smooth phone gimbal
```
Hi ZHIYUN team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Smooth phone footage is what small creators ask me about most. I'd love to review a Smooth phone gimbal: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sat Dec 5
**Lofree**: search "Lofree" on Instagram, pick the blue ✓ account
Ask for: the Flow keyboard
```
Hi Lofree team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Low-profile keyboards are having a moment and my desk Shorts are perfect for it. I'd love to review the Flow keyboard: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**EPOMAKER**: search "EPOMAKER" on Instagram, pick the blue ✓ account
Ask for: a mechanical keyboard
```
Hey EPOMAKER! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Affordable mechanical keyboards are a great 'worth it or a waste?' test. I'd love to review a mechanical keyboard: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sun Dec 6
**Quntis**: search "Quntis" on Instagram, pick the blue ✓ account
Ask for: a monitor light bar
```
Hi Quntis team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Desk lighting is an upgrade my readers keep asking about. I'd love to review a monitor light bar: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Orbitkey**: @orbitkey (check for the blue ✓)
Ask for: a desk mat or key organiser
```
Hi Orbitkey team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm doing a desk and everyday-carry series and your gear fits it perfectly. I'd love to review a desk mat or key organiser: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Mon Dec 7
**Twelve South**: @twelvesouth (check for the blue ✓)
Ask for: a stand or charger for my Apple setup
```
Hey Twelve South! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Apple desk accessories are a big part of my coverage. I'd love to review a stand or charger for my Apple setup: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Bellroy**: @bellroy (check for the blue ✓)
Ask for: a tech kit or organiser
```
Hi Bellroy team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I'm doing a 'what's in my creator bag' Short and want gear worth recommending. I'd love to review a tech kit or organiser: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Tue Dec 8
**Wyze**: @wyzecam (check for the blue ✓)
Ask for: a security camera
```
Hi Wyze team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Budget smart home gear is one of my readers' favourite topics. I'd love to review a security camera: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Aqara**: search "Aqara" on Instagram, pick the blue ✓ account
Ask for: a smart home starter kit
```
Hey Aqara! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm building a 'smart home under $100' series. I'd love to review a smart home starter kit: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Wed Dec 9
**SwitchBot**: search "SwitchBot" on Instagram, pick the blue ✓ account
Ask for: a SwitchBot or curtain robot
```
Hi SwitchBot team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Gadgets that make a dumb home smart are perfect Short content. I'd love to review a SwitchBot or curtain robot: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Pebblebee**: @pebblebee (check for the blue ✓)
Ask for: your trackers
```
Hi Pebblebee team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I just made a Short on trackers that work with both Find My and Find Hub, and you're a great fit for the follow-up. I'd love to review your trackers: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Thu Dec 10
**Amazfit**: @amazfit (check for the blue ✓)
Ask for: a smartwatch
```
Hey Amazfit! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm comparing affordable smartwatches against the Apple Watch for my readers. I'd love to review a smartwatch: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**RingConn**: search "RingConn" on Instagram, pick the blue ✓ account
Ask for: a smart ring
```
Hi RingConn team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I just covered Oura vs Ultrahuman, and readers want a cheaper option without a subscription. I'd love to review a smart ring: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Fri Dec 11
**Mobvoi**: search "Mobvoi" on Instagram, pick the blue ✓ account
Ask for: a TicWatch
```
Hi Mobvoi team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Wear OS watches are a gap in my coverage I'd love to fill. I'd love to review a TicWatch: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**8BitDo**: search "8BitDo" on Instagram, pick the blue ✓ account
Ask for: a controller
```
Hey 8BitDo! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Retro-style controllers make great, fun Shorts. I'd love to review a controller: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sat Dec 12
**GameSir**: search "GameSir" on Instagram, pick the blue ✓ account
Ask for: a mobile controller
```
Hi GameSir team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Phone gaming gear is a fun 'worth it or a waste?' test. I'd love to review a mobile controller: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**JSAUX**: search "JSAUX" on Instagram, pick the blue ✓ account
Ask for: a dock or accessory for handheld gaming PCs
```
Hi JSAUX team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I just covered the ROG Xbox Ally, so your accessories fit right in. I'd love to review a dock or accessory for handheld gaming PCs: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Sun Dec 13
**EMEET**: search "EMEET" on Instagram, pick the blue ✓ account
Ask for: a webcam or conference mic
```
Hey EMEET! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Work-from-home gear is a big part of what my readers buy. I'd love to review a webcam or conference mic: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Baseus**: search "Baseus" on Instagram, pick the blue ✓ account
Ask for: a power bank or charger
```
Hi Baseus team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Charging gear with real-world numbers is one of my most popular topics. I'd love to review a power bank or charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Mon Dec 14
**Shokz**: @shokz (check for the blue ✓)
Ask for: open-ear headphones
```
Hi Shokz team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Open-ear audio is a hot category and my readers want an honest take. I'd love to review open-ear headphones: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**XREAL**: search "XREAL" on Instagram, pick the blue ✓ account
Ask for: AR glasses
```
Hey XREAL! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Display glasses are one of the most-asked-about gadgets this year. I'd love to review AR glasses: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Tue Dec 15
**VITURE**: search "VITURE" on Instagram, pick the blue ✓ account
Ask for: XR glasses
```
Hi VITURE team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Display glasses are one of the most-asked-about gadgets this year. I'd love to review XR glasses: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**KUXIU**: search "KUXIU" on Instagram, pick the blue ✓ account
Ask for: a MagSafe stand
```
Hi KUXIU team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm testing MagSafe desk gear for my iPhone setup. I'd love to review a MagSafe stand: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```


# Wed Dec 16
**Insta360**: @insta360 (check for the blue ✓)
Ask for: an action or pocket camera
```
Hey Insta360! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'd love to show what a creator can do beyond a phone. I'd love to review an action or pocket camera: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```

**Lexar**: search "Lexar" on Instagram, pick the blue ✓ account
Ask for: a portable SSD for my video edits
```
Hi Lexar team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Fast storage for phone creators is a gap in my coverage. I'd love to review a portable SSD for my video edits: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html
```
$tbd$, true where not exists (select 1 from public.notes where title = $tbd$30-day brand DM plan (Nov 17 – Dec 16)$tbd$);

insert into public.ideas (title, notes, platform, status, due)
select * from (values
($tbd$DM PITAKA (@ipitaka.global)$tbd$, $tbd$Instagram: @ipitaka.global
Ask for: a MagEZ case for my iPhone 15 Plus
Tip: Also apply: ipitaka.com/pages/pitaka-brand-ambassador (they reply within 3 business days).
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi PITAKA team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I film all my content on an iPhone 15 Plus and I'm writing a long-term review of it right now. I'd love to review a MagEZ case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-17'::date),
($tbd$DM Ulanzi (@ulanzi_official)$tbd$, $tbd$Instagram: @ulanzi_official
Ask for: one of your phone tripods or phone lights
Tip: Also apply for their Seed Program at ulanzi.com (Creator Program page).
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Ulanzi! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I shoot all my Shorts indoors on an iPhone, so phone rigs and lights are what I use every day. I'd love to review one of your phone tripods or phone lights: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-17'::date),
($tbd$DM SHARGE (@sharge_official)$tbd$, $tbd$Instagram: @sharge_official
Ask for: an ICEMAG MagSafe power bank
Tip: No reply in 5 days? Email marketing@sharge.com.
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi SHARGE team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Your ICEMAG power banks are some of the most eye-catching MagSafe gear out there. I'd love to review an ICEMAG MagSafe power bank: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-18'::date),
($tbd$DM NuPhy (@nuphy.studio)$tbd$, $tbd$Instagram: @nuphy.studio
Ask for: an Air75 keyboard
Tip: Careful: the fake account is nuphy.studio_ (with an underscore).
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi NuPhy team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I write and edit everything for my site at my desk, and the Air75 is the upgrade I've been eyeing. I'd love to review an Air75 keyboard: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-18'::date),
($tbd$DM EarFun$tbd$, $tbd$Instagram: search "EarFun" on Instagram, pick the blue ✓ account
Ask for: the EarFun Air Pro 4
Tip: Also apply: myearfun.com/earfun-experience (review due within 2 weeks of delivery).
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey EarFun! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I just covered the AirPods Pro 3 Black Friday deal, and readers keep asking for cheaper alternatives that are actually good. I'd love to review the EarFun Air Pro 4: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-19'::date),
($tbd$DM SOUNDPEATS$tbd$, $tbd$Instagram: search "SOUNDPEATS" on Instagram, pick the blue ✓ account
Ask for: the Air5 Pro
Tip: No reply? Email marketing@soundpeatsaudio.com.
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi SOUNDPEATS team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Budget earbuds that punch above their price are my favourite kind of story. I'd love to review the Air5 Pro: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-19'::date),
($tbd$DM Keychron (@keychron)$tbd$, $tbd$Instagram: @keychron
Ask for: a wireless keyboard like the K2 HE
Tip: Tag @keychron in the post if they send one.
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Keychron team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Desk-setup Shorts are some of my most-watched, and a Keychron is the board people ask about most. I'd love to review a wireless keyboard like the K2 HE: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-20'::date),
($tbd$DM Satechi (@satechi)$tbd$, $tbd$Instagram: @satechi
Ask for: a FindAll tracker or an OntheGo charger
Tip: Creators tag #SatechiSetup.
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Satechi! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I just made a Short about trackers that work with Find My, and your FindAll line fits that story perfectly. I'd love to review a FindAll tracker or an OntheGo charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-20'::date),
($tbd$DM Govee (@goveeofficial)$tbd$, $tbd$Instagram: @goveeofficial
Ask for: light strips or a desk light for my filming setup
Tip: On TikTok they're @govee.official.
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Govee team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Lighting is the biggest upgrade in my indoor Shorts, and I'd love a before/after with Govee. I'd love to review light strips or a desk light for my filming setup: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-21'::date),
($tbd$DM Nanoleaf (@nanoleaf)$tbd$, $tbd$Instagram: @nanoleaf (check for the blue ✓)
Ask for: Nanoleaf Lines or Shapes for my desk wall
Tip: Mention you're in Toronto: local stories land well.
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Nanoleaf team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm a Toronto creator too, and I'd love to feature a local Toronto brand in my setup. I'd love to review Nanoleaf Lines or Shapes for my desk wall: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-21'::date),
($tbd$DM Tribit$tbd$, $tbd$Instagram: search "Tribit" on Instagram, pick the blue ✓ account
Ask for: a StormBox speaker
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Tribit! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Budget Bluetooth speakers are a perfect 'worth it or a waste?' test. I'd love to review a StormBox speaker: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-22'::date),
($tbd$DM 1MORE$tbd$, $tbd$Instagram: search "1MORE" on Instagram, pick the blue ✓ account
Ask for: a pair of your ANC earbuds
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi 1MORE team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I'm building a 'best earbuds under $100' series for my readers. I'd love to review a pair of your ANC earbuds: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-22'::date),
($tbd$DM Edifier$tbd$, $tbd$Instagram: search "Edifier" on Instagram, pick the blue ✓ account
Ask for: a pair of desktop speakers
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Edifier team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm upgrading my desk setup and want speakers that look as good as they sound. I'd love to review a pair of desktop speakers: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-23'::date),
($tbd$DM TOZO$tbd$, $tbd$Instagram: search "TOZO" on Instagram, pick the blue ✓ account
Ask for: your newest earbuds
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey TOZO! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? My readers love honest takes on budget earbuds that actually last. I'd love to review your newest earbuds: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-23'::date),
($tbd$DM INIU$tbd$, $tbd$Instagram: search "INIU" on Instagram, pick the blue ✓ account
Ask for: a slim power bank
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi INIU team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Power banks are one of my readers' most-bought gadgets, and I test them in real days out. I'd love to review a slim power bank: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-24'::date),
($tbd$DM CUKTECH$tbd$, $tbd$Instagram: search "CUKTECH" on Instagram, pick the blue ✓ account
Ask for: a power bank or GaN charger
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi CUKTECH team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Charging gear with real-world numbers is one of my most popular topics. I'd love to review a power bank or GaN charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-24'::date),
($tbd$DM TORRAS$tbd$, $tbd$Instagram: search "TORRAS" on Instagram, pick the blue ✓ account
Ask for: a MagSafe case for my iPhone 15 Plus
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey TORRAS! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm reviewing my iPhone 15 Plus long-term and want to pair it with a case worth recommending. I'd love to review a MagSafe case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-25'::date),
($tbd$DM ESR$tbd$, $tbd$Instagram: search "ESR" on Instagram, pick the blue ✓ account
Ask for: HaloLock MagSafe accessories
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi ESR team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. MagSafe accessories are a big part of my 'smarter buys' coverage. I'd love to review HaloLock MagSafe accessories: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-25'::date),
($tbd$DM UGREEN$tbd$, $tbd$Instagram: search "UGREEN" on Instagram, pick the blue ✓ account
Ask for: a Nexode GaN charger
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi UGREEN team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm putting together a 'one charger for everything' guide for travel season. I'd love to review a Nexode GaN charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-26'::date),
($tbd$DM Lisen$tbd$, $tbd$Instagram: search "Lisen" on Instagram, pick the blue ✓ account
Ask for: a MagSafe car mount or charger
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Lisen! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Car and desk mounts are a gap in my coverage I'd love to fill with something good. I'd love to review a MagSafe car mount or charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-26'::date),
($tbd$DM Nomad (@nomadgoods)$tbd$, $tbd$Instagram: @nomadgoods (check for the blue ✓)
Ask for: a case or charger
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Nomad team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Premium accessories that last are exactly what my 'worth it or a waste?' question is for. I'd love to review a case or charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-27'::date),
($tbd$DM MOFT$tbd$, $tbd$Instagram: search "MOFT" on Instagram, pick the blue ✓ account
Ask for: the Snap Phone Tripod Stand
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi MOFT team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? It's exactly the kind of tiny creator tool I'd use filming my Shorts. I'd love to review the Snap Phone Tripod Stand: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-27'::date),
($tbd$DM Lamicall$tbd$, $tbd$Instagram: search "Lamicall" on Instagram, pick the blue ✓ account
Ask for: a phone or tablet stand
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Lamicall! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Desk stands are an easy upgrade my readers ask about. I'd love to review a phone or tablet stand: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-28'::date),
($tbd$DM Native Union (@nativeunion)$tbd$, $tbd$Instagram: @nativeunion (check for the blue ✓)
Ask for: a charging cable or desk charger
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Native Union team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I love gear that makes a desk look cleaner, and your design is a great fit. I'd love to review a charging cable or desk charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-28'::date),
($tbd$DM Mous (@mous)$tbd$, $tbd$Instagram: @mous (check for the blue ✓)
Ask for: a case for my iPhone 15 Plus
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Mous team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Drop-tested cases make for great Short content. I'd love to review a case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-29'::date),
($tbd$DM totallee (@totallee)$tbd$, $tbd$Instagram: @totallee (check for the blue ✓)
Ask for: a thin case for my iPhone 15 Plus
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey totallee! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Plenty of my readers want protection without bulk, and that's your whole thing. I'd love to review a thin case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-29'::date),
($tbd$DM CASEKOO$tbd$, $tbd$Instagram: search "CASEKOO" on Instagram, pick the blue ✓ account
Ask for: a MagSafe case for my iPhone 15 Plus
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi CASEKOO team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I'm reviewing the iPhone 15 Plus long-term and want a case pick that's good value. I'd love to review a MagSafe case for my iPhone 15 Plus: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-30'::date),
($tbd$DM SmallRig$tbd$, $tbd$Instagram: search "SmallRig" on Instagram, pick the blue ✓ account
Ask for: a phone cage or grip
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi SmallRig team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I film everything on my phone and want to show how a rig levels it up. I'd love to review a phone cage or grip: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-11-30'::date),
($tbd$DM NEEWER$tbd$, $tbd$Instagram: search "NEEWER" on Instagram, pick the blue ✓ account
Ask for: a small LED light or ring light
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey NEEWER! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Lighting is the biggest upgrade in my indoor Shorts. I'd love to review a small LED light or ring light: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-01'::date),
($tbd$DM Hohem$tbd$, $tbd$Instagram: search "Hohem" on Instagram, pick the blue ✓ account
Ask for: a phone gimbal
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Hohem team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Smooth phone footage is something every small creator asks me about. I'd love to review a phone gimbal: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-01'::date),
($tbd$DM Hollyland$tbd$, $tbd$Instagram: search "Hollyland" on Instagram, pick the blue ✓ account
Ask for: a Lark wireless mic
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Hollyland team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Clean audio is the biggest weakness in phone videos, and I'd love to show the fix. I'd love to review a Lark wireless mic: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-02'::date),
($tbd$DM Saramonic$tbd$, $tbd$Instagram: search "Saramonic" on Instagram, pick the blue ✓ account
Ask for: a wireless mic for my phone
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Saramonic! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm testing phone mics for small creators who film like I do. I'd love to review a wireless mic for my phone: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-02'::date),
($tbd$DM BOYA$tbd$, $tbd$Instagram: search "BOYA" on Instagram, pick the blue ✓ account
Ask for: a wireless mic for my phone
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi BOYA team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Budget mics that actually sound good are a perfect 'worth it?' story. I'd love to review a wireless mic for my phone: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-03'::date),
($tbd$DM Lume Cube (@lumecube)$tbd$, $tbd$Instagram: @lumecube (check for the blue ✓)
Ask for: a panel or video conference light
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Lume Cube team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Lighting makes the biggest difference in my indoor Shorts. I'd love to review a panel or video conference light: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-03'::date),
($tbd$DM Moment (@moment)$tbd$, $tbd$Instagram: @moment (check for the blue ✓)
Ask for: a mobile lens or phone filter mount
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Moment! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I shoot on an iPhone and want to show what a real lens adds. I'd love to review a mobile lens or phone filter mount: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-04'::date),
($tbd$DM ZHIYUN$tbd$, $tbd$Instagram: search "ZHIYUN" on Instagram, pick the blue ✓ account
Ask for: a Smooth phone gimbal
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi ZHIYUN team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Smooth phone footage is what small creators ask me about most. I'd love to review a Smooth phone gimbal: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-04'::date),
($tbd$DM Lofree$tbd$, $tbd$Instagram: search "Lofree" on Instagram, pick the blue ✓ account
Ask for: the Flow keyboard
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Lofree team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Low-profile keyboards are having a moment and my desk Shorts are perfect for it. I'd love to review the Flow keyboard: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-05'::date),
($tbd$DM EPOMAKER$tbd$, $tbd$Instagram: search "EPOMAKER" on Instagram, pick the blue ✓ account
Ask for: a mechanical keyboard
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey EPOMAKER! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Affordable mechanical keyboards are a great 'worth it or a waste?' test. I'd love to review a mechanical keyboard: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-05'::date),
($tbd$DM Quntis$tbd$, $tbd$Instagram: search "Quntis" on Instagram, pick the blue ✓ account
Ask for: a monitor light bar
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Quntis team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Desk lighting is an upgrade my readers keep asking about. I'd love to review a monitor light bar: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-06'::date),
($tbd$DM Orbitkey (@orbitkey)$tbd$, $tbd$Instagram: @orbitkey (check for the blue ✓)
Ask for: a desk mat or key organiser
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Orbitkey team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm doing a desk and everyday-carry series and your gear fits it perfectly. I'd love to review a desk mat or key organiser: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-06'::date),
($tbd$DM Twelve South (@twelvesouth)$tbd$, $tbd$Instagram: @twelvesouth (check for the blue ✓)
Ask for: a stand or charger for my Apple setup
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Twelve South! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Apple desk accessories are a big part of my coverage. I'd love to review a stand or charger for my Apple setup: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-07'::date),
($tbd$DM Bellroy (@bellroy)$tbd$, $tbd$Instagram: @bellroy (check for the blue ✓)
Ask for: a tech kit or organiser
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Bellroy team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I'm doing a 'what's in my creator bag' Short and want gear worth recommending. I'd love to review a tech kit or organiser: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-07'::date),
($tbd$DM Wyze (@wyzecam)$tbd$, $tbd$Instagram: @wyzecam (check for the blue ✓)
Ask for: a security camera
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Wyze team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Budget smart home gear is one of my readers' favourite topics. I'd love to review a security camera: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-08'::date),
($tbd$DM Aqara$tbd$, $tbd$Instagram: search "Aqara" on Instagram, pick the blue ✓ account
Ask for: a smart home starter kit
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Aqara! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm building a 'smart home under $100' series. I'd love to review a smart home starter kit: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-08'::date),
($tbd$DM SwitchBot$tbd$, $tbd$Instagram: search "SwitchBot" on Instagram, pick the blue ✓ account
Ask for: a SwitchBot or curtain robot
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi SwitchBot team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Gadgets that make a dumb home smart are perfect Short content. I'd love to review a SwitchBot or curtain robot: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-09'::date),
($tbd$DM Pebblebee (@pebblebee)$tbd$, $tbd$Instagram: @pebblebee (check for the blue ✓)
Ask for: your trackers
Tip: Canadian brand: mention you're in Toronto.
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Pebblebee team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I just made a Short on trackers that work with both Find My and Find Hub, and you're a great fit for the follow-up. I'd love to review your trackers: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-09'::date),
($tbd$DM Amazfit (@amazfit)$tbd$, $tbd$Instagram: @amazfit (check for the blue ✓)
Ask for: a smartwatch
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Amazfit! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'm comparing affordable smartwatches against the Apple Watch for my readers. I'd love to review a smartwatch: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-10'::date),
($tbd$DM RingConn$tbd$, $tbd$Instagram: search "RingConn" on Instagram, pick the blue ✓ account
Ask for: a smart ring
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi RingConn team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. I just covered Oura vs Ultrahuman, and readers want a cheaper option without a subscription. I'd love to review a smart ring: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-10'::date),
($tbd$DM Mobvoi$tbd$, $tbd$Instagram: search "Mobvoi" on Instagram, pick the blue ✓ account
Ask for: a TicWatch
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Mobvoi team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Wear OS watches are a gap in my coverage I'd love to fill. I'd love to review a TicWatch: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-11'::date),
($tbd$DM 8BitDo$tbd$, $tbd$Instagram: search "8BitDo" on Instagram, pick the blue ✓ account
Ask for: a controller
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey 8BitDo! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Retro-style controllers make great, fun Shorts. I'd love to review a controller: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-11'::date),
($tbd$DM GameSir$tbd$, $tbd$Instagram: search "GameSir" on Instagram, pick the blue ✓ account
Ask for: a mobile controller
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi GameSir team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Phone gaming gear is a fun 'worth it or a waste?' test. I'd love to review a mobile controller: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-12'::date),
($tbd$DM JSAUX$tbd$, $tbd$Instagram: search "JSAUX" on Instagram, pick the blue ✓ account
Ask for: a dock or accessory for handheld gaming PCs
Tip: Also join their affiliate program (anyone can apply).
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi JSAUX team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I just covered the ROG Xbox Ally, so your accessories fit right in. I'd love to review a dock or accessory for handheld gaming PCs: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-12'::date),
($tbd$DM EMEET$tbd$, $tbd$Instagram: search "EMEET" on Instagram, pick the blue ✓ account
Ask for: a webcam or conference mic
Tip: Also apply via their Influencer Recruitment page (free products if selected).
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey EMEET! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Work-from-home gear is a big part of what my readers buy. I'd love to review a webcam or conference mic: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-13'::date),
($tbd$DM Baseus$tbd$, $tbd$Instagram: search "Baseus" on Instagram, pick the blue ✓ account
Ask for: a power bank or charger
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Baseus team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Charging gear with real-world numbers is one of my most popular topics. I'd love to review a power bank or charger: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-13'::date),
($tbd$DM Shokz (@shokz)$tbd$, $tbd$Instagram: @shokz (check for the blue ✓)
Ask for: open-ear headphones
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Shokz team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? Open-ear audio is a hot category and my readers want an honest take. I'd love to review open-ear headphones: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-14'::date),
($tbd$DM XREAL$tbd$, $tbd$Instagram: search "XREAL" on Instagram, pick the blue ✓ account
Ask for: AR glasses
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey XREAL! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? Display glasses are one of the most-asked-about gadgets this year. I'd love to review AR glasses: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-14'::date),
($tbd$DM VITURE$tbd$, $tbd$Instagram: search "VITURE" on Instagram, pick the blue ✓ account
Ask for: XR glasses
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi VITURE team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Display glasses are one of the most-asked-about gadgets this year. I'd love to review XR glasses: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-15'::date),
($tbd$DM KUXIU$tbd$, $tbd$Instagram: search "KUXIU" on Instagram, pick the blue ✓ account
Ask for: a MagSafe stand
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi KUXIU team! I'm Dave from TechByDave (techbydave.com), a tech reviewer in Toronto. My whole channel asks one question: is it worth it, or a waste? I'm testing MagSafe desk gear for my iPhone setup. I'd love to review a MagSafe stand: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-15'::date),
($tbd$DM Insta360 (@insta360)$tbd$, $tbd$Instagram: @insta360 (check for the blue ✓)
Ask for: an action or pocket camera
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hey Insta360! Dave here from TechByDave (techbydave.com). I'm a Toronto tech reviewer and every video I make answers one question: worth it, or a waste? I'd love to show what a creator can do beyond a phone. I'd love to review an action or pocket camera: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-16'::date),
($tbd$DM Lexar$tbd$, $tbd$Instagram: search "Lexar" on Instagram, pick the blue ✓ account
Ask for: a portable SSD for my video edits
Before sending: follow them and like 2 or 3 recent posts.

DM to send:
Hi Lexar team! I'm Dave, the tech reviewer behind TechByDave (techbydave.com) in Toronto. I make honest 'worth it or a waste?' reviews of gadgets people actually buy. Fast storage for phone creators is a gap in my coverage. I'd love to review a portable SSD for my video edits: a hands-on review on my site plus a Short on Instagram, TikTok and YouTube, with footage you're free to repost. Who's the best person to talk to? Media kit: techbydave.com/media-kit.html$tbd$, 'Instagram', 'planned', '2026-12-16'::date)
) as v(title, notes, platform, status, due)
where not exists (select 1 from public.ideas where title like 'DM %' and notes like '%Media kit: techbydave.com%');
