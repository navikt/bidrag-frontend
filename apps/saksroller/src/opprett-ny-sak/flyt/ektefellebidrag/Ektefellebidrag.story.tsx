import { testpersoner } from "@ct-saksroller/opprett-ny-sak/fixtures";
import { OpprettSakSkjemaStory } from "@ct-saksroller/opprett-ny-sak/OpprettSak.story";

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
