import type { GebyrSakDto } from "@bidrag/api/BidragBehandlingApiV1";

import { EndeligIlagtGebyr, type GebyrFormValues } from "../../../types/gebyrFormValues";

export const createInitialValues = (gebyrSaker: GebyrSakDto[]): GebyrFormValues => {
    return {
        gebyrSaker: gebyrSaker.map((gebyrSak) => ({
            saksnummer: gebyrSak.saksnummer,
            gebyrRoller: gebyrSak.gebyrRoller.map((gebyrRolle) => ({
                rolle: gebyrRolle.rolle,
                gebyrDetaljer: {
                    ...gebyrRolle.gebyrDetaljer,
                    endeligIlagtGebyr: gebyrRolle.gebyrDetaljer.endeligIlagtGebyr
                        ? EndeligIlagtGebyr.Ilagt
                        : EndeligIlagtGebyr.Fritatt,
                },
            })),
            gebyr18År: gebyrSak.gebyr18År.map((gebyrRolle) => ({
                rolle: gebyrRolle.rolle,
                gebyrDetaljer: {
                    ...gebyrRolle.gebyrDetaljer,
                    endeligIlagtGebyr: gebyrRolle.gebyrDetaljer.endeligIlagtGebyr
                        ? EndeligIlagtGebyr.Ilagt
                        : EndeligIlagtGebyr.Fritatt,
                },
            })),
        })),
    };
};
