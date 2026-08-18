#!/usr/bin/env node
// REPL driver for Personal Count, driven over stdin, one command per line.
// Built because chromium-cli isn't available in this environment; this is
// the fallback described by the run-skill-generator (raw Playwright chromium,
// not _electron -- this is a web app, not desktop).
//
// Usage:
//   node driver.mjs <<'EOF'
//   nav http://localhost:3111/login.html
//   fill #password testpass123
//   click button[type=submit]
//   wait-for text=Dashboard
//   screenshot login-ok
//   EOF
//
// Screenshots land in .claude/skills/run-personal-count/screenshots/<name>.png

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(__dirname, 'screenshots');

async function main() {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', (msg) => {
        if (msg.type() === 'error') console.error('[console.error]', msg.text());
    });
    page.on('pageerror', (err) => console.error('[pageerror]', err.message));

    const rl = readline.createInterface({ input: process.stdin });
    for await (const raw of rl) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const [cmd, ...rest] = line.split(' ');
        const arg = rest.join(' ');
        try {
            await runCommand(page, cmd, arg);
        } catch (e) {
            console.error(`[FAIL] ${line} ->`, e.message);
        }
    }

    await browser.close();
}

async function runCommand(page, cmd, arg) {
    switch (cmd) {
        case 'nav':
            await page.goto(arg, { waitUntil: 'domcontentloaded' });
            console.log('[ok] nav', arg);
            break;
        case 'wait-idle':
            // La app carga ~30 scripts en cascada y pide categorias/transacciones
            // apenas arranca -- interactuar antes de que la red se asiente hace
            // que un click en un boton real no dispare su listener todavia.
            await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
            console.log('[ok] wait-idle');
            break;
        case 'fill': {
            const [selector, ...valueParts] = arg.split(' ');
            await page.fill(selector, valueParts.join(' '));
            console.log('[ok] fill', selector);
            break;
        }
        case 'click':
            await page.click(arg);
            console.log('[ok] click', arg);
            break;
        case 'press':
            await page.keyboard.press(arg);
            console.log('[ok] press', arg);
            break;
        case 'wait-for': {
            if (arg.startsWith('text=')) {
                await page.getByText(arg.slice(5)).first().waitFor({ timeout: 15000 });
            } else {
                await page.waitForSelector(arg, { timeout: 15000 });
            }
            console.log('[ok] wait-for', arg);
            break;
        }
        case 'wait-ms':
            await page.waitForTimeout(Number(arg));
            console.log('[ok] wait-ms', arg);
            break;
        case 'screenshot': {
            const fs = await import('node:fs');
            fs.mkdirSync(SHOT_DIR, { recursive: true });
            const name = arg || `shot-${Date.now()}`;
            const file = path.join(SHOT_DIR, `${name}.png`);
            await page.screenshot({ path: file, fullPage: true });
            console.log('[ok] screenshot ->', file);
            break;
        }
        case 'eval': {
            const result = await page.evaluate(arg);
            console.log('[eval]', JSON.stringify(result));
            break;
        }
        case 'text': {
            const t = await page.locator(arg).first().textContent();
            console.log('[text]', t);
            break;
        }
        default:
            console.error('[unknown command]', cmd);
    }
}

main();
