import "./Dokumenter.css";

import React from "react";

import type { Dokument } from "../../../types/journalpost";
import DokumentView from "./DokumentView";

interface DokumenterProps {
    dokumenter: Dokument[];
    editable?: boolean;
    journalpostId: string;
    onChange?: (value: string) => void;
}

export default function Dokumenter(props: DokumenterProps) {
    const { dokumenter, ...dokumentProps } = props;
    return (
        <div className={"dokumenter"}>
            {dokumenter.map((dokument) => (
                <DokumentView {...dokumentProps} dokument={dokument} />
            ))}
        </div>
    );
}
