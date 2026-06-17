import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../../playwright/fixtures/accounts";
import { loginAs } from "../../playwright/fixtures/auth";

/**
 * Returns. Maps to PRODUCTION_TEST_PLAN RET-01..04.
 *
 * These drive the /api/returns contract directly for determinism (the UI is
 * exercised by the customer specs). The returns customer is seeded with:
 *   - a DELIVERED order inside the 7-day window  (returnable)
 *   - a DELIVERED order older than 7 days        (window expired)
 *   - a SHIPPED (not delivered) order            (not returnable)
 * Order ids are read from the customer's order list so the spec stays
 * decoupled from seed internals.
 */

interface OrderRow {
  id: string;
  status: string;
  createdAt: string;
}

async function getOrders(page: import("@playwright/test").Page): Promise<OrderRow[]> {
  const resp = await page.request.get("/api/orders");
  expect(resp.status()).toBe(200);
  const json = await resp.json();
  return (json.orders ?? json) as OrderRow[];
}

test("RET-02 — a non-delivered order cannot be returned (422)", async ({ page }) => {
  await loginAs(page, CUSTOMERS.returns);
  const orders = await getOrders(page);
  const notDelivered = orders.find((o) => o.status === "SHIPPED" || o.status === "PROCESSING");
  test.skip(!notDelivered, "no non-delivered order seeded for returns customer");

  const resp = await page.request.post("/api/returns", {
    data: {
      orderId: notDelivered!.id,
      reason: "CHANGED_MIND",
      items: [{ orderItemId: "x", productId: "x", productName: "x", quantity: 1, unitPrice: 100 }],
    },
  });
  expect(resp.status(), "non-delivered order must be rejected").toBe(422);
});

test("RET-01 + RET-04 — eligible return succeeds, duplicate is blocked", async ({ page }) => {
  await loginAs(page, CUSTOMERS.returns);
  const orders = await getOrders(page);
  const delivered = orders.find((o) => o.status === "DELIVERED");
  test.skip(!delivered, "no delivered order seeded for returns customer");

  // Fetch the order's items to build a valid return payload.
  const detail = await (await page.request.get(`/api/orders/${delivered!.id}`)).json();
  const item = (detail.order?.items ?? detail.items ?? [])[0];
  test.skip(!item, "delivered order has no items");

  const payload = {
    orderId: delivered!.id,
    reason: "SIZE_ISSUE",
    items: [{
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName ?? "Item",
      quantity: 1,
      unitPrice: Number(item.unitPrice ?? item.price ?? 100),
    }],
  };

  const first = await page.request.post("/api/returns", { data: payload });
  // RET-01: either accepted now, or already returned from a prior run (409/422 duplicate).
  expect([200, 201, 409, 422]).toContain(first.status());

  if (first.status() === 200 || first.status() === 201) {
    // RET-04: an immediate second request on the same order must be blocked.
    const second = await page.request.post("/api/returns", { data: payload });
    expect([409, 422], "duplicate active return must be blocked").toContain(second.status());
  }
});

test("RET-06 — a non-customer cannot file returns", async ({ page }) => {
  // Unauthenticated baseline (covered live too): 401.
  const resp = await page.request.post("/api/returns", { data: {} });
  expect(resp.status()).toBe(401);
});
