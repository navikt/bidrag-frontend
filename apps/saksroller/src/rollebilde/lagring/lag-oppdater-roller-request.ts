import type { OppdaterRollerISakRequest } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";

import type { BarnRolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";

export function lagOppdaterRollerRequest(data: SakRedigeringData): OppdaterRollerISakRequest {
    return {
        saksnummer: data.saksnummer,
        roller: data.roller.map((rolle) => {
            const barnRolle = rolle as BarnRolle;
            const bidragSakRolle = {
                BA: Rolletype.BA,
                BM: Rolletype.BM,
                BP: Rolletype.BP,
                RM: Rolletype.RM,
            }[rolle.rolleType];

            return {
                fodselsnummer: rolle.fodselsnummer || "",
                type: bidragSakRolle,
                objektnummer: rolle.objektnummer || "",
                reellMottaker:
                    rolle.rolleType === "BA" && barnRolle?.reellMottaker
                        ? { ident: barnRolle.reellMottaker || "", verge: false }
                        : null,
                mottagerErVerge: rolle.mottagerErVerge,
                rolleType: bidragSakRolle,
                rollehistorikk: [],
            };
        }),
    };
}
