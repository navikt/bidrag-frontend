import { barnkurver, testpersoner } from "../fixtures";
import { WizardFlowStory } from "../WizardFlowStory";

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
