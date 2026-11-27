import assert from "node:assert/strict";
import test from "node:test";
import { loadDashboard } from "../solar-opara-static/dashboard.js";

const now = new Date("2026-11-28T01:30:00Z");
const contract = (id, status, event_date) => ({ id, event_date, status, event_name: id });
const parcel = (id, contract_id, amount, due_date, status = "pending") => ({ id, contract_id, amount, due_date, status });
const receipt = (id, receivable_id, amount, paid_at, reversed = false) => ({ id, receivable_id, amount, paid_at, reversed });
const expense = (id, amount, expense_date) => ({ id, amount, expense_date });

const records = {
  so_contracts: [
    contract("active", "active", "2027-02-04"),
    contract("previous", "completed", "2026-09-15"),
    contract("cancelled", "cancelled", "2027-12-14"),
    contract("draft", "draft", "2028-01-14"),
  ],
  so_receivables: [
    parcel("a", "active", 1000, "2026-12-10"),
    parcel("b", "active", 55, "2026-11-27"),
    parcel("c", "active", 100, "2026-11-20"),
    parcel("d", "active", 80, null),
    parcel("e", "active", 200, "2027-06-18"),
    parcel("f", "active", 400, "2027-06-19"),
    parcel("g", "active", 100, "2027-02-09"),
    parcel("h", "cancelled", 99, "2027-02-09"),
    parcel("i", "draft", 2000, "2027-02-09"),
    parcel("j", "previous", 150, "2027-04-10"),
    parcel("k", "active", 800, "2027-02-09", "cancelled"),
  ],
  so_payments: [
    receipt("a", "a", 300, "2026-11-03T15:00:00Z"),
    receipt("b", "a", 100, "2026-11-03T15:00:00Z", true),
    receipt("c", "c", 40, "2026-11-28T00:50:00Z"),
    receipt("d", "g", 70, "2027-03-06T15:00:00Z"),
    receipt("e", "f", 10, "2027-07-06T15:00:00Z"),
  ],
  so_expenses: [
    expense("a", 75, "2026-11-27"),
    expense("b", 120, "2026-12-11"),
    expense("c", 50, "2027-06-18"),
    expense("d", 250, "2027-06-19"),
  ],
  so_legacy_events: [
    { id: 1, event_date: "2027-02-04", description: "Registro de planilha na mesma data" },
    { id: 2, event_date: "2027-05-12", description: "Compromisso importado" },
  ],
  so_booking_requests: [
    { id: "a", event_date: "2027-06-18", event_type: "Casamento", status: "approved" },
    { id: "b", event_date: "2027-07-06", event_type: "Evento", status: "new" },
  ],
};

function fakeClient(tables, failed) {
  return {
    from(table) {
      let rows = [...tables[table]].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      let count;
      let pageSize;
      return {
        select(_columns, options) { if (options?.count) count = true; return this; },
        order() { return this; },
        limit(value) { pageSize = Math.min(2, value); return this; },
        eq(field, value) { rows = rows.filter(row => row[field] === value); return this; },
        in(field, values) { rows = rows.filter(row => values.includes(row[field])); return this; },
        gt(field, value) { rows = rows.filter(row => row[field] > value); return this; },
        gte(field, value) { rows = rows.filter(row => row[field] >= value); return this; },
        then(resolve) {
          resolve(table === failed ? { error: new Error("Unavailable") } : { data: rows.slice(0, pageSize), count: count ? rows.length : null });
        },
      };
    },
  };
}

test("projects recorded balances through the latest scheduled date without counting a receipt twice", async () => {
  const model = await loadDashboard(fakeClient(records), now);
  const { forecast } = model;
  assert.equal(model.today, "2026-11-27");
  assert.equal(forecast.lastDay, "2027-06-18");
  assert.deepEqual(model.cash, { received: 34000, spent: 7500 });
  assert.deepEqual(forecast.finance, {
    opening: 26500, received: 120500, spent: 17000, result: 103500, closing: 130000,
    overdue: 6000, undated: 8000, afterEnd: 40000,
  });
  assert.equal(forecast.agendaOnlyDays, 2);
  const february = forecast.months.find(month => month.key === "2027-02");
  assert.equal(february.contractedDays, 1);
  assert.equal(february.days.length, 1);
  assert.equal(february.days[0].events.length, 2);
  assert.equal(february.received, 3000);
  assert.equal(forecast.months.find(month => month.key === "2027-03").received, 7000);
  assert.equal(forecast.months.at(-1).closing, forecast.finance.closing);
  assert.equal(model.activity.length, 3);
});

test("handles an incomplete calendar or incomplete finance and preserves the available data", async () => {
  const incompleteCalendar = await loadDashboard(fakeClient(records, "so_legacy_events"), now);
  assert.equal(incompleteCalendar.forecast.state, "unavailable");
  const incompleteFinance = await loadDashboard(fakeClient(records, "so_expenses"), now);
  assert.equal(incompleteFinance.forecast.lastDay, "2027-06-18");
  assert.equal(incompleteFinance.forecast.finance, null);
  const empty = Object.fromEntries(Object.keys(records).map(table => [table, []]));
  assert.equal((await loadDashboard(fakeClient(empty), now)).forecast.state, "empty");
});
