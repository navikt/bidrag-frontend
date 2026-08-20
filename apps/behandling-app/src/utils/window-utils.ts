export function scrollToHash() {
    if (window.location.hash) {
        document.getElementById(window.location.hash.replace("#", ""))?.scrollIntoView(true);
    }
}

export function updateUrlSearchParam(key: string, value: string) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    urlSearchParams.set(key, value);
    window.history.pushState({}, "", `${window.location.pathname}?${urlSearchParams}`);
}

export function getSearchParam(key: string): string | null {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(key);
}

export function getAllSearchParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
}

export function getAllSearchParamsExcludingKeys(...key: string[]): URLSearchParams {
    const urlSearchParams = new URLSearchParams(window.location.search);
    Array.from(key).forEach((k) => urlSearchParams.delete(k));
    return urlSearchParams;
}
