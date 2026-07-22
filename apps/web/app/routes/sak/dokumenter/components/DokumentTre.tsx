import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Accordion, Alert, VStack } from "@navikt/ds-react";
import type React from "react";
import { standardSort } from "../../sakshistorikk/components/journalpost/journalpostUtils";
import type { SaksDokument } from "../types";
import { finnDokumenterForJournalpost } from "../utils/saksdokumenterUtils";
import { DokumentKnapp } from "./DokumentKnapp";
import { JournalpostHaderInfo } from "./JournalpostHaderInfo";

export interface DokumentTreProps {
    journalposter: JournalpostDto[];
    dokumenter: SaksDokument[];
    sakRoller: RolleDto[];
    harBlandingFarBid: boolean;
    selectedId?: string;
    setSelectedId: (id: string) => void;
    visitedIds: Set<string>;
    expandedIds: Set<string>;
    setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function DokumentTre({
    journalposter,
    dokumenter,
    sakRoller,
    harBlandingFarBid,
    selectedId,
    setSelectedId,
    visitedIds,
    expandedIds,
    setExpandedIds,
}: DokumentTreProps) {
    if (dokumenter.length === 0) {
        return (
            <div style={{ padding: "0.5rem" }}>
                <Alert variant="info" size="small">
                    Ingen dokumenter
                </Alert>
            </div>
        );
    }

    return (
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "0.25rem" }}>
            <VStack gap="space-4">
                {journalposter
                    .slice()
                    .sort(standardSort)
                    .map((jp: JournalpostDto) => {
                        const jpId = jp.journalpostId ?? `${jp.journalfortDato ?? ""}-${jp.dokumentDato ?? ""}`;
                        const doksForJp = finnDokumenterForJournalpost(jp, dokumenter);

                        if (doksForJp.length === 0) {
                            return (
                                <div key={jpId} style={{ padding: "0.25rem 0.5rem" }}>
                                    <JournalpostHaderInfo
                                        jp={jp}
                                        sakRoller={sakRoller}
                                        visFagomrade={harBlandingFarBid}
                                        kanAapnes={false}
                                    />
                                </div>
                            );
                        }

                        if (doksForJp.length === 1) {
                            const dok = doksForJp[0] as SaksDokument;
                            const isSelected = selectedId === dok.id;
                            const isVisited = visitedIds.has(dok.id);

                            const backgroundStyle = isSelected
                                ? "var(--a-surface-action-subtle, #cce1ff)"
                                : "transparent";
                            const borderStyle = isSelected
                                ? "4px solid var(--a-border-action, #0056b4)"
                                : "4px solid transparent";

                            return (
                                <button
                                    key={jpId}
                                    type="button"
                                    onClick={() => dok.kanAapnes && setSelectedId(dok.id)}
                                    aria-current={isSelected ? "true" : "false"}
                                    style={{
                                        width: "100%",
                                        padding: "0.375rem 0.5rem",
                                        textAlign: "left",
                                        background: backgroundStyle,
                                        border: "none",
                                        borderLeft: borderStyle,
                                        borderRadius: "0 0.25rem 0.25rem 0",
                                        cursor: dok.kanAapnes ? "pointer" : "not-allowed",
                                        display: "block",
                                        transition: "background-color 0.15s ease",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <JournalpostHaderInfo
                                        jp={jp}
                                        sakRoller={sakRoller}
                                        visFagomrade={harBlandingFarBid}
                                        kanAapnes={dok.kanAapnes}
                                        isSelected={isSelected}
                                        isVisited={isVisited}
                                    />
                                </button>
                            );
                        }

                        const isExpanded = expandedIds.has(jpId);
                        const harSettAlle = doksForJp.length > 0 && doksForJp.every((dok) => visitedIds.has(dok.id));

                        const handterAccordionEndring = (isOpen: boolean) => {
                            setExpandedIds((prev) => {
                                const next = new Set(prev);
                                if (isOpen) {
                                    next.add(jpId);
                                } else {
                                    next.delete(jpId);
                                }
                                return next;
                            });
                        };

                        return (
                            <Accordion key={jpId}>
                                <Accordion.Item open={isExpanded} onOpenChange={handterAccordionEndring}>
                                    <Accordion.Header className="[&>button]:py-2 [&>button]:px-2 hover:[&>button]:bg-gray-100">
                                        <JournalpostHaderInfo
                                            jp={jp}
                                            sakRoller={sakRoller}
                                            visFagomrade={harBlandingFarBid}
                                            isVisited={harSettAlle}
                                        />
                                    </Accordion.Header>
                                    <Accordion.Content style={{ padding: "0 0.25rem 0.25rem 1rem" }}>
                                        <VStack gap="space-0">
                                            {doksForJp.map((dok) => (
                                                <DokumentKnapp
                                                    key={dok.id}
                                                    dokument={dok}
                                                    isSelected={selectedId === dok.id}
                                                    isVisited={visitedIds.has(dok.id)}
                                                    onClick={() => setSelectedId(dok.id)}
                                                />
                                            ))}
                                        </VStack>
                                    </Accordion.Content>
                                </Accordion.Item>
                            </Accordion>
                        );
                    })}
            </VStack>
        </div>
    );
}
