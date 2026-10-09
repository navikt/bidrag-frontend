import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Button, HGrid, Select, Tag, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { ISamhandlerPersonInfo } from "../../api/samhandler.api";
import SøkPerson from "../../felles/person-søk/SøkPerson";
import RolleForelderKort from "../../rollebilde/forelder/ForelderKort";
import type { ForelderPart, ForelderPartRolle } from "../skjema/opprett-sak-schema";
import SkjemaSeksjon from "../skjema/SkjemaSeksjon";
import LåstPartTag from "./LåstPartTag";
import { hentForelderRolleLabel } from "./part-utils";

export type ForelderKortProps = {
    rolle: ForelderPartRolle;
    part: ForelderPart;
    forslag?: PersonDto[];
    valgPlaceholder?: string;
    kanSettesUkjent?: boolean;
    feil?: string;
    /** Parten kan ikke endres, fordi flyten ble åpnet for denne personen. */
    låst?: boolean;
    onVelg: (person: PersonDto) => void;
    onUkjent: () => void;
    onEndre: () => void;
};

const UKJENT_FORELDER_VALG = "ukjent";

/**
 * Felles partsseksjon med ett redigerbart kort per part, uansett hvem saken ble startet fra.
 */
export default function ParterSeksjon({
    kort,
    tittel = "Bidragspliktig og bidragsmottaker",
    beskrivelse,
}: {
    kort: ForelderKortProps[];
    tittel?: string;
    beskrivelse?: string;
}) {
    return (
        <SkjemaSeksjon tittel={tittel} beskrivelse={beskrivelse}>
            <HGrid columns={{ xs: 1, md: 2 }} gap="space-16">
                {kort.map((props) => (
                    <ForelderKort key={props.rolle} {...props} />
                ))}
            </HGrid>
        </SkjemaSeksjon>
    );
}

function ForelderKort(props: ForelderKortProps) {
    const { rolle, part } = props;
    const ident = part.ident;
    const erKjent = part.erKjent === true && !!ident;
    const [valgtPerson, setValgtPerson] = useState<Pick<ISamhandlerPersonInfo, "ident" | "søktIdent">>();
    const rolleTag =
        part.erKjent === false ? (
            <Tag variant="moderate" data-color="neutral" size="small">
                {rolle === "bidragspliktig" ? "BP" : "BM"}
            </Tag>
        ) : undefined;
    const handlinger: ForelderKortProps = {
        ...props,
        onVelg: (person) => {
            setValgtPerson(person);
            props.onVelg(person);
        },
    };

    return (
        <VStack role="group" aria-label={hentForelderRolleLabel(rolle)}>
            <RolleForelderKort
                forelder={
                    erKjent
                        ? {
                              ident,
                              navn: part.navn,
                              diskresjonskode: part.diskresjonskode,
                          }
                        : null
                }
                rolle={rolle === "bidragspliktig" ? "BP" : "BM"}
                height="100%"
                ukjentTekst={part.erKjent === undefined ? `Velg ${rolle}` : `${rolle} markert som ukjent`}
                søktIdent={valgtPerson?.ident === ident ? valgtPerson?.søktIdent : undefined}
                tags={props.låst && erKjent ? <LåstPartTag /> : rolleTag}
                actions={!props.låst && <Handlinger {...handlinger} />}
            />
        </VStack>
    );
}

function Handlinger({
    rolle,
    part,
    forslag = [],
    valgPlaceholder,
    kanSettesUkjent = true,
    feil,
    onVelg,
    onUkjent,
    onEndre,
}: ForelderKortProps) {
    const erKjent = part.erKjent === true && !!part.ident;

    return (
        <VStack gap="space-8" align="start">
            {erKjent || part.erKjent === false ? (
                <Button type="button" size="small" variant="tertiary" onClick={onEndre}>
                    Endre {rolle}
                </Button>
            ) : (
                <VelgForelder
                    rolle={rolle}
                    part={part}
                    forslag={forslag}
                    valgPlaceholder={valgPlaceholder}
                    kanSettesUkjent={kanSettesUkjent}
                    onVelg={onVelg}
                    onUkjent={onUkjent}
                />
            )}
            {feil && (
                <Alert variant="error" size="small">
                    {feil}
                </Alert>
            )}
        </VStack>
    );
}

function VelgForelder({
    rolle,
    part,
    forslag,
    valgPlaceholder,
    kanSettesUkjent,
    onVelg,
    onUkjent,
}: Pick<ForelderKortProps, "part" | "rolle" | "onVelg" | "onUkjent" | "valgPlaceholder"> & {
    forslag: PersonDto[];
    kanSettesUkjent: boolean;
}) {
    const velgForelder = (verdi: string) => {
        if (verdi === UKJENT_FORELDER_VALG) {
            onUkjent();
            return;
        }

        if (!verdi) return;

        const person = forslag.find((forslag) => forslag.ident === verdi);
        if (!person) throw new Error("Fant ikke den valgte forelderen blant forslagene");
        onVelg(person);
    };

    return (
        <>
            {(forslag.length > 0 || kanSettesUkjent) && (
                <Select
                    label={`Velg ${rolle}`}
                    hideLabel
                    size="small"
                    value={part.erKjent === false ? UKJENT_FORELDER_VALG : ""}
                    onChange={(event) => velgForelder(event.target.value)}
                >
                    <option value="">{valgPlaceholder ?? "Velg forelder"}</option>
                    {forslag.map((person) => (
                        <option key={person.ident} value={person.ident}>
                            {person.visningsnavn}
                        </option>
                    ))}
                    {kanSettesUkjent && <option value={UKJENT_FORELDER_VALG}>Ukjent</option>}
                </Select>
            )}
            <SøkPerson label={`Søk etter ${rolle}`} personInformasjon={onVelg} />
        </>
    );
}
