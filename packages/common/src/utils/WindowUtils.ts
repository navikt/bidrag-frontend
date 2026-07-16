export function queryParams(): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}
