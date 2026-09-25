import { XMarkIcon } from "@navikt/aksel-icons";
import { Box, Button, ErrorMessage, HStack, Tag, VStack } from "@navikt/ds-react";
import { useFormContext } from "react-hook-form";
import { BarnKortInnhold } from "../../felles/person/BarnKort.tsx";
import { KortRamme } from "../../felles/person/PersonRolleKort.tsx";
import { reellMottakerRegelForSak, reellMottakerValgregel } from "../../felles/reell-mottaker/reell-mottaker-regel.ts";
import type { BarnRolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import RollehistorikkVisning from "../RollehistorikkVisning.tsx";
import ReellMottakerRad from "./ReellMottakerRad.tsx";
import ReellMottakerVelger from "./ReellMottakerVelger.tsx";
import { useBarnReellMottaker } from "./useBarnReellMottaker.tsx";

interface BarnVisningProps {
    rolle: BarnRolle;
    index: number;
    bidragsmottakerIdent: string | undefined;
    erNyttBarn?: boolean;
    hentOgNullstillSamhandler: (barnIndex: number, isLeggTilBarn: boolean) => { ident: string; navn: string } | null;
    closeEditorSignal?: number;
    erOppfostringsbidrag?: boolean;
}

export default function BarnVisning({
    rolle,
    index,
    bidragsmottakerIdent,
    erNyttBarn,
    hentOgNullstillSamhandler,
    closeEditorSignal,
    erOppfostringsbidrag = false,
}: BarnVisningProps) {
    const form = useFormContext<SakRedigeringData>();
    const {
        visReellMottaker,
        harReellMottaker,
        reellMottakerInfo,
        handleFjernBarn,
        handleÅpneReellMottaker,
        handleLukkReellMottaker,
        handleBekreftReellMottaker,
    } = useBarnReellMottaker({ rolle, index, closeEditorSignal, hentOgNullstillSamhandler });
    const reellMottakerFeil = form.formState.errors.roller?.[index]?.reellMottaker?.message;

    return (
        <KortRamme>
            <VStack gap={"space-16"}>
                <BarnKortInnhold
                    barn={{
                        ident: rolle.fodselsnummer,
                        navn: rolle.navn,
                        fødselsdato: rolle.fødselsdato,
                        alder: rolle.alder,
                        erMyndig: rolle.erMyndig,
                        diskresjonskode: rolle.diskresjonskode,
                    }}
                    visIkon={false}
                    headingActions={erNyttBarn && <NyttBarnHandlinger onFjern={handleFjernBarn} />}
                >
                    {!visReellMottaker && (
                        <ReellMottakerRad
                            harReellMottaker={harReellMottaker}
                            reellMottakerInfo={reellMottakerInfo}
                            onEndre={handleÅpneReellMottaker}
                            onLeggTil={handleÅpneReellMottaker}
                        />
                    )}

                    {!visReellMottaker && <ReellMottakerFeil melding={reellMottakerFeil} />}
                </BarnKortInnhold>

                {visReellMottaker && (
                    <ReellMottakerVelger
                        barnNavn={rolle.navn || "Barnet"}
                        barnIdent={rolle.fodselsnummer}
                        verdi={{
                            type: rolle.reellMottakerType,
                            ident: rolle.reellMottaker,
                            navn: rolle.reellMottakerNavn,
                        }}
                        onAvbryt={handleLukkReellMottaker}
                        onBekreft={handleBekreftReellMottaker}
                        regel={reellMottakerValgregel(
                            reellMottakerRegelForSak(erOppfostringsbidrag, bidragsmottakerIdent),
                            rolle.erMyndig ?? false,
                        )}
                    />
                )}
                <RollehistorikkVisning
                    rollehistorikk={rolle.rollehistorikk}
                    rolle={rolle}
                    saksnummer={form.getValues("saksnummer")}
                />
            </VStack>
        </KortRamme>
    );
}

function NyttBarnHandlinger({ onFjern }: { onFjern: () => void }) {
    return (
        <HStack gap="space-12" align="center" flexShrink="0" marginInline="auto space-0">
            <Tag variant="alt1" size="xsmall">
                Nytt barn
            </Tag>
            <Button type="button" variant="tertiary" size="small" icon={<XMarkIcon aria-hidden />} onClick={onFjern}>
                Fjern
            </Button>
        </HStack>
    );
}

function ReellMottakerFeil({ melding }: { melding?: string }) {
    if (!melding) return null;
    return (
        <Box asChild marginBlock="space-8 space-0">
            <ErrorMessage size="small">{melding}</ErrorMessage>
        </Box>
    );
}
