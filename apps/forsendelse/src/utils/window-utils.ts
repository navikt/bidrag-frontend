export function scrollToHash() {
    if (window.location.hash) {
        document.getElementById(window.location.hash.replace("#", ""))?.scrollIntoView(true);
    }
}

/**
 * @deprecated Bruker rå `window.history.pushState`, som ikke oppdaterer React
 * Routers interne historikk-state. Dette fører til at React Router mister
 * oversikten over gjeldende URL, og kan i etterkant tvinge frem en full
 * sideoppdatering (hard reload) i stedet for en vanlig SPA-navigasjon ved
 * neste `navigate()`-kall. Bruk `useUpdatePageTitleParam` (React Routers
 * `useSearchParams`) inne i komponenter i stedet.
 */
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
    // biome-ignore lint/suspicious/useIterableCallbackReturn: Migrering
    Array.from(key).forEach((k) => urlSearchParams.delete(k));
    return urlSearchParams;
}
