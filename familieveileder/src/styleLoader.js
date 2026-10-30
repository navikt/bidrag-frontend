const styles = [];
const containers = {};
const waitForElement = (id, name) => {
    return new Promise((resolve) => {
        const check = () => {
            const elements = document.getElementsByTagName(name);
            let el = null;
            for (let i = 0; i < elements.length; i++) {
                const idElement = elements[i].getAttribute("id");
                if (convertToValidId(idElement) === convertToValidId(id)) {
                    el = elements[i];
                    break;
                }
            }
            if (el) {
                resolve(el);
            } else {
                setTimeout(check, 100); // Check every 100ms
            }
        };
        check();
    });
};

const convertToValidId = (id) => {
    try {
        return JSON.parse(id);
    } catch {
        return id;
    }
};
/**
 * Venter på custom element `name` med gitt id, fester en shadow root med alle kjente stiler
 * og returnerer en placeholder-div som React-appen kan rendres i.
 * @param {string} parentElementId
 * @param {string} name
 * @returns {Promise<HTMLDivElement>}
 */
export const createShadowContainer = async (parentElementId, name) => {
    const shadowContainer = await waitForElement(parentElementId, name);
    shadowContainer.style.all = "initial";
    shadowContainer.attachShadow({ mode: "open", delegatesFocus: true });
    shadowContainer.shadowRoot.append(...styles.map((style) => style.cloneNode(true)));
    // Create a body element so that reboot CSS rules work in the shadow DOM
    const body = document.createElement("body");
    // Aksel defines its default (accent) semantic tokens on `:root`, which never matches
    // inside a shadow tree. Without this the tokens are undefined and components lose
    // their backgrounds (white checkboxes, buttons without fill).
    body.setAttribute("data-color", "accent");
    // Create a placeholder for the React app
    const appPlaceholder = document.createElement("div");
    appPlaceholder.id = "bidrag-sak-ui";
    body.appendChild(appPlaceholder);
    shadowContainer.shadowRoot.appendChild(body);
    containers[parentElementId] = shadowContainer;

    return appPlaceholder;
};

/**
 * style-loader `insert`-funksjon: lagrer stilen og legger den inn i alle eksisterende shadow roots.
 * @param {HTMLStyleElement} style
 */
const insertAtTop = (style) => {
    // Update the style list for newly created shadow containers
    styles.push(style);

    // Update the style list for already existing shadow containers.
    // This will provide them with any lazy loaded styles.
    Promise.resolve().then(() => {
        Object.values(containers).forEach((container) => {
            container.shadowRoot.appendChild(style.cloneNode(true));
        });
    });
};

export default insertAtTop;
