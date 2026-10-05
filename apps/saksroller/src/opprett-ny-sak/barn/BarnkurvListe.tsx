import { BodyShort, Box, Checkbox, CheckboxGroup, HGrid, HStack, VStack } from "@navikt/ds-react";
import { type ReactNode, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import { BarnKortInnhold } from "../../felles/person/BarnKort";
import { KortRamme } from "../../felles/person/PersonRolleKort";
import type { ReellMottakerRegel } from "../../felles/saksregler";
import { useOpprettSakStart } from "../skjema/OpprettSakStartContext";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";
import { beregnBarnkurvValg, utenReellMottaker } from "./barnkurv-valg";
import { BarnReellMottaker } from "./ReellMottakerInline";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
    maksEttBarn?: boolean;
};

/**
 * Alle barn som kan være med i saken, som valg i én liste: registrerte barn per motpart
 * og barn som er lagt til manuelt. Manuelt lagte barn er valgt fra start og blir stående når de velges bort.
 *
 * `onKurvByttet` kalles når valget går over til en annen barnkurv, eller med `null` når ingen
 * barn er valgt. Med `maksEttBarn` erstatter et nytt valg det forrige.
 */
export default function BarnkurvListe({ barnkurver, form, reellMottakerRegel, onKurvByttet, maksEttBarn }: Props) {
    const valgteBarn = form.watch("valgteBarn") || [];
    const manuelleBarn = useManuelleBarn(valgteBarn);

    const settValgteBarn = (nyeValg: BarnMedAlder[]) => {
        form.setValue("valgteBarn", maksEttBarn ? begrensTilSisteValg(nyeValg, form.getValues("valgteBarn")) : nyeValg);
    };

    const velgIKurv = (valgteIdenter: string[], kurvId: string) => {
        const valg = beregnBarnkurvValg(barnkurver, form.getValues("valgteBarn") || [], valgteIdenter, kurvId);
        if (!valg) return;

        settValgteBarn(valg.valgteBarn);
        if (valg.valgteBarn.length === 0) {
            onKurvByttet?.(null);
        } else if (valgteIdenter.length > 0 && valg.aktivKurv?.id !== kurvId) {
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
    };

    return (
        <VStack gap="space-16">
            {barnkurver.map((kurv, index) => {
                const motpartNavn = kurv.motpart?.visningsnavn ?? "ukjent forelder";
                const ident = kurv.id.toLowerCase().includes("ukjent")
                    ? `${index + 1}`
                    : kurv.motpart?.ident
                      ? `(${kurv.motpart.ident})`
                      : "";
                return (
                    <BarnGruppe
                        key={kurv.id}
                        {...gruppe}
                        tittel={
                            <>
                                Med <span className="personnavn">{motpartNavn}</span>{" "}
                                <span className="personident">{ident}</span>
                            </>
                        }
                        legend={`Velg barn med ${motpartNavn}`}
                        barn={kurv.barn}
                        onChange={(identer) => velgIKurv(identer, kurv.id)}
                        visVelgAlle={!maksEttBarn}
                    />
                );
            })}
            {manuelleBarn.length > 0 && (
                <BarnGruppe
                    {...gruppe}
                    tittel="Barn lagt til manuelt"
                    legend="Barn lagt til manuelt"
                    barn={manuelleBarn}
                    onChange={velgManuelle}
                    visVelgAlle={!maksEttBarn}
                />
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
}: {
    tittel?: ReactNode;
    legend: string;
    barn: BarnMedAlder[];
    onChange: (valgteIdenter: string[]) => void;
    form: Props["form"];
    valgteBarn: BarnMedAlder[];
    reellMottakerRegel: ReellMottakerRegel;
    visVelgAlle: boolean;
}) {
    const valgteIdenter = barn.filter((b) => valgteBarn.some((v) => v.ident === b.ident)).map((b) => b.ident);
    const { låstIdent } = useOpprettSakStart();
    const valgbareIdenter = barn.filter((b) => b.ident !== låstIdent).map((b) => b.ident);
    const valgteValgbareIdenter = valgteIdenter.filter((ident) => valgbareIdenter.includes(ident));
    const alleValgbareErValgt = valgbareIdenter.length > 0 && valgteValgbareIdenter.length === valgbareIdenter.length;
    const noenValgbareErValgt = valgteValgbareIdenter.length > 0 && !alleValgbareErValgt;

    return (
        <Box padding="space-16" borderRadius="8">
            {tittel && (
                <HStack align="center" justify="space-between" gap="space-8" wrap={false} paddingInline="space-8">
                    <BodyShort size="small" weight="semibold" textColor="subtle" truncate>
                        {tittel}
                    </BodyShort>
                    {visVelgAlle && valgbareIdenter.length > 0 && (
                        <Checkbox
                            size="small"
                            checked={alleValgbareErValgt}
                            indeterminate={noenValgbareErValgt}
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
                </HStack>
            )}
            {tittel && <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" marginBlock="space-8 space-8" />}
            <CheckboxGroup legend={legend} hideLegend value={valgteIdenter} onChange={onChange} size="small">
                <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-16" align="start">
                    {barn.map((b) => {
                        const låst = b.ident === låstIdent;
                        return (
                            <KortRamme key={b.ident}>
                                <VStack gap="space-16">
                                    <HStack align="start" gap="space-8" wrap={false}>
                                        <BarnKortInnhold
                                            barn={b}
                                            headingActions={
                                                <Checkbox
                                                    value={b.ident}
                                                    hideLabel
                                                    aria-label={`Velg ${b.navn ?? b.ident}`}
                                                    readOnly={låst}
                                                >
                                                    {" "}
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
        </Box>
    );
}
