import { OpprettSakProvider, type OpprettSakRolleType, OpprettSakSkjema, useOpprettSakContext } from "@bidrag/common";
import { Heading, Loader, Modal } from "@navikt/ds-react";
import { Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router";

/**
 * Rute for "Opprett ny sak" (migrert fra bidrag-ui, se
 * apps/sak-ui/src/pages/opprett-sak/OpprettSakPage.tsx). Selve skjemaet
 * (`OpprettSakSkjema`) og støttekomponentene bor i `@bidrag/common` slik at de
 * kan gjenbrukes av apps/behandling sin innebygde "Opprett sak"-modal
 * (apps/behandling/src/common/sak/OpprettSakModal.tsx) — denne ruten bidrar
 * bare med `<Modal>`-skallet og navigasjonslogikken som er spesifikk for
 * apps/web.
 *
 * Den opprinnelige siden var en fristilt Web Component ("shadow DOM") montert
 * på `/opprettsakmodal?ident=...&navn=...&eierfogd=...`, drevet av
 * query-parametre og trigget fra Bisys (se `OpprettSakLegacyRedirect.ts` for
 * URL-kompatibilitet).
 */
export default function OpprettSakPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const ident = searchParams.get("ident") ?? "";
    const navn = searchParams.get("navn") ?? "";
    const eierfogd = searchParams.get("eierfogd") ?? "";
    const rolle = (searchParams.get("rolle") as OpprettSakRolleType | null) ?? undefined;

    function onClose() {
        navigate(-1);
    }

    function onSubmit(saksnummer: string) {
        navigate(`/sak/${saksnummer}/saksroller`);
    }

    return (
        <OpprettSakProvider
            ident={ident}
            navn={navn}
            eierfogd={eierfogd}
            rolle={rolle}
            onSubmit={onSubmit}
            onClose={onClose}
        >
            <OpprettSakModalShell />
        </OpprettSakProvider>
    );
}

function OpprettSakModalShell() {
    const { onClose } = useOpprettSakContext();

    return (
        <Modal className="w-[55rem] p-1" open closeOnBackdropClick aria-label="Opprett ny sak" onClose={onClose}>
            <Modal.Header closeButton>
                <Heading spacing level="1" size="medium">
                    Opprett ny sak
                </Heading>
            </Modal.Header>
            <Modal.Body>
                <Suspense
                    fallback={
                        <div className="flex justify-center">
                            <Loader size="3xlarge" title="Laster..." variant="interaction" />
                        </div>
                    }
                >
                    <OpprettSakSkjema />
                </Suspense>
            </Modal.Body>
        </Modal>
    );
}
