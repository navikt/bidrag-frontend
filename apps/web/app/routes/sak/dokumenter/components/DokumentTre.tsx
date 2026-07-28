import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Accordion, Box, Detail, VStack } from "@navikt/ds-react";
import { JournalpostHeaderInfo } from "../../../../common/dokument/JournalpostHeaderInfo";
import { JournalpostMetadata } from "../../../../common/dokument/JournalpostMetadata";
import type { SaksDokument } from "../types";
import { finnDokumenterForJournalpost } from "../utils/saksdokumenterUtils";
import { DokumentKnapp } from "./DokumentKnapp";
import styles from "./DokumentTre.module.css";
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
                    // handleSelectDocument legger selv journalposten tilbake i expandedIds, så den skal
                    // kun kalles ved åpning – ellers vil lukking bli motvirket umiddelbart.
                    if (isOpen && dokumentForHeader) handleSelectDocument(dokumentForHeader.id);
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
            className={`${styles.accordion} [&.navds-accordion]:!border-none border-l-4 ${
                !harÅpnebareDokumenter ? "opacity-50" : ""
            } `}
        >
            <Accordion.Item open={isExpanded} onOpenChange={onToggle}>
                <Accordion.Header
                    // Aksel sin Accordion.Header pakker innholdet i en <Heading as="span">, som er
                    // display:inline og derfor ikke krymper i header-radens flex-layout. Uten dette
                    // vokser headingen til full tekstbredde og lange journalposttitler "blør" ut over
                    // komponenten i stedet for å trunkeres med ellipsis.
                    className={`[&>.aksel-heading]:min-w-0 [&>.aksel-heading]:flex-1 [&>.aksel-heading]:block [&>.aksel-heading]:overflow-hidden ${
                        isExpanded
                            ? `!pb-2 ${
                                  hoveddokumentErValgt
                                      ? "border-[var(--a-border-action,#0056b4)] bg-[var(--a-surface-action-subtle,#cce1ff)]"
                                      : "border-transparent"
                              }`
                            : ""
                    }`}
                >
                    <JournalpostHeaderInfo
                        jp={jp}
                        harDokumenter={harÅpnebareDokumenter}
                        antallDokumenter={antallDokumenter}
                        antallLeste={antallLeste}
                        gjelderRolle={gjelderRolle}
                        isExpanded={isExpanded}
                    />
                </Accordion.Header>
                <Accordion.Content
                    // Aksel sin Accordion.Content pakker barna i .aksel-accordion__content-inner, som er
                    // et CSS grid-element uten satt bredde. Grid-elementer har min-width:auto som default,
                    // så uten dette krymper ikke innholdet – lange dokumenttitler tvinger raden bredere enn
                    // sidepanelet og "blør" ut under det mørke panelet i stedet for å trunkeres.
                    className={`!p-0 ${styles.accordionContent}`}
                >
                    <VStack className="min-w-0">
                        <JournalpostMetadata jp={jp} visFagomrade={visFagomrade} />

                        {vedlegg.length > 0 && (
                            <VStack
                                gap="space-0"
                                className="divide-y divide-neutral-subtle border-t border-neutral-subtle min-w-0"
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
