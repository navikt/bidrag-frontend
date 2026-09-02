export enum FAGOMRADE {
    BID = "BID",
    FAR = "FAR",
}

export function isFagomradeBidrag(fagomrade: string) {
    return fagomrade === FAGOMRADE.BID || fagomrade === FAGOMRADE.FAR;
}
