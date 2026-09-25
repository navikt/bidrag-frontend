import type { KeyboardEvent } from "react";

export const actionOnEnter = (event: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLElement && e.target.nodeName === "TEXTAREA")) {
        e.preventDefault();
        event();
    }
};
