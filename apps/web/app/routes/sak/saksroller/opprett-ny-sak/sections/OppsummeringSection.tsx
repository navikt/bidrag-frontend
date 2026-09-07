import { PersonIcon } from "@navikt/aksel-icons";
import { BodyLong, BodyShort, Button, Heading, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import MaskerSensitivInfo from "../components/MaskerSensitivInfo";
import type { Diskresjonskode, ForelderPartRolle } from "../opprett-sak-schema";
import { sakstypeTilTekst, useSaksrolleroversikt } from "../saksrolleroversiktContext";
import { hentForelderRolleLabel } from "../utils";

type PartOppsummering = {
    rolle: ForelderPartRolle;
    ident?: string;
    navn?: string;
    fødselsdato?: string;
    erKjent?: boolean;
    diskresjonskode?: Diskresjonskode;
};

type BarnOppsummering = {
    ident: string;
    navn: string;
    diskresjonskode?: Diskresjonskode;
    reellMottakerType?: "ingen" | "barnet_selv" | "annen_person" | null;
    reellMottaker?: string | null;
    reellMottakerNavn?: string | null;
};

type Props = {
    bidragspliktig: PartOppsummering | null;
    bidragsmottaker: PartOppsummering | null;
    barn: BarnOppsummering[];
    partISakenRolle: ForelderPartRolle;
    hideMissingPartCards?: boolean;
    onSettBidragspliktigUkjent?: () => void;
    onSettBidragsmottakerUkjent?: () => void;
    onLeggTilBidragspliktig?: () => void;
    onLeggTilBidragsmottaker?: () => void;
};

export default function OppsummeringSection({
    bidragspliktig,
    bidragsmottaker,
    barn,
    partISakenRolle,
    hideMissingPartCards = false,
    onSettBidragspliktigUkjent,
    onSettBidragsmottakerUkjent,
    onLeggTilBidragspliktig,
    onLeggTilBidragsmottaker,
}: Props) {
    const { sakstype, sakskategori } = useSaksrolleroversikt();
    // Always show part i saken first (left), then motpart (right)
    const firstPart = partISakenRolle === "bidragspliktig" ? bidragspliktig : bidragsmottaker;
    const secondPart = partISakenRolle === "bidragspliktig" ? bidragsmottaker : bidragspliktig;
    const firstCallback = partISakenRolle === "bidragspliktig" ? undefined : onSettBidragsmottakerUkjent;
    const secondCallback =
        partISakenRolle === "bidragspliktig" ? onSettBidragsmottakerUkjent : onSettBidragspliktigUkjent;
    const firstAddCallback = partISakenRolle === "bidragspliktig" ? onLeggTilBidragspliktig : onLeggTilBidragsmottaker;
    const secondAddCallback = partISakenRolle === "bidragspliktig" ? onLeggTilBidragsmottaker : onLeggTilBidragspliktig;

    const partCards = [
        { key: "first", data: firstPart, callback: firstCallback, addCallback: firstAddCallback },
        { key: "second", data: secondPart, callback: secondCallback, addCallback: secondAddCallback },
    ].filter((item) => !hideMissingPartCards || item.data !== null);

    return (
        <VStack gap="space-4">
            <Heading level="2" size="large">
                Oppsummering
            </Heading>

            <dl className="rounded-lg border border-ax-neutral-300 bg-ax-neutral-200 p-4">
                <div className="grid w-fit grid-cols-[max-content_max-content] gap-x-2 gap-y-1 items-start">
                    <dt>
                        <BodyShort size="small" className="text-ax-neutral-800">
                            Sakstype:
                        </BodyShort>
                    </dt>
                    <dd className="ml-0">
                        <BodyShort size="small" className="font-semibold text-ax-neutral-1000">
                            {sakstype ? sakstypeTilTekst(sakstype) : "Ikke valgt"}
                        </BodyShort>
                    </dd>

                    <dt>
                        <BodyShort size="small" className="text-ax-neutral-800">
                            Sakskategori:
                        </BodyShort>
                    </dt>
                    <dd className="ml-0">
                        <BodyShort size="small" className="font-semibold text-ax-neutral-1000">
                            {sakskategori}
                        </BodyShort>
                    </dd>
                </div>
            </dl>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partCards.map((item) => (
                    <PartKort
                        key={item.key}
                        data={item.data}
                        onSettUkjent={item.callback}
                        onLeggTil={item.addCallback}
                    />
                ))}
            </div>

            {barn.length > 0 && (
                <VStack gap="space-2">
                    <BodyShort size="small" className="font-semibold text-ax-neutral-1000">
                        Barn
                    </BodyShort>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {barn.map((item) => (
                            <BarnKort key={item.ident} barn={item} />
                        ))}
                    </div>
                </VStack>
            )}
        </VStack>
    );
}

type PartKortProps = {
    data: PartOppsummering | null;
    onSettUkjent?: () => void;
    onLeggTil?: () => void;
};

function PartKort({ data, onSettUkjent, onLeggTil }: PartKortProps) {
    if (!data) {
        return <div className="rounded-lg p-4 bg-ax-neutral-200" />;
    }

    const erUkjent = data.erKjent === false || !data.ident || !data.navn;

    return (
        <VStack gap="space-4" className="rounded-lg p-4 bg-ax-neutral-200">
            <div className="flex items-center gap-2">
                <PersonIcon aria-hidden fontSize="1.5rem" className="text-ax-neutral-1000" />
                <BodyLong size="small" className="font-semibold text-ax-neutral-1000">
                    {hentForelderRolleLabel(data.rolle)}
                </BodyLong>
            </div>
            <MaskerSensitivInfo>
                {erUkjent ? (
                    <div className="flex items-center justify-between gap-2">
                        <BodyLong size="small" className="italic text-ax-neutral-800">
                            Ukjent
                        </BodyLong>
                        {onLeggTil && (
                            <Button type="button" variant="tertiary" size="xsmall" onClick={onLeggTil}>
                                Legg til {data.rolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker"}
                            </Button>
                        )}
                    </div>
                ) : (
                    <VStack gap="space-1">
                        <PersonInfo ident={data.ident || ""} navn={data.navn} fødselsdato={data.fødselsdato} />
                        {data.diskresjonskode && <DiskresjonAlert diskresjonskode={data.diskresjonskode} />}
                    </VStack>
                )}
            </MaskerSensitivInfo>
            {!erUkjent && onSettUkjent && (
                <div className="flex justify-end pt-1 border-t border-ax-neutral-300">
                    <Button type="button" variant="tertiary" size="small" onClick={onSettUkjent}>
                        Sett {data.rolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker"} som ukjent
                    </Button>
                </div>
            )}
        </VStack>
    );
}

type BarnKortProps = {
    barn: BarnOppsummering;
};

function BarnKort({ barn }: BarnKortProps) {
    const reellMottakerTekst = hentReellMottakerTekst(barn);

    return (
        <VStack gap="space-4" className="rounded-lg p-4 bg-ax-neutral-200">
            <div>
                <BodyShort size="small" className="font-semibold text-ax-neutral-1000">
                    Barn
                </BodyShort>
                <PersonInfo ident={barn.ident} navn={barn.navn} />
                {barn.diskresjonskode && <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />}
            </div>

            <div className="pt-2 border-t border-ax-neutral-300">
                <div>
                    <BodyShort size="small" className="text-ax-neutral-700">
                        Reell mottaker:
                    </BodyShort>
                    <BodyShort size="small" className="text-ax-neutral-1000">
                        {reellMottakerTekst}
                    </BodyShort>
                </div>
            </div>
        </VStack>
    );
}

function hentReellMottakerTekst(barn: BarnOppsummering): string | ReactNode {
    if (barn.reellMottakerType === "barnet_selv") {
        return "Barnet selv";
    }

    if (barn.reellMottakerType === "annen_person") {
        return <PersonInfo ident={barn.reellMottaker ?? ""} navn={barn.reellMottakerNavn ?? undefined} />;
    }

    if (barn.reellMottakerType === "ingen") {
        return "Ingen";
    }

    return "Ikke valgt";
}
