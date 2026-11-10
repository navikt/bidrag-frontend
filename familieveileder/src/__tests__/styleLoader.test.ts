const TAG_NAME = "style-test-element";
const ELEMENT_ID = "style-test-id";
const PLACEHOLDER_ID = "bidrag-sak-ui";
const POLL_INTERVAL_MS = 100;

type StyleLoader = typeof import("../styleLoader.js");

function createStyle(css: string): HTMLStyleElement {
    const style = document.createElement("style");
    style.textContent = css;
    return style;
}

function appendElement(id: string): HTMLElement {
    const element = document.createElement(TAG_NAME);
    element.setAttribute("id", id);
    document.body.appendChild(element);
    return element;
}

const shadowStyles = (element: HTMLElement) =>
    Array.from(element.shadowRoot.children)
        .filter((child) => child instanceof HTMLStyleElement)
        .map((style) => style.textContent);

describe("styleLoader", () => {
    let styleLoader: StyleLoader;

    beforeEach(async () => {
        vi.resetModules();
        styleLoader = await import("../styleLoader.js");
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.useRealTimers();
    });

    it("attaches shadow root with accent body and returns app placeholder", async () => {
        const element = appendElement(ELEMENT_ID);

        const placeholder = await styleLoader.createShadowContainer(ELEMENT_ID, TAG_NAME);

        expect(element.style.all).toBe("initial");
        const body = element.shadowRoot.querySelector("body");
        expect(body.getAttribute("data-color")).toBe("accent");
        expect(placeholder.id).toBe(PLACEHOLDER_ID);
        expect(placeholder.parentElement).toBe(body);
    });

    it("waits until the element exists", async () => {
        vi.useFakeTimers();
        let resolved: HTMLElement | undefined;
        styleLoader.createShadowContainer(ELEMENT_ID, TAG_NAME).then((p: HTMLElement) => (resolved = p));

        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
        expect(resolved).toBeUndefined();

        const element = appendElement(ELEMENT_ID);
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
        expect(resolved).toBe(element.shadowRoot.getElementById(PLACEHOLDER_ID));
    });

    it("matches the element with the requested id only", async () => {
        const other = appendElement("other-id");
        const element = appendElement(ELEMENT_ID);

        await styleLoader.createShadowContainer(ELEMENT_ID, TAG_NAME);

        expect(element.shadowRoot).not.toBeNull();
        expect(other.shadowRoot).toBeNull();
    });

    it("matches JSON-quoted id attributes", async () => {
        const element = appendElement(JSON.stringify(ELEMENT_ID));

        await styleLoader.createShadowContainer(ELEMENT_ID, TAG_NAME);

        expect(element.shadowRoot).not.toBeNull();
    });

    it("copies styles inserted before the container was created", async () => {
        styleLoader.default(createStyle(".a{}"));
        styleLoader.default(createStyle(".b{}"));
        const element = appendElement(ELEMENT_ID);

        await styleLoader.createShadowContainer(ELEMENT_ID, TAG_NAME);

        expect(shadowStyles(element)).toEqual([".a{}", ".b{}"]);
    });

    it("adds styles inserted later to every existing container, not to document head", async () => {
        const first = appendElement(ELEMENT_ID);
        const second = appendElement("second-id");
        await styleLoader.createShadowContainer(ELEMENT_ID, TAG_NAME);
        await styleLoader.createShadowContainer("second-id", TAG_NAME);

        const style = createStyle(".lazy{}");
        styleLoader.default(style);
        await Promise.resolve();

        expect(shadowStyles(first)).toEqual([".lazy{}"]);
        expect(shadowStyles(second)).toEqual([".lazy{}"]);
        expect(document.head.contains(style)).toBe(false);
    });
});
