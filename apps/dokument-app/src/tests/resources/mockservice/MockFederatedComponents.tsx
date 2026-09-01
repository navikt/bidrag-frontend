import React from "react";

import type { IOpprettSakModalProps } from "../../../common/components/modal/opprett-sak-modal/OpprettSakModal";
import { NY_OPPRETTET_SAKSNUMMER } from "../testdata";

export const OpprettSakMock = ({ onSubmit, onClose }: IOpprettSakModalProps) => {
    return (
        <div>
            <button type={"button"} id="opprettsak-submit" onClick={() => onSubmit(NY_OPPRETTET_SAKSNUMMER)}>
                opprettsak
            </button>
            <button id="opprettsak-close" onClick={onClose}>
                avbrytsak
            </button>
        </div>
    );
};
