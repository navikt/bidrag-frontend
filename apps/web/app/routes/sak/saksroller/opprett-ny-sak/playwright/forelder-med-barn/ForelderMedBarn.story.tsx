import { barnkurver, testpersoner, ukjentBarnkurv } from "../fixtures";
import { WizardFlowStory } from "../WizardFlowStory";

export const Standard = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "FORELDER_MED_BARN",
            partISaken: {
                ident: testpersoner.bidragspliktig.ident,
                navn: testpersoner.bidragspliktig.visningsnavn,
                rolle: "bidragspliktig",
                erKjent: true,
            },
            barnkurver,
        }}
    />
);

export const UkjentBidragsmottaker = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "FORELDER_MED_BARN",
            partISaken: {
                ident: testpersoner.bidragspliktig.ident,
                navn: testpersoner.bidragspliktig.visningsnavn,
                rolle: "bidragspliktig",
                erKjent: true,
            },
            barnkurver: ukjentBarnkurv,
        }}
    />
);
