import { PersonIdent } from "@bidrag/common";
import { BodyShort, Box, Checkbox, CheckboxGroup, HGrid, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { BarnKortInnhold } from "../../felles/BarnKort";
import { KortRamme } from "../../felles/PersonRolleKort";
import type { ReellMottakerRegel } from "../../reell-mottaker-regel";
import { BarnReellMottaker } from "../components/ReellMottakerInline";
import type { Barnkurv, BarnMedAlder } from "../opprett-sak-schema";
import { beregnBarnkurvValg } from "./barnkurv-valg";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
    låsteIdenter?: string[];
};

/**
 * Alle barn som kan være med i saken, som valg i én liste: registrerte barn per motpart
 * og barn som er lagt til manuelt.
 *
 * `onKurvByttet` kalles når valget går over til en annen barnkurv, eller med `null` når ingen
 * barn er valgt. `låsteIdenter` er barn som ikke kan velges bort, som barnet saken ble startet fra.
 */
export default function BarnkurvListe({
    barnkurver,
    form,
    reellMottakerRegel,
    onKurvByttet,
    låsteIdenter = [],
}: Props) {
    const valgteBarn = form.watch("valgteBarn") || [];
    const manuelleBarn = valgteBarn.filter((b) => b.manuellLagtTil);

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

    const velgBortManuelle = (valgteIdenter: string[]) => {
        const beholdt = valgteBarn.filter(
            (b) => !b.manuellLagtTil || valgteIdenter.includes(b.ident) || låsteIdenter.includes(b.ident),
        );
        form.setValue("valgteBarn", beholdt);
        if (beholdt.length === 0) onKurvByttet?.(null);
    };

    const gruppe = {
        form,
        valgteBarn,
        reellMottakerRegel,
        låsteIdenter,
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
                <BarnGruppe
                    {...gruppe}
                    tittel="Lagt til manuelt"
                    legend="Barn lagt til manuelt"
                    barn={manuelleBarn}
                    onChange={velgBortManuelle}
                />
            )}
        </VStack>
    );
}

function BarnGruppe({
    tittel,
    legend,
    barn,
    onChange,
    form,
    valgteBarn,
    reellMottakerRegel,
    låsteIdenter,
}: {
    tittel: ReactNode;
    legend: string;
    barn: BarnMedAlder[];
    onChange: (valgteIdenter: string[]) => void;
    form: Props["form"];
    valgteBarn: BarnMedAlder[];
    reellMottakerRegel: ReellMottakerRegel;
    låsteIdenter: string[];
}) {
    const valgteIdenter = barn.filter((b) => valgteBarn.some((v) => v.ident === b.ident)).map((b) => b.ident);

    return (
        <Box padding="space-16" borderRadius="8">
            <HStack asChild gap="space-4" paddingInline="space-8" marginBlock="space-0 space-8">
                <BodyShort size="small" weight="semibold" textColor="subtle">
                    {tittel}
                </BodyShort>
            </HStack>
            <CheckboxGroup legend={legend} hideLegend value={valgteIdenter} onChange={onChange} size="small">
                <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-16" align="start">
                    {barn.map((b) => {
                        const låst = låsteIdenter.includes(b.ident);
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
                                            readOnly={låst}
                                            aria-label={`Velg ${b.navn ?? b.ident}`}
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
