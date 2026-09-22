import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { pageUrls } from './lib/pages.mjs';
import { ok, section, finish } from './lib/report.mjs';

const { base, stop } = await startPreview();
const browser = await launch();

try {
  section('harness');
  const urls = pageUrls();
  ok(urls.length >= 20, 'dist/ contains at least 20 pages', `found ${urls.length}`);
  ok(urls.includes('/index.html'), 'homepage present in the page list');

  const page = await browser.newPage();
  const res = await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  ok(res?.status() === 200, 'preview serves the homepage', `status ${res?.status()}`);

  const title = await page.title();
  ok(title.includes('M&Z'), 'homepage title rendered', title);
} finally {
  await browser.close();
  stop();
}

finish('smoke');
