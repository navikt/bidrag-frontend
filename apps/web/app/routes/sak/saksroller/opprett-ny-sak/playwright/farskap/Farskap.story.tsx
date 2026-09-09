import { barnkurver, testpersoner } from "../fixtures";
import { WizardFlowStory } from "../WizardFlowStory";

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
