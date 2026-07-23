import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { Accordion, Box, Detail, HStack, VStack } from "@navikt/ds-react";
import { standardSort } from "../../sakshistorikk/components/journalpost/journalpostUtils";
import PersonIdentMedRolle from "../../sakshistorikk/components/journalpost/PersonIdentMedRolle";
import type { SaksDokument } from "../types";
import { finnDokumenterForJournalpost } from "../utils/saksdokumenterUtils";
import { DokumentKnapp } from "./DokumentKnapp";
import type { DokumentData, MenyState } from "./hooks/useDokumentState";
import { JournalpostHeaderInfo } from "./JournalpostHeaderInfo";

export interface DokumentTreProps {
    data: DokumentData;
    menyState: MenyState;
    sakRoller: RolleDto[];
}

export function DokumentTre({ data, menyState, sakRoller }: DokumentTreProps) {
    const { journalposter, dokumenter, harBlandingFarBid } = data;
    const { selectedId, handleSelectDocument, visitedIds, expandedIds, setExpandedIds } = menyState;

    if (dokumenter.length === 0) {
        return (
            <Box padding="space-2">
                <Detail>Ingen dokumenter funnet for filteret</Detail>
            </Box>
        );
    }

    return (
        <VStack gap="0" className="divide-y divide-neutral-subtle">
            {journalposter
                .slice()
                .sort(standardSort)
                .map((jp: JournalpostDto) => {
                    const jpId = jp.journalpostId ?? `${jp.journalfortDato ?? ""}-${jp.dokumentDato ?? ""}`;
                    const doksForJp = finnDokumenterForJournalpost(jp, dokumenter);

                    const handterAccordionEndring = (isOpen: boolean) => {
                        setExpandedIds((prev) => {
                            const next = new Set(prev);
                            isOpen ? next.add(jpId) : next.delete(jpId);
                            return next;
                        });
                    };

                    return (
                        <DokumentJournalpost
                            key={jpId}
                            jp={jp}
                            doksForJp={doksForJp}
                            sakRoller={sakRoller}
                            visFagomrade={harBlandingFarBid}
                            isExpanded={expandedIds.has(jpId)}
                            onToggle={handterAccordionEndring}
                            selectedId={selectedId}
                            visitedIds={visitedIds}
                            onSelectDocument={handleSelectDocument}
                        />
                    );
                })}
        </VStack>
    );
}

interface DokumentJournalpostProps {
    jp: JournalpostDto;
    doksForJp: SaksDokument[];
    sakRoller: RolleDto[];
    visFagomrade: boolean;
    isExpanded: boolean;
    onToggle: (isOpen: boolean) => void;
    selectedId?: string;
    visitedIds: Set<string>;
    onSelectDocument: (id: string) => void;
}

function DokumentJournalpost({
    jp,
    doksForJp,
    sakRoller,
    visFagomrade,
    isExpanded,
    onToggle,
    selectedId,
    visitedIds,
    onSelectDocument,
}: DokumentJournalpostProps) {
    const harDokumenter = doksForJp.length > 0;
    const harSettAlle = harDokumenter && doksForJp.every((dok) => visitedIds.has(dok.id));

    // Hvis det ikke finnes dokumenter, rendrer vi bare en grået-ut header
    if (!harDokumenter) {
        return (
            <Box paddingBlock="space-3" paddingInline="space-4" className="bg-neutral-soft">
                <JournalpostHeaderInfo jp={jp} harDokumenter={false} />
            </Box>
        );
    }

    return (
        <Accordion className="[&.navds-accordion]:!border-none [&_.navds-accordion__item]:!border-none">
            <Accordion.Item open={isExpanded} onOpenChange={onToggle}>
                <Accordion.Header>
                    <JournalpostHeaderInfo jp={jp} isVisited={harSettAlle} harDokumenter={true} />
                </Accordion.Header>
                {/* Vi fjerner default padding fra Aksel med !p-0 for å ha full kontroll selv */}
                <Accordion.Content className="!p-0">
                    <VStack>
                        <JournalpostMetadata jp={jp} sakRoller={sakRoller} visFagomrade={visFagomrade} />
                        <VStack gap="0" className="divide-y divide-neutral-subtle">
                            {doksForJp.map((dok) => (
                                <DokumentKnapp
                                    key={dok.id}
                                    dokument={dok}
                                    isSelected={selectedId === dok.id}
                                    isVisited={visitedIds.has(dok.id)}
                                    onClick={() => onSelectDocument(dok.id)}
                                />
                            ))}
                        </VStack>
                    </VStack>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
}

// All metadata som tidligere lå i headeren er nå her inne!
function JournalpostMetadata({
    jp,
    sakRoller,
    visFagomrade,
}: {
    jp: JournalpostDto;
    sakRoller: RolleDto[];
    visFagomrade: boolean;
}) {
    const dokDato = jp.dokumentDato ? formaterDato(jp.dokumentDato) : "";
    const jourDato = jp.journalfortDato ? formaterDato(jp.journalfortDato) : "";
    const gjelderAktor = jp.gjelderAktor;
    const journalforendeEnhet = jp.journalforendeEnhet;
    const dokumentType = jp.dokumentType;
    const fagomrade = jp.fagomrade;
    const skalViseGjelderLinje = Boolean(gjelderAktor || journalforendeEnhet);

    return (
        <VStack
            gap="space-1"
            paddingInline="space-4"
            paddingBlock="space-2 space-4"
            className="bg-neutral-soft border-b border-neutral-subtle"
        >
            <HStack gap="space-4" align="center" wrap className="text-xs">
                {dokumentType && <Detail textColor="subtle">{dokumentType}</Detail>}
                {visFagomrade && fagomrade && <Detail textColor="subtle">· {fagomrade}</Detail>}
                {dokDato && <Detail textColor="subtle">· Dok: {dokDato}</Detail>}
                {jourDato && <Detail textColor="subtle">· Jour: {jourDato}</Detail>}
            </HStack>

            {skalViseGjelderLinje && (
                <HStack align="center" gap="space-4" wrap={false} className="text-xs overflow-hidden">
                    {gjelderAktor && (
                        <>
                            <Detail textColor="subtle" className="shrink-0">
                                Gjelder:
                            </Detail>
                            <div className="truncate min-w-0">
                                <PersonIdentMedRolle gjelderAktor={gjelderAktor} sakRoller={sakRoller} />
                            </div>
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
