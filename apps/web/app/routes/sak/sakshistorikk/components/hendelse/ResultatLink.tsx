import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { HStack, Link } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";

export function ResultatLink({
    saksnummer,
    hendelse,
    bisysUrl,
    enhet,
    sessionState,
}: {
    saksnummer: string;
    hendelse: SakshendelseDto;
    bisysUrl: string;
    enhet: string | null;
    sessionState: string | null;
}) {
    const visINyLosning = useFlag("bisys.vedtak_lesemodus_ny_losning");
    const visIBegge = useFlag("bisys.vedtak_lesemodus_lenke_begge");

    if (!hendelse.link || !hendelse.resultat) {
        return undefined;
    }

    const resultatUrl = generateResultatUrl(
        hendelse,
        enhet,
        sessionState,
        saksnummer,
    );
    const bisysResultatUrl = generateBisysResultatUrl(
        hendelse,
        saksnummer,
        enhet,
        sessionState,
        bisysUrl,
    );

    if (visIBegge && visINyLosning && hendelse.erBisysVedtakOgErOverført) {
        return (
            <HStack gap={"space-12"}>
                <Link href={bisysResultatUrl}>{hendelse.resultat}*</Link>
                <Link href={resultatUrl} aria-label="Vis i ny løsning">
                    🦄
                </Link>
            </HStack>
        );
    }

    if (visINyLosning && hendelse.erBisysVedtakOgErOverført) {
        return <Link href={resultatUrl}>{hendelse.resultat}</Link>;
    }

    if (hendelse.behandlingsid != null && hendelse.vedtaksid != null) {
        return <Link href={resultatUrl}>{hendelse.resultat}</Link>;
    }

    if (hendelse.resultatIBisys) {
        return <Link href={bisysResultatUrl}>{hendelse.resultat}*</Link>;
    }

    return null;
}

function generateBisysResultatUrl(
    hendelse: SakshendelseDto,
    saksnummer: string,
    enhet: string | null,
    sessionState: string | null,
    bisysUrl: string,
) {
    const bisysResultatUrlParams = new URLSearchParams({
        executeResultat: "1",
        linkTil: hendelse.link ?? "",
        saksnr: saksnummer,
        ...(hendelse.søknadsid && { soknadId: hendelse.søknadsid }),
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
    });

    return `${bisysUrl}Sakshistorikk.do?${bisysResultatUrlParams}`;
}

function generateResultatUrl(
    hendelse: SakshendelseDto,
    enhet: string | null,
    sessionState: string | null,
    saksnummer: string,
) {
    const resultatUrlParams = new URLSearchParams({
        steg: "vedtak",
        ...(hendelse.søknadsid && { soknadId: hendelse.søknadsid }),
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
    });

    return `/sak/${saksnummer}/vedtak/${hendelse.vedtaksid}?${resultatUrlParams}`;
}
