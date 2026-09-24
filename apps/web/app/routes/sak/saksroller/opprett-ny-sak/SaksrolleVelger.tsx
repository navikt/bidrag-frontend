import { TilgangsFeilError } from "@bidrag/api";
import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { Alert, Radio, RadioGroup, Stack, VStack } from "@navikt/ds-react";
import { Suspense, useEffect, useState } from "react";
import { useHentForeldreinformasjonForBarnSuspense, useHentPersonMotpartBarnRelasjonSuspense } from "~/api/useApi.ts";
import LasterSkeleton from "./components/LasterSkeleton";
import { MAKS_ALDER_BARN, type PartRolle, PartRolleSchema } from "./opprett-sak-schema";
import { filtrerSaksroller, type SaksrolleAlternativ } from "./saksrolle-regler";
import { useSaksrolleroversikt } from "./saksrolleroversiktContext";

type Props = {
    partISaken: PersonDto;
    enforcedRolle: PartRolle | null;
};

export default function SaksrolleVelger({ partISaken, enforcedRolle }: Props) {
    const {
        velgRolle,
        partISakenAlder,
        partISaken: partISakenSkjemaData,
        sakstype,
        isLoadingOpprettSak,
    } = useSaksrolleroversikt();

    const valgtRolle = partISakenSkjemaData?.rolle ?? null;
    const alternativer = filtrerSaksroller(sakstype, partISakenAlder, skjemaPartRoller);

    const velgSaksrolle = (valgteRolle: string) => {
        if (isLoadingOpprettSak) return;
        const result = PartRolleSchema.safeParse(valgteRolle);

        if (!result.success || !alternativer.some((valg) => valg.value === result.data)) {
            return;
        }

        if (partISakenSkjemaData?.rolle === result.data) {
            return;
        }

        velgRolle(result.data);
    };

    useEffect(() => {
        if (!enforcedRolle) {
            return;
        }

        if (partISakenSkjemaData?.rolle !== enforcedRolle) {
            velgRolle(enforcedRolle);
        }
    }, [enforcedRolle, partISakenSkjemaData?.rolle, velgRolle]);

    return (
        <RadioGroup
            legend={`Hvilken rolle har ${partISaken.visningsnavn}?`}
            value={valgtRolle ?? undefined}
            onChange={velgSaksrolle}
            size="small"
            readOnly={!!enforcedRolle || isLoadingOpprettSak}
        >
            <Stack gap="space-0 space-24" direction={{ xs: "column", sm: "row" }} wrap={false}>
                {alternativer.map((alternativ) => (
                    <Radio key={alternativ.value} value={alternativ.value}>
                        {alternativ.label}
                    </Radio>
                ))}
            </Stack>
        </RadioGroup>
    );
}

export function SaksrolleFlytResolver({ partISaken, enforcedRolle }: Props) {
    const [feil, settFeil] = useState("");
    const { valgVersjon, partISaken: partISakenSkjemaData, sakstype } = useSaksrolleroversikt();
    const valgtRolle = partISakenSkjemaData?.rolle ?? null;
    const erBarnRolle = valgtRolle === "barn_over_18" || valgtRolle === "barn_under_18";
    const trengerRelasjon = !!valgtRolle && !erBarnRolle && !enforcedRolle;
    const trengerForeldreinfo = !!valgtRolle && erBarnRolle;

    if (!trengerRelasjon && !trengerForeldreinfo) {
        return null;
    }

    return (
        <VStack gap="space-8">
            {feil && <Alert variant="error">{feil}</Alert>}
            {trengerRelasjon && (
                <Suspense fallback={<LasterSkeleton tekst="Henter relasjoner..." />}>
                    <RelasjonTilBarnBranch
                        key={`${partISaken.ident}-${valgtRolle}-${valgVersjon}`}
                        partISaken={partISaken}
                        sakstype={sakstype}
                        valgVersjon={valgVersjon}
                        onFeil={settFeil}
                    />
                </Suspense>
            )}
            {trengerForeldreinfo && (
                <Suspense fallback={<LasterSkeleton tekst="Henter foreldreinformasjon..." />}>
                    <ForeldreinfoBranch
                        key={`${partISaken.ident}-${valgtRolle}-${valgVersjon}`}
                        partISaken={partISaken}
                        valgVersjon={valgVersjon}
                        onFeil={settFeil}
                    />
                </Suspense>
            )}
        </VStack>
    );
}

/**
 * Henter relasjon til barn/motpart for den valgte rollen og utleder riktig saksrolleflyt.
 *
 * Egen komponent slik at `useHentPersonMotpartBarnRelasjonSuspense` (en Suspense-spørring)
 * kun monteres når relasjonen faktisk trengs. Suspense-spørringer kan ikke deaktiveres med
 * et `enabled`-flagg, så betinget montering er riktig måte å styre om spørringen kjører.
 */
function RelasjonTilBarnBranch({
    partISaken,
    sakstype,
    valgVersjon,
    onFeil,
}: {
    partISaken: PersonDto;
    sakstype: string | null;
    valgVersjon: number;
    onFeil: (feil: string) => void;
}) {
    const { settFlytHvisGjeldende } = useSaksrolleroversikt();
    const { data: relasjonTilBarn, error } = useHentPersonMotpartBarnRelasjonSuspense({ ident: partISaken.ident });

    useEffect(() => {
        if (sakstype === "EKTEFELLEBIDRAG") {
            settFlytHvisGjeldende(valgVersjon, {
                key: Math.random(),
                type: "EKTEFELLEBIDRAG",
                motpart: relasjonTilBarn?.personensMotpartBarnRelasjon
                    ? Array.from(
                          relasjonTilBarn.personensMotpartBarnRelasjon
                              .reduce<Map<string, PersonDto>>((unikeMotparter, rel) => {
                                  if (rel.motpart && !unikeMotparter.has(rel.motpart.ident)) {
                                      unikeMotparter.set(rel.motpart.ident, rel.motpart);
                                  }
                                  return unikeMotparter;
                              }, new Map())
                              .values(),
                      )
                    : null,
            });
            return;
        }

        const relasjoner = relasjonTilBarn?.personensMotpartBarnRelasjon;

        if (!relasjoner) {
            return;
        }

        const harDuplisertMotpartMedUlikeRoller = relasjoner.some((relasjon, _, array) =>
            array.some(
                (r) =>
                    r.motpart?.ident === relasjon.motpart?.ident &&
                    r.forelderrolleMotpart !== relasjon.forelderrolleMotpart,
            ),
        );

        if (harDuplisertMotpartMedUlikeRoller) {
            onFeil(
                `Samme motpart er registrert med flere forelderroller (f.eks. både mor og far) for ${partISaken.visningsnavn}. Kontakt support for å få hjelp.`,
            );
            return;
        }

        if (relasjoner.length === 0) {
            settFlytHvisGjeldende(valgVersjon, { key: Math.random(), type: "FORELDER_UTEN_BARN" });
            return;
        }

        const relasjonMedBarnUnder24 = relasjoner
            .map((relasjon) => ({
                ...relasjon,
                fellesBarn: relasjon.fellesBarn.filter((barn) => {
                    const alder = beregnAlderForPerson(barn);

                    return alder !== null && alder <= MAKS_ALDER_BARN;
                }),
            }))
            .filter((relasjon) => relasjon.fellesBarn.length > 0)
            .reduce<MotpartBarnRelasjon[]>((acc, relasjon) => {
                const eksisterende = acc.find(
                    (r) =>
                        r.motpart?.ident === relasjon.motpart?.ident &&
                        r.forelderrolleMotpart === relasjon.forelderrolleMotpart,
                );

                if (eksisterende) {
                    eksisterende.fellesBarn = [...eksisterende.fellesBarn, ...relasjon.fellesBarn];
                } else {
                    acc.push({ ...relasjon });
                }

                return acc;
            }, []);

        settFlytHvisGjeldende(valgVersjon, {
            key: Math.random(),
            type: "FORELDER_MED_BARN",
            barnkurver: relasjonMedBarnUnder24,
        });
    }, [relasjonTilBarn, sakstype, partISaken.ident, valgVersjon, settFlytHvisGjeldende, onFeil]);

    if (error === null) {
        return null;
    }

    return error instanceof TilgangsFeilError ? (
        <Alert variant="error">{error.message}</Alert>
    ) : (
        <Alert variant="error">Kunne ikke hente barn til {partISaken.visningsnavn}. Vennligst prøv igjen.</Alert>
    );
}

/**
 * Henter foreldreinformasjon for en valgt barnerolle og utleder riktig saksrolleflyt.
 *
 * Egen komponent av samme grunn som `RelasjonTilBarnBranch`: monteres kun når foreldreinfo
 * faktisk trengs, slik at Suspense-spørringen aldri kalles i en "deaktivert" tilstand.
 */
function ForeldreinfoBranch({
    partISaken,
    valgVersjon,
    onFeil,
}: {
    partISaken: PersonDto;
    valgVersjon: number;
    onFeil: (feil: string) => void;
}) {
    const { settFlytHvisGjeldende } = useSaksrolleroversikt();
    const { data: foreldreinformasjonTilBarn, error } = useHentForeldreinformasjonForBarnSuspense({
        ident: partISaken.ident,
    });

    useEffect(() => {
        if (foreldreinformasjonTilBarn.length === 2) {
            settFlytHvisGjeldende(valgVersjon, {
                key: Math.random(),
                type: "BARN_BEGGE_FORELDRE",
                foreldre: foreldreinformasjonTilBarn,
            });
        }

        if (foreldreinformasjonTilBarn.length < 2) {
            settFlytHvisGjeldende(valgVersjon, {
                key: Math.random(),
                type: "BARN_MANGLENDE_FORELDRE",
                forelder: foreldreinformasjonTilBarn[0] ?? null,
            });
        }

        if (foreldreinformasjonTilBarn.length > 2) {
            onFeil(
                `Dette barnet (${partISaken.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`,
            );
        }
    }, [foreldreinformasjonTilBarn, partISaken.ident, valgVersjon, settFlytHvisGjeldende, onFeil]);

    if (error === null) {
        return null;
    }

    return error instanceof TilgangsFeilError ? (
        <Alert variant="error">{error.message}</Alert>
    ) : (
        <Alert variant="error">
            Kunne ikke hente foreldreinformasjon til {partISaken.visningsnavn}. Vennligst prøv igjen.
        </Alert>
    );
}

const skjemaPartRoller: SaksrolleAlternativ[] = [
    { label: "Bidragspliktig", value: "bidragspliktig" },
    { label: "Bidragsmottaker", value: "bidragsmottaker" },
    { label: "Barn over 18 år", value: "barn_over_18" },
    { label: "Barn under 18 år", value: "barn_under_18" },
];
