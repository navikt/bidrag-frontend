import { BodyShort } from "@navikt/ds-react";

import type { IMottakerAdresse } from "../types/Adresse";
import { countryCodeToName } from "../utils/AdresseUtils";

interface AdresseInfoProps {
    adresse?: IMottakerAdresse;
}

function renderDetailWhenExists(...values: string[]) {
    const valuesFiltered = values.filter((v) => v !== undefined);
    if (valuesFiltered.length > 0) {
        return <BodyShort size="medium">{valuesFiltered.join(" ")}</BodyShort>;
    }
}

export default function AdresseInfo({ adresse }: AdresseInfoProps) {
    if (!adresse) return null;
    return (
        <>
            {renderDetailWhenExists(adresse?.adresselinje1)}
            {renderDetailWhenExists(adresse?.adresselinje2)}
            {renderDetailWhenExists(adresse?.adresselinje3)}
            {renderDetailWhenExists(adresse?.postnummer, adresse?.poststed)}
            {renderDetailWhenExists(countryCodeToName(adresse?.landkode ?? adresse.land))}
        </>
    );
}
