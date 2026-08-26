export function isEqualIgnoreNull(a?: string, b?: string): boolean {
    if (a == null || b == null) return false;
    return a === b;
}

export function hasOnlyNullValues(o?: object): boolean {
    if (o == null) return true;
    return (
        Object.values(o)
            .filter((value) => value != null)
            .filter(
                (value) =>
                    (typeof value === "string" && value.length > 0) || (typeof value === "boolean" && value === true),
            ).length === 0
    );
}
