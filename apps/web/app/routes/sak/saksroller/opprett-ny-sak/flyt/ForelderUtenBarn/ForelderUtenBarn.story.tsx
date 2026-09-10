import { testpersoner } from "../../playwright/fixtures";
import { WizardFlowStory } from "../../playwright/WizardFlowStory";

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
