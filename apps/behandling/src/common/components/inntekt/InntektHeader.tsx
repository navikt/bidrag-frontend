import { BodyShort, ExpansionCard } from "@navikt/ds-react";
import text from "../../constants/texts";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { BehandlingAlert } from "../BehandlingAlert";
import { QueryErrorWrapper } from "../query-error-boundary/QueryErrorWrapper";
import { Arbeidsforhold } from "./Arbeidsforhold";
import { InntektChartWithInfoBoard } from "./InntektChart";

export const InntektHeader = ({ ident }: { ident: string }) => {
    const { inntekterV2 } = useGetBehandlingV2();

    const månedsinntekter = inntekterV2.find((inntekt) => inntekt.gjelder.ident === ident).inntekter.månedsinntekter;

    return månedsinntekter?.length > 0 ? (
        <div className="grid w-full gap-y-8">
            <InntektChartWithInfoBoard inntekt={månedsinntekter} />
            <ExpansionCard aria-label="default-demo" size="small" className="w-[568px]">
                <ExpansionCard.Header>
                    <ExpansionCard.Title size="small">{text.title.arbeidsforhold}</ExpansionCard.Title>
                </ExpansionCard.Header>
                <ExpansionCard.Content>
                    <QueryErrorWrapper>
                        <Arbeidsforhold ident={ident} />
                    </QueryErrorWrapper>
                </ExpansionCard.Content>
            </ExpansionCard>
        </div>
    ) : (
        <BehandlingAlert variant="info">
            <BodyShort>Ingen inntekt funnet</BodyShort>
        </BehandlingAlert>
    );
};
