import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import catalog from "../src/data/media-catalog.json" with { type: "json" };

const busyDate = "2026-11-20";
const freeDate = "2026-11-21";

async function isolatedBooking(page: Page, result = "ok") {
  await page.clock.setFixedTime(new Date("2026-11-13T15:00:00-03:00"));
  await page.route("**/rest/v1/**", async (route) => {
    if (route.request().method() === "POST") {
      if (result === "ok") await route.fulfill({ status: 201, json: null });
      else await route.fulfill({ status: 400, json: { code: "P0001", message: result } });
    } else {
      await route.fulfill({ status: 200, json: [{ event_date: busyDate }] });
    }
  });
}

async function ready(page: Page) {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".hero-media")).toHaveJSProperty("complete", true);
  await page.locator(".hero-media").evaluate((image: HTMLImageElement) => image.decode());
}

test("availability loads only when the calendar approaches the viewport", async ({page}) => {
  await isolatedBooking(page);
  const calls: string[] = [];
  page.on('request', request => {if (request.url().includes('/rest/v1/so_public_busy_dates')) calls.push(request.url());});
  await ready(page);
  await page.waitForTimeout(250);
  expect(calls).toHaveLength(0);
  await page.locator('#datas').scrollIntoViewIfNeeded();
  await expect.poll(() => calls.length).toBe(1);
  await expect(page.getByLabel('20 de Novembro, Ocupado', {exact:true})).toBeDisabled();
});

test("layout, media and booking controls fit the viewport", async ({ page }, info) => {
  await isolatedBooking(page);
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await ready(page);
  await expect(page.locator("h1")).toContainText("Para celebrar");
  await expect(page.locator("h1")).toContainText("o que importa.");
  const hero = await page.locator(".hero-title").boundingBox();
  expect(hero!.x).toBeGreaterThanOrEqual(0);
  expect(hero!.x + hero!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(await page.locator(".hero-media").evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await mkdir(".qa/screenshots", { recursive: true });
  await page.screenshot({ path: `.qa/screenshots/${info.project.name}-hero.png` });
  for (const id of ["espaco", "experiencias", "galeria", "datas", "contato"]) {
    await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView({ block: "start" }));
    await expect(page.locator(`#${id} h2`)).toBeVisible();
    await expect.poll(() => page.locator("img").evaluateAll((images: HTMLImageElement[]) => images.filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.top < innerHeight && rect.bottom > 0 && rect.width > 0 && getComputedStyle(image).visibility !== "hidden";
    }).every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
    await page.screenshot({ path: `.qa/screenshots/${info.project.name}-${id}.png` });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const broken = await page.locator("img").evaluateAll((images: HTMLImageElement[]) => images.filter((image) => image.complete && image.naturalWidth === 0 && getComputedStyle(image).visibility !== "hidden").map((image) => image.src));
  expect(broken).toEqual([]);
  await expect(page.getByLabel("20 de Novembro, Ocupado", { exact: true })).toBeDisabled();
  await expect(page.locator('input[name="nome"]')).toBeVisible();
  expect(failures).toEqual([]);
});

test("mobile menu closes after navigation and Escape", async ({ page }, info) => {
  test.skip(["desktop", "notebook"].includes(info.project.name));
  await isolatedBooking(page);
  await ready(page);
  const button = page.getByRole("button", { name: "Abrir menu" });
  await button.click();
  await expect(page.getByRole("navigation", { name: "Menu móvel" })).toBeVisible();
  await page.getByRole("navigation", { name: "Menu móvel" }).getByRole("link", { name: "Galeria", exact: true }).click();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#menu-mobile")).toBeHidden();
  await button.click();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("editorial gallery filters, incremental loading and fullscreen navigation", async ({ page }, info) => {
  test.skip(!["desktop", "mobile"].includes(info.project.name));
  await isolatedBooking(page);
  await ready(page);
  await page.locator("#galeria").scrollIntoViewIfNeeded();
  await expect(page.locator(".gallery-card")).toHaveCount(catalog.media.filter(item => !item.locationNote).length);
  await page.getByRole("group", { name: "Filtrar fotografias" }).getByRole("button", { name: /^Todas as fotos/ }).click();
  await expect(page.locator(".gallery-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Ver mais fotografias" }).click();
  await expect(page.locator(".gallery-card")).toHaveCount(catalog.media.length);
  await expect(page.locator(".gallery-open").nth(6)).toBeFocused();
  for (const [id, label] of Object.entries({ solar: "O espaço", historias: "Histórias de casamento", todos: "Todas as fotos" })) {
    const filter = page.getByRole("group", { name: "Filtrar fotografias" }).getByRole("button", { name: new RegExp(`^${label}`) });
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".gallery-card")).toHaveCount(Math.min(catalog.media.filter((item) => id === "todos" || (id === "solar" ? !item.locationNote : !!item.locationNote)).length, 6));
  }
  await page.getByRole("group", { name: "Filtrar fotografias" }).getByRole("button", { name: /^O espaço/ }).click();
  const opener = page.locator(".gallery-open").first();
  await opener.click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(page.locator("#lightbox-title")).toHaveText(catalog.media[0].caption);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#lightbox-title")).toHaveText(catalog.media[1].caption);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#lightbox-title")).toHaveText(catalog.media[0].caption);
  await page.getByRole("button", { name: "Fotografia anterior" }).click();
  await expect(page.locator("#lightbox-title")).toHaveText(catalog.media[1].caption);
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
  }
  await page.screenshot({ path: `.qa/screenshots/${info.project.name}-lightbox.png` });
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();
});

test("touch swipes move within the filtered collection", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await isolatedBooking(page);
  await ready(page);
  await page.locator(".gallery-open").first().click();
  await page.locator(".lightbox-stage").dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: 280, clientY: 280 }] });
  await page.locator(".lightbox-stage").dispatchEvent("touchend", { changedTouches: [{ identifier: 1, clientX: 70, clientY: 285 }] });
  await expect(page.locator("#lightbox-title")).toHaveText(catalog.media[1].caption);
  await page.getByRole("button", { name: "Fechar galeria" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("local photographic fallback survives a missing hero", async ({ page }, info) => {
  test.skip(!["desktop", "mobile"].includes(info.project.name));
  await isolatedBooking(page);
  await page.route("**/media/casamentos/solar-opara-casamento-luana-carlos-*.webp", (route) => route.abort());
  await ready(page);
  await expect(page.locator(".hero-media")).toHaveAttribute("src", catalog.media[1].src);
  expect(await page.locator(".hero-media").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test("last-resort brand fallback and total media failure never show broken icons", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await isolatedBooking(page);
  await page.route("**/media/**/*.webp", (route) => route.abort());
  await ready(page);
  await expect(page.locator(".hero-media")).toHaveAttribute("src", "/media/solar-opara-monogram.svg");
  expect(await page.locator(".hero-media").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.route("**/media/**", (route) => route.abort());
  await page.reload();
  await expect(page.locator(".hero-media")).toHaveCSS("visibility", "hidden");
});

test("reduced motion disables decorative movement", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await isolatedBooking(page);
  await ready(page);
  await expect(page.locator(".hero-media")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".marquee-track,.cursor-aura,.global-noise")).toHaveCount(0);
  await expect(page.locator(".hero-media")).toHaveCSS("transform", "none");
});

test("normal motion reveals content and keeps the hero responsive", async ({ page }, info) => {
  test.skip(!["desktop", "mobile"].includes(info.project.name));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await isolatedBooking(page);
  await ready(page);
  await page.locator(".hero-media").evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  await expect(page.locator(".hero-title")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: `.qa/screenshots/${info.project.name}-hero-motion.png` });
  await page.locator("#espaco").evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(page.locator(".manifesto-copy")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-media")).toHaveCSS("visibility", "visible");
});

test("calendar, validation and request submission preserve the booking contract", async ({ page }, info) => {
  test.skip(!["desktop", "mobile"].includes(info.project.name));
  await isolatedBooking(page);
  let posted: Record<string, unknown> | null = null;
  page.on("request", (request) => { if (request.method() === "POST" && request.url().includes("so_booking_requests")) posted = request.postDataJSON(); });
  await ready(page);
  await page.locator("#datas").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Mês anterior" })).toBeDisabled();
  await page.getByRole("button", { name: "Próximo mês" }).click();
  await expect(page.locator("#datas")).toContainText("Dezembro 2026");
  await page.getByRole("button", { name: "Mês anterior" }).click();
  await expect(page.getByLabel("20 de Novembro, Ocupado", { exact: true })).toBeDisabled();
  await page.getByLabel("21 de Novembro, Disponível", { exact: true }).click();
  await expect(page.locator('input[name="data"]')).toHaveValue(freeDate);
  await page.getByRole("button", { name: "Enviar solicitação", exact: true }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  expect(posted).toBeNull();
  await page.locator('input[name="nome"]').fill("Teste automatizado local");
  await page.locator('input[name="telefone"]').fill("38999999999");
  await page.locator('input[name="email"]').fill("teste@example.invalid");
  await page.locator('select[name="tipo"]').selectOption("Casamento");
  await page.locator('input[name="convidados"]').fill("120");
  await page.getByRole("button", { name: "Enviar solicitação", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Solicitação enviada." })).toBeVisible();
  expect(posted).toMatchObject({ event_date: freeDate, event_type: "Casamento", guest_count: 120 });
});

for (const result of ["date_unavailable", "recent_request_exists", "unavailable"]) {
  test(`booking response ${result} remains understandable`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop");
    await isolatedBooking(page, result);
    await ready(page);
    await page.locator('input[name="data"]').fill(freeDate);
    await page.locator('input[name="nome"]').fill("Teste local");
    await page.locator('input[name="telefone"]').fill("38999999999");
    await page.locator('input[name="email"]').fill("teste@example.invalid");
    await page.locator('select[name="tipo"]').selectOption("Casamento");
    await page.getByRole("button", { name: "Enviar solicitação", exact: true }).click();
    const notice = result === "date_unavailable" ? "Essa data acabou de ficar indisponível" : result === "recent_request_exists" ? "Já recebemos uma solicitação" : "Não foi possível enviar agora";
    await expect(page.getByRole("alert")).toContainText(notice);
    if (result === "date_unavailable") await expect(page.locator('input[name="data"]')).toHaveValue("");
  });
}

test("unavailable calendar keeps unknown dates disabled", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.route("**/rest/v1/**", (route) => route.fulfill({ status: 503, json: { message: "Offline" } }));
  await ready(page);
  await page.locator('#datas').scrollIntoViewIfNeeded();
  await expect(page.getByRole("status").filter({ hasText: "Não foi possível carregar as datas" })).toBeVisible();
  await expect(page.locator("#datas .grid-cols-7 button:enabled")).toHaveCount(0);
});

test("calendar recovers after a failed availability request", async ({ page }, info) => {
  test.skip(!["desktop", "mobile"].includes(info.project.name));
  await page.clock.setFixedTime(new Date("2026-11-13T15:00:00-03:00"));
  let attempts = 0;
  let connectionRestored = false;
  await page.route("**/rest/v1/**", route => {
    attempts += 1;
    return connectionRestored ? route.fulfill({status:200,json:[{event_date:busyDate}]}) : route.fulfill({status:503,json:{message:"Offline"}});
  });
  await ready(page);
  await page.locator("#datas").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button",{name:"Tentar novamente"})).toBeVisible();
  await expect(page.locator(".calendar-grid button:enabled")).toHaveCount(0);
  const attemptsBeforeRetry = attempts;
  connectionRestored = true;
  await page.getByRole("button",{name:"Tentar novamente"}).click();
  await expect(page.getByLabel("20 de Novembro, Ocupado",{exact:true})).toBeDisabled();
  await expect(page.getByLabel("21 de Novembro, Disponível",{exact:true})).toBeEnabled();
  expect(attempts).toBe(attemptsBeforeRetry + 1);
});

test("wedding archive keeps the photograph location visible", async ({page},info) => {
  test.skip(info.project.name !== "desktop");
  await isolatedBooking(page);
  await ready(page);
  await page.locator("#galeria").scrollIntoViewIfNeeded();
  await page.getByRole("group",{name:"Filtrar fotografias"}).getByRole("button",{name:/^Histórias de casamento/}).click();
  await page.locator(".gallery-open").first().click();
  await expect(page.locator("#lightbox-caption")).toContainText("local não confirmado como Solar Opará");
});

test("main page and fullscreen gallery pass accessibility checks", async ({ page }, info) => {
  test.skip(!["desktop", "mobile"].includes(info.project.name));
  await isolatedBooking(page);
  await ready(page);
  for (const id of ["espaco", "experiencias", "galeria", "datas", "contato"]) await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  const main = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(main.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  await page.locator(".gallery-open").first().click();
  const modal = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(modal.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
});

test("production exposes real availability and local social media", async ({ page, request }, info) => {
  test.skip(!process.env.BASE_URL || ["localhost", "127.0.0.1"].includes(new URL(process.env.BASE_URL).hostname) || info.project.name !== "desktop");
  const responsePromise = page.waitForResponse((response) => response.url().includes("/rest/v1/so_public_busy_dates"));
  await ready(page);
  await page.locator('#datas').scrollIntoViewIfNeeded();
  const availability = await responsePromise;
  expect(availability.status()).toBe(200);
  expect(Array.isArray(await availability.json())).toBe(true);
  const imageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
  const image = await request.get(imageUrl!);
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/jpeg");
});
