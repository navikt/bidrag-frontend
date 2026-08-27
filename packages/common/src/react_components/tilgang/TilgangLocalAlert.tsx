import {List, LocalAlert} from "@navikt/ds-react";
import {ListItem} from "@navikt/ds-react/List";
import {TilgangskontrollResponse} from "@bidrag/api/TilgangskontrollApi";

interface Props {
    title: string;
    tilgangResultat: TilgangskontrollResponse;
}

export function TilgangLocalAlert({tilgangResultat, title}: Props) {
    return (
        <LocalAlert status={"warning"} size={"small"}>
            <LocalAlert.Header>
                <LocalAlert.Title>
                    {title}
                </LocalAlert.Title>
            </LocalAlert.Header>
            <LocalAlert.Content>
                <List>
                    {tilgangResultat.detaljer
                        .filter(detalj => !detalj.harTilgang)
                        .map((detalj,) => (
                            <ListItem key={detalj.begrunnelse}>{detalj.begrunnelse}</ListItem>)
                        )}
                </List>
            </LocalAlert.Content>
        </LocalAlert>
    );
}

