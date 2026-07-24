import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { RolleTag, type RolleType } from "@bidrag/common";
import { EyeIcon } from "@navikt/aksel-icons";
import { Detail, HStack, Tag } from "@navikt/ds-react";

interface JPHeaderInfoProps {
    jp: JournalpostDto;
    harDokumenter: boolean;
    antallDokumenter: number;
    antallLeste: number;
    gjelderRolle?: RolleDto;
    isExpanded?: boolean;
}

export function JournalpostHeaderInfo({
    jp,
    harDokumenter = true,
    antallDokumenter,
    antallLeste,
    gjelderRolle,
    isExpanded = false,
}: JPHeaderInfoProps) {
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
    const rolleIdent = jp.gjelderAktor?.ident;

    const harLestMinstEtt = antallLeste > 0;

    const antallTekst =
        antallDokumenter > 1 && harLestMinstEtt ? `(${antallLeste}/${antallDokumenter})` : `(${antallDokumenter})`;

    return (
        <HStack gap="space-4" align={isExpanded ? "start" : "center"} wrap={false} className="w-full min-w-0">
            <Tag size="small" variant={getTagVariant()} className="shrink-0">
                {jp.dokumentType ?? "?"}
            </Tag>

            {rolleType && (
                <RolleTag rolleType={rolleType as string as RolleType} ident={rolleIdent} className="shrink-0 !mr-0" />
            )}

            <HStack gap="space-1" align="center" className="shrink-0 text-gray-500">
                {harDokumenter && harLestMinstEtt && <EyeIcon title="Sett" aria-label="Sett" className="text-base" />}
                <Detail textColor="subtle" className="font-normal">
                    {antallTekst}
                </Detail>
            </HStack>

            <Detail
                weight="semibold"
                textColor={harDokumenter ? "default" : "subtle"}
                className={`flex-1 min-w-0 ${isExpanded ? "break-words whitespace-normal block" : "truncate block"}`}
            >
                {innhold}
            </Detail>
        </HStack>
    );
}
