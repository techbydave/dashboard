// WebCreator: Dave's freelance website business (webcreator.techbydave.com).
// Pure data and helpers (no DOM), so they can be unit tested.
// Client work is stored in the ideas table (platform "WebCreator" or "Client"),
// and the business numbers in the metrics table under source "webcreator",
// so this page needs no database changes.

export const WC_SOURCE = "webcreator";
export const WC_SITE = "https://webcreator.techbydave.com";

export const WC_LINKS = [
  ["Website", WC_SITE],
  ["Fiverr", "https://www.fiverr.com/techbydave"],
  ["Upwork", "https://www.upwork.com/nx/find-work/"],
  ["Instagram", "https://www.instagram.com/webcreator.dave/"],
  ["Buffer", "https://publish.buffer.com/"],
  ["GitHub repo", "https://github.com/techbydave/webcreator"],
  ["Search Console", "https://search.google.com/search-console"],
];

// Running totals you type in now and then; the page shows the latest value and the change over 30 days.
export const WC_NUMBERS = [
  { metric: "ig_followers", label: "Instagram followers", hint: "@webcreator.dave", money: false },
  { metric: "clients", label: "Clients so far", hint: "Paid projects, all time", money: false },
  { metric: "earned", label: "Earned so far", hint: "CAD, all time", money: true },
  { metric: "reviews", label: "Reviews", hint: "Fiverr + Upwork", money: false },
];

// Same four stages as the ideas board, named for client work.
export const WC_STAGES = [["idea", "Leads"], ["planned", "Booked"], ["filming", "Building"], ["posted", "Delivered"]];

export const WC_PLATFORMS = new Set(["WebCreator", "Client"]);
export const isClientWork = (idea) => WC_PLATFORMS.has(idea?.platform);

export const WC_OFFER = {
  package: ["Website redesign", "Dashboard: emails, appointments, website visits", "Google Business Profile + SEO", "Professional email", "Flyers and business cards"],
  addons: ["Instagram launch content kit", "Google review requests", "Appointment reminders", "AI assistant"],
};

// Group client work by stage, soonest due date first.
export function clientBoard(ideas) {
  const work = ideas.filter(isClientWork);
  return WC_STAGES.map(([key, label]) => ({
    key, label,
    items: work.filter((i) => i.status === key).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")),
  }));
}
