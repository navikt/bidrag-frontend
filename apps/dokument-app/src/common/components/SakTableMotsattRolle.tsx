import { PersonNavnIdent } from "@navikt/bidrag-ui-common";

import type { Sak } from "../../types/sak";
import RolleTag from "./person/RolleTag";

export default function SakTableMotsattRolle({ sak }: { sak: Sak }) {
    if (sak.erIkkeBidragSak) {
        return <div></div>;
    }
    if (sak.begrensetTilgang) {
        return (
            <div>
                <p>
                    Skjermet
                    <RolleTag rolleType={sak.motsattRolle?.rolleType} />
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
        <div className="[&_.personident]:grow [&>span:first-child>*]:flex-wrap w-35">
            {sak.motsattRolle?.foedselsnummer ? (
                <PersonNavnIdent
                    rolle={sak.motsattRolle.rolleType}
                    ident={sak.motsattRolle.foedselsnummer}
                    navn={sak.motsattRolle?.person?.kortnavn ?? ""}
                />
            ) : (
                <p>{sak.motsattRolle?.person?.kortnavn ?? ""}</p>
            )}
        </div>
    );
}
