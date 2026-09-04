import "@navikt/ds-css";
import "../../app/index.css";

import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { resolve } from "./stories";

// Minimal test-kontrakt for Playwright sin native "story gallery"-mount-fixture -
// se .github/skills/playwright-component-testing/references/gallery-spec.md.
// Ingen meny/UI her med vilje: denne siden lastes av HVER test og skal bare
// implementere window.mount()/window.unmount(). Vil du bla gjennom stories i
// nettleseren selv, bruk browse.html/browse.tsx i stedet (pnpm test:ct:gallery).

function getRequiredElement(id: string) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Story-galleriet mangler nødvendig element: #${id}`);
    return element;
}

const rootEl = getRequiredElement("root");
let root: Root | undefined;

declare global {
    interface Window {
        mount: (params: { story: string; props?: Record<string, unknown> }) => Promise<void>;
        unmount: () => Promise<void>;
    }
}

window.mount = async ({ story, props }) => {
    const Story = (await resolve(story)) as React.ComponentType<Record<string, unknown>> | undefined;
    if (!Story) throw new Error(`Unknown story: ${story}`);
    if (!root) root = createRoot(rootEl);
    const currentRoot = root; // gjenbruk root slik at update() rekonsilierer og bevarer state
    // flushSync slik at en render-feil avviser Promise-en i stedet for å bli svelget.
    flushSync(() => {
        currentRoot.render(
            <StrictMode>
                <Story {...props} />
            </StrictMode>,
        );
    });
};

window.unmount = async () => {
    root?.unmount();
    root = undefined;
};
