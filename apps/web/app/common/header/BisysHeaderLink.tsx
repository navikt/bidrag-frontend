import {useBisysLink} from "~/common/bisys/useBisysLink.ts";

export default function BisysHeaderLink() {
    const {bisysUrl} = useBisysLink();
    if (!bisysUrl) {
        return null
    }
    return <a style={{
        color: "white",
        justifySelf: "end",
        textAlign: "center",
        alignSelf: "center",
        padding: "0 var(--ax-space-20)"
    }}
              href={bisysUrl}
    > Tilbake til bisys
    </a>
}
