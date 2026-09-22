import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { ok, section, finish } from './lib/report.mjs';

const { base, stop } = await startPreview();
const browser = await launch();

try {
  // ---- Project filter -----------------------------------------------------
  section('project filter');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/projects.html`, { waitUntil: 'load' });

    const total = await page.locator('.project-card').count();
    ok(total >= 9, 'all projects render', `found ${total}`);

    // Counts on the chips must equal what filtering actually shows.
    const sectors = await page.$$eval('.filter:not([data-filter="all"])', (els) =>
      els.map((el) => ({
        name: el.dataset.filter,
        count: Number(el.querySelector('.filter-count').textContent.trim()),
      }))
    );
    ok(sectors.length >= 2, 'more than one sector offered', `found ${sectors.length}`);

    for (const sector of sectors) {
      await page.click(`.filter[data-filter="${sector.name}"]`);
      const visible = await page.locator('.project-card:not(.is-hidden)').count();
      ok(visible === sector.count, `"${sector.name}" shows its advertised count`, `chip says ${sector.count}, grid shows ${visible}`);

      const pressed = await page.getAttribute(`.filter[data-filter="${sector.name}"]`, 'aria-pressed');
      ok(pressed === 'true', `"${sector.name}" is aria-pressed`, `got ${pressed}`);

      const othersPressed = await page.$$eval(
        '.filter',
        (els, active) => els.filter((e) => e.dataset.filter !== active && e.getAttribute('aria-pressed') === 'true').length,
        sector.name
      );
      ok(othersPressed === 0, `"${sector.name}" is the only pressed chip`, `${othersPressed} others pressed`);

      const status = (await page.textContent('#filter-status'))?.trim();
      ok(
        status?.includes(String(sector.count)),
        `live region announces the "${sector.name}" result`,
        status
      );

      const url = new URL(page.url());
      ok(url.searchParams.get('sector') === sector.name, `URL syncs for "${sector.name}"`, page.url());
    }

    // Deep link: load straight into a filtered state.
    const deep = sectors[0];
    await page.goto(`${base}/projects.html?sector=${encodeURIComponent(deep.name)}`, { waitUntil: 'load' });
    const deepVisible = await page.locator('.project-card:not(.is-hidden)').count();
    ok(deepVisible === deep.count, `deep link applies the "${deep.name}" filter`, `showed ${deepVisible} of ${deep.count}`);

    // Back to all.
    await page.click('.filter[data-filter="all"]');
    const allVisible = await page.locator('.project-card:not(.is-hidden)').count();
    ok(allVisible === total, '"All" restores every card', `${allVisible} of ${total}`);
    ok(!new URL(page.url()).searchParams.has('sector'), '"All" clears the URL parameter', page.url());

    await ctx.close();
  }

  // ---- Mobile drawer ------------------------------------------------------
  section('mobile drawer');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });

    ok(!(await page.isVisible('#nav-drawer')), 'drawer starts closed');
    ok((await page.getAttribute('#nav-toggle', 'aria-expanded')) === 'false', 'toggle starts aria-expanded=false');

    await page.click('#nav-toggle');
    ok(await page.isVisible('#nav-drawer'), 'drawer opens on click');
    ok((await page.getAttribute('#nav-toggle', 'aria-expanded')) === 'true', 'toggle reports expanded');

    await page.keyboard.press('Escape');
    ok(!(await page.isVisible('#nav-drawer')), 'Escape closes the drawer');
    const focused = await page.evaluate(() => document.activeElement?.id);
    ok(focused === 'nav-toggle', 'focus returns to the toggle', `activeElement is #${focused}`);

    await ctx.close();
  }

  // ---- FAQ ----------------------------------------------------------------
  section('faq');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/insights.html`, { waitUntil: 'load' });

    const count = await page.locator('#faq details.faq').count();
    ok(count >= 5, 'FAQ entries render', `found ${count}`);

    const first = page.locator('#faq details.faq').first();
    ok(!(await first.evaluate((el) => el.open)), 'first FAQ starts closed');

    // Keyboard operation: focus the summary and press Enter.
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    ok(await first.evaluate((el) => el.open), 'Enter opens the FAQ from the keyboard');
    await page.keyboard.press('Enter');
    ok(!(await first.evaluate((el) => el.open)), 'Enter closes it again');

    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}

finish('interaction');
