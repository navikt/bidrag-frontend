import type {PersonDto} from "@bidrag/api/PersonApi";
import {Enhet} from "./enhet";

export interface Person extends PersonDto {
    begrensetTilgang?: boolean;
    geografiskEnhet?: Enhet;
    feil?: boolean;
}

export function erSamhandlerId(id: string): boolean {
    if (!id) {
        return false;
    }
    const samhandlerIdRegex = /^[89]\d{10}$/;
    return samhandlerIdRegex.test(id);
}
