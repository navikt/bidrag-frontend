import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";
import PersonNavnIdent from "../../../person/PersonNavnIdent.tsx";
import { Heading, Select } from "@navikt/ds-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { RolleType } from "../RolleType.ts";
import { useKanOppretteSakUtenBm } from "../../../../api/useOpprettSakApiData.ts";
import { useSakContext } from "../OpprettSakContext.tsx";
import { getMotpartRolleType } from "../personUtils.ts";
import BarnContainer from "./BarnContainer.tsx";
import BarnMotpartUkjentContainer from "./BarnMotpartUkjentContainer.tsx";

// Migrert fra bidrag-ui
// (apps/sak-ui/src/pages/opprett-sak/container/familieenheter/familienheter-container/FamilieenheterContainer.tsx).
interface IFamilieenheterContainerProps {
    personensRolle: RolleType;
    personensMotpartBarnRelasjon: MotpartBarnRelasjon[];
}

export default function FamilieenheterContainer({
    personensRolle,
    personensMotpartBarnRelasjon,
}: IFamilieenheterContainerProps) {
    const [motpartsRolle, setMotpartsRolle] = useState<RolleType | undefined>();
    const { selectedMotpart, updateMotpart } = useSakContext();
    const { data: kanOppretteSakUtenBM } = useKanOppretteSakUtenBm();

    function onlyUnknownMotpart(): boolean {
        return personensMotpartBarnRelasjon.every((i) => i.motpart === null || i.motpart === undefined);
    }

    function getUnknownMotpart(): MotpartBarnRelasjon | undefined {
        const relasjonerUkjentMotpart = personensMotpartBarnRelasjon.filter(
            (i) => i.motpart === null || i.motpart === undefined || kanOppretteSakUtenBM,
        );
        if (relasjonerUkjentMotpart.length > 0) {
            const fellesBarn = relasjonerUkjentMotpart.flatMap((i) => i.fellesBarn);
            return {
                fellesBarn,
                motpart: null,
                forelderrolleMotpart: relasjonerUkjentMotpart[0]?.forelderrolleMotpart ?? "UKJENT",
            };
        }
        return undefined;
    }

    useEffect(() => {
        // hovedpersonen har enten motpart eller barn
        if (personensMotpartBarnRelasjon && personensMotpartBarnRelasjon.length > 0) {
            if (onlyUnknownMotpart()) {
                setMotpartsRolle(RolleType.UKJENT);
                updateMotpart(getUnknownMotpart());
            } else {
                const defaultFamilieenhet = personensMotpartBarnRelasjon.find((i) => i.motpart != null);
                setMotpartsRolle(getMotpartRolleType(personensRolle));
                updateMotpart(defaultFamilieenhet);
            }
        } else {
            // hovedpersonen har ikke noen motpart eller barn
            setMotpartsRolle(RolleType.UKJENT);
            updateMotpart(getUnknownMotpart());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personensMotpartBarnRelasjon]);

    if (!personensMotpartBarnRelasjon) {
        return null;
    }

    function onSelectMotpart({ target }: ChangeEvent<HTMLSelectElement>): void {
        if (target.value === "") {
            setMotpartsRolle(RolleType.UKJENT);
            updateMotpart(getUnknownMotpart());
        } else {
            const motpart = personensMotpartBarnRelasjon.find((i) => i.motpart?.ident === target.value);
            setMotpartsRolle(getMotpartRolleType(personensRolle));
            updateMotpart(motpart);
        }
    }

    return (
        <div className="grid gap-2">
            <Heading spacing level="2" size="small">
                Familieenheter
            </Heading>
            <Select
                className="text-ax-neutral-800 pb-2"
                label={`Velg ${getMotpartRolleType(personensRolle)}`}
                size="small"
                value={selectedMotpart?.motpart?.ident ?? ""}
                onChange={onSelectMotpart}
                data-testid="test-opprettsak-select-motpart"
            >
                {personensMotpartBarnRelasjon
                    .filter((i) => i.motpart != null)
                    .map((element, i) => (
                        <option key={i} value={element.motpart?.ident}>
                            <PersonNavnIdent ident={element.motpart?.ident} variant="compact" />
                        </option>
                    ))}
                <option value="">Ukjent</option>
            </Select>
            <Heading spacing level="2" size="medium">
                Barn
            </Heading>
            {motpartsRolle === RolleType.UKJENT ? (
                <BarnMotpartUkjentContainer personensRolle={personensRolle} />
            ) : (
                <BarnContainer personensRolle={personensRolle} />
            )}
        </div>
    );
}
