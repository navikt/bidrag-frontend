import { barnkurver, testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { OpprettSakSkjemaStory } from "@ct/opprett-ny-sak/OpprettSak.story";

export const Standard = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "OPPFOSTRINGSBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: barnkurver,
        }}
    />
);
