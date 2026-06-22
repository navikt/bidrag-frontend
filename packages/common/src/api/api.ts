import { useApi } from "../react_components/hooks";
import { Api as PersonApi } from "./PersonApi";

export const PERSON_API = useApi(new PersonApi({ baseURL: "/proxy/bidrag-person" }), {
    app: "bidrag-person",
    cluster: "fss",
    env: "TODO",
});
