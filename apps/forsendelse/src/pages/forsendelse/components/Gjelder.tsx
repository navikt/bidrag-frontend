import { useHentGjelder } from "../../../hooks/useForsendelseApi";
import RolleDetaljer from "./RolleDetaljer";

export default function Gjelder() {
    const gjelder = useHentGjelder();
    return <RolleDetaljer label={"Gjelder"} rolle={gjelder.rolleType} ident={gjelder.ident} navn={gjelder.navn} />;
}
