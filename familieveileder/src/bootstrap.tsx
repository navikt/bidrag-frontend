import React from "react";
import ReactDOM from "react-dom/client";

import FamilieveilederShadow from "./pages/familieveileder/FamilieveilederShadow";
import { RolleType } from "./types/rolleveileder";

const DEV_FODSELSNUMMER = "01010112345";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <FamilieveilederShadow
        fodselsnummer={DEV_FODSELSNUMMER}
        rolle={RolleType.BP}
        valgteRoller={{ bp: DEV_FODSELSNUMMER, bm: "", barn: [] }}
        onSubmit={(rolleveileder) => console.log("onSubmit", rolleveileder)}
    />
);
