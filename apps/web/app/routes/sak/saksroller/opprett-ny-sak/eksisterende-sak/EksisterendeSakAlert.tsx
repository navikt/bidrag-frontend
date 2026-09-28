import type { BidragssakDto } from "@bidrag/api/SakApi";
import { RedirectTo } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Heading, Link } from "@navikt/ds-react";
import { useEffect, useRef } from "react";
import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root.tsx";

type Props = {
    eksisterendeSak: BidragssakDto;
    partISakenNavn: string;
    motpartNavn?: string;
};

export default function EksisterendeSakAlert({ eksisterendeSak, partISakenNavn, motpartNavn }: Props) {
    const { bisysUrl = "" } = useRouteLoaderData<typeof rootLoader>("root") ?? {};
    const alertRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            alertRef.current.focus();
        }
    }, []);

    return (
        <Alert variant="error" size="small" ref={alertRef} tabIndex={-1}>
            <Heading level="3" size="xsmall" spacing>
                Eksisterende sak funnet
            </Heading>
            <BodyShort spacing>
                Det finnes allerede en sak (saksnr:{" "}
                <Link
                    data-color="accent"
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        RedirectTo.behandleSak(eksisterendeSak.saksnummer, bisysUrl, true);
                    }}
                >
                    <span className="saksnr">{eksisterendeSak.saksnummer}</span> <ExternalLinkIcon aria-hidden />
                </Link>
                ) mellom <strong className="personnavn">{partISakenNavn}</strong> og{" "}
                <strong className="personnavn">{motpartNavn || "ukjent motpart"}</strong> med samme roller. Du kan ikke
                opprette en ny sak med identiske parter og roller.
            </BodyShort>
        </Alert>
    );
}
