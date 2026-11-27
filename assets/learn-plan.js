// Learn to code: an 8-month, 1-hour-a-day, Monday-to-Friday plan.
// HTML & CSS -> JavaScript -> SQL -> Python -> Swift -> a final project.
// Pure data and helpers (no DOM), so they can be unit tested.

export const LEARN_START = "2026-11-30"; // Monday

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const PHASES = [
  {
    key: "web", name: "HTML & CSS", color: "#ff7a45", weeks: [1, 3],
    why: "The building blocks of every web page, including your blog and this dashboard.",
    tools: [
      ["VS Code (free code editor)", "https://code.visualstudio.com"],
      ["MDN: Learn web development", "https://developer.mozilla.org/en-US/docs/Learn_web_development"],
      ["freeCodeCamp: Responsive Web Design", "https://www.freecodecamp.org/learn"],
      ["Flexbox Froggy (game)", "https://flexboxfroggy.com"],
      ["Grid Garden (game)", "https://cssgridgarden.com"],
      ["GitHub Pages (free hosting)", "https://pages.github.com"],
    ],
    videos: [
      ["HTML in 100 Seconds (Fireship)", yt("HTML in 100 Seconds Fireship")],
      ["CSS in 100 Seconds (Fireship)", yt("CSS in 100 Seconds Fireship")],
      ["HTML & CSS Full Course (SuperSimpleDev)", yt("SuperSimpleDev HTML CSS full course beginner to pro")],
    ],
  },
  {
    key: "js", name: "JavaScript", color: "#f7c948", weeks: [4, 12],
    why: "Makes web pages do things. Your dashboard runs on it, and it's the path to your own apps.",
    tools: [
      ["javascript.info (the best free JS book)", "https://javascript.info"],
      ["The Odin Project: Foundations", "https://www.theodinproject.com"],
      ["freeCodeCamp: JavaScript", "https://www.freecodecamp.org/learn"],
      ["GitHub Desktop (save your code)", "https://desktop.github.com"],
    ],
    videos: [
      ["JavaScript in 100 Seconds (Fireship)", yt("JavaScript in 100 Seconds Fireship")],
      ["JavaScript Full Course (SuperSimpleDev)", yt("SuperSimpleDev JavaScript full course beginner to pro")],
      ["Git Explained in 100 Seconds (Fireship)", yt("Git Explained in 100 Seconds Fireship")],
    ],
  },
  {
    key: "sql", name: "SQL", color: "#4fc3f7", weeks: [13, 15],
    why: "The language for asking databases questions, like the Supabase database behind this dashboard.",
    tools: [
      ["SQLBolt (interactive lessons)", "https://sqlbolt.com"],
      ["Khan Academy: Intro to SQL", "https://www.khanacademy.org/computing/computer-programming/sql"],
      ["Supabase docs", "https://supabase.com/docs"],
    ],
    videos: [
      ["SQL Explained in 100 Seconds (Fireship)", yt("SQL Explained in 100 Seconds Fireship")],
      ["SQL Full Database Course (freeCodeCamp)", yt("freeCodeCamp SQL tutorial full database course for beginners")],
    ],
  },
  {
    key: "py", name: "Python", color: "#3ddc97", weeks: [16, 24],
    why: "The easiest language to read, and the main one for AI and automating boring tasks.",
    tools: [
      ["CS50P: Harvard's free Python course", "https://cs50.harvard.edu/python/"],
      ["Python (download)", "https://www.python.org/downloads/"],
      ["VS Code Python extension", "https://code.visualstudio.com/docs/python/python-tutorial"],
    ],
    videos: [
      ["Python in 100 Seconds (Fireship)", yt("Python in 100 Seconds Fireship")],
      ["CS50P lectures (Harvard)", yt("CS50P 2022 lecture 0 functions variables")],
    ],
  },
  {
    key: "swift", name: "Swift", color: "#ff6b6b", weeks: [25, 33],
    why: "Apple's language for iPhone apps, the way to get Covered onto the App Store.",
    note: "Building iPhone apps needs a Mac with Xcode (free). No Mac? Days 1–15 (the Swift language) work in the free online playground at swiftfiddle.com.",
    tools: [
      ["100 Days of SwiftUI (Hacking with Swift)", "https://www.hackingwithswift.com/100/swiftui"],
      ["Xcode (free, Mac only)", "https://developer.apple.com/xcode/"],
      ["SwiftFiddle (online Swift playground)", "https://swiftfiddle.com"],
    ],
    videos: [
      ["Swift in 100 Seconds (Fireship)", yt("Swift in 100 Seconds Fireship")],
      ["100 Days of SwiftUI videos (Paul Hudson)", yt("Hacking with Swift 100 days of SwiftUI day 1")],
    ],
  },
  {
    key: "final", name: "Final project", color: "#b388ff", weeks: [34, 35],
    why: "Put it all together and show it off.",
    tools: [["GitHub Pages (free hosting)", "https://pages.github.com"]],
    videos: [],
  },
];

// One entry per week: [title, [Mon, Tue, Wed, Thu, Fri]].
export const WEEKS = [
  // HTML & CSS
  ["HTML basics", [
    "Install VS Code and the Live Server extension. Watch \"HTML in 100 Seconds\". Make index.html that says hello.",
    "Headings, paragraphs, links and images. Add a photo and a link to your YouTube.",
    "Lists and tables. Make a table of 3 gadgets with price and verdict.",
    "Forms: inputs, buttons, labels. Build a newsletter sign-up form (it doesn't need to send yet).",
    "Build: an \"About Dave\" page using everything from this week.",
  ]],
  ["CSS basics", [
    "Selectors, colours and fonts. Style your About page with your brand colours.",
    "The box model: margin, padding, border. Space everything out properly.",
    "Flexbox: put things side by side and centre them.",
    "Play Flexbox Froggy to the end.",
    "Build: restyle your About page so it looks like a real site.",
  ]],
  ["Layout and phones", [
    "CSS Grid. Play Grid Garden.",
    "Responsive design: media queries so the page works on a phone.",
    "CSS variables and a dark/light theme, like your dashboard.",
    "Build: start a links-in-bio page (YouTube, TikTok, Instagram, newsletter).",
    "Finish it and publish it free with GitHub Pages. You have a live site!",
  ]],
  // JavaScript
  ["JavaScript first steps", [
    "Watch \"JavaScript in 100 Seconds\". Open the browser console and run your first lines.",
    "Variables and types: let, const, strings, numbers, true/false.",
    "Working with strings and numbers: join text, round prices.",
    "Decisions: if / else and comparisons.",
    "Mini build: a tip calculator in the console.",
  ]],
  ["Functions and loops", [
    "Functions: write one that adds 13% HST to a price.",
    "Loops: for and while. Count to 100, print every gadget in a list.",
    "Arrays: make a list of gadgets, add and remove items.",
    "Practice: 3 small exercises on arrays and loops (freeCodeCamp).",
    "Holiday. Rest. Happy New Year!",
  ]],
  ["Objects", [
    "Catch-up: re-read your notes from the last two weeks.",
    "Objects: describe a gadget with name, price, rating.",
    "Array methods: map, filter, find. Filter gadgets under $100.",
    "Review weak spots. Redo one exercise you struggled with.",
    "Practice: 3 small exercises on objects and array methods (freeCodeCamp).",
  ]],
  ["Making pages interactive (the DOM)", [
    "Select elements on a page and change their text.",
    "Change styles and classes from JavaScript.",
    "Events: react to clicks and typing.",
    "Read form values with JavaScript.",
    "Build: a gadget price calculator page (price + tax + shipping).",
  ]],
  ["Build week: to-do app", [
    "Plan a to-do app on paper: what it shows, what buttons it has.",
    "Add and remove to-dos.",
    "Save them with localStorage so they survive a refresh.",
    "Style it and make it work on your phone.",
    "Publish it on GitHub Pages.",
  ]],
  ["Getting data from the internet", [
    "What an API and JSON are. Look at a JSON file in your browser.",
    "fetch(): load data from a free public API.",
    "async / await: the clean way to wait for data.",
    "Handle errors with try / catch.",
    "Build: a page that shows live data from a free API.",
  ]],
  ["Tools pros use", [
    "Modules: import and export between files.",
    "Watch \"Git in 100 Seconds\". Install GitHub Desktop.",
    "Put all your projects on GitHub with commits.",
    "Read real code: open your dashboard's goals.js on GitHub and explain each function to yourself.",
    "Debugging: breakpoints and the console in DevTools.",
  ]],
  ["Project: Covered prototype", [
    "Design the data: product, purchase date, warranty length.",
    "A form to add a product.",
    "Work out days left on each warranty.",
    "Sort by soonest to expire and highlight anything ending this month.",
    "Save to localStorage and publish.",
  ]],
  ["JavaScript review", [
    "freeCodeCamp JavaScript challenges.",
    "More challenges. Aim for 5 today.",
    "Clean up Covered's code: better names, smaller functions.",
    "Write a README for Covered.",
    "Film a Short: \"I learned JavaScript in 9 weeks. Here's what I built.\"",
  ]],
  // SQL
  ["SQL: reading data", [
    "Watch \"SQL in 100 Seconds\". SQLBolt lesson 1 (SELECT).",
    "SQLBolt lessons 2–3: filtering with WHERE.",
    "SQLBolt lessons 4–5: ORDER BY, LIMIT, review.",
    "Open your Supabase SQL editor and SELECT from your ideas table (read only, no changes).",
    "Quiz yourself: write 5 queries from memory.",
  ]],
  ["SQL: combining data", [
    "SQLBolt lessons 6–7: JOINs.",
    "SQLBolt lessons 10–11: COUNT, SUM, GROUP BY.",
    "Practice on Supabase: count your ideas by status (read only).",
    "SQLBolt lessons 13–15: INSERT, UPDATE, DELETE (in SQLBolt, not your real database).",
    "Khan Academy Intro to SQL: first project.",
  ]],
  ["SQL: your own database", [
    "SQLBolt lessons 16–18: CREATE TABLE and data types.",
    "Design tables for Covered on paper: products and warranties.",
    "Make a new free Supabase project (separate from the dashboard) and create the tables.",
    "Connect Covered to it with supabase-js so data is saved online.",
    "Review the whole SQL phase and write a cheat sheet in Notes.",
  ]],
  // Python (CS50P)
  ["Python: functions and variables", [
    "Install Python. Watch \"Python in 100 Seconds\". Start CS50P lecture 0.",
    "Finish lecture 0 and take notes.",
    "CS50P problem set 0, first half.",
    "Problem set 0, second half.",
    "Mini build: a script that turns a price in USD into CAD.",
  ]],
  ["Python: conditionals", [
    "CS50P lecture 1 (conditionals), first half.",
    "Finish lecture 1.",
    "Problem set 1, first half.",
    "Problem set 1, second half.",
    "Mini build: a \"worth it or a waste?\" quiz in the terminal.",
  ]],
  ["Python: loops", [
    "CS50P lecture 2 (loops), first half.",
    "Finish lecture 2.",
    "Problem set 2, first half.",
    "Problem set 2, second half.",
    "Mini build: print a table of gadgets and prices from a list.",
  ]],
  ["Python: exceptions", [
    "CS50P lecture 3 (exceptions).",
    "Finish lecture 3.",
    "Problem set 3, first half.",
    "Problem set 3, second half.",
    "Mini build: make one of your scripts handle bad input without crashing.",
  ]],
  ["Python: libraries", [
    "CS50P lecture 4 (libraries).",
    "Finish lecture 4.",
    "Problem set 4, first half.",
    "Problem set 4, second half.",
    "Mini build: use the requests library to download a web page.",
  ]],
  ["Python: unit tests", [
    "CS50P lecture 5 (unit tests).",
    "Finish lecture 5.",
    "Problem set 5, first half.",
    "Problem set 5, second half.",
    "Mini build: write tests for your USD-to-CAD script.",
  ]],
  ["Python: files", [
    "CS50P lecture 6 (file I/O).",
    "Finish lecture 6.",
    "Problem set 6, first half.",
    "Problem set 6, second half.",
    "Mini build: a script that renames your Shorts video files neatly.",
  ]],
  ["Python: regular expressions", [
    "CS50P lecture 7 (regular expressions).",
    "Finish lecture 7.",
    "Problem set 7, first half.",
    "Problem set 7, second half.",
    "Mini build: pull every price ($...) out of a blog post.",
  ]],
  ["Python: objects", [
    "CS50P lecture 8 (object-oriented programming).",
    "Finish lecture 8.",
    "Problem set 8.",
    "Plan a small Python tool for your channel.",
    "Build it. Example: count words and links in every blog post.",
  ]],
  // Swift (100 Days of SwiftUI)
  ["Swift basics 1", [
    "Read the Swift note above (Mac vs no Mac). Watch \"Swift in 100 Seconds\". Install Xcode or open SwiftFiddle.",
    "100 Days of SwiftUI: day 1 (variables, constants, numbers).",
    "Day 2 (booleans, string interpolation, checkpoint 1).",
    "Day 3 (arrays, dictionaries, sets, enums).",
    "Days 4–5 (type annotations, conditions).",
  ]],
  ["Swift basics 2", [
    "Day 6 (loops).",
    "Day 7 (functions, part 1).",
    "Day 8 (functions, part 2).",
    "Day 9 (closures).",
    "Day 10 (structs, part 1).",
  ]],
  ["Swift basics 3", [
    "Day 11 (structs, part 2).",
    "Day 12 (classes).",
    "Day 13 (protocols and extensions).",
    "Day 14 (optionals).",
    "Day 15 (Swift review). The Swift language is done!",
  ]],
  ["First SwiftUI apps", [
    "Days 16–17: WeSplit (a bill-splitting app).",
    "Day 18: WeSplit wrap-up.",
    "Day 19: challenge day.",
    "Days 20–21: Guess the Flag.",
    "Day 22: Guess the Flag wrap-up.",
  ]],
  ["Views and more apps", [
    "Days 23–24: views and modifiers.",
    "Day 25: milestone.",
    "Days 26–27: BetterRest.",
    "Day 28: BetterRest wrap-up.",
    "Days 29–30: Word Scramble.",
  ]],
  ["Animation and data", [
    "Day 31: Word Scramble wrap-up.",
    "Days 32–33: animation.",
    "Day 34: animation wrap-up.",
    "Days 35–36: challenge and iExpense start.",
    "Days 37–38: iExpense.",
  ]],
  ["Bigger apps", [
    "Days 39–40: Moonshot.",
    "Days 41–42: Moonshot wrap-up.",
    "Days 43–44: navigation.",
    "Days 45–46: navigation wrap-up.",
    "Day 47: milestone.",
  ]],
  ["Saving data", [
    "Days 49–50: Cupcake Corner.",
    "Days 51–52: Cupcake Corner wrap-up.",
    "Days 53–54: Bookworm (SwiftData).",
    "Day 55–56: Bookworm wrap-up.",
    "Review: rebuild one screen from memory.",
  ]],
  ["Covered for iPhone", [
    "Plan Covered as an iPhone app: screens and data.",
    "Build the product list screen.",
    "Build the add-product form.",
    "Show days left and sort by soonest.",
    "Save with SwiftData and test on your iPhone.",
  ]],
  // Final project
  ["Final project", [
    "Pick your final project: finish Covered (web or iPhone), or something new. Plan it.",
    "Build.",
    "Build.",
    "Build and test on your phone.",
    "Polish and publish.",
  ]],
  ["Show it off", [
    "Build a portfolio page (HTML & CSS) listing everything you made.",
    "Write a blog post: \"8 months learning to code\".",
    "Film an on-camera Short about it.",
    "Decide what to learn next and write it in Notes.",
    "You did it. 175 sessions. Celebrate 🎉",
  ]],
];

export const TOTAL = WEEKS.length * 5;

// Weekday stat holidays (Ontario) inside the plan: shown as optional days.
export const HOLIDAYS = {
  "2026-12-25": "Christmas", "2026-12-28": "Boxing Day (observed)", "2027-01-01": "New Year's Day",
  "2027-02-15": "Family Day", "2027-03-26": "Good Friday", "2027-05-24": "Victoria Day", "2027-07-01": "Canada Day",
};

const toUTC = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10);

// Session n (0-based) -> its date.
export function sessionDate(n) {
  const week = Math.floor(n / 5), day = n % 5;
  return isoOf(toUTC(LEARN_START) + (week * 7 + day) * 864e5);
}

// Date -> session index, or null for weekends and dates outside the plan.
export function sessionAt(iso) {
  const diff = Math.round((toUTC(iso) - toUTC(LEARN_START)) / 864e5);
  if (diff < 0) return null;
  const week = Math.floor(diff / 7), day = diff % 7;
  if (day > 4 || week >= WEEKS.length) return null;
  return week * 5 + day;
}

export function session(n) {
  const week = Math.floor(n / 5);
  const [title, days] = WEEKS[week];
  const phase = PHASES.find((p) => week + 1 >= p.weeks[0] && week + 1 <= p.weeks[1]);
  const date = sessionDate(n);
  return { n, week: week + 1, day: n % 5, title, task: days[n % 5], phase, date, holiday: HOLIDAYS[date] || null };
}

// The session to show "today": today's if it's a plan day, else the next one (or the last, when finished).
export function currentSession(today) {
  if (today < LEARN_START) return 0;
  const at = sessionAt(today);
  if (at !== null) return at;
  for (let i = 1; i <= 3; i++) {
    const next = sessionAt(isoOf(toUTC(today) + i * 864e5));
    if (next !== null) return next;
  }
  return TOTAL - 1;
}

// Index of the last plan day on or before `today` (-1 before the start).
function lastIndexBy(today) {
  if (today < LEARN_START) return -1;
  for (let i = 0; i <= 3; i++) {
    const at = sessionAt(isoOf(toUTC(today) - i * 864e5));
    if (at !== null) return at;
  }
  return TOTAL - 1;
}

// Done sessions in a row, counting back from the latest plan day (today only counts once ticked).
export function streak(doneDates, today) {
  const done = new Set(doneDates);
  let i = lastIndexBy(today);
  if (i >= 0 && sessionDate(i) === today && !done.has(today)) i -= 1;
  let n = 0;
  for (; i >= 0 && done.has(sessionDate(i)); i--) n++;
  return n;
}

// Plan days already past (not today) that weren't ticked.
export function missed(doneDates, today) {
  const done = new Set(doneDates);
  const out = [];
  for (let i = 0; i < TOTAL; i++) { const d = sessionDate(i); if (d >= today) break; if (!done.has(d)) out.push(i); }
  return out;
}

export function phaseProgress(phase, doneDates) {
  const done = new Set(doneDates);
  const first = (phase.weeks[0] - 1) * 5, last = phase.weeks[1] * 5;
  let d = 0;
  for (let i = first; i < last; i++) if (done.has(sessionDate(i))) d++;
  return { done: d, total: last - first };
}
