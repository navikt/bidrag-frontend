import type { Sak, Saksnummer } from "@bidrag/types";
import { fetchJson } from "./index.ts";

const BIDRAG_SAK_URL = process.env["BIDRAG_SAK_URL"] ?? "http://bidrag-sak";

export async function hentSak(
    saksnummer: Saksnummer,
    token: string,
): Promise<{ ok: true; data: Sak } | { ok: false; error: import("@bidrag/types").ApiError }> {
    return fetchJson<Sak>(`${BIDRAG_SAK_URL}/api/sak/${saksnummer}`, token);
}

export async function hentSaker(
    token: string,
): Promise<{ ok: true; data: Sak[] } | { ok: false; error: import("@bidrag/types").ApiError }> {
    return fetchJson<Sak[]>(`${BIDRAG_SAK_URL}/api/sak`, token);
}
