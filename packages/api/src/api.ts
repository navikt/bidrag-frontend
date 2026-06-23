import {Api as BidragBelopshistorikk} from "./api/BelopshistorikkApi";
import {Api as BidragReskontro} from "./api/BidragReskontroApi";
import {Api as BidragVedtak} from "./api/BidragVedtakApi";
import {Api as BidragOrganisasjon} from "./api/OrganisasjonApi";
import {Api as BidragPersonApi} from "./api/PersonApi";
import {Api as BidragSakApi} from "./api/SakApi";
import {Api as BidragSamhandler} from "./api/SamhandlerApi";
import {Api as BidragTilgangskontroll} from "./api/TilgangskontrollApi";
import {proxy} from "./api/proxyApi";

export const BIDRAG_TILGANGSKONTROLL_API = proxy(
    new BidragTilgangskontroll(),
    {
        app: "bidrag-tilgangskontroll",
    }
);

export const BIDRAG_PERSON_API = proxy(new BidragPersonApi(), {
    app: "bidrag-person",
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

export const BIDRAG_BELOPSHISTORIKK_API = proxy(
    new BidragBelopshistorikk(),
    {
        app: "bidrag-belopshistorikk",
    }
);

export const BIDRAG_VEDTAK_API = proxy(new BidragVedtak(), {
    app: "bidrag-vedtak"
});

export const BIDRAG_RESKONTRO_API = proxy(new BidragReskontro(), {
    app: "bidrag-reskontro",
});

