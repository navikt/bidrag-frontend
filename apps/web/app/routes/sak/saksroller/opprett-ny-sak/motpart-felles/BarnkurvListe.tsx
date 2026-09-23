import { PersonIdent } from "@bidrag/common";
import { BodyShort, Box, Checkbox, CheckboxGroup, HGrid, HStack, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import { BarnKortInnhold } from "../../felles/BarnKort";
import { KortRamme } from "../../felles/PersonRolleKort";
import ReellMottakerInline from "../components/ReellMottakerInline";
import type { Barnkurv, ForelderMedBarnSkjemaData } from "../opprett-sak-schema";
import { type ReellMottakerRegel, reellMottakerValgregel } from "../reell-mottaker-regel";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<ForelderMedBarnSkjemaData>;
    reellMottakerRegel: ReellMottakerRegel;
};

export default function BarnkurvListe({ barnkurver, form, reellMottakerRegel }: Props) {
    const valgteBarn = form.watch("valgteBarn") || [];

    const erBarnValgt = (barnIdent: string) => valgteBarn.some((b) => b.ident === barnIdent);

    const håndterBarnKlikk = (valgteIdenter: string[], kurvId: string) => {
        const kurv = barnkurver.find((k) => k.id === kurvId);
        if (!kurv) {
            return;
        }

        // Read current form values synchronously (avoid stale render-time closure).
        const currentValgteBarn = form.getValues("valgteBarn") || [];
        const identerIPar = kurv.barn.map((b) => b.ident);
        const aktivKurv = barnkurver.find((barnkurv) =>
            barnkurv.barn.some((barn) =>
                currentValgteBarn.some((valgtBarn) => !valgtBarn.manuellLagtTil && valgtBarn.ident === barn.ident),
            ),
        );
        const bytterKurv = valgteIdenter.length > 0 && aktivKurv !== undefined && aktivKurv.id !== kurvId;
        const eksisterendeValg = bytterKurv ? [] : currentValgteBarn;
        const forblirValgt = eksisterendeValg.filter(
            (b) => !identerIPar.includes(b.ident) || valgteIdenter.includes(b.ident),
        );
        const nyeBarn = kurv.barn
            .filter((b) => valgteIdenter.includes(b.ident) && !eksisterendeValg.some((cb) => cb.ident === b.ident))
            .map((kurvBarn) => ({
                ...kurvBarn,
                reellMottakerType: "ingen" as const,
                reellMottaker: "",
                reellMottakerNavn: "",
                manuellLagtTil: false,
            }));

        const oppdaterteBarn = [...forblirValgt, ...nyeBarn];
        form.setValue("valgteBarn", oppdaterteBarn);

        if (oppdaterteBarn.length === 0) {
            form.setValue("motpart", {
                ident: "",
                navn: "",
                erKjent: undefined,
                rolle: form.getValues("motpart.rolle"),
                diskresjonskode: undefined,
            });
            return;
        }

        if (valgteIdenter.length > 0 && aktivKurv?.id !== kurvId) {
            const erMotpartUkjent = kurv.id.toLowerCase().includes("ukjent");

            if (!erMotpartUkjent && kurv.motpart) {
                form.setValue("motpart", {
                    ident: kurv.motpart.ident,
                    navn: kurv.motpart.visningsnavn ?? kurv.id,
                    erKjent: true,
                    rolle: form.getValues("motpart.rolle"),
                    diskresjonskode: kurv.motpart.diskresjonskode,
                });
            } else {
                form.setValue("motpart", {
                    ident: "",
                    navn: "",
                    erKjent: false,
                    rolle: form.getValues("motpart.rolle"),
                    diskresjonskode: undefined,
                });
            }
        }
    };

    return (
        <VStack gap="space-16">
            {barnkurver.map((kurv, index) => {
                const erMotpartUkjent = kurv.id.toLowerCase().includes("ukjent");
                const motpartNavn = kurv.motpart?.visningsnavn ?? "ukjent forelder";
                const motpartIdent = kurv.motpart?.ident;
                const valgteIdenter = kurv.barn.filter((barn) => erBarnValgt(barn.ident)).map((barn) => barn.ident);

                return (
                    <Box key={kurv.id} padding="space-16" borderRadius="8">
                        <HStack asChild gap="space-4" paddingInline="space-8" marginBlock="space-0 space-8">
                            <BodyShort size="small" weight="semibold" textColor="subtle">
                                Med {motpartNavn}{" "}
                                <PersonIdent
                                    ident={`${erMotpartUkjent ? index + 1 : motpartIdent ? `(${motpartIdent})` : ""}`}
                                />
                            </BodyShort>
                        </HStack>
                        <CheckboxGroup
                            legend={`Velg barn med ${motpartNavn}`}
                            hideLegend
                            value={valgteIdenter}
                            onChange={(valgteIdenter) => håndterBarnKlikk(valgteIdenter, kurv.id)}
                            size="small"
                        >
                            <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-16" align="start">
                                {kurv.barn.map((barn) => {
                                    const barnIndex = valgteBarn.findIndex((b) => b.ident === barn.ident);
                                    const erValgt = erBarnValgt(barn.ident);
                                    return (
                                        <KortRamme key={barn.ident}>
                                            <VStack gap="space-16">
                                                <Checkbox value={barn.ident}>
                                                    <BarnKortInnhold
                                                        barn={{
                                                            ident: barn.ident,
                                                            navn: barn.navn,
                                                            fødselsdato: barn.fødselsdato,
                                                            alder: barn.alder,
                                                            diskresjonskode: barn.diskresjonskode,
                                                        }}
                                                        visIkon={false}
                                                        visKopieringsknapp={false}
                                                    />
                                                </Checkbox>
                                                {erValgt &&
                                                    reellMottakerRegel.type !== "skjult" &&
                                                    barnIndex !== -1 && (
                                                        <Box
                                                            marginBlock="space-4 space-0"
                                                            paddingBlock="space-4 space-0"
                                                        >
                                                            <ReellMottakerInline
                                                                form={form}
                                                                fieldPath={`valgteBarn.${barnIndex}`}
                                                                barnIdent={barn.ident}
                                                                barnNavn={barn.navn}
                                                                regel={reellMottakerValgregel(
                                                                    reellMottakerRegel,
                                                                    barn.erMyndig,
                                                                )}
                                                            />
                                                        </Box>
                                                    )}
                                            </VStack>
                                        </KortRamme>
                                    );
                                })}
                            </HGrid>
                        </CheckboxGroup>
                    </Box>
                );
            })}
        </VStack>
    );
}
