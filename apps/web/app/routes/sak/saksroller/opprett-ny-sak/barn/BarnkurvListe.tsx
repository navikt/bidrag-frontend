import { PersonIdent } from "@bidrag/common";
import { BodyShort, Box, Checkbox, CheckboxGroup, HGrid, HStack, VStack } from "@navikt/ds-react";
import { type ReactNode, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import { BarnKortInnhold } from "../../felles/person/BarnKort";
import { KortRamme } from "../../felles/person/PersonRolleKort";
import type { ReellMottakerRegel } from "../../felles/reell-mottaker/reell-mottaker-regel";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";
import { useSaksrolleroversikt } from "../skjema/saksrolleroversiktContext";
import { beregnBarnkurvValg } from "./barnkurv-valg";
import { BarnReellMottaker } from "./ReellMottakerInline";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
};

/**
 * Alle barn som kan være med i saken, som valg i én liste: registrerte barn per motpart
 * og barn som er lagt til manuelt. Manuelt lagte barn er valgt fra start og blir stående når de velges bort.
 *
 * `onKurvByttet` kalles når valget går over til en annen barnkurv, eller med `null` når ingen
 * barn er valgt.
 */
export default function BarnkurvListe({ barnkurver, form, reellMottakerRegel, onKurvByttet }: Props) {
    const valgteBarn = form.watch("valgteBarn") || [];
    const manuelleBarn = useManuelleBarn(valgteBarn);

    const velgIKurv = (valgteIdenter: string[], kurvId: string) => {
        const valg = beregnBarnkurvValg(barnkurver, form.getValues("valgteBarn") || [], valgteIdenter, kurvId);
        if (!valg) return;

        form.setValue("valgteBarn", valg.valgteBarn);
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
            .map((b) => ({ ...b, reellMottakerType: "ingen" as const, reellMottaker: "", reellMottakerNavn: "" }));
        const nyeValg = [...beholdt, ...gjenvalgt];
        form.setValue("valgteBarn", nyeValg);
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
                                Med {motpartNavn} <PersonIdent ident={ident} />
                            </>
                        }
                        legend={`Velg barn med ${motpartNavn}`}
                        barn={kurv.barn}
                        onChange={(identer) => velgIKurv(identer, kurv.id)}
                    />
                );
            })}
            {manuelleBarn.length > 0 && (
                <BarnGruppe {...gruppe} legend="Barn lagt til manuelt" barn={manuelleBarn} onChange={velgManuelle} />
            )}
        </VStack>
    );
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
}: {
    tittel?: ReactNode;
    legend: string;
    barn: BarnMedAlder[];
    onChange: (valgteIdenter: string[]) => void;
    form: Props["form"];
    valgteBarn: BarnMedAlder[];
    reellMottakerRegel: ReellMottakerRegel;
}) {
    const valgteIdenter = barn.filter((b) => valgteBarn.some((v) => v.ident === b.ident)).map((b) => b.ident);
    const { låstIdent } = useSaksrolleroversikt();

    return (
        <Box padding="space-16" borderRadius="8">
            {tittel && (
                <HStack asChild gap="space-4" paddingInline="space-8" marginBlock="space-0 space-8">
                    <BodyShort size="small" weight="semibold" textColor="subtle">
                        {tittel}
                    </BodyShort>
                </HStack>
            )}
            <CheckboxGroup legend={legend} hideLegend value={valgteIdenter} onChange={onChange} size="small">
                <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-16" align="start">
                    {barn.map((b) => {
                        const låst = b.ident === låstIdent;
                        return (
                            <KortRamme key={b.ident}>
                                <VStack gap="space-16">
                                    <HStack
                                        align="start"
                                        justify="space-between"
                                        gap="space-8"
                                        wrap={false}
                                        className={låst ? undefined : "cursor-pointer"}
                                        onClick={(event) =>
                                            !låst &&
                                            event.currentTarget
                                                .querySelector<HTMLInputElement>('input[type="checkbox"]')
                                                ?.click()
                                        }
                                    >
                                        <BarnKortInnhold
                                            barn={b}
                                            visIkon={false}
                                            visKopieringsknapp={false}
                                            visRolleTag={false}
                                        />
                                        <Checkbox
                                            value={b.ident}
                                            hideLabel
                                            aria-label={`Velg ${b.navn ?? b.ident}`}
                                            readOnly={låst}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            {" "}
                                        </Checkbox>
                                    </HStack>
                                    {valgteIdenter.includes(b.ident) && (
                                        <BarnReellMottaker
                                            form={form}
                                            barn={b}
                                            barnIndex={valgteBarn.findIndex((v) => v.ident === b.ident)}
                                            regel={reellMottakerRegel}
                                        />
                                    )}
                                </VStack>
                            </KortRamme>
                        );
                    })}
                </HGrid>
            </CheckboxGroup>
        </Box>
    );
}
