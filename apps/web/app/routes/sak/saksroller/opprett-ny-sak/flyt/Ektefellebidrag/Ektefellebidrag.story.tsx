import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "@ct/opprett-ny-sak/WizardFlowStory";

export const MedForslag = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "EKTEFELLEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: [{ motpart: testpersoner.ektefelle, forelderrolleMotpart: "UKJENT", fellesBarn: [] }],
        }}
    />
);
