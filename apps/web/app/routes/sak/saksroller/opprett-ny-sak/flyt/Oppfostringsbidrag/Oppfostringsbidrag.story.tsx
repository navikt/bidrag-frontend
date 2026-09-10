import { barnkurver, testpersoner } from "../../playwright/fixtures";
import { WizardFlowStory } from "../../playwright/WizardFlowStory";

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
