import { Api as BidragBelopshistorikk } from "./api/BelopshistorikkApi";
import { Api as BidragAdminApi } from "./api/BidragAdminApi";
import { Api as BidragBehandlingApi } from "./api/BidragBehandlingApiV1";
import { Api as BidragDokumentApi } from "./api/BidragDokumentApi";
import { Api as BidragDokumentArkivApi } from "./api/BidragDokumentArkivApi";
import { Api as BidragDokumentProduksjonApi } from "./api/BidragDokumentProduksjonApi";
import { Api as BidragForsendelseApi } from "./api/BidragForsendelseApi";
import { Api as BidragKodeverkApi } from "./api/BidragKodeverkApi";
import { Api as BidragReskontro } from "./api/BidragReskontroApi";
import { Api as BidragVedtak } from "./api/BidragVedtakApi";
import { Api as BidragOrganisasjon } from "./api/OrganisasjonApi";
import { Api as BidragPersonApi } from "./api/PersonApi";
import { Api as BidragSakApi } from "./api/SakApi";
import { Api as BidragSamhandler } from "./api/SamhandlerApi";
import { Api as BidragTilgangskontroll } from "./api/TilgangskontrollApi";
import { proxy } from "./proxyApi";

export const BIDRAG_TILGANGSKONTROLL_API = proxy(new BidragTilgangskontroll(), {
    app: "bidrag-tilgangskontroll",
});

export const BIDRAG_PERSON_API = proxy(new BidragPersonApi(), {
    app: "bidrag-person",
});

export const BIDRAG_ADMIN_API = proxy(new BidragAdminApi(), {
    app: "bidrag-admin",
});

export const BIDRAG_SAK_API = proxy(new BidragSakApi(), {
    app: "bidrag-sak",
});

export const BIDRAG_SAMHANDLER_API = proxy(new BidragSamhandler(), {
    app: "bidrag-samhandler",
});

export const BIDRAG_ORGANISASJON_API = proxy(new BidragOrganisasjon(), {
    app: "bidrag-organisasjon",
});

export const BIDRAG_BELOPSHISTORIKK_API = proxy(new BidragBelopshistorikk(), {
    app: "bidrag-belopshistorikk",
});

export const BIDRAG_VEDTAK_API = proxy(new BidragVedtak(), {
    app: "bidrag-vedtak",
});

export const BIDRAG_DOKUMENT_API = proxy(new BidragDokumentApi(), {
    app: "bidrag-dokument",
});

export const BIDRAG_RESKONTRO_API = proxy(new BidragReskontro(), {
    app: "bidrag-reskontro",
});

export const BIDRAG_FORSENDELSE_API = proxy(new BidragForsendelseApi(), {
    app: "bidrag-dokument-forsendelse",
});

export const BIDRAG_DOKUMENT_ARKIV_API = proxy(new BidragDokumentArkivApi(), {
    app: "bidrag-dokument-arkiv",
});

export const BIDRAG_KODEVERK_API = proxy(new BidragKodeverkApi(), {
    app: "bidrag-kodeverk",
});

export const BEHANDLING_API_V1 = proxy(new BidragBehandlingApi(), {
    app: "bidrag-behandling",
});

export const BIDRAG_DOKUMENT_PRODUKSJON_API = proxy(new BidragDokumentProduksjonApi(), {
    app: "bidrag-dokument-produksjon",
});
