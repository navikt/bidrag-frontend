import { DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { PencilIcon } from "@navikt/aksel-icons";
import { Button, Link, Loader } from "@navikt/ds-react";
import { type PropsWithChildren, useState } from "react";

import { OpenDocumentUtils } from "../../utils/OpenDocumentUtils";

const MBDOK_SPINNER_VARIGHET_MS = 5000;

export interface AapneDokumentKnappProps {
    journalpostId: string;
    dokumentreferanse?: string;
    /** Status på dokumentet. Kan være `DokumentStatusDto` eller en app-spesifikk statusstreng med samme verdier. */
    status?: DokumentStatusDto | string;
    /**
     * Tekst som skal vises for `variant="lenke"`. Utelates `children`, eller brukes
     * `variant="ikon"`, vises kun en ikonknapp uten synlig tekst.
     */
    variant?: "lenke" | "ikon";
    tittel?: string;
    className?: string;
    /** Vis en ekstra knapp for å åpne dokumentet i redigeringsverktøyet, i tillegg til vanlig åpning. */
    visRedigeringKnapp?: boolean;
}

/**
 * Felleskomponent for å åpne et dokument, uavhengig av om det ligger i en journalpost
 * (ferdigstilt/arkivert) eller fortsatt er under produksjon i mbdok.
 *
 * - `FERDIGSTILT`: åpner dokumentvisningen i en ny fane.
 * - `UNDER_PRODUKSJON`: åpner via mbdok, med en spinner i inntil 5 sekunder og sperre mot dobbeltklikk.
 * - I tillegg kan en knapp for å åpne dokumentet i redigeringsverktøyet vises (`visRedigeringKnapp`).
 */
export default function AapneDokumentKnapp({
    journalpostId,
    dokumentreferanse,
    status,
    variant = "lenke",
    tittel,
    className,
    visRedigeringKnapp = false,
    children,
}: PropsWithChildren<AapneDokumentKnappProps>) {
    const [laster, setLaster] = useState(false);

    const kanÅpnesDirekte = status === DokumentStatusDto.FERDIGSTILT && Boolean(dokumentreferanse);
    const kanÅpnesMedMbdok = status === DokumentStatusDto.UNDER_REDIGERING && Boolean(dokumentreferanse);
    const dokumentHref = `/dokument/${journalpostId}/${dokumentreferanse}?dok=${dokumentreferanse}`;

    function åpneMedMbdok() {
        console.log(laster, dokumentreferanse)
        if (laster || !dokumentreferanse) return;
        setLaster(true);
        window.setTimeout(() => setLaster(false), MBDOK_SPINNER_VARIGHET_MS);
        OpenDocumentUtils.openMbdokDocument(journalpostId, dokumentreferanse).catch((error: unknown) => {
            setLaster(false);
            window.alert(error instanceof Error ? error.message : "Kunne ikke åpne dokumentet");
        });
    }

    function åpneIRedigering() {
        if (!dokumentreferanse) return;
        OpenDocumentUtils.openDocumentRedigering(journalpostId, dokumentreferanse);
    }

    function renderÅpneknapp() {
        if (variant === "ikon") {
            if (kanÅpnesDirekte) {
                return (
                    <Button
                        as="a"
                        href={dokumentHref}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        variant="tertiary"
                        title={tittel ?? "Åpne dokument"}
                        icon={children}
                        className={className}
                    />
                );
            }
            if (kanÅpnesMedMbdok) {
                return (
                    <Button
                        size="small"
                        variant="tertiary"
                        loading={laster}
                        disabled={laster}
                        title={laster ? "Åpner dokument …" : (tittel ?? "Åpne dokument")}
                        icon={children}
                        className={className}
                        onClick={åpneMedMbdok}
                    />
                );
            }
            return null;
        }

        if (kanÅpnesDirekte) {
            return (
                <Link className={className} target="_blank" href={dokumentHref} title={tittel}>
                    {children}
                </Link>
            );
        }
        if (kanÅpnesMedMbdok) {
            return (
                <>
                    <Link
                        className={className}
                        href="#"
                        aria-disabled={laster}
                        title={tittel}
                        onClick={(e) => {
                            e.preventDefault();
                            åpneMedMbdok();
                        }}
                    >
                        {children}
                    </Link>
                    {laster && <Loader size="xsmall" title="Åpner dokument …" />}
                </>
            );
        }
        return <span className={className}>{children}</span>;
    }

    const visRedigering = visRedigeringKnapp && dokumentreferanse && (kanÅpnesDirekte || kanÅpnesMedMbdok);

    return (
        <>
            {renderÅpneknapp()}
            {variant === "ikon" && kanÅpnesMedMbdok && laster && <Loader size="xsmall" title="Åpner dokument …" />}
            {visRedigering && (
                <Button
                    size="small"
                    variant="tertiary-neutral"
                    icon={<PencilIcon />}
                    title="Åpne i redigering"
                    onClick={åpneIRedigering}
                />
            )}
        </>
    );
}
