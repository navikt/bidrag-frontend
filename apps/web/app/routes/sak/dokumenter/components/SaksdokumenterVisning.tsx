import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { useHentSak } from "~/api/useApi.ts";
import { DokumentVisning } from "./DokumentVisning";
import { useDokumentState } from "./hooks/useDokumentState";

export function SaksdokumenterVisning({
    saksnummer,
    journalposter,
}: {
    saksnummer: string;
    journalposter: JournalpostDto[];
}) {
    const { data: sak } = useHentSak(saksnummer);
    const sakRoller = (sak?.roller ?? []) as RolleDto[];

    const { data, filterState, menyState } = useDokumentState(journalposter);

    return <DokumentVisning data={data} filterState={filterState} menyState={menyState} sakRoller={sakRoller} />;
}
