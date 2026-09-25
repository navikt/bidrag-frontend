import { PersonPencilIcon } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { useState } from "react";

import RedigeringsRamme from "../../felles/RedigeringsRamme.tsx";
import ReellMottakerValgGruppe, {
    type ReellMottakerValg,
    type ReellMottakerValgregel,
    useLagretSamhandler,
} from "../../felles/reell-mottaker/ReellMottakerValgGruppe.tsx";
import { initialiserValg } from "../../felles/reell-mottaker/reell-mottaker-regel.ts";

interface ReellMottakerVelgerProps {
    barnNavn: string;
    barnIdent?: string;
    verdi: ReellMottakerValg;
    onAvbryt: () => void;
    onBekreft: (verdi: ReellMottakerValg) => void;
    regel: ReellMottakerValgregel;
    feil?: string;
}

export default function ReellMottakerVelger({
    barnNavn,
    barnIdent,
    verdi,
    onAvbryt,
    onBekreft,
    feil,
    regel,
}: ReellMottakerVelgerProps) {
    const [valideringsfeil, setValideringsfeil] = useState<string | undefined>();
    const påkrevd = regel !== "valgfri";
    // Utkast, slik at endringsoppsummeringen først oppdateres ved bekreftelse.
    const [utkast, setUtkast] = useState<ReellMottakerValg>(() =>
        initialiserValg(verdi, regel, { ident: barnIdent ?? "", navn: barnNavn }),
    );
    const { lagretSamhandler, huskSamhandler } = useLagretSamhandler(utkast);

    const kanBekrefte =
        utkast.type === "samhandler"
            ? Boolean(utkast.ident)
            : !påkrevd || (utkast.type === "barnet_selv" && Boolean(utkast.ident));

    const handleBekreft = () => {
        if (!kanBekrefte) {
            setValideringsfeil("Velg eller søk opp en reell mottaker før du legger til.");
            return;
        }
        setValideringsfeil(undefined);
        onBekreft(utkast);
    };

    const handleValg = (nyttValg: ReellMottakerValg) => {
        huskSamhandler(utkast, nyttValg);
        setUtkast(nyttValg);
        setValideringsfeil(undefined);
    };

    return (
        <RedigeringsRamme
            tittel="Endre reell mottaker av barnebidraget"
            ikon={<PersonPencilIcon aria-hidden />}
            onAvbryt={onAvbryt}
            actions={
                <>
                    <Button type="button" size="small" onClick={handleBekreft}>
                        Legg til
                    </Button>
                    <Button type="button" size="small" variant="secondary" onClick={onAvbryt}>
                        Avbryt
                    </Button>
                </>
            }
        >
            <ReellMottakerValgGruppe
                barnNavn={barnNavn}
                barnIdent={barnIdent ?? ""}
                valg={utkast}
                lagretSamhandler={lagretSamhandler}
                onValg={handleValg}
                regel={regel}
                feil={valideringsfeil ?? feil}
            />
        </RedigeringsRamme>
    );
}
