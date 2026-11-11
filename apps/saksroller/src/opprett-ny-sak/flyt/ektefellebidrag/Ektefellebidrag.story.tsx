import { testpersoner } from "../../../../playwright/opprett-ny-sak/fixtures";
import { OpprettSakSkjemaStory } from "../../../../playwright/opprett-ny-sak/OpprettSak.story";

export const MedForslag = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "EKTEFELLEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: [{ motpart: testpersoner.ektefelle, forelderrolleMotpart: "UKJENT", fellesBarn: [] }],
        }}
    />
);
