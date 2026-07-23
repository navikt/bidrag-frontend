import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { EyeIcon } from "@navikt/aksel-icons";
import { HStack, Tag, VStack } from "@navikt/ds-react";
import PersonIdentMedRolle from "../../sakshistorikk/components/journalpost/PersonIdentMedRolle";
import { journalpostStatusForkortelse } from "../utils/saksdokumenterUtils";

interface JPHeaderInfoProps {
    jp: JournalpostDto;
    sakRoller: RolleDto[];
    visFagomrade: boolean;
    kanAapnes?: boolean;
    isSelected?: boolean;
    isVisited?: boolean;
}

export function JournalpostHeaderInfo({
    jp,
    sakRoller,
    visFagomrade,
    kanAapnes,
    isSelected,
    isVisited,
}: JPHeaderInfoProps) {
    const forkortelse = journalpostStatusForkortelse(jp.status);
    const dokDato = jp.dokumentDato ? formaterDato(jp.dokumentDato) : "";
    const jourDato = jp.journalfortDato ? formaterDato(jp.journalfortDato) : "";
    const innhold = jp.innhold || jp.journalpostId || "Ukjent tittel";
    const gjelderAktor = jp.gjelderAktor;
    const journalforendeEnhet = jp.journalforendeEnhet;
    const dokumentType = jp.dokumentType;
    const fagomrade = jp.fagomrade;
    const skalViseGjelderLinje = Boolean(gjelderAktor || journalforendeEnhet);
    const skalViseSkilleForEnhet = Boolean(gjelderAktor && journalforendeEnhet);

    const tittelFarge =
        kanAapnes === true
            ? "var(--a-text-action, #0067c5)"
            : kanAapnes === false
              ? "var(--a-text-subtle, #707070)"
              : "var(--a-text-default, #262626)";

    return (
        <VStack gap="space-1" style={{ width: "100%", overflow: "hidden", textAlign: "left" }}>
            <HStack gap="space-4" align="center" wrap={false} style={{ width: "100%", minWidth: 0 }}>
                <Tag
                    size="xsmall"
                    variant={isSelected ? "alt1" : "neutral"}
                    style={{
                        padding: "0",
                        width: "1.25rem",
                        height: "1.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontWeight: "bold",
                    }}
                >
                    {forkortelse}
                </Tag>
                <div
                    style={{
                        fontWeight: isSelected ? 800 : "bold",
                        fontSize: "var(--a-font-size-small)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: isSelected ? "var(--a-text-default, #101010)" : tittelFarge,
                        textDecoration: kanAapnes === true && !isSelected ? "underline" : "none",
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {innhold}
                </div>
                {isVisited && (
                    <EyeIcon
                        title="Sett"
                        aria-label="Sett"
                        style={{
                            color: "var(--a-text-subtle, #707070)",
                            flexShrink: 0,
                            fontSize: "1rem",
                            marginLeft: "0.25rem",
                        }}
                    />
                )}
            </HStack>

            <HStack
                gap="space-4"
                align="center"
                wrap={true}
                style={{
                    color: isSelected ? "var(--a-text-default)" : "var(--a-text-subtle)",
                    fontSize: "var(--a-font-size-small)",
                }}
            >
                {dokumentType && <span>{dokumentType}</span>}
                {visFagomrade && fagomrade && <span>· {fagomrade}</span>}
                {dokDato && <span>· Dok: {dokDato}</span>}
                {jourDato && <span>· Jour: {jourDato}</span>}
            </HStack>

            {skalViseGjelderLinje && (
                <HStack
                    align="center"
                    gap="space-4"
                    wrap={false}
                    style={{ fontSize: "var(--a-font-size-small)", overflow: "hidden" }}
                >
                    {gjelderAktor && (
                        <>
                            <span
                                style={{
                                    color: isSelected ? "var(--a-text-default)" : "var(--a-text-subtle)",
                                    flexShrink: 0,
                                }}
                            >
                                Gjelder:
                            </span>
                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                <PersonIdentMedRolle gjelderAktor={gjelderAktor} sakRoller={sakRoller} />
                            </div>
                        </>
                    )}
                    {skalViseSkilleForEnhet && (
                        <span
                            style={{
                                color: isSelected ? "var(--a-text-default)" : "var(--a-text-subtle)",
                                flexShrink: 0,
                            }}
                        >
                            ·
                        </span>
                    )}
                    {journalforendeEnhet && (
                        <span
                            style={{
                                color: isSelected ? "var(--a-text-default)" : "var(--a-text-subtle)",
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Enhet: {journalforendeEnhet}
                        </span>
                    )}
                </HStack>
            )}
        </VStack>
    );
}
