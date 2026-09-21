import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "@ct/opprett-ny-sak/WizardFlowStory";

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
