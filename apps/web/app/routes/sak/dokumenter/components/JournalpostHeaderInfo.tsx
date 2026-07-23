import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { JournalpostStatus } from "@bidrag/api/BidragDokumentApi"; // Juster importen om nødvendig!
import { EyeIcon } from "@navikt/aksel-icons";
import { Detail, HStack, Tag } from "@navikt/ds-react";
import { journalpostStatusForkortelse } from "../utils/saksdokumenterUtils";

interface JPHeaderInfoProps {
    jp: JournalpostDto;
    isSelected?: boolean;
    isVisited?: boolean;
    harDokumenter?: boolean;
}

export function JournalpostHeaderInfo({ jp, isSelected, isVisited, harDokumenter = true }: JPHeaderInfoProps) {
    const forkortelse = journalpostStatusForkortelse(jp.status);
    const innhold = jp.innhold || jp.journalpostId || "Ukjent tittel";

    // Velg tag-farge ut ifra den faktiske statusen
    const getTagVariant = () => {
        if (isSelected) return "alt1"; 
        
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

    return (
        <HStack gap="space-4" align="center" wrap={false} className="w-full min-w-0">
            <Tag size="xsmall" variant={getTagVariant()}>
                {forkortelse}
            </Tag>
            <Detail weight="semibold" className="truncate flex-1 min-w-0">
                {innhold}
            </Detail>
            {harDokumenter && isVisited && (
                <EyeIcon title="Sett" aria-label="Sett" className="text-gray-500 shrink-0 text-base ml-1" />
            )}
        </HStack>
    );
}