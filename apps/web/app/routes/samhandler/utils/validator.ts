export const erGyldigKontonummer = (kontonummer: string): boolean => {
    const d0 = parseInt(kontonummer[0]);
    const d1 = parseInt(kontonummer[1]);
    const d2 = parseInt(kontonummer[2]);
    const d3 = parseInt(kontonummer[3]);
    const d4 = parseInt(kontonummer[4]);
    const d5 = parseInt(kontonummer[5]);
    const d6 = parseInt(kontonummer[6]);
    const d7 = parseInt(kontonummer[7]);
    const d8 = parseInt(kontonummer[8]);
    const d9 = parseInt(kontonummer[9]);
    const k = parseInt(kontonummer[10]);

    const controlSum = d9 * 2 + d8 * 3 + d7 * 4 + d6 * 5 + d5 * 6 + d4 * 7 + d3 * 2 + d2 * 3 + d1 * 4 + d0 * 5;

    const v1 = k + controlSum;
    const tmp = Math.floor(v1 / 11);
    const rest = v1 - tmp * 11;

    return rest === 0;
};

export const objectHasSomeValue = (obj: Record<string, unknown>) => Object.keys(obj).some((key) => !!obj[key]);
