import { BodyShort } from "@navikt/ds-react";
import React, { useMemo } from "react";

import NoAccessModal, { type NoAccessModalProps } from "../../../../common/components/modal/NoAccessModal";
import { isEmpty } from "../../../../common/utils/ObjectUtils";
import { useHentJournalpost } from "../../../../hooks/useDokumentApi";
import { useHentEnhet } from "../../../../hooks/useOrganisasjonApi";
import { useHentPersonGeografiskEnhet } from "../../../../hooks/usePersonApi";
import type { Enhet } from "../../../../types/enhet";
import type { Person } from "../../../../types/person";
import type { Sak } from "../../../../types/sak";

interface PersonSakNoAccessModalProps {
    onCancel: () => void;
    onSubmit: (lagreJournalpost?: boolean, overforTilEnhet?: string) => void;
    sak?: Sak;
    person?: Person;
}

export default function PersonSakNoAccessModal(props: PersonSakNoAccessModalProps) {
    const { sak, person } = props;
    const personGeografiskEnhet = useHentPersonGeografiskEnhet();
    const sakEnhetsInfoLoadable = useHentEnhet(sak?.eierfogd);
    const journalpost = useHentJournalpost();

    const isSakBegrensetTilgang = useMemo<boolean>(() => sak?.begrensetTilgang, [sak]);

    const shouldRedirectToOppgaveListe = () => {
        const journalforendeEnhet = journalpost.journalforendeEnhet;
        return sak?.eierfogd && journalforendeEnhet === sak.eierfogd;
    };

    const shouldSaveJournalpost = () => {
        const journalforendeEnhet = journalpost.journalforendeEnhet;

        const isJournalpostAndPersonEnhetSame = person && journalforendeEnhet === personGeografiskEnhet?.enhetIdent;
        const sakOrPersonEnhetExists = !isEmpty(sak?.eierfogd) || !isEmpty(personGeografiskEnhet?.enhetIdent);
        return isJournalpostAndPersonEnhetSame || !sakOrPersonEnhetExists;
    };

    const getEnhet = (): Enhet => {
        if (isSakBegrensetTilgang) {
            return {
                enhetIdent: sak.eierfogd,
                enhetNavn: sakEnhetsInfoLoadable?.enhetNavn,
            };
        }
        return personGeografiskEnhet;
    };

    function getWarningInfoText() {
        if (isSakBegrensetTilgang) {
            return <BodyShort>Du har ingen tilgang til sak {sak.saksnummer}</BodyShort>;
        }

        return <BodyShort>Du har ingen tilgang til fødselsnummer {person?.ident}</BodyShort>;
    }

    function getNoAccessModalProps(): NoAccessModalProps {
        if (shouldSaveJournalpost() || shouldRedirectToOppgaveListe()) {
            return {
                onSubmit: () => props.onSubmit(shouldSaveJournalpost()),
                submitButtonLabel: shouldRedirectToOppgaveListe() ? "Til oppgaveliste" : "Lagre og lukk",
                alertContent: (
                    <div className="alert-content">
                        {getWarningInfoText()}
                        <BodyShort>Oppgaven må behandles av saksbehandler med utvidede rettigheter</BodyShort>
                    </div>
                ),
            } as NoAccessModalProps;
        }

        const enhet = getEnhet();
        const enhetDescription = enhet.enhetIdent + (enhet.enhetNavn ? ` - ${enhet.enhetNavn}` : "");

        return {
            onSubmit: () => props.onSubmit(false, enhet.enhetIdent),
            submitButtonLabel: `Overfør`,
            alertContent: (
                <div className="alert-content">
                    {getWarningInfoText()}
                    <BodyShort>
                        Oppgaven må overføres til enhet <strong>{enhetDescription}</strong>
                    </BodyShort>
                </div>
            ),
        } as NoAccessModalProps;
    }

    return <NoAccessModal {...getNoAccessModalProps()} loadingData={false} onCancel={props.onCancel} />;
}
