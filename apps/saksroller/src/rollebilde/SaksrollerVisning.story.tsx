import { SaksrollerStoryRouter } from "../../playwright/saksroller/StoryRouter.tsx";
import { ANNEN_FORELDER_FLAGG } from "../felles/relasjon/useRelasjonsregler.ts";
import SaksrollerVisning from "./SaksrollerVisning.tsx";

export const Standard = () => <SaksrollerStoryRouter content={<SaksrollerVisning saksnummer="2024/1" />} />;

export const AnnenForelderTillatt = () => (
    <SaksrollerStoryRouter content={<SaksrollerVisning saksnummer="2024/1" />} flagg={[ANNEN_FORELDER_FLAGG]} />
);
