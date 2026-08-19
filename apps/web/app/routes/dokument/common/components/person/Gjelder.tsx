import React from "react";

import { Person } from "../../../types/person";
import { isEmpty } from "../../utils/ObjectUtils";
import PersonInfo from "./PersonInfo";

interface GjelderProps {
    person: Person;
}
export default function Gjelder({ person }: GjelderProps) {
    if (isEmpty(person.ident)) {
        return null;
    }

    return (
        <div>
            <PersonInfo navn={person.visningsnavn} ident={person.ident} />
        </div>
    );
}
