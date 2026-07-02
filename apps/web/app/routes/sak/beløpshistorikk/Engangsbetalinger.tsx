import { Engangsbeloptype } from "@bidrag/api/BelopshistorikkApi";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hentEngangsbetalingerQuery } from "~/api/query/belopshistorikk.query";
import EngangsbetalingTabell from "./EngangsbetalingTabell";

interface EngangsbetalingerProps {
    saksnummer: string;
}

const GebyrTyper: Array<Engangsbeloptype> = [
    Engangsbeloptype.GEBYR_MOTTAKER,
    Engangsbeloptype.GEBYR_SKYLDNER,
];

export function Engangsbetalinger({ saksnummer }: EngangsbetalingerProps) {
    const { data: engangsbetalinger } = useSuspenseQuery(
        hentEngangsbetalingerQuery(saksnummer),
    );

    const saerBidrag = engangsbetalinger.filter(
        (e) => !GebyrTyper.includes(e.type),
    );

    return <EngangsbetalingTabell engangsbelop={saerBidrag} />;
}
