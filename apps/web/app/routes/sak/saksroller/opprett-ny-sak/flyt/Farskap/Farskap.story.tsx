import { barnkurver, testpersoner } from "../../../../../../../playwright/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "../../../../../../../playwright/opprett-ny-sak/WizardFlowStory";

export const Standard = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "FARSKAP",
            flow: "FARSKAP",
            partISaken: {
                ident: testpersoner.bidragsmottaker.ident,
                navn: testpersoner.bidragsmottaker.visningsnavn,
                rolle: "bidragsmottaker",
                erKjent: true,
            },
            barnkurver,
        }}
    />
);
