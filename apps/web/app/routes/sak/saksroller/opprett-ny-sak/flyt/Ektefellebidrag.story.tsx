import { testpersoner } from "../playwright/fixtures";
import { WizardFlowStory } from "../playwright/WizardFlowStory";

export const MedForslag = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "EKTEFELLEBIDRAG",
            flow: "EKTEFELLEBIDRAG",
            partISaken: {
                ident: testpersoner.bidragspliktig.ident,
                navn: testpersoner.bidragspliktig.visningsnavn,
                rolle: "bidragspliktig",
                erKjent: true,
            },
            motpart: [testpersoner.ektefelle],
        }}
    />
);
