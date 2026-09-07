import { TilgangsFeilError } from "@bidrag/api";
import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import { Alert, BodyShort, Select, VStack } from "@navikt/ds-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { useHentForeldreinformasjonForBarnSuspense, useHentPersonMotpartBarnRelasjonSuspense } from "~/api/useApi.ts";
import { MAKS_ALDER_BARN, MYNDYG_BARN_ALDER, type PartRolle, PartRolleSchema } from "./opprett-sak-schema";
import { useSaksrolleroversikt } from "./saksrolleroversiktContext";
import { tilPartISaken } from "./utils";

type Props = {
    partISaken: PersonDto;
    enforcedRolle: PartRolle | null;
};

type SkjemaPartRollerType = {
    label: string;
    value: PartRolle;
};

function getFilteredPartRoller(
    sakstype: string | null,
    partISakenAlder: number | null,
    roles: SkjemaPartRollerType[],
): SkjemaPartRollerType[] {
    if (sakstype === "EKTEFELLEBIDRAG") {
        return roles.filter((valg) => !["barn_over_18", "barn_under_18"].includes(valg.value));
    }

    if (partISakenAlder === null) {
        return roles;
    }

    if (partISakenAlder >= MYNDYG_BARN_ALDER && partISakenAlder < MAKS_ALDER_BARN) {
        return roles.filter((valgt) => valgt.value !== "barn_under_18");
    }

    if (partISakenAlder <= MYNDYG_BARN_ALDER) {
        return roles.filter((valg) => valg.value !== "barn_over_18");
    }

    if (partISakenAlder > MAKS_ALDER_BARN) {
        return roles.filter((valg) => !["barn_over_18", "barn_under_18"].includes(valg.value));
    }

    return roles;
}
export default function SaksrolleVelger({ partISaken, enforcedRolle }: Props) {
    const [feil, settFeil] = useState<string>("");
    const [valgtRolle, settValgtRolle] = useState<PartRolle | null>(null);

    const {
        setSaksrolleFlyt,
        setPartISaken,
        partISakenAlder,
        partISaken: partISakenSkjemaData,
        sakstype,
    } = useSaksrolleroversikt();

    const erBarnRolle = valgtRolle === "barn_over_18" || valgtRolle === "barn_under_18";
    const trengerRelasjon = !!valgtRolle && (sakstype === "EKTEFELLEBIDRAG" || !erBarnRolle);
    const trengerForeldreinfo = !!valgtRolle && erBarnRolle;

    const { data: relasjonTilBarn, error: relasjonTilBarnError } = useHentPersonMotpartBarnRelasjonSuspense(
        partISaken ? { ident: partISaken.ident } : null,
        trengerRelasjon,
    );

    const { data: foreldreinformasjonTilBarn, error: foreldreinformasjonTilBarnError } =
        useHentForeldreinformasjonForBarnSuspense(partISaken ? { ident: partISaken.ident } : null, trengerForeldreinfo);

    if (partISaken === null) {
        return null;
    }

    const velgSaksrolle = (verdi: ChangeEvent<HTMLSelectElement>) => {
        const valgteRolle = verdi.target.value;
        const result = PartRolleSchema.safeParse(valgteRolle);

        if (partISakenSkjemaData && partISakenSkjemaData.rolle === result.data) {
            return;
        }

        if (!result.success) {
            console.warn("Ugldig type", verdi);
            return;
        }

        settFeil("");
        settValgtRolle(result.data);
        setPartISaken(tilPartISaken(partISaken, result.data));
    };

    useEffect(() => {
        console.log("Valgt rolle:", valgtRolle, "Enforced rolle:", enforcedRolle);
        if (enforcedRolle) {
            settValgtRolle(enforcedRolle);
            setPartISaken(tilPartISaken(partISaken, enforcedRolle));
            return;
        }
        if (!valgtRolle) {
            return;
        }

        if (sakstype === "EKTEFELLEBIDRAG") {
            if (!relasjonTilBarn) {
                return;
            }

            setSaksrolleFlyt({
                key: Math.random(),
                type: "EKTEFELLEBIDRAG",
                motpart: relasjonTilBarn.personensMotpartBarnRelasjon
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

        if (erBarnRolle) {
            if (!foreldreinformasjonTilBarn) {
                return;
            }

            if (foreldreinformasjonTilBarn.length === 2) {
                setSaksrolleFlyt({
                    key: Math.random(),
                    type: "BARN_BEGGE_FORELDRE",
                    foreldre: foreldreinformasjonTilBarn,
                });
            }

            if (foreldreinformasjonTilBarn.length < 2) {
                setSaksrolleFlyt({
                    key: Math.random(),
                    type: "BARN_MANGLENDE_FORELDRE",
                    forelder: foreldreinformasjonTilBarn[0] ?? null,
                });
            }

            if (foreldreinformasjonTilBarn.length > 2) {
                settFeil(
                    `Dette barnet (${partISaken.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`,
                );
            }
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
            settFeil(
                `Samme motpart er registrert med flere forelderroller (f.eks. både mor og far) for ${partISaken.visningsnavn}. Kontakt support for å få hjelp.`,
            );
            return;
        }

        if (relasjoner.length === 0) {
            setSaksrolleFlyt({ key: Math.random(), type: "FORELDER_UTEN_BARN" });
            return;
        }

        const relasjonMedBarnUnder24 = relasjoner
            .map((relasjon) => ({
                ...relasjon,
                fellesBarn: relasjon.fellesBarn.filter((barn) => {
                    const alder = barn?.fødselsdato ? beregnAlder(barn.fødselsdato) : beregnAlderFraFnr(barn.ident);

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

        setSaksrolleFlyt({
            key: Math.random(),
            type: "FORELDER_MED_BARN",
            barnkurver: relasjonMedBarnUnder24,
        });
    }, [valgtRolle, sakstype, erBarnRolle, relasjonTilBarn, foreldreinformasjonTilBarn, partISaken, setSaksrolleFlyt]);

    const alternativer = getFilteredPartRoller(sakstype, partISakenAlder, skjemaPartRoller);

    return (
        <VStack gap="space-4">
            <div>
                <BodyShort size="small" className="text-ax-neutral-700 mb-2">
                    Rolle i saken
                </BodyShort>
                <Select
                    label={`Hvilken rolle har ${partISaken.visningsnavn}?`}
                    hideLabel
                    onChange={(value) => velgSaksrolle(value)}
                    size="small"
                    readOnly={!!enforcedRolle}
                    value={valgtRolle ?? ""}
                >
                    <option value="">- Velg rolle -</option>
                    {alternativer.map((skjemaRoller, index) => (
                        <option key={index} value={skjemaRoller.value}>
                            {skjemaRoller.label}
                        </option>
                    ))}
                </Select>
            </div>

            {feil && <Alert variant="error">{feil}</Alert>}

            {relasjonTilBarnError !== null &&
                (relasjonTilBarnError instanceof TilgangsFeilError ? (
                    <Alert variant="error">{relasjonTilBarnError.message}</Alert>
                ) : (
                    <Alert variant="error">
                        Kunne ikke hente barn til {partISaken.visningsnavn}. Vennligst prøv igjen.
                    </Alert>
                ))}

            {foreldreinformasjonTilBarnError !== null &&
                (foreldreinformasjonTilBarnError instanceof TilgangsFeilError ? (
                    <Alert variant="error">{foreldreinformasjonTilBarnError.message}</Alert>
                ) : (
                    <Alert variant="error">
                        Kunne ikke hente foreldreinformasjon til {partISaken.visningsnavn}. Vennligst prøv igjen.
                    </Alert>
                ))}
        </VStack>
    );
}

const skjemaPartRoller: SkjemaPartRollerType[] = [
    { label: "Bidragspliktig", value: "bidragspliktig" },
    { label: "Bidragsmottaker", value: "bidragsmottaker" },
    { label: "Barn over 18 år", value: "barn_over_18" },
    { label: "Barn under 18 år", value: "barn_under_18" },
];
