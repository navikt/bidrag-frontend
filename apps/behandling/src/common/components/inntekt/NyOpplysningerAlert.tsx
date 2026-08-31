import type { IkkeAktivInntektDto } from "@bidrag/api/BidragBehandlingApiV1";
import { StringUtils } from "@bidrag/common";
import { BodyShort, Heading } from "@navikt/ds-react";
import { DateToDDMMYYYYHHMMString, dateOrNull } from "../../../utils/date-utils";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext.tsx";
import { erDelAvValgtSaksnummer } from "../../helpers/inntektFormHelpers";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { BehandlingAlert } from "../BehandlingAlert";

export const NyOpplysningerAlert = () => {
    const { ikkeAktiverteEndringerIGrunnlagsdata, roller } = useGetBehandlingV2();
    const { selectedSaksnummer } = useBehandlingProvider();

    const tilhørerValgtSaksnummer = (inntekt: IkkeAktivInntektDto) => {
        const gjelderBarnNotEmpty = StringUtils.isEmpty(inntekt.gjelderBarn) ? null : inntekt.gjelderBarn;
        const rolle = roller.find((r) => r.ident === (gjelderBarnNotEmpty ?? inntekt.ident));
        return erDelAvValgtSaksnummer(inntekt?.saksnummer ?? rolle?.saksnummer, selectedSaksnummer, rolle?.rolletype);
    };

    const ikkeAktiverteEndringer = Object.values(ikkeAktiverteEndringerIGrunnlagsdata.inntekter)
        .map((inntekter) => inntekter.filter(tilhørerValgtSaksnummer))
        .filter((inntekter) => inntekter.length > 0);

    console.log(ikkeAktiverteEndringerIGrunnlagsdata, ikkeAktiverteEndringer);

    if (ikkeAktiverteEndringer.length === 0) return null;
    return (
        <BehandlingAlert variant="info">
            <Heading size="xsmall" level="3">
                {text.alert.nyOpplysningerInfo}
            </Heading>
            <BodyShort size="small">
                Nye opplysninger fra offentlige register er tilgjengelig. Oppdatert{" "}
                {DateToDDMMYYYYHHMMString(dateOrNull(ikkeAktiverteEndringer[0][0].innhentetTidspunkt))}.
            </BodyShort>
        </BehandlingAlert>
    );
};
