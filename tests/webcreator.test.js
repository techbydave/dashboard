import test from "node:test";
import assert from "node:assert/strict";
import { clientBoard, isClientWork, WC_STAGES, WC_NUMBERS } from "../assets/webcreator.js";

const ideas = [
  { id: "1", title: "Bakery site", platform: "Client", status: "filming", due: "2026-12-10" },
  { id: "2", title: "Dentist lead", platform: "WebCreator", status: "idea", due: null },
  { id: "3", title: "Pixel review", platform: "Blog", status: "idea", due: "2026-12-01" },
  { id: "4", title: "Salon site", platform: "WebCreator", status: "filming", due: "2026-12-03" },
];

test("only WebCreator and Client items count as client work", () => {
  assert.deepEqual(ideas.filter(isClientWork).map((i) => i.id), ["1", "2", "4"]);
  assert.equal(isClientWork(undefined), false);
});

test("client board keeps every stage and sorts by due date", () => {
  const b = clientBoard(ideas);
  assert.deepEqual(b.map((c) => c.key), WC_STAGES.map(([k]) => k));
  assert.deepEqual(b.find((c) => c.key === "filming").items.map((i) => i.id), ["4", "1"]);
  assert.deepEqual(b.find((c) => c.key === "idea").items.map((i) => i.id), ["2"]);
});

test("metric names fit the metrics table (30 characters max)", () => {
  for (const n of WC_NUMBERS) assert.ok(n.metric.length <= 30);
});
