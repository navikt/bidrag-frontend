import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "@ct/opprett-ny-sak/WizardFlowStory";

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
