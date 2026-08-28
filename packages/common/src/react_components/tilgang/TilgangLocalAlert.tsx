import {List, LocalAlert} from "@navikt/ds-react";
import {ListItem} from "@navikt/ds-react/List";
import {TilgangskontrollResponse} from "@bidrag/api/TilgangskontrollApi";
import {ComponentProps} from "react";

export type PartialAlertProps = Partial<Omit<ComponentProps<typeof LocalAlert>, "children">>;

type TilgangAlertProps = PartialAlertProps & {
    title: string;
    tilgangResultat?: TilgangskontrollResponse;
};

export function TilgangLocalAlert({
                                      tilgangResultat,
                                      title,
                                      status = "warning",
                                      size = "small",
                                      ...rest
                                  }: TilgangAlertProps) {
    return (
        <LocalAlert status={status} size={size} {...rest}>
            <LocalAlert.Header>
                <LocalAlert.Title>
                    {title}
                </LocalAlert.Title>
            </LocalAlert.Header>
            <LocalAlert.Content>
                <List>
                    {tilgangResultat?.detaljer
                        .filter(detalj => !detalj.harTilgang)
                        .map((detalj,) => (
                            <ListItem key={detalj.begrunnelse}>{detalj.begrunnelse}</ListItem>)
                        )}
                </List>
            </LocalAlert.Content>
        </LocalAlert>
    );
}

