import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { BodyShort, Detail, Heading, HStack, VStack } from "@navikt/ds-react";
import PersonIdentMedRolle from "../../sakshistorikk/components/journalpost/PersonIdentMedRolle";
import type { SaksDokument } from "../types";

interface ToppRadProps {
    saksnummer: string;
    selectedDocument?: SaksDokument;
    sakRoller: RolleDto[];
}

export function ToppRad({ saksnummer, selectedDocument, sakRoller }: ToppRadProps) {
    const tittel = selectedDocument?.tittel;
    const jpTittel = selectedDocument?.journalpostTittel;
    const harForskjelligJpTittel = jpTittel && jpTittel !== tittel;

    const journalpostId = selectedDocument?.journalpostId;
    const dokRef = selectedDocument?.dokumentreferanse;
    const dokDato = selectedDocument?.dokumentDato ? formaterDato(selectedDocument.dokumentDato) : undefined;
    const jourDato = selectedDocument?.journalfortDato ? formaterDato(selectedDocument.journalfortDato) : undefined;
    const dokType = selectedDocument?.dokumentType;
    const gjelderAktor = selectedDocument?.gjelderAktor;

    return (
        <HStack gap="space-16" align="center" style={{ flexShrink: 0 }}>
            <div style={{ width: "24rem", minWidth: "18rem", maxWidth: "26rem" }}>
                <Heading size="medium">Dokumenter for sak {saksnummer}</Heading>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {selectedDocument ? (
                    <VStack gap="space-1">
                        <HStack gap="space-8" align="center" wrap={false}>
                            <Heading
                                size="small"
                                style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                                {tittel}
                            </Heading>
                            {harForskjelligJpTittel && (
                                <Detail
                                    style={{
                                        color: "var(--a-text-subtle)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        flexShrink: 1,
                                    }}
                                >
                                    ({jpTittel})
                                </Detail>
                            )}
                        </HStack>

                        <HStack
                            gap="space-8"
                            align="center"
                            wrap={true}
                            style={{ fontSize: "var(--a-font-size-small)", color: "var(--a-text-subtle)" }}
                        >
                            {journalpostId && <span>JP: {journalpostId}</span>}
                            {dokRef && <span>· Dok.ref: {dokRef}</span>}
                            {dokType && <span>· Type: {dokType}</span>}
                            {dokDato && <span>· Dok: {dokDato}</span>}
                            {jourDato && <span>· Jour: {jourDato}</span>}
                            {gjelderAktor && (
                                <HStack gap="space-4" align="center" wrap={false} style={{ display: "inline-flex" }}>
                                    <span>· Gjelder:</span>
                                    <PersonIdentMedRolle gjelderAktor={gjelderAktor} sakRoller={sakRoller} />
                                </HStack>
                            )}
                        </HStack>
                    </VStack>
                ) : (
                    <BodyShort size="small" style={{ color: "var(--a-text-subtle)" }}>
                        Ingen dokumenter valgt
                    </BodyShort>
                )}
            </div>
        </HStack>
    );
}
