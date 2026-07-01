/**
 * Mapper personidenter til korte nøkler (0–9) for bruk i URL-parametere.
 */
export class IdentQueryParamMapper {
    readonly allIdents: string[];

    constructor(idents: (string | null | undefined)[]) {
        this.allIdents = [...new Set(idents.filter(Boolean) as string[])].sort();
    }

    /** Returnerer kort nøkkel (f.eks. "0") for ein full ident. */
    toKey(ident: string): string | null {
        const number = this.allIdents.indexOf(ident);
        if (number === -1) {
            return null;
        }
        return number.toString();
    }

    toIdents(keys: string[]): string[] {
        return keys.map((k) => this.toIdent(k)).filter(Boolean) as string[];
    }

    /** Returnerer full ident for en kort nøkkel. */
    toIdent(key: string): string | null {
        const index = this.safeParseInt(key);
        if (index === null) {
            return null;
        }
        return this.allIdents.at(index) ?? null;
    }

    private safeParseInt(value: string, radix: number = 10): number | null {
        // Use Number() first to ensure the entire string is strictly numeric
        const coerced = Number(value);
        if (Number.isNaN(coerced) || value.trim() === "") {
            return null;
        }

        const parsed = parseInt(value, radix);
        return Number.isNaN(parsed) ? null : parsed;
    }
}
