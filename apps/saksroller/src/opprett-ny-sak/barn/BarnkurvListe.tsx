import { Accordion, BodyShort, Checkbox, CheckboxGroup, HGrid, HStack, Skeleton, VStack } from "@navikt/ds-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { BarnKortInnhold } from "../../felles/person/BarnKort";
import { KortRamme } from "../../felles/person/PersonRolleKort";
import type { ReellMottakerRegel } from "../../felles/saksregler";
import LåstPartTag from "../parter/LåstPartTag";
import { useOpprettSakStart } from "../skjema/OpprettSakStartContext";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";
import { beregnBarnkurvValg, utenReellMottaker } from "./barnkurv-valg";
import { BarnReellMottaker } from "./ReellMottakerInline";

type Props = {
    barnkurver: Barnkurv[];
    /** Barnkurvene hentes. Manuelt lagte barn vises da som lasting, ikke i egen gruppe. */
    laster?: boolean;
    /** Tittel for barn som ikke finnes i noen barnkurv. Uten tittel brukes «Med ukjent forelder». */
    manuellTittel?: string;
    form: UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
    maksEttBarn?: boolean;
    utvidSøskenflokker?: boolean;
};

/**
 * Alle barn som kan være med i saken, som valg i én liste: registrerte barn per motpart
 * og barn som er lagt til manuelt. Et manuelt lagt barn som finnes i en barnkurv, vises der sammen med
 * søsknene sine. Ellers vises det under «Med ukjent forelder», valgt fra start, og blir stående når det velges bort.
 *
 * `onKurvByttet` kalles når valget går over til en annen barnkurv, eller med `null` når ingen
 * barn er valgt. Med `maksEttBarn` erstatter et nytt valg det forrige.
 */
export default function BarnkurvListe({
    barnkurver,
    laster = false,
    manuellTittel,
    form,
    reellMottakerRegel,
    onKurvByttet,
    maksEttBarn,
    utvidSøskenflokker = false,
}: Props) {
    const valgteBarn = form.watch("valgteBarn") || [];
    const harManueltValgtBarn = valgteBarn.some((barn) => barn.manuellLagtTil);
    const [aktivKurvId, settAktivKurvId] = useState<string | null>(null);
    const låstKurvId =
        harManueltValgtBarn &&
        aktivKurvId &&
        barnkurver.some(
            (kurv) =>
                kurv.id === aktivKurvId &&
                kurv.barn.some((barn) =>
                    valgteBarn.some((valgtBarn) => !valgtBarn.manuellLagtTil && valgtBarn.ident === barn.ident),
                ),
        )
            ? aktivKurvId
            : null;
    const synligeBarnIdenter = new Set(barnkurver.flatMap((kurv) => kurv.barn.map((barn) => barn.ident)));
    const manuelleBarn = useManuelleBarn(valgteBarn).filter((barn) => !synligeBarnIdenter.has(barn.ident));

    const settValgteBarn = (nyeValg: BarnMedAlder[]) => {
        form.setValue("valgteBarn", maksEttBarn ? begrensTilSisteValg(nyeValg, form.getValues("valgteBarn")) : nyeValg);
    };

    const velgIKurv = (valgteIdenter: string[], kurvId: string) => {
        if (harManueltValgtBarn && låstKurvId && låstKurvId !== kurvId) return;

        const valg = beregnBarnkurvValg(barnkurver, form.getValues("valgteBarn") || [], valgteIdenter, kurvId);
        if (!valg) return;

        settValgteBarn(valg.valgteBarn);
        const kurv = barnkurver.find((barnkurv) => barnkurv.id === kurvId);
        const kurvHarValgteBarn = kurv?.barn.some((barn) =>
            valg.valgteBarn.some((valgtBarn) => !valgtBarn.manuellLagtTil && valgtBarn.ident === barn.ident),
        );
        settAktivKurvId(kurvHarValgteBarn ? kurvId : null);
        if (valg.valgteBarn.length === 0) {
            onKurvByttet?.(null);
        } else if (kurvHarValgteBarn && valg.aktivKurv?.id !== kurvId) {
            onKurvByttet?.(valg.kurv);
        }
    };

    const velgManuelle = (valgteIdenter: string[]) => {
        const beholdt = valgteBarn.filter((b) => !b.manuellLagtTil || valgteIdenter.includes(b.ident));
        const gjenvalgt = manuelleBarn
            .filter((b) => valgteIdenter.includes(b.ident) && !beholdt.some((v) => v.ident === b.ident))
            .map(utenReellMottaker);
        const nyeValg = [...beholdt, ...gjenvalgt];
        settValgteBarn(nyeValg);
        if (nyeValg.length === 0) onKurvByttet?.(null);
    };

    const gruppe = {
        form,
        valgteBarn,
        reellMottakerRegel,
        utvidSøskenflokker,
    };

    const visManuelle = !laster && manuelleBarn.length > 0;
    const erManuelt = (ident: string) => valgteBarn.some((b) => b.ident === ident && b.manuellLagtTil);
    const ukjenteKurver = barnkurver.filter((kurv) => !kurv.motpart);
    const antallUkjente = ukjenteKurver.length + (visManuelle && !manuellTittel ? 1 : 0);
    /** Nummer skiller grupper med ukjent forelder fra hverandre, og vises bare når det er flere. */
    const ukjentNummer = (nummer: number) => (antallUkjente > 1 ? ` ${nummer}` : "");

    return (
        <VStack gap="space-16">
            <Accordion as="section" aria-label="Søskenflokker" size="small" indent={false}>
                {barnkurver.map((kurv) => {
                    // Uten motpart vet vi ikke hvor barnet hører hjemme før alt er hentet. Vis lasting i stedet.
                    if (!kurv.motpart && laster) return null;
                    const motpartNavn = kurv.motpart?.visningsnavn ?? "ukjent forelder";
                    const ident = !kurv.motpart
                        ? ukjentNummer(ukjenteKurver.indexOf(kurv) + 1).trim()
                        : kurv.motpart.ident
                          ? `(${kurv.motpart.ident})`
                          : "";
                    const tittelUtenMotpart =
                        !kurv.motpart && manuellTittel && kurv.barn.some((b) => erManuelt(b.ident))
                            ? manuellTittel
                            : null;
                    return (
                        <BarnGruppe
                            key={kurv.id}
                            {...gruppe}
                            tittel={
                                tittelUtenMotpart ?? (
                                    <>
                                        <span className="personnavn">
                                            {kurv.forelder?.visningsnavn || kurv.forelder?.ident || "Ukjent forelder"}
                                        </span>
                                        {" og "}
                                        <span className="personnavn">{motpartNavn}</span>
                                        {!kurv.motpart && ident && ` ${ident}`}
                                    </>
                                )
                            }
                            legend={tittelUtenMotpart ?? `Velg barn med ${motpartNavn}`}
                            barn={kurv.barn}
                            disabled={låstKurvId !== null && låstKurvId !== kurv.id}
                            onChange={(identer) => velgIKurv(identer, kurv.id)}
                            visVelgAlle={!maksEttBarn}
                        />
                    );
                })}
                {visManuelle && (
                    <BarnGruppe
                        {...gruppe}
                        tittel={manuellTittel ?? `Med ukjent forelder${ukjentNummer(antallUkjente)}`}
                        legend={manuellTittel ?? `Velg barn med ukjent forelder${ukjentNummer(antallUkjente)}`}
                        barn={manuelleBarn}
                        onChange={velgManuelle}
                        visVelgAlle={!maksEttBarn}
                    />
                )}
            </Accordion>
            {laster && (
                <VStack gap="space-8" role="status" aria-live="polite">
                    <BodyShort size="small" textColor="subtle">
                        Henter barn...
                    </BodyShort>
                    <Skeleton variant="rounded" height="8rem" />
                </VStack>
            )}
        </VStack>
    );
}

function begrensTilSisteValg(nyeValg: BarnMedAlder[], forrigeValg: BarnMedAlder[]) {
    if (nyeValg.length <= 1) return nyeValg;
    return nyeValg.filter((barn) => !forrigeValg.some((forrige) => forrige.ident === barn.ident)).slice(-1);
}

function useManuelleBarn(valgteBarn: BarnMedAlder[]) {
    const lagtTil = useRef(new Map<string, BarnMedAlder>());

    for (const barn of valgteBarn) {
        if (barn.manuellLagtTil) {
            lagtTil.current.set(barn.ident, barn);
        }
    }

    return [...lagtTil.current.values()];
}

function BarnGruppe({
    tittel,
    legend,
    barn,
    onChange,
    form,
    valgteBarn,
    reellMottakerRegel,
    visVelgAlle,
    disabled = false,
    utvidSøskenflokker,
}: {
    tittel?: ReactNode;
    legend: string;
    barn: BarnMedAlder[];
    onChange: (valgteIdenter: string[]) => void;
    form: Props["form"];
    valgteBarn: BarnMedAlder[];
    reellMottakerRegel: ReellMottakerRegel;
    visVelgAlle: boolean;
    disabled?: boolean;
    utvidSøskenflokker: boolean;
}) {
    const valgteIdenter = barn.filter((b) => valgteBarn.some((v) => v.ident === b.ident)).map((b) => b.ident);
    const harValgteBarn = valgteIdenter.length > 0;
    const [open, setOpen] = useState(utvidSøskenflokker || harValgteBarn);
    useEffect(() => {
        if (utvidSøskenflokker || harValgteBarn) setOpen(true);
    }, [utvidSøskenflokker, harValgteBarn]);
    const { låstIdent } = useOpprettSakStart();
    const valgbareIdenter = barn.filter((b) => b.ident !== låstIdent).map((b) => b.ident);
    const valgteValgbareIdenter = valgteIdenter.filter((ident) => valgbareIdenter.includes(ident));
    const alleValgbareErValgt = valgbareIdenter.length > 0 && valgteValgbareIdenter.length === valgbareIdenter.length;
    const noenValgbareErValgt = valgteValgbareIdenter.length > 0 && !alleValgbareErValgt;

    return (
        <Accordion.Item open={open} onOpenChange={setOpen}>
            <Accordion.Header>{tittel ?? legend}</Accordion.Header>
            <Accordion.Content>
                <VStack gap="space-16">
                    {visVelgAlle && valgbareIdenter.length > 0 && (
                        <Checkbox
                            size="small"
                            checked={alleValgbareErValgt}
                            indeterminate={noenValgbareErValgt}
                            disabled={disabled}
                            aria-label={`Velg alle: ${legend}`}
                            onChange={() =>
                                onChange(
                                    alleValgbareErValgt
                                        ? valgteIdenter.filter((ident) => ident === låstIdent)
                                        : barn.map((b) => b.ident),
                                )
                            }
                        >
                            Velg alle
                        </Checkbox>
                    )}
                    <CheckboxGroup legend={legend} hideLegend value={valgteIdenter} onChange={onChange} size="small">
                        <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-16" align="start">
                            {barn
                                .toSorted((a, b) => b.alder - a.alder)
                                .map((b) => {
                                    const låst = b.ident === låstIdent;
                                    return (
                                        <KortRamme key={b.ident}>
                                            <VStack gap="space-16">
                                                <HStack align="start" gap="space-8" wrap={false}>
                                                    <BarnKortInnhold
                                                        barn={b}
                                                        tags={låst && <LåstPartTag />}
                                                        headingActions={
                                                            <Checkbox
                                                                value={b.ident}
                                                                hideLabel
                                                                readOnly={låst}
                                                                disabled={disabled}
                                                            >
                                                                Velg {b.navn ?? b.ident}
                                                            </Checkbox>
                                                        }
                                                    />
                                                </HStack>
                                                <BarnReellMottaker
                                                    form={form}
                                                    barn={b}
                                                    barnIndex={valgteBarn.findIndex((v) => v.ident === b.ident)}
                                                    regel={reellMottakerRegel}
                                                    valgt={valgteIdenter.includes(b.ident)}
                                                />
                                            </VStack>
                                        </KortRamme>
                                    );
                                })}
                        </HGrid>
                    </CheckboxGroup>
                </VStack>
            </Accordion.Content>
        </Accordion.Item>
    );
}
