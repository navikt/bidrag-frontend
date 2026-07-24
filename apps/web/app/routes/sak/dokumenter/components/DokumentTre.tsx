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

function hentIdentFraRolle(rolle: RolleDto): string | undefined {
    if ("fodselsnummer" in rolle && typeof rolle.fodselsnummer === "string") return rolle.fodselsnummer;
    if ("aktorId" in rolle && typeof rolle.aktorId === "string") return rolle.aktorId;
    if ("ident" in rolle && typeof rolle.ident === "string") return rolle.ident;
    return undefined;
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
        <VStack>
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
    const antallDokumenter = doksForJp.length;
    const åpnebareDoks = doksForJp.filter((dok: SaksDokument) => dok.kanÅpnes);
    const harÅpnebareDokumenter = åpnebareDoks.length > 0;

    // Teller hvor mange av de åpnebare dokumentene i denne journalposten som er visited
    const antallLeste = åpnebareDoks.filter((dok) => visitedIds.has(dok.id)).length;

    const jpAktorIdent = jp.gjelderAktor?.ident;
    const gjelderRolle = sakRoller.find((r) => hentIdentFraRolle(r) === jpAktorIdent);

    return (
        <Accordion
            className={`[&.navds-accordion]:!border-none [&_.navds-accordion__item]:!border-none ${
                !harÅpnebareDokumenter ? "opacity-50" : ""
            }`}
        >
            <Accordion.Item open={isExpanded} onOpenChange={onToggle}>
                <Accordion.Header className={isExpanded ? "!pb-0" : ""}>
                    <JournalpostHeaderInfo
                        jp={jp}
                        harDokumenter={harÅpnebareDokumenter}
                        antallDokumenter={antallDokumenter}
                        antallLeste={antallLeste} // Sendes med her!
                        gjelderRolle={gjelderRolle}
                        isExpanded={isExpanded}
                    />
                </Accordion.Header>
                <Accordion.Content className="!p-0">
                    <VStack>
                        <JournalpostMetadata jp={jp} sakRoller={sakRoller} visFagomrade={visFagomrade} />

                        {antallDokumenter > 0 && (
                            <VStack
                                gap="space-0"
                                className="divide-y divide-neutral-subtle border-t border-neutral-subtle"
                            >
                                {doksForJp.map((dok: SaksDokument) => (
                                    <DokumentKnapp
                                        key={dok.id}
                                        dokument={dok}
                                        isSelected={selectedId === dok.id}
                                        isVisited={visitedIds.has(dok.id)}
                                        onClick={() => onSelectDocument(dok.id)}
                                    />
                                ))}
                            </VStack>
                        )}
                    </VStack>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
}

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
            // Setter top-padding til space-0 slik at den ligger helt klistret til tittelen!
            paddingBlock="space-0 space-4"
            className="bg-neutral-soft"
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
