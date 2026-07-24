import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { PersonNavnIdent } from "@bidrag/common";
import { formaterDato } from "@bidrag/utils";
import { Detail, HStack, VStack } from "@navikt/ds-react";

export function JournalpostMetadata({ jp, visFagomrade }: { jp: JournalpostDto; visFagomrade: boolean }) {
    const dokDato = jp.dokumentDato ? formaterDato(jp.dokumentDato) : "";
    const jourDato = jp.journalfortDato ? formaterDato(jp.journalfortDato) : "";
    const gjelderAktor = jp.gjelderAktor;
    const journalforendeEnhet = jp.journalforendeEnhet;
    const fagomrade = jp.fagomrade;
    const skalViseGjelderLinje = Boolean(gjelderAktor || journalforendeEnhet);

    return (
        <VStack gap="space-1" paddingInline="space-4" paddingBlock="space-0 space-4" className="bg-neutral-soft">
            <HStack gap="space-4" align="center" wrap className="text-xs">
                {visFagomrade && fagomrade && <Detail textColor="subtle">{fagomrade} ·</Detail>}
                {dokDato && <Detail textColor="subtle">Dokumentdato: {dokDato}</Detail>}
                {jourDato && <Detail textColor="subtle">· Jouraldato: {jourDato}</Detail>}
            </HStack>

            {skalViseGjelderLinje && (
                <HStack align="center" gap="space-4" wrap={false} className="text-xs overflow-hidden">
                    {gjelderAktor && (
                        <>
                            <Detail textColor="subtle" className="shrink-0">
                                Gjelder:
                            </Detail>
                            <PersonNavnIdent variant="ident" ident={gjelderAktor.ident} />
                        </>
                    )}
                    {gjelderAktor && journalforendeEnhet && (
                        <Detail textColor="subtle" className="shrink-0">
                            ·
                        </Detail>
                    )}
                    {journalforendeEnhet && (
                        <Detail textColor="subtle" className="shrink-0 whitespace-nowrap">
                            Enhet: {journalforendeEnhet}
                        </Detail>
                    )}
                </HStack>
            )}
        </VStack>
    );
}
