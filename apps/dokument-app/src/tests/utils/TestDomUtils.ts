export function removeAttributesFromElement(element: Element, ...attributes: string[]) {
    if (element.children.length === 0) {
        return;
    }

    Array.from(element.children).forEach((childElement) => {
        Array.from(attributes).forEach((attribute) => childElement.removeAttribute(attribute));
        removeAttributesFromElement(childElement, ...attributes);
    });
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function elementExists(selector: string) {
    return document.querySelector(selector) !== null;
}

export async function waitForElement(selector: string) {
    let nTry = 5;
    while (nTry !== 0) {
        nTry = nTry - 1;
        if (elementExists(selector)) {
            return true;
        }
        await sleep(200);
    }
    throw new Error(`Could not find element with selector ${selector}`);
}

export async function waitForEvent(event: () => void, message?: string, timeout = 1000) {
    const waitMs = 200;
    let nTry = Math.round(timeout / waitMs);
    while (nTry !== 0) {
        nTry = nTry - 1;
        try {
            event();
            return true;
        } catch (e) {
            // ignore
        }
        await sleep(waitMs);
    }
    throw new Error(`Waiting for event failed ${message ? "- " + message : ""}`);
}

export function getDocumentBody() {
    const bodyDiv = document.createElement("div");
    document.body.appendChild(bodyDiv);
    return bodyDiv;
}
