import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import type React from "react";
import type { SaksDokument } from "../types";
import { DokumentTre } from "./DokumentTre";
import { FilterBoks } from "./FilterBoks";

export interface VenstreMenyProps {
    journalposter: JournalpostDto[];
    dokumenter: SaksDokument[];
    sakRoller: RolleDto[];
    harBlandingFarBid: boolean;
    kunVedtak: boolean;
    setKunVedtak: (val: boolean) => void;
    visFarskapUtelukket: boolean;
    setVisFarskapUtelukket: (val: boolean) => void;
    visFeilregistrerte: boolean;
    setVisFeilregistrerte: (val: boolean) => void;
    kunFerdigstilte: boolean;
    setKunFerdigstilte: (val: boolean) => void;
    selectedId?: string;
    setSelectedId: (id: string) => void;
    visitedIds: Set<string>;
    expandedIds: Set<string>;
    setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    alleJpMedFlereDokumenter: string[];
}

export function VenstreMeny(props: VenstreMenyProps) {
    return (
        <nav
            aria-label="Dokumentliste"
            style={{
                width: "24rem",
                minWidth: "18rem",
                maxWidth: "26rem",
                height: "100%",
                border: "1px solid var(--a-border-default)",
                borderRadius: "0.5rem",
                background: "var(--a-surface-subtle)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <FilterBoks {...props} />
            <DokumentTre {...props} />
        </nav>
    );
}
