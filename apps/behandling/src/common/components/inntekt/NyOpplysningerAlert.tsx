import { BodyShort, Heading } from "@navikt/ds-react";
import { DateToDDMMYYYYHHMMString, dateOrNull } from "../../../utils/date-utils";
import text from "../../constants/texts";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { BehandlingAlert } from "../BehandlingAlert";

export const NyOpplysningerAlert = () => {
    const { ikkeAktiverteEndringerIGrunnlagsdata } = useGetBehandlingV2();
    const ikkeAktiverteEndringer = Object.values(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).filter(
        (i) => i.length > 0,
    );

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
