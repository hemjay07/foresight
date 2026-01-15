/**
 * Screenshot Utility
 * Takes automated screenshots of pages and components for verification
 *
 * Usage:
 *   npx tsx scripts/screenshot.ts [page] [options]
 *
 * Examples:
 *   npx tsx scripts/screenshot.ts                    # Screenshot dashboard
 *   npx tsx scripts/screenshot.ts /home              # Screenshot home page
 *   npx tsx scripts/screenshot.ts /home --full       # Full page screenshot
 *   npx tsx scripts/screenshot.ts /arena --selector ".ct-feed"  # Specific element
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

interface ScreenshotOptions {
  path: string;
  fullPage?: boolean;
  selector?: string;
  waitFor?: string;
  delay?: number;
  viewport?: { width: number; height: number };
}

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(options: ScreenshotOptions): Promise<string> {
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page: Page = await browser.newPage();

    // Set viewport
    const viewport = options.viewport || { width: 1440, height: 900 };
    await page.setViewport(viewport);

    // Navigate to page
    const url = `${BASE_URL}${options.path}`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for specific element if specified
    if (options.waitFor) {
      console.log(`Waiting for: ${options.waitFor}`);
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }

    // Additional delay if needed (for animations, etc.)
    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    // Scroll to bottom and back to capture full page content
    if (options.fullPage) {
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 500;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
        });
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pageName = options.path === '/' ? 'dashboard' : options.path.replace(/\//g, '-').slice(1);
    const filename = `${pageName}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    // Take screenshot
    if (options.selector) {
      // Screenshot specific element
      const element = await page.$(options.selector);
      if (element) {
        await element.screenshot({ path: filepath });
        console.log(`Element screenshot saved: ${filepath}`);
      } else {
        console.error(`Selector not found: ${options.selector}`);
        // Fall back to full page
        await page.screenshot({ path: filepath, fullPage: options.fullPage });
        console.log(`Fallback screenshot saved: ${filepath}`);
      }
    } else {
      // Full page or viewport screenshot
      await page.screenshot({
        path: filepath,
        fullPage: options.fullPage
      });
      console.log(`Screenshot saved: ${filepath}`);
    }

    return filepath;
  } finally {
    await browser.close();
  }
}

// Predefined page configs for common screenshots
const PAGE_CONFIGS: Record<string, Partial<ScreenshotOptions>> = {
  dashboard: { path: '/', waitFor: '.container-app' },
  home: { path: '/home', waitFor: '.container-app', fullPage: true },
  arena: { path: '/arena', waitFor: '.container-app' },
  compete: { path: '/compete', waitFor: '.container-app' },
  progress: { path: '/progress', waitFor: '.container-app' },
  profile: { path: '/profile', waitFor: '.container-app' },
  ctfeed: { path: '/home', waitFor: '[data-testid="ct-feed-container"]', selector: '[data-testid="ct-feed-container"]' },
};

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let pagePath = '/';
  let fullPage = false;
  let selector: string | undefined;
  let preset: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--full') {
      fullPage = true;
    } else if (arg === '--selector' && args[i + 1]) {
      selector = args[++i];
    } else if (arg === '--preset' && args[i + 1]) {
      preset = args[++i];
    } else if (arg.startsWith('/')) {
      pagePath = arg;
    } else if (PAGE_CONFIGS[arg]) {
      preset = arg;
    }
  }

  // Use preset if specified
  if (preset && PAGE_CONFIGS[preset]) {
    const config = PAGE_CONFIGS[preset];
    const filepath = await takeScreenshot({
      path: config.path || '/',
      fullPage: config.fullPage || fullPage,
      selector: config.selector || selector,
      waitFor: config.waitFor,
      delay: 1000, // Wait for animations
    });
    console.log(`\nScreenshot complete: ${filepath}`);
  } else {
    // Custom page
    const filepath = await takeScreenshot({
      path: pagePath,
      fullPage,
      selector,
      delay: 1000,
    });
    console.log(`\nScreenshot complete: ${filepath}`);
  }
}

// Export for programmatic use
export { takeScreenshot, PAGE_CONFIGS, SCREENSHOT_DIR };

// Run if called directly
main().catch(console.error);
