import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { useMemo, useState } from "react";
import {
    byggDokumenter,
    filtrerJournalposter,
    hentJournalpostIderMedFlereDokumenter,
    sjekkOmBlandingAvFarOgBidrag,
    utvidSettMedNyVerdi,
} from "../../utils/saksdokumenterUtils";

export type FilterState = ReturnType<typeof useDokumentState>["filterState"];
export type MenyState = ReturnType<typeof useDokumentState>["menyState"];
export type DokumentData = ReturnType<typeof useDokumentState>["data"];

export function useDokumentState(journalposter: JournalpostDto[]) {
    const harBlandingFarBid = useMemo(() => sjekkOmBlandingAvFarOgBidrag(journalposter), [journalposter]);

    const [visFarskapUtelukket, setVisFarskapUtelukket] = useState(false);
    const [visFeilregistrerte, setVisFeilregistrerte] = useState(false);
    const [kunVedtak, setKunVedtak] = useState(false);
    const [kunFerdigstilte, setKunFerdigstilte] = useState(true);

    const [selectedId, setSelectedId] = useState<string>();
    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const filtrerteJournalposter = useMemo(
        () => filtrerJournalposter(journalposter, kunVedtak, visFarskapUtelukket, visFeilregistrerte, kunFerdigstilte),
        [journalposter, kunVedtak, visFarskapUtelukket, visFeilregistrerte, kunFerdigstilte]
    );

    const alleJpMedFlereDokumenter = useMemo(
        () => hentJournalpostIderMedFlereDokumenter(filtrerteJournalposter),
        [filtrerteJournalposter]
    );

    const dokumenter = useMemo(() => byggDokumenter(filtrerteJournalposter), [filtrerteJournalposter]);

    const selectedDocument = useMemo(() => dokumenter.find((d) => d.id === selectedId), [dokumenter, selectedId]);

    const handleSelectDocument = (id?: string) => {
        setSelectedId(id);
        if (!id) return;

        setVisitedIds((prev) => utvidSettMedNyVerdi(prev, id));

        const doc = dokumenter.find((d) => d.id === id);
        if (doc?.journalpostId) {
            setExpandedIds((prev) => utvidSettMedNyVerdi(prev, doc.journalpostId));
        }
    };

    const handterAapneAlle = () => setExpandedIds(new Set(alleJpMedFlereDokumenter));
    const handterLukkAlle = () => setExpandedIds(new Set());

    return {
        data: {
            journalposter: filtrerteJournalposter,
            dokumenter,
            harBlandingFarBid,
            selectedDocument,
        },
        filterState: {
            kunVedtak, setKunVedtak,
            visFarskapUtelukket, setVisFarskapUtelukket,
            visFeilregistrerte, setVisFeilregistrerte,
            kunFerdigstilte, setKunFerdigstilte,
        },
        menyState: {
            selectedId,
            handleSelectDocument,
            visitedIds,
            expandedIds,
            setExpandedIds,
            handterAapneAlle,
            handterLukkAlle,
        }
    };
}