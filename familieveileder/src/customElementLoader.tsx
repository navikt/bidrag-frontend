import React from "react";
import ReactDOM, { Root } from "react-dom/client";

import { createShadowContainer } from "./styleLoader.js";

/**
 * Lytter på window-eventer for alle funksjons-props og videresender dem til props-funksjonen.
 * @returns Funksjon som fjerner alle lyttere
 */
export const createEventsForFunctionProps = (props: object, appName: string) => {
    const removeListeners = [];
    Object.keys(getParsedProps(props, appName)).forEach((propKey) => {
        if (propKey.startsWith("event_")) {
            const propName = propKey.replace("event_", "");
            const result = createEventListener(props, appName, propName);
            removeListeners.push(result.removeListenerFn);
        }
    });

    return () => removeListeners.forEach((removeListenerFn) => removeListenerFn());
};
/**
 * Navnet på window-eventet som brukes for funksjons-prop `name`.
 */
export const getEventname = (appName: string, name: string) => `${appName}_${name}`;

/**
 * Registrerer en window-lytter som kaller `props[name]` med eventets `detail`.
 */
export const createEventListener = (props: object, appName: string, name: string) => {
    const eventName = getEventname(appName, name);
    const eventFn = handleCustomEvent(props, name);
    window.addEventListener(eventName, eventFn, { passive: true });
    return {
        eventName,
        removeListenerFn: () => {
            window.removeEventListener(eventName, eventFn);
        },
    };
};

/**
 * Gjør props om til attributter: funksjoner blir `event_<navn>` med eventnavn, øvrige verdier JSON-strenger.
 */
export const getParsedProps = (props: object, appName: string) =>
    Object.assign(
        {},
        ...Object.keys(props).map((propKey) => {
            if (typeof props[propKey] == "function") {
                return { [`event_${propKey}`]: getEventname(appName, propKey) };
            }
            return { [propKey]: JSON.stringify(props[propKey]) };
        })
    );

const handleEvent = (props: object, name: string, inputs: any) => {
    try {
        props[name]?.(inputs);
    } catch (e) {
        console.error(`Error when handling event ${name}`, e);
    }
};

const handleCustomEvent = (props: object, name: string) => (ev: CustomEvent) => handleEvent(props, name, ev.detail);
const createEvent = (appName: string, name: string, input: any) => {
    const eventName = getEventname(appName, name);
    const customEvent = new CustomEvent(eventName, {
        detail: input,
    });
    window.dispatchEvent(customEvent);
};

/**
 * Definerer custom element `name` (hvis ikke allerede definert) som rendrer `RenderElement` i en shadow root.
 * Funksjons-props blir til window-eventer, se {@link createEventsForFunctionProps}.
 */
export const createCustomElement = (
    name: string,
    props: object,
    RenderElement: (props: any) => React.JSX.Element,
    parentElementId?: string
) => {
    if (customElements.get(name) == null) {
        customElements.define(
            name,
            class CustomElement extends HTMLElement {
                static observedAttributes = [...Object.keys(props).map((prop) => prop.toLowerCase()), "id"];
                private shadowContainer: HTMLDivElement;
                private root: Root;
                private propNames = Object.keys(props);
                private props = props;
                constructor() {
                    super();
                    this.props = props;
                    createShadowContainer(this.parentId(), name).then((container) => {
                        this.shadowContainer = container;
                        this.root = ReactDOM.createRoot(this.shadowContainer);
                        // The shadow container is created asynchronously, so the initial
                        // connectedCallback/attributeChangedCallback render is a no-op. Render
                        // again once the root exists, otherwise nothing is shown on first view.
                        this.render();
                    });
                }

                connectedCallback() {
                    this.render();
                }

                getEventProps() {
                    return Object.keys(this.props)
                        .filter((key) => key.startsWith("event_"))
                        .map((key) => key.replace("event_", ""));
                }
                parsedProps() {
                    return Object.assign(
                        {},
                        ...Object.keys(this.props).map((propKey) => {
                            if (propKey.startsWith("event_")) {
                                const actualPropKey = propKey.replace("event_", "");
                                const actualKeyWithCorrectCase =
                                    this.propNames.find((propName) => propName.toLowerCase() == actualPropKey) ??
                                    actualPropKey;
                                return {
                                    [actualKeyWithCorrectCase]: (input: any) => createEvent(name, actualPropKey, input),
                                };
                            }

                            if (this.getEventProps().includes(propKey)) {
                                return {};
                            }

                            const parsedInput = this.parseJson(this.props[propKey]);
                            return { [propKey]: parsedInput };
                        })
                    );
                }

                private parseJson(jsonString: string) {
                    try {
                        return JSON.parse(jsonString);
                    } catch {
                        return jsonString;
                    }
                }
                render() {
                    this.root?.render(<RenderElement {...this.parsedProps()} />);
                }

                private parentId() {
                    return this.getAttribute("id") ?? parentElementId;
                }

                attributeChangedCallback(propName, _oldValue, newValue) {
                    const actualPropName =
                        this.propNames.find((origPropName) => origPropName.toLowerCase() == propName) ?? propName;
                    this.props = { ...this.props, [actualPropName]: newValue };
                    this.render();
                }
            }
        );
    }
};
