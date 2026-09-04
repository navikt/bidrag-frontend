import { useHentMottaker } from "../../../hooks/useForsendelseApi";
import RolleDetaljer from "./RolleDetaljer";

export default function Mottaker() {
    const mottaker = useHentMottaker();
    return <RolleDetaljer label={"Mottaker"} rolle={mottaker.rolleType} ident={mottaker.ident} navn={mottaker.navn} />;
}
