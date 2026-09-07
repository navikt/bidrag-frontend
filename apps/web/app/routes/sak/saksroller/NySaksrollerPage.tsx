import OpprettSakFlyt from "./opprett-ny-sak/OpprettSakFlyt";
import { SaksrolleroversiktProvider } from "./opprett-ny-sak/saksrolleroversiktContext";

/**
 * Migrert fra bidrag-ui (apps/sak-ui/src/pages/saksroller og features/saksrolleroversikt).
 *
 * Bisys lenker hit via `/sak/rolle` uten saksnummer. `enhet`-query-parameteren fra Bisys brukes
 * bevisst ikke — enheten utledes av `useBestemEnhet`, slik den også gjorde i bidrag-ui.
 */
export default function NySaksrollerPage() {
    return (
        <SaksrolleroversiktProvider>
            <div className="max-w-5xl mx-auto">
                <OpprettSakFlyt />
            </div>
        </SaksrolleroversiktProvider>
    );
}
