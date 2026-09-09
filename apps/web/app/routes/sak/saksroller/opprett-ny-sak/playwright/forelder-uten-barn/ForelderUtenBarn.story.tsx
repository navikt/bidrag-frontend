import { testpersoner } from "../fixtures";
import { WizardFlowStory } from "../WizardFlowStory";

export const Standard = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "FORELDER_UTEN_BARN",
            partISaken: {
                ident: testpersoner.bidragspliktig.ident,
                navn: testpersoner.bidragspliktig.visningsnavn,
                rolle: "bidragspliktig",
                erKjent: true,
            },
        }}
    />
);
