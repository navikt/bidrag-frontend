import { Rolletype } from "@bidrag/api/SakApi";
import { RadioGroup } from "@navikt/ds-react";
import _ from "lodash";
import { useSearch } from "../../../../store/SearchContext";
import type { Sak } from "../../../../types/sak";
import PersonRadioButton from "./PersonRadioButton";

interface TilknyttetSaksRollerProps {
    onPersonSelected: (ident: string) => void;
    enkelSak: Sak;
}

export default function TilknyttetSaksRoller(props: TilknyttetSaksRollerProps) {
    const { enkelSak } = useSearch();
    function setSelectedSearchedSaksRolle(selectedRolleFnr: string) {
        if (!_.isEmpty(selectedRolleFnr)) {
            props.onPersonSelected(selectedRolleFnr);
        }
    }

    if (_.isEmpty(props.enkelSak) || _.isEmpty(props.enkelSak.roller)) {
        return null;
    }

    return (
        <RadioGroup
            id={"selectedSearchedSaksRolleRadioGroup"}
            legend={"Velg personen saken gjelder"}
            onChange={setSelectedSearchedSaksRolle}
        >
            {enkelSak?.roller
                ?.filter((rolle) => rolle.rolleType !== Rolletype.RM && rolle.rolleType !== Rolletype.FR)
                .map((rolle) => (
                    <PersonRadioButton
                        name={"selectSakRadio"}
                        key={rolle.foedselsnummer + rolle.rolleType}
                        foedselsnummer={rolle.foedselsnummer}
                        rolleType={rolle.rolleType}
                        navn={rolle.visningsnavn}
                    />
                ))}
        </RadioGroup>
    );
}
