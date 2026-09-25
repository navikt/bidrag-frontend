import { barnkurver, testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "@ct/opprett-ny-sak/WizardFlowStory";

export const Standard = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "FARSKAP",
            person: testpersoner.bidragsmottaker,
            rolle: "bidragsmottaker",
            relasjoner: barnkurver,
        }}
    />
);
