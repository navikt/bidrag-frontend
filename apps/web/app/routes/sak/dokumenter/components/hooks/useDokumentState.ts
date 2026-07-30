import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { standardSort } from "../../../sakshistorikk/components/journalpost/journalpostUtils";
import { useSort } from "../../../sakshistorikk/components/useSort";
import {
    byggDokumenter,
    filtrerJournalposter,
    finnDokumenterForJournalpost,
    sjekkOmBlandingAvFarOgBidrag,
    utvidSettMedNyVerdi,
} from "../../utils/saksdokumenterUtils";

/**
 * Sorteringsnøkler tilgjengelig i tre-/listevisningen (`DokumentTre`). Tabellvisningen har sin
 * egen kolonnebaserte sortering (`useSort` direkte i `SaksdokumentTabell`).
 */
export type DokumentSortKey = "dokumentDato" | "journalfortDato" | "gjelderAktor";

export type FilterState = ReturnType<typeof useDokumentState>["filterState"];
export type MenyState = ReturnType<typeof useDokumentState>["menyState"];
export type DokumentData = ReturnType<typeof useDokumentState>["data"];

/**
 * Tre tilstander for venstremenyen:
 * - skjult: helt minimert til en smal kolonne, slik at dokumentet får all plassen
 * - liste: minimert tre-visning med journalposter og dokumenter
 * - tabell: utvidet tabellvisning med utvalgte kolonner og radvalg via checkbox
 */
export type MenyVisning = "skjult" | "liste" | "tabell";

const GYLDIGE_VISNINGER: MenyVisning[] = ["skjult", "liste", "tabell"];

function parseVisning(verdi: string | null): MenyVisning | undefined {
    return GYLDIGE_VISNINGER.includes(verdi as MenyVisning) ? (verdi as MenyVisning) : undefined;
}

function parseValgteRefs(verdi: string | null): Set<string> {
    if (!verdi) return new Set();
    return new Set(verdi.split(",").filter(Boolean));
}

export interface UseDokumentStateOptions {
    /**
     * Standardverdi for "kun ferdigstilte"-filteret. Sak-visningen ønsker `true` (skjul journalposter
     * uten ferdigstilte dokumenter), mens en enkelt journalpost (f.eks. `JournalpostFremviser`) alltid
     * skal vises uavhengig av status – der brukes `false`.
     */
    standardKunFerdigstilte?: boolean;
    /**
     * Dokumentreferanse som skal være forhåndsvalgt dersom URL-et ikke allerede spesifiserer `?dok=`.
     */
    initialDokumentreferanse?: string;
    /**
     * Velg første tilgjengelige dokument automatisk når dokumentlisten har lastet.
     */
    autoSelectFirstDocument?: boolean;
    /**
     * Journalposter hentet med `bareFarskapUtelukket=true`. Backend returnerer enten alle
     * journalposter *unntatt* de farskapsutelukkede (standard) eller *kun* de farskapsutelukkede,
     * så utvalgene byttes ut i sin helhet når filteret slås på.
     */
    farskapUtelukkedeJournalposter?: JournalpostDto[];
}

export function useDokumentState(journalposter: JournalpostDto[], options?: UseDokumentStateOptions) {
    const [searchParams, setSearchParams] = useSearchParams();

    const [visFarskapUtelukket, setVisFarskapUtelukket] = useState(false);
    const [visFeilregistrerte, setVisFeilregistrerte] = useState(false);
    const [kunVedtak, setKunVedtak] = useState(false);
    const [kunFerdigstilte, setKunFerdigstilte] = useState(options?.standardKunFerdigstilte ?? true);

    const farskapUtelukkedeJournalposter = options?.farskapUtelukkedeJournalposter ?? [];
    const harFarskapUtelukkede = farskapUtelukkedeJournalposter.length > 0;

    // Backend skiller utvalgene med `bareFarskapUtelukket`: standardutvalget inneholder ingen
    // farskapsutelukkede journalposter, og filteret bytter til utvalget som kun inneholder disse.
    // Journalposter med tema FAR som ikke er farskapsutelukket vises derfor alltid.
    const kildeJournalposter = visFarskapUtelukket ? farskapUtelukkedeJournalposter : journalposter;

    const harBlandingFarBid = useMemo(() => sjekkOmBlandingAvFarOgBidrag(kildeJournalposter), [kildeJournalposter]);

    const [visning, setVisning] = useState<MenyVisning>(() => {
        const visningParam = parseVisning(searchParams.get("visning"));
        if (visningParam) return visningParam;

        // Ingen dokument forhåndsvalgt (verken via `?dok=` eller `initialDokumentreferanse`) betyr at
        // brukeren åpner oversikten uten en spesifikk journalpost i fokus – da er tabellvisningen mest
        // nyttig som standard. Er et dokument allerede valgt (f.eks. `JournalpostFremviser`), behold
        // den kompakte listevisningen slik at dokumentfremviseren får mest plass.
        const dokRef = searchParams.get("dok") ?? options?.initialDokumentreferanse;
        return dokRef ? "liste" : "tabell";
    });

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

    // Avkrysningsboksene i tabellen finnes kun for å filtrere ned dokumentlisten, og er forvirrende
    // når de alltid vises. De slås derfor på eksplisitt via "Filtrer dokumenter". Et delt URL-et med
    // `valgte` starter i modusen, slik at mottakeren ser hva avsenderen filtrerte på.
    const [velgDokumenterAktiv, setVelgDokumenterAktiv] = useState<boolean>(
        () => parseValgteRefs(searchParams.get("valgte")).size > 0,
    );

    const filtrerteJournalposter = useMemo(
        () => filtrerJournalposter(kildeJournalposter, kunVedtak, visFeilregistrerte, kunFerdigstilte),
        [kildeJournalposter, kunVedtak, visFeilregistrerte, kunFerdigstilte],
    );

    const alleDokumenter = useMemo(() => byggDokumenter(filtrerteJournalposter), [filtrerteJournalposter]);

    // Totalt antall journalposter/dokumenter i gjeldende utvalg før filtrering – brukes til tellerne.
    const antallJournalposterTotalt = kildeJournalposter.length;
    const antallDokumenterTotalt = useMemo(
        () => kildeJournalposter.reduce((sum, jp) => sum + (jp.dokumenter?.length ?? 0), 0),
        [kildeJournalposter],
    );

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

    // Sortering for tre-/listevisningen (`DokumentTre`). Tabellvisningen sorterer uavhengig via
    // egne kolonneheadere i `SaksdokumentTabell`, men tilstanden ligger her slik at
    // "Tilbakestill sortering" kan bo sammen med de øvrige kontrollene i `FilterBoks`.
    const {
        sort: tabellSort,
        handleSort: handleTabellSort,
        sortData: sortTabellData,
        setSort: setTabellSort,
    } = useSort<JournalpostDto>({
        defaultUnsorted: standardSort,
        customComparators: {
            gjelderAktor: (a, b) => (a.gjelderAktor?.ident ?? "").localeCompare(b.gjelderAktor?.ident ?? ""),
        },
    });

    const {
        sort: listeSort,
        handleSort: handleListeSort,
        sortData: sortListeData,
    } = useSort<JournalpostDto, DokumentSortKey>({
        defaultUnsorted: standardSort,
        customComparators: {
            gjelderAktor: (a, b) => (a.gjelderAktor?.ident ?? "").localeCompare(b.gjelderAktor?.ident ?? ""),
        },
    });

    const sorterteJournalposter = sortListeData(synligeJournalposter);

    const alleJpMedFlereDokumenter = useMemo(
        () =>
            synligeJournalposter
                .filter((jp) => finnDokumenterForJournalpost(jp, dokumenter).length > 1)
                .map((jp) => jp.journalpostId ?? `${jp.journalfortDato ?? ""}-${jp.dokumentDato ?? ""}`),
        [synligeJournalposter, dokumenter],
    );

    // Rad-id-ene (SaksDokument.id) til hoveddokumentene som har vedlegg – brukes for "åpne alle rader" i tabellen.
    // Kun relevant når hoveddokumentet faktisk er synlig (ellers vises vedleggene som egne, uavhengige rader).
    const alleTabellForeldreIder = useMemo(
        () =>
            synligeJournalposter
                .map((jp) => finnDokumenterForJournalpost(jp, dokumenter))
                .filter((docs) => docs.length > 1 && docs.some((d) => d.erHoveddokument))
                .map((docs) => docs.find((d) => d.erHoveddokument)?.id)
                .filter((id): id is string => Boolean(id)),
        [synligeJournalposter, dokumenter],
    );

    const [selectedId, setSelectedId] = useState<string | undefined>(() => {
        const dokRef = searchParams.get("dok") ?? options?.initialDokumentreferanse;
        if (!dokRef) return undefined;
        return alleDokumenter.find((d) => d.dokumentreferanse === dokRef)?.id;
    });

    const selectedDocument = useMemo(() => dokumenter.find((d) => d.id === selectedId), [dokumenter, selectedId]);

    useEffect(() => {
        if (!options?.autoSelectFirstDocument) return;
        if (selectedId !== undefined) return;
        if (alleDokumenter.length === 0) return;

        const dokRef = searchParams.get("dok") ?? options?.initialDokumentreferanse;
        const onsketDokument = dokRef ? alleDokumenter.find((d) => d.dokumentreferanse === dokRef) : undefined;
        setSelectedId(onsketDokument?.id ?? alleDokumenter[0]?.id);
    }, [alleDokumenter, options?.autoSelectFirstDocument, options?.initialDokumentreferanse, searchParams, selectedId]);

    const handleSelectDocument = (id?: string) => {
        setSelectedId(id);
        if (!id) return;

        setVisitedIds((prev) => utvidSettMedNyVerdi(prev, id));

        const doc = alleDokumenter.find((d) => d.id === id);
        if (doc?.journalpostId) {
            setExpandedIds((prev) => utvidSettMedNyVerdi(prev, doc.journalpostId));

            // I tabellvisningen ligger vedlegg skjult under hoveddokument-raden til den er utvidet.
            // Naviger (f.eks. med piltast) til et vedlegg skal derfor automatisk utvide raden, slik
            // at brukeren alltid ser hvilket dokument som faktisk vises i PDF-fremviseren.
            if (!doc.erHoveddokument) {
                const hoveddokument = alleDokumenter.find(
                    (d) => d.journalpostId === doc.journalpostId && d.erHoveddokument,
                );
                if (hoveddokument) {
                    setTableExpandedIds((prev) => utvidSettMedNyVerdi(prev, hoveddokument.id));
                }
            }
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
    // Når utvalget tømmes forsvinner også "Vis kun valgte"-avkrysningsboksen, så tilstanden nullstilles
    // for å unngå at den er huket av neste gang brukeren velger et dokument.
    const handleFjernAlle = () => {
        setValgteDokumentreferanser(new Set());
        setVisKunValgte(false);
    };

    /**
     * Slår dokumentfiltreringen av eller på. Når den slås av nullstilles utvalget, slik at tabellen
     * går tilbake til å vise alle dokumenter i stedet for å etterlate et usynlig aktivt filter.
     */
    const handterToggleVelgDokumenter = () => {
        setVelgDokumenterAktiv((forrige) => {
            if (forrige) {
                setValgteDokumentreferanser(new Set());
                setVisKunValgte(false);
            }
            return !forrige;
        });
    };
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
            journalposter: sorterteJournalposter,
            dokumenter,
            alleDokumenter,
            antallDokumenterTotalt,
            antallJournalposterTotalt,
            harBlandingFarBid,
            harFarskapUtelukkede,
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
            listeSort,
            handleListeSort,
            tabellSort,
            handleTabellSort,
            sortTabellData,
            tilbakestillTabellSortering: () => setTabellSort(undefined),
            valgteDokumentreferanser,
            handleSettValgteRefs,
            handleVelgAlle,
            handleFjernAlle,
            velgDokumenterAktiv,
            handterToggleVelgDokumenter,
            visKunValgte,
            setVisKunValgte,
        },
    };
}
