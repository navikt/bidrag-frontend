import { barnkurver, testpersoner } from "../../../../../../../playwright/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "../../../../../../../playwright/opprett-ny-sak/WizardFlowStory";

export const Standard = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "OPPFOSTRINGSBIDRAG",
            flow: "OPPFOSTRINGSBIDRAG",
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
