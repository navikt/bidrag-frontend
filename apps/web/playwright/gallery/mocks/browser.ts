import { setupWorker } from "msw/browser";
import { galleryHandlers } from "./handlers";

/**
 * MSW Service Worker for manuell galleri-browsing (`browse.html`). Automatiserte
 * `*.ct.spec.ts`-tester kjører med `serviceWorkers: "block"` i Playwright-config
 * og bruker fortsatt `page.route()` (se `network.ts`) – denne worker'en startes
 * kun fra `browse.tsx` og påvirker ikke CT-testene.
 */
export const worker = setupWorker(...galleryHandlers);
