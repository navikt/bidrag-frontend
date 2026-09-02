export function countryCodeToName(countryCode: string) {
    try {
        const regionNames = new Intl.DisplayNames(["nb"], { type: "region" });
        return countryCode ? regionNames.of(countryCode) : " ";
    } catch (_) {
        return countryCode;
    }
}

export function isCountryCodeNorway(countryCode: string) {
    return countryCode === "NO" || countryCode === "NOR";
}
