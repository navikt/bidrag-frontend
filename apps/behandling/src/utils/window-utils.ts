export function updateUrlSearchParam(key: string, value: string) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    urlSearchParams.set(key, value);
    window.history.pushState({}, "", `${window.location.pathname}?${urlSearchParams}`);
}

export function getAllSearchParamsExcludingKeys(...key: string[]): URLSearchParams {
    const urlSearchParams = new URLSearchParams(window.location.search);
    Array.from(key).forEach((k) => {
        urlSearchParams.delete(k);
    });
    return urlSearchParams;
}
