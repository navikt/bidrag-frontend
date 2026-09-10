import { barnkurver, testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "@ct/opprett-ny-sak/WizardFlowStory";

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
