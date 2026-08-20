import { IdentUtils } from "@bidrag/common";

import { RolleType } from "../../forskudd/enum/RolleType";
import { Sakskategori } from "../../forskudd/enum/Sakskategori";
import { Saksstatus } from "../../forskudd/enum/Saksstatus";
import type { BidragSakDto } from "../../types/bidragSakTypes";

export const bidragsak: BidragSakDto = {
    eierfogd: "2990",
    saksnummer: "2235166",
    saksstatus: Saksstatus.NY,
    kategori: Sakskategori.NASJONAL,
    erParagraf19: false,
    begrensetTilgang: false,
    roller: [
        {
            fodselsnummer: IdentUtils.generateFnr(),
            type: RolleType.BA,
            objektnummer: null,
            reellMottager: null,
            mottagerErVerge: false,
            samhandlerIdent: null,
            rolleType: RolleType.BA,
        },
        {
            fodselsnummer: IdentUtils.generateFnr(),
            type: RolleType.BA,
            objektnummer: null,
            reellMottager: null,
            mottagerErVerge: false,
            samhandlerIdent: null,
            rolleType: RolleType.BA,
        },
        {
            fodselsnummer: IdentUtils.generateFnr(),
            type: RolleType.BM,
            objektnummer: null,
            reellMottager: null,
            mottagerErVerge: false,
            samhandlerIdent: null,
            rolleType: RolleType.BM,
        },
        {
            fodselsnummer: IdentUtils.generateFnr(),
            type: RolleType.BP,
            objektnummer: null,
            reellMottager: null,
            mottagerErVerge: false,
            samhandlerIdent: null,
            rolleType: RolleType.BP,
        },
    ],
};
