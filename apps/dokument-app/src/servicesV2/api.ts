import { useApi } from "@navikt/bidrag-ui-common";

import { Api as BidragDokumentApi } from "../api/BidragDokumentApi";
import { Api as BidragDokumentArkiveringApi } from "../api/BidragDokumentArkiveringApi";
import { Api as BidragOrganisasjontApi } from "../api/BidragOrganisasjonApi";
import { Api as PersonApi } from "../api/BidragPersonApi";
import { Api as SakApi } from "../api/BidragSakApi";
import { Api as SamhandlerApi } from "../api/BidragSamhandler";
import environment from "../environment";

export const PERSON_API = useApi(new PersonApi({ baseURL: environment.url.bidragPerson + "/bidrag-person" }), {
    app: "bidrag-person",
    cluster: "fss",
});
export const SAK_API = useApi(new SakApi({ baseURL: environment.url.bidragSak }), {
    app: "bidrag-sak",
    cluster: "fss",
});
export const SAMHANDLER_API = useApi(new SamhandlerApi({ baseURL: environment.url.bidragSamhandler }), {
    app: "bidrag-samhandler",
    cluster: "gcp",
});
export const BIDRAG_DOKUMENT_API = useApi(
    new BidragDokumentApi({ baseURL: environment.url.bidragDokument + "/bidrag-dokument" }),
    {
        app: "bidrag-dokument",
        cluster: "fss",
        env: environment.system.legacyEnvironment,
    },
);
export const BIDRAG_ORGANISASJON_API = useApi(
    new BidragOrganisasjontApi({ baseURL: environment.url.bidragOrganisasjon + "/bidrag-organisasjon" }),
    {
        app: "bidrag-organisasjon",
        cluster: "fss",
        env: environment.system.legacyEnvironment,
    },
);
export const BIDRAG_DOKUMENT_ARKIVERING_API = useApi(
    new BidragDokumentArkiveringApi({ baseURL: environment.url.bidragDokumentArkivering }),
    {
        app: "bidrag-dokument-arkivering",
        cluster: "fss",
        env: environment.system.legacyEnvironment,
    },
);
