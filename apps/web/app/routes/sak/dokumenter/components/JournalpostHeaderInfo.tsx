import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { RolleTag, type RolleType } from "@bidrag/common";
import { EyeIcon } from "@navikt/aksel-icons";
import { Detail, HStack, Tag } from "@navikt/ds-react";
import { journalpostStatusForkortelse } from "../utils/saksdokumenterUtils";

interface JPHeaderInfoProps {
    jp: JournalpostDto;
    isVisited: boolean;
    harDokumenter: boolean;
    antallDokumenter: number;
    gjelderRolle?: RolleDto;
    isExpanded?: boolean;
}

export function JournalpostHeaderInfo({
    jp,
    isVisited,
    harDokumenter = true,
    antallDokumenter,
    gjelderRolle,
    isExpanded = false,
}: JPHeaderInfoProps) {
    const forkortelse = journalpostStatusForkortelse(jp.status);
    const innhold = jp.innhold || jp.journalpostId || "Ukjent tittel";

    const getTagVariant = () => {
        switch (jp.status) {
            case JournalpostStatus.UNDER_OPPRETTELSE:
            case JournalpostStatus.KLAR_FOR_DISTRIBUSJON:
                return "info";
            case JournalpostStatus.UNDER_PRODUKSJON:
                return "warning";
            case JournalpostStatus.FERDIGSTILT:
                return "success";
            case JournalpostStatus.FEILREGISTRERT:
            case JournalpostStatus.RETUR:
                return "error";
            default:
                return "neutral";
        }
    };

    const rolleType = gjelderRolle?.type;
    const rolleIdent = typeof jp.gjelderAktor === "string" ? jp.gjelderAktor : (jp.gjelderAktor)?.ident;

    return (
        <HStack gap="space-4" align={isExpanded ? "start" : "center"} wrap={false}>
            <Tag size="small" variant={getTagVariant()}>
                {forkortelse}
            </Tag>

            {rolleType && (
                <RolleTag 
                    rolleType={rolleType as string as RolleType} 
                    ident={rolleIdent}
                    className="!mr-0" 
                />
            )}

            {/* Antall */}
            <Detail textColor="subtle">
                ({antallDokumenter})
            </Detail>

            <Detail 
                weight="semibold" 
                textColor={harDokumenter ? "default" : "subtle"} 
                className={`flex-1 min-w-0 ${
                    isExpanded 
                        ? "break-words whitespace-normal block" 
                        : "truncate block"
                }`}
            >
                {innhold}
            </Detail>

            {harDokumenter && isVisited && (
                <EyeIcon title="Sett" aria-label="Sett" className="text-gray-500 shrink-0 text-base ml-1 mt-0.5" />
            )}
        </HStack>
    );
}