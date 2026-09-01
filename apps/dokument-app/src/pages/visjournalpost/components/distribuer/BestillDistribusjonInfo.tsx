import { Edit } from "@navikt/ds-icons";
import { Button, Heading, Loader } from "@navikt/ds-react";
import React, { useState } from "react";

import type { DistribuerTilAdresse } from "../../../../api/BidragDokumentApi";
import AvsenderMottaker from "../../../../common/components/person/AvsenderMottaker";
import AdresseInfo from "../AdresseInfo";
import EditAddress from "./EditAddress";

interface BestillDistribusjonContentProps {
    mottakerId: string;
    mottakerNavn: string;
    editable?: boolean;
    adresse: DistribuerTilAdresse;
    onEditModeChanged?: (inEditMode: boolean) => void;
    onAdresseChanged: (adresse: DistribuerTilAdresse) => void;
}
export default function BestillDistribusjonInfo({
    mottakerId,
    mottakerNavn,
    editable = true,
    adresse,
    onAdresseChanged,
    onEditModeChanged,
}: BestillDistribusjonContentProps) {
    const [adressEditable, setAdressEditable] = useState<boolean>(false);

    function changeAdressEditable(value: boolean) {
        onEditModeChanged(value);
        setAdressEditable(value);
    }
    return (
        <>
            <Heading size={"small"}>Mottaker</Heading>
            <AvsenderMottaker
                showLabel={false}
                avsenderMottakerInfo={{ navn: mottakerNavn, foedselsnummer: mottakerId, ident: mottakerId }}
                editable={false}
                isMottaker
            />
            <div>
                <Heading size={"small"} className={"pb-1"}>
                    {adressEditable ? "Endre adresse" : "Adresse"}
                </Heading>
                <div className={"flex w-full"}>
                    {adressEditable ? (
                        <React.Suspense fallback={<Loader variant="neutral" size="small" fr="true" />}>
                            <EditAddress
                                address={adresse}
                                onSubmit={(adresse) => {
                                    onAdresseChanged(adresse);
                                    changeAdressEditable(false);
                                }}
                                onCancel={() => changeAdressEditable(false)}
                            />
                        </React.Suspense>
                    ) : (
                        <div className="pt-2">
                            <AdresseInfo adresse={adresse} />
                        </div>
                    )}
                    <div className={"pl-1"}>
                        {!adressEditable && editable && (
                            <Button
                                id={"endre_adresse_knapp"}
                                variant="tertiary"
                                size="small"
                                onClick={() => changeAdressEditable(true)}
                                icon={<Edit fr="true" />}
                            >
                                {!adresse ? "Legg til" : "Endre"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
