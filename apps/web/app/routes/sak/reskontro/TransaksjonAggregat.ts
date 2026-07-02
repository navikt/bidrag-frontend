import type { Transaksjon } from "@bidrag/api/BidragReskontroApi";

export class TransaksjonAggregat {
    readonly dato: string | null;
    readonly transaksjonskode: string | null;
    readonly beskrivelse: string | null;
    readonly mottaker: string | null;
    readonly søknadstype: string | null;

    private readonly _transaksjoner: Transaksjon[];

    constructor(transaksjon: Transaksjon) {
        this.dato = transaksjon.dato ?? null;
        this.transaksjonskode = transaksjon.transaksjonskode ?? null;
        this.beskrivelse = transaksjon.beskrivelse ?? null;
        this.mottaker = transaksjon.mottaker ?? null;
        this.søknadstype = transaksjon.søknadstype ?? null;
        this._transaksjoner = [transaksjon];
    }

    private shouldNegateSum(): boolean {
        return ["B10", "D10", "E10", "F10"].includes(this.transaksjonskode??"");
    }

    add(transaksjon: Transaksjon): void {
        this._transaksjoner.push(transaksjon);
    }

    get nøkkel(): string {
        return generateNøkkel(this._transaksjoner.at(0));
    }

    get antall(): number {
        return this._transaksjoner.length;
    }

    get transaksjoner(): Transaksjon[] {
        return this._transaksjoner;
    }

    get sumBeløp(): number {
        const sum = this._transaksjoner.reduce((sum, t) => sum + (t.beløp ?? 0), 0);
        if (sum !== 0 && this.shouldNegateSum()) {
            return -sum;
        }
        return sum;
    }

    get sumRestBeløp(): number {
        const sum = this._transaksjoner.reduce((sum, t) => sum + (t.restBeløp ?? 0), 0);
        return sum;
    }
}

const generateNøkkel = (t: Transaksjon) => {
    return `${t.dato ?? ""}|${t.transaksjonskode ?? ""}|${t.søknadstype ?? ""}|${t.mottaker ?? ""}`;
};

export function aggregerTransaksjoner(transaksjoner: Transaksjon[]): TransaksjonAggregat[] {
    const map = new Map<string, TransaksjonAggregat>();
    for (const t of transaksjoner) {
        const nøkkel = generateNøkkel(t);
        const existing = map.get(nøkkel);
        if (existing) {
            existing.add(t);
        } else {
            map.set(nøkkel, new TransaksjonAggregat(t));
        }
    }
    return [...map.values()];
}
