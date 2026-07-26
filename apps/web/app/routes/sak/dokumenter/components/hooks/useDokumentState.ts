import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
    byggDokumenter,
    filtrerJournalposter,
    finnDokumenterForJournalpost,
    sjekkOmBlandingAvFarOgBidrag,
    utvidSettMedNyVerdi,
} from "../../utils/saksdokumenterUtils";

export type FilterState = ReturnType<typeof useDokumentState>["filterState"];
export type MenyState = ReturnType<typeof useDokumentState>["menyState"];
export type DokumentData = ReturnType<typeof useDokumentState>["data"];

/**
 * To tilstander for venstremenyen:
 * - liste: minimert tre-visning med journalposter og dokumenter
 * - tabell: utvidet tabellvisning med utvalgte kolonner og radvalg via checkbox
 */
export type MenyVisning = "liste" | "tabell";

const GYLDIGE_VISNINGER: MenyVisning[] = ["liste", "tabell"];

function parseVisning(verdi: string | null): MenyVisning {
    return GYLDIGE_VISNINGER.includes(verdi as MenyVisning) ? (verdi as MenyVisning) : "liste";
}

function parseValgteRefs(verdi: string | null): Set<string> {
    if (!verdi) return new Set();
    return new Set(verdi.split(",").filter(Boolean));
}

export function useDokumentState(journalposter: JournalpostDto[]) {
    const [searchParams, setSearchParams] = useSearchParams();

    const harBlandingFarBid = useMemo(() => sjekkOmBlandingAvFarOgBidrag(journalposter), [journalposter]);

    const [visFarskapUtelukket, setVisFarskapUtelukket] = useState(false);
    const [visFeilregistrerte, setVisFeilregistrerte] = useState(false);
    const [kunVedtak, setKunVedtak] = useState(false);
    const [kunFerdigstilte, setKunFerdigstilte] = useState(true);

    const [visning, setVisning] = useState<MenyVisning>(() => parseVisning(searchParams.get("visning")));

    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [tableExpandedIds, setTableExpandedIds] = useState<Set<string>>(new Set());

    // Hvilke dokumenter (identifisert med dokumentreferanse) som er huket av i tabellvisningen.
    const [valgteDokumentreferanser, setValgteDokumentreferanser] = useState<Set<string>>(() =>
        parseValgteRefs(searchParams.get("valgte")),
    );
    const [visKunValgte, setVisKunValgte] = useState<boolean>(
        () => parseValgteRefs(searchParams.get("valgte")).size > 0,
    );

    const filtrerteJournalposter = useMemo(
        () => filtrerJournalposter(journalposter, kunVedtak, visFarskapUtelukket, visFeilregistrerte, kunFerdigstilte),
        [journalposter, kunVedtak, visFarskapUtelukket, visFeilregistrerte, kunFerdigstilte],
    );

    const alleDokumenter = useMemo(() => byggDokumenter(filtrerteJournalposter), [filtrerteJournalposter]);

    const dokumenter = useMemo(() => {
        if (!visKunValgte || valgteDokumentreferanser.size === 0) return alleDokumenter;
        return alleDokumenter.filter(
            (dok) => dok.dokumentreferanse && valgteDokumentreferanser.has(dok.dokumentreferanse),
        );
    }, [alleDokumenter, visKunValgte, valgteDokumentreferanser]);

    // Når "Vis kun valgte" er aktiv skal kun journalposter med valgte dokumenter vises.
    const synligeJournalposter = useMemo(() => {
        if (!visKunValgte || valgteDokumentreferanser.size === 0) return filtrerteJournalposter;
        return filtrerteJournalposter.filter((jp) =>
            (jp.dokumenter ?? []).some(
                (dok) => dok.dokumentreferanse && valgteDokumentreferanser.has(dok.dokumentreferanse),
            ),
        );
    }, [filtrerteJournalposter, visKunValgte, valgteDokumentreferanser]);

    const alleJpMedFlereDokumenter = useMemo(
        () =>
            synligeJournalposter
                .filter((jp) => finnDokumenterForJournalpost(jp, dokumenter).length > 1)
                .map((jp) => jp.journalpostId ?? `${jp.journalfortDato ?? ""}-${jp.dokumentDato ?? ""}`),
        [synligeJournalposter, dokumenter],
    );

    // Rad-id-ene (SaksDokument.id) til hoveddokumentene som har vedlegg – brukes for "åpne alle rader" i tabellen.
    const alleTabellForeldreIder = useMemo(
        () =>
            synligeJournalposter
                .map((jp) => finnDokumenterForJournalpost(jp, dokumenter))
                .filter((docs) => docs.length > 1)
                .map((docs) => docs[0]?.id)
                .filter((id): id is string => Boolean(id)),
        [synligeJournalposter, dokumenter],
    );

    const [selectedId, setSelectedId] = useState<string | undefined>(() => {
        const dokRef = searchParams.get("dok");
        if (!dokRef) return undefined;
        return alleDokumenter.find((d) => d.dokumentreferanse === dokRef)?.id;
    });

    const selectedDocument = useMemo(() => dokumenter.find((d) => d.id === selectedId), [dokumenter, selectedId]);

    const handleSelectDocument = (id?: string) => {
        setSelectedId(id);
        if (!id) return;

        setVisitedIds((prev) => utvidSettMedNyVerdi(prev, id));

        const doc = alleDokumenter.find((d) => d.id === id);
        if (doc?.journalpostId) {
            setExpandedIds((prev) => utvidSettMedNyVerdi(prev, doc.journalpostId));
        }
    };

    const handterAapneAlle = () => setExpandedIds(new Set(alleJpMedFlereDokumenter));
    const handterLukkAlle = () => setExpandedIds(new Set());

    const handterAapneAlleTabellRader = () => setTableExpandedIds(new Set(alleTabellForeldreIder));
    const handterLukkAlleTabellRader = () => setTableExpandedIds(new Set());

    // Bygde-inn seleksjon i DataGrid gir hele det nye valget på én gang (kaskaderende), så vi erstatter settet.
    const handleSettValgteRefs = (referanser: string[]) =>
        setValgteDokumentreferanser(new Set(referanser.filter(Boolean)));

    const handleVelgAlle = () =>
        setValgteDokumentreferanser(
            new Set(alleDokumenter.map((dok) => dok.dokumentreferanse).filter((ref): ref is string => Boolean(ref))),
        );
    const handleFjernAlle = () => setValgteDokumentreferanser(new Set());
    // Synkroniser visningstilstand mot søkeparametre slik at siden kan åpnes/deles med ønsket visning.
    useEffect(() => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);

                visning === "liste" ? next.delete("visning") : next.set("visning", visning);

                valgteDokumentreferanser.size > 0
                    ? next.set("valgte", Array.from(valgteDokumentreferanser).join(","))
                    : next.delete("valgte");

                selectedDocument?.dokumentreferanse
                    ? next.set("dok", selectedDocument.dokumentreferanse)
                    : next.delete("dok");

                return next;
            },
            { replace: true },
        );
    }, [visning, valgteDokumentreferanser, selectedDocument?.dokumentreferanse]);

    // Piltaster opp/ned for å navigere mellom dokumenter i gjeldende (filtrerte) liste.
    useEffect(() => {
        const navigerbareDokumenter = dokumenter.filter((dok) => dok.kanÅpnes);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName;
            if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) return;

            if (navigerbareDokumenter.length === 0) return;

            event.preventDefault();
            const gjeldendeIndeks = navigerbareDokumenter.findIndex((dok) => dok.id === selectedId);
            const retning = event.key === "ArrowDown" ? 1 : -1;
            const nesteIndeks =
                gjeldendeIndeks === -1
                    ? 0
                    : Math.min(Math.max(gjeldendeIndeks + retning, 0), navigerbareDokumenter.length - 1);

            const nesteDokument = navigerbareDokumenter[nesteIndeks];
            if (nesteDokument) handleSelectDocument(nesteDokument.id);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dokumenter, selectedId]);

    return {
        data: {
            journalposter: synligeJournalposter,
            dokumenter,
            alleDokumenter,
            harBlandingFarBid,
            selectedDocument,
        },
        filterState: {
            kunVedtak,
            setKunVedtak,
            visFarskapUtelukket,
            setVisFarskapUtelukket,
            visFeilregistrerte,
            setVisFeilregistrerte,
            kunFerdigstilte,
            setKunFerdigstilte,
        },
        menyState: {
            visning,
            setVisning,
            selectedId,
            handleSelectDocument,
            visitedIds,
            expandedIds,
            setExpandedIds,
            handterAapneAlle,
            handterLukkAlle,
            tableExpandedIds,
            setTableExpandedIds,
            handterAapneAlleTabellRader,
            handterLukkAlleTabellRader,
            valgteDokumentreferanser,
            handleSettValgteRefs,
            handleVelgAlle,
            handleFjernAlle,
            visKunValgte,
            setVisKunValgte,
        },
    };
}
