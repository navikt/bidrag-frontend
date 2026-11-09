export function queryParams(): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export function scrollToHash() {
    if (window.location.hash) {
        document.getElementById(window.location.hash.replace("#", ""))?.scrollIntoView(true);
    }
}
