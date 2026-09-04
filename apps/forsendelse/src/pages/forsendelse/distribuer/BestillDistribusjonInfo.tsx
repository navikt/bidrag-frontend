import { IdentUtils } from "@bidrag/common";
import { PencilIcon as Edit } from "@navikt/aksel-icons";
import { BodyShort, Button, Heading, Loader } from "@navikt/ds-react";
import React, { useState } from "react";

import AdresseInfo from "../../../components/AdresseInfo";
import { EditAddressForm } from "../../../components/EditAddress";
import { mapToDistribusjonKanalBeskrivelse } from "../../../helpers/forsendelseHelpers";
import { useDistribusjonKanal } from "../../../hooks/useDokumentApi";
import { useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
import type { IMottakerAdresse } from "../../../types/Adresse";
import Mottaker from "../components/Mottaker";

interface BestillDistribusjonContentProps {
    editable?: boolean;
    adresse?: IMottakerAdresse;
    onEditModeChanged?: (inEditMode: boolean) => void;
    onAdresseChanged: (adresse: IMottakerAdresse) => void;
}
export default function BestillDistribusjonInfo(props: BestillDistribusjonContentProps) {
    return (
        <div className={"pt-4 pb-4"}>
            <Mottaker />
            <DistribusjonDetaljer {...props} />
        </div>
    );
}

function DistribusjonDetaljer(props: BestillDistribusjonContentProps) {
    const distribusjonKanal = useDistribusjonKanal();
    const forsendelse = useHentForsendelseQuery();

    function mapToBegrunnelseBeskrivelse() {
        if (forsendelse.mottaker?.ident !== forsendelse.gjelderIdent) return "Mottaker er ulik gjelder";
        if (IdentUtils.isSamhandlerId(forsendelse.mottaker?.ident)) return "Mottaker er samhandler";
        return distribusjonKanal.regelBegrunnelse;
    }
    return (
        <div className="pb-2 pt-2">
            <Heading size={"small"} className={"pb-1"}>
                Distribusjonskanal
            </Heading>
            <div>
                <BodyShort spacing>
                    <div>{mapToDistribusjonKanalBeskrivelse(distribusjonKanal.distribusjonskanal)}</div>
                </BodyShort>
                {distribusjonKanal.distribusjonskanal === "PRINT" && (
                    <BodyShort spacing>
                        <Heading size="xsmall">Begrunnelse</Heading>
                        <div>{mapToBegrunnelseBeskrivelse()}</div>
                    </BodyShort>
                )}
                {distribusjonKanal.distribusjonskanal === "PRINT" && <Adresse {...props} />}
            </div>
        </div>
    );
}

function Adresse({ editable = true, adresse, onAdresseChanged, onEditModeChanged }: BestillDistribusjonContentProps) {
    const [adressEditable, setAdressEditable] = useState<boolean>(false);
    function changeAdressEditable(value: boolean) {
        onEditModeChanged(value);
        setAdressEditable(value);
    }

    return (
        <div>
            <Heading size="xsmall">{adressEditable ? "Endre adresse" : "Til følgende adresse"}</Heading>
            <div className={"flex w-full"}>
                {adressEditable ? (
                    <React.Suspense fallback={<Loader variant="neutral" size="small" fr="true" />}>
                        <EditAddressForm
                            address={adresse}
                            onSubmit={(adresse) => {
                                onAdresseChanged(adresse);
                                changeAdressEditable(false);
                            }}
                            onCancel={() => changeAdressEditable(false)}
                        />
                    </React.Suspense>
                ) : (
                    <div>
                        <AdresseInfo adresse={adresse} />
                    </div>
                )}
                <div className={"pl-1"}>
                    {!adressEditable && editable && (
                        <Button
                            id={"endre_adresse_knapp"}
                            variant="tertiary"
                            size="xsmall"
                            onClick={() => changeAdressEditable(true)}
                            icon={<Edit fr="true" />}
                        >
                            {!adresse ? "Legg til" : "Endre"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
