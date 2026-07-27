import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Accordion, Box, Detail, VStack } from "@navikt/ds-react";
import { JournalpostHeaderInfo } from "../../../../common/dokument/JournalpostHeaderInfo";
import { JournalpostMetadata } from "../../../../common/dokument/JournalpostMetadata";
import type { SaksDokument } from "../types";
import { finnDokumenterForJournalpost } from "../utils/saksdokumenterUtils";
import { DokumentKnapp } from "./DokumentKnapp";
import type { DokumentData, MenyState } from "./hooks/useDokumentState";

export interface DokumentTreProps {
    data: DokumentData;
    menyState: MenyState;
    sakRoller: RolleDto[];
    /**
     * Flat liste uten journalpost-gruppering. Brukes når visningen allerede har journalposten som
     * kontekst (f.eks. `JournalpostFremviser`), slik at tittel/metadata ikke gjentas i treet.
     */
    flatListe?: boolean;
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

export function DokumentTre({ data, menyState, sakRoller, flatListe = false }: DokumentTreProps) {
    const { journalposter, dokumenter, harBlandingFarBid } = data;
    const { selectedId, handleSelectDocument, visitedIds, expandedIds, setExpandedIds } = menyState;

    if (dokumenter.length === 0) {
        return (
            <Box padding="space-2">
                <Detail>Ingen dokumenter funnet for filteret</Detail>
            </Box>
        );
    }

    if (flatListe) {
        return (
            <VStack gap="space-0" className="divide-y divide-neutral-subtle">
                {dokumenter.map((dok: SaksDokument) => (
                    <DokumentKnapp
                        key={dok.id}
                        dokument={dok}
                        isSelected={selectedId === dok.id}
                        isVisited={visitedIds.has(dok.id)}
                        onClick={() => handleSelectDocument(dok.id)}
                        visDokumentRolle
                    />
                ))}
            </VStack>
        );
    }

    return (
        <VStack>
            {journalposter.map((jp: JournalpostDto) => {
                const jpId = jp.journalpostId ?? `${jp.journalfortDato ?? ""}-${jp.dokumentDato ?? ""}`;
                const doksForJp = finnDokumenterForJournalpost(jp, dokumenter);

                // Headeren representerer hoveddokumentet, så et klikk på den skal alltid vise det.
                // Faller tilbake til første åpnebare dokument dersom hoveddokumentet ikke kan åpnes.
                const hoveddokument = doksForJp.find((dok) => dok.erHoveddokument);
                const dokumentForHeader = hoveddokument?.kanÅpnes
                    ? hoveddokument
                    : doksForJp.find((dok) => dok.kanÅpnes);

                const handterAccordionEndring = (isOpen: boolean) => {
                    setExpandedIds((prev) => {
                        const next = new Set(prev);
                        isOpen ? next.add(jpId) : next.delete(jpId);
                        return next;
                    });
                    if (dokumentForHeader) handleSelectDocument(dokumentForHeader.id);
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

    // Hoveddokumentet er journalpostens "hovedinnhold" og bærer som regel samme tittel som selve
    // journalposten. Headeren fungerer derfor som raden for hoveddokumentet, og listen under viser
    // kun vedleggene. Hvis et filter har skjult hoveddokumentet vises vedleggene som vanlige rader.
    const hoveddokument = doksForJp.find((dok: SaksDokument) => dok.erHoveddokument);
    const vedlegg = doksForJp.filter((dok: SaksDokument) => !dok.erHoveddokument);
    const hoveddokumentErValgt = Boolean(hoveddokument && selectedId === hoveddokument.id);

    return (
        <Accordion
            className={`[&.navds-accordion]:!border-none [&_.navds-accordion__item]:!border-none border-l-4 ${
                !harÅpnebareDokumenter ? "opacity-50" : ""
            } ${
                hoveddokumentErValgt
                    ? "border-[var(--a-border-action,#0056b4)] bg-[var(--a-surface-action-subtle,#cce1ff)]"
                    : "border-transparent"
            }`}
        >
            <Accordion.Item open={isExpanded} onOpenChange={onToggle}>
                <Accordion.Header className={isExpanded ? "!pb-0" : ""}>
                    <JournalpostHeaderInfo
                        jp={jp}
                        harDokumenter={harÅpnebareDokumenter}
                        antallDokumenter={antallDokumenter}
                        antallLeste={antallLeste}
                        gjelderRolle={gjelderRolle}
                        isExpanded={isExpanded}
                    />
                </Accordion.Header>
                <Accordion.Content className="!p-0">
                    <VStack>
                        <JournalpostMetadata jp={jp} visFagomrade={visFagomrade} />

                        {vedlegg.length > 0 && (
                            <VStack
                                gap="space-0"
                                className="divide-y divide-neutral-subtle border-t border-neutral-subtle"
                            >
                                {vedlegg.map((dok: SaksDokument) => (
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
