import { barnkurver, testpersoner } from "../playwright/fixtures";
import { WizardFlowStory } from "../playwright/WizardFlowStory";

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
