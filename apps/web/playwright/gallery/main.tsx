import "@navikt/ds-css";
import "../../app/index.css";

import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { resolve } from "./stories";

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
    const currentRoot = root;
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
