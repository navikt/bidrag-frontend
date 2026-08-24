import type { SaksinformasjonBarn } from "@bidrag/api/BidragReskontroApi";
import { sumNullable } from "@bidrag/utils/belopUtils";

export function beregnBarnGjeld(barn: SaksinformasjonBarn): number {
    return sumNullable(barn.restGjeldOffentlig, barn.restGjeldPrivat);
}

export function beregnBarnTilUtbetaling(barn: SaksinformasjonBarn): number {
    return sumNullable(barn.sumForskuddUtbetalt, barn.sumIkkeUtbetalt);
}

export function beregnTotalGjeld(barnListe: SaksinformasjonBarn[]): number {
    return barnListe.reduce((sum, barn) => sum + beregnBarnGjeld(barn), 0);
}

export function beregnTotalPrivatGjeld(barnListe: SaksinformasjonBarn[]): number {
    return barnListe.reduce((sum, barn) => sumNullable(sum, barn.restGjeldPrivat), 0);
}

export function beregnTotalOffentligGjeld(barnListe: SaksinformasjonBarn[]): number {
    return barnListe.reduce((sum, barn) => sumNullable(sum, barn.restGjeldOffentlig), 0);
}

export function beregnTotaltTilUtbetaling(barnListe: SaksinformasjonBarn[]): number {
    return barnListe.reduce((sum, barn) => sum + beregnBarnTilUtbetaling(barn), 0);
}

export function beregnBmGjeld(bmGjeldRest?: number | null, bmGjeldFastsettelsesgebyr?: number | null): number {
    return sumNullable(bmGjeldRest, bmGjeldFastsettelsesgebyr);
}
