import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { BodyShort, HStack, Link } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";

const getResultatTekst = (hendelse: SakshendelseDto) => {
    if (!hendelse.resultat) {
        switch (hendelse.type) {
            case "INDEKSREGULERT":
            case "INDEKSREGULERT_KOMMUNE":
            case "INDEKSREGULERT_UTENLANDSKE_MYNDIGHETER":
                return "Indeksregulert";
        }
    }
    return hendelse.resultat;
};

export function ResultatLink({
    saksnummer,
    hendelse,
    enhet,
    sessionState,
}: {
    saksnummer: string;
    hendelse: SakshendelseDto;
    enhet: string | null;
    sessionState: string | null;
}) {
    const visINyLosning = useFlag("bisys.vedtak_lesemodus_ny_losning");
    const visIBegge = useFlag("bisys.vedtak_lesemodus_lenke_begge");
    const resultatTekst = getResultatTekst(hendelse);

    const resultatUrl = generateResultatUrl(hendelse, enhet, sessionState, saksnummer);
    const bisysResultatUrl = generateBisysResultatUrl(hendelse, saksnummer, enhet, sessionState);

    if (visIBegge && visINyLosning && hendelse.erBisysVedtakOgErOverført && resultatUrl) {
        return (
            <HStack gap={"space-12"}>
                <Link href={bisysResultatUrl}>{resultatTekst}*</Link>
                <Link href={resultatUrl} aria-label="Vis i ny løsning">
                    🦄
                </Link>
            </HStack>
        );
    }

    if (visINyLosning && hendelse.erBisysVedtakOgErOverført && resultatUrl) {
        return <Link href={resultatUrl}>{resultatTekst}</Link>;
    }

    if (hendelse.behandlingsid != null && hendelse.vedtaksid != null && resultatUrl) {
        return <Link href={resultatUrl}>{resultatTekst}</Link>;
    }

    if (hendelse.resultatIBisys) {
        return <Link href={bisysResultatUrl}>{resultatTekst}*</Link>;
    }

    return <BodyShort size={"small"}>{resultatTekst}</BodyShort>;
}

function generateBisysResultatUrl(
    hendelse: SakshendelseDto,
    saksnummer: string,
    enhet: string | null,
    sessionState: string | null,
) {
    const bisysResultatUrlParams = new URLSearchParams({
        executeResultat: "1",
        linkTil: hendelse.link ?? "",
        saksnr: saksnummer,
        ...(hendelse.søknadsid && { soknid: hendelse.søknadsid }),
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
    });

    return `/bisys/sakshistorikk?${bisysResultatUrlParams}`;
}

function generateResultatUrl(
    hendelse: SakshendelseDto,
    enhet: string | null,
    sessionState: string | null,
    saksnummer: string,
) {
    if (hendelse.vedtaksid == null) {
        return null;
    }

    const resultatUrlParams = new URLSearchParams({
        steg: "vedtak",
        ...(hendelse.søknadsid && { soknadId: hendelse.søknadsid }),
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
    });

    return `/sak/${saksnummer}/vedtak/${hendelse.vedtaksid}?${resultatUrlParams}`;
}
