import { testpersoner } from "../../../../../../../playwright/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "../../../../../../../playwright/opprett-ny-sak/WizardFlowStory";

export const Standard = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARN_BEGGE_FORELDRE",
            partISaken: {
                ident: testpersoner.barnUnder18.ident,
                navn: testpersoner.barnUnder18.visningsnavn,
                rolle: "barn_under_18",
                erKjent: true,
            },
            foreldre: [testpersoner.bidragspliktig, testpersoner.bidragsmottaker],
        }}
    />
);
