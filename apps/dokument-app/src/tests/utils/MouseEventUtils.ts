export function clickElement(selector: string) {
    const mouseEvent = new MouseEvent("click");
    const element = document.querySelector(selector);
    element?.dispatchEvent(mouseEvent);
}

export function changeInput(selector: string, changeToValue: string) {
    const event = new Event("change", { bubbles: true });
    const element = document.querySelector(selector) as Element;
    element?.dispatchEvent(event);
}

export class DomElement {
    element: Element;
    constructor(selector?: string) {
        if (selector) {
            this.element = document.querySelector(selector);
        }
    }

    withChildSelector(selector: string) {
        this.element = this.element.querySelector(selector);
        return this;
    }

    withElement(element: Element) {
        this.element = element;
        return this;
    }

    click() {
        (this.element as HTMLElement).click();
    }
}
