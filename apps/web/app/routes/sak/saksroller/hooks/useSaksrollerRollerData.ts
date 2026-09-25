import type { PersonDto } from "@bidrag/api/PersonApi";
import { useMemo } from "react";
import type { BarnRolle, SakRedigeringData } from "../sakvisning-schema.ts";
import { erBarn } from "../sakvisning-schema.ts";
import { utledSakstype } from "../utled-sakstype.ts";

export function useSaksrollerRollerData({
    roller,
    berikedeRoller,
    muligeBarnPerMotpart,
}: {
    roller: SakRedigeringData["roller"];
    berikedeRoller: SakRedigeringData["roller"];
    muligeBarnPerMotpart: Map<string, PersonDto[]>;
}) {
    const bp = useMemo(() => roller.find((r) => r.type === "BP"), [roller]);
    const bm = useMemo(() => roller.find((r) => r.type === "BM"), [roller]);
    const barn = roller.filter(erBarn) as BarnRolle[];
    const barnIdenter = useMemo(() => barn.map((b) => b.fodselsnummer), [barn]);
    const aktiveRoller = useMemo(() => (roller.length > 0 ? roller : berikedeRoller), [roller, berikedeRoller]);
    const sakstype = useMemo(() => utledSakstype(aktiveRoller), [aktiveRoller]);
    const muligeBarn =
        bp || bm
            ? (muligeBarnPerMotpart.get(bp?.fodselsnummer ?? "") ??
              muligeBarnPerMotpart.get(bm?.fodselsnummer ?? "") ??
              [])
            : [];

    return { bp, bm, barn, barnIdenter, aktiveRoller, sakstype, muligeBarn };
}
