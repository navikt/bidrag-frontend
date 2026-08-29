import "./ForsendelseDetaljer.css";

import { dateToDDMMYYYYString } from "@bidrag/common";
import { BodyLong, Label } from "@navikt/ds-react";
import type { JSX } from "react";

import { useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
import { Distribusjonskanal } from "./Distribusjonskanal";
export default function ForsendelseDetaljer() {
    const forsendelse = useHentForsendelseQuery();

    return (
        <div>
            {/* <Heading size="small">Andre detaljer</Heading> */}
            <div className="h-px w-full bg-ax-border-neutral-subtle mt-4 mb-3" />
            <div className="flex flex-row static_data">
                <DetailsGrid
                    rows={[
                        {
                            label: "Tema",
                            value: forsendelse.tema === "FAR" ? "Foreldreskap" : "Bidrag",
                        },
                        {
                            label: "Opprettet dato",
                            value: dateToDDMMYYYYString(new Date(forsendelse.opprettetDato)),
                        },
                        {
                            label: "Opprettet av",
                            value: forsendelse.opprettetAvNavn,
                        },
                        {
                            label: "Distribusjonskanal",
                            value: <Distribusjonskanal />,
                        },
                    ]}
                />
            </div>
        </div>
    );
}

interface DetailsColumnProps {
    rows: {
        label: string;
        value: string | JSX.Element;
    }[];
}
function DetailsGrid({ rows }: DetailsColumnProps) {
    return (
        <dl className="forsendelse_description_list">
            {rows.map((row) => (
                <BodyLong key={row.value + row.label}>
                    <dt>
                        <Label>{row.label}</Label>
                    </dt>
                    <dd>{row.value}</dd>
                </BodyLong>
            ))}
        </dl>
    );
}
