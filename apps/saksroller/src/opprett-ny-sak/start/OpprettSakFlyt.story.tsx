import { OpprettSakFlytInnbyggetStory, OpprettSakFlytStory } from "../../../playwright/opprett-ny-sak/OpprettSak.story";

export const Standard = () => <OpprettSakFlytStory />;
export const Innbygget = OpprettSakFlytInnbyggetStory;
