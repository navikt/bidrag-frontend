import { PersonNavnIdent, RolleTag } from "@bidrag/common";
import { tilRolleType } from "../../helpers/rolletypeHelpers";

import { useHentPersonData } from "../../hooks/useApiData";
import type { Sak } from "./sak";

export default function SakTableMotsattRolle({ sak }: { sak: Sak }) {
    const person = useHentPersonData(sak.motsattRolle?.fodselsnummer);
    if (sak.erIkkeBidragSak) {
        return <div></div>;
    }
    if (sak.begrensetTilgang) {
        return (
            <div>
                <p>
                    Skjermet
                    <RolleTag rolleType={tilRolleType(sak.motsattRolle?.type)} />
                </p>
            </div>
        );
    }
    if (!sak.ferdigRegistrert) {
        return <div>Ikke ferdigregistrert</div>;
    }

    if (!sak.motsattRolle) {
        return <div>Ingen motpart</div>;
    }

    return (
        <div className="[&_.personident]:grow [&>span]:flex-wrap w-35 flex-wrap">
            {sak.motsattRolle?.fodselsnummer ? (
                <PersonNavnIdent
                    rolle={tilRolleType(sak.motsattRolle.type)}
                    ident={sak.motsattRolle.fodselsnummer}
                    navn={person?.data.visningsnavn ?? ""}
                />
            ) : (
                <p>{person?.data.visningsnavn ?? ""}</p>
            )}
        </div>
    );
}
