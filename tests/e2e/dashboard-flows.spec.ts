import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const screenshotDir = path.join(process.cwd(), "e2e-artifacts", "screenshots");

/** Set in env for CI/local runs — no defaults (avoids committing demo credentials). */
const shopEmail = process.env.SHOP_EMAIL;
const shopPassword = process.env.SHOP_PASSWORD;
const superEmail = process.env.SUPER_EMAIL;
const superPassword = process.env.SUPER_PASSWORD;

const shopRoutes = [
  "/",
  "/products",
  "/products/new",
  "/inventory",
  "/inventory/new",
  "/warehouses",
  "/warehouses/new",
  "/customers",
  "/customers/new",
  "/vendors",
  "/vendors/new",
  "/purchasing",
  "/purchasing/new",
  "/sales",
  "/sales/new",
  "/employees",
  "/employees/new",
  "/reports",
  "/udhaar/parties",
  "/udhaar/reports",
  "/notifications",
  "/referrals",
  "/settings/profile"
];

const superAdminRoutes = [
  "/",
  "/superadmin/markets",
  "/superadmin/markets/new",
  "/superadmin/businesses",
  "/superadmin/businesses/new",
  "/superadmin/categories",
  "/superadmin/categories/new",
  "/superadmin/requests",
  "/referrals/settings"
];

function routeSlug(route: string) {
  if (route === "/") return "dashboard";
  return route.replace(/^\//, "").replace(/\//g, "-");
}

async function waitForStableScreen(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1200);
}

async function saveFullPage(page: Page, fileName: string) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDir, fileName),
    fullPage: true
  });
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 25_000 }),
    page.getByRole("button", { name: /^sign in$/i }).click()
  ]);
  await waitForStableScreen(page);
}

async function captureFlow(page: Page, prefix: string, routes: string[]) {
  for (const route of routes) {
    await page.goto(route);
    await waitForStableScreen(page);
    await saveFullPage(page, `${prefix}-${routeSlug(route)}.png`);
  }
}

test("shop admin full dashboard/module flow", async ({ page }) => {
  test.skip(!shopEmail || !shopPassword, "Set SHOP_EMAIL and SHOP_PASSWORD to run this test.");
  await login(page, shopEmail!, shopPassword!);
  await captureFlow(page, "shop-admin", shopRoutes);
});

test("super admin full dashboard/module flow", async ({ page }) => {
  test.skip(!superEmail || !superPassword, "Set SUPER_EMAIL and SUPER_PASSWORD to run this test.");
  await login(page, superEmail!, superPassword!);
  await captureFlow(page, "super-admin", superAdminRoutes);
});
