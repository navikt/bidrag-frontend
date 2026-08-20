export const actionOnEnter = (event: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLElement && e.target.nodeName === "TEXTAREA")) {
        e.preventDefault();
        event();
    }
};
