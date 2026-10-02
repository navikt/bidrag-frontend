import { SaksrollerStoryRouter } from "@ct/saksroller/StoryRouter.tsx";
import SaksrollerVisning from "./SaksrollerVisning.tsx";

export const Standard = () => <SaksrollerStoryRouter content={<SaksrollerVisning saksnummer="2024/1" />} />;
