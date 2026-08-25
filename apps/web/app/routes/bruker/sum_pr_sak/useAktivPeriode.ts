import { useBeløphistorikk } from "~/common/reskontro/useBelopshistorikk.ts";
import { erDatoInnenforPeriode } from "~/routes/sak/beløpshistorikk/periode.utils.ts";

export function useAktivPeriode(saksnummer: string) {
    const { perioder } = useBeløphistorikk(saksnummer);
    const now = new Date();
    const aktivePerioder = perioder.filter((p) => {
        const periode = p.periode;
        return erDatoInnenforPeriode(now, periode.fom, periode.til);
    });

    return {
        aktivePerioder,
    };
}
