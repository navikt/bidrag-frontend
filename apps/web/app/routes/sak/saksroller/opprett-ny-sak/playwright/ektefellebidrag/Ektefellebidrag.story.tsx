import { testpersoner } from "../fixtures";
import { WizardFlowStory } from "../WizardFlowStory";

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
