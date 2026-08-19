import React from "react";

const OpprettSakComponent = React.lazy(() => import("bidrag_sak_ui/OpprettSak"));

export interface IOpprettSakModalProps {
    isOpen: boolean;
    ident: string;
    navn: string;
    eierfogd: string;
    onSubmit: (saksnummer: string) => void;
    onClose: () => void;
}

export default function OpprettSakModal({ isOpen, ident, navn, eierfogd, onSubmit, onClose }: IOpprettSakModalProps) {
    return (
        <OpprettSakComponent
            isOpen={isOpen}
            ident={ident}
            navn={navn}
            eierfogd={eierfogd}
            onSubmit={onSubmit}
            onClose={onClose}
        />
    );
}
