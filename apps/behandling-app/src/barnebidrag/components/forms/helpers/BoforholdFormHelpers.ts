import type { BoforholdDtoV2 } from "@bidrag/api/BidragBehandlingApiV1";
import { compareHusstandsBarn } from "../../../../common/helpers/boforholdFormHelpers";
import type { BoforholdFormValues } from "../../../../common/types/boforholdFormValues";

export const createInitialValues = (boforhold: BoforholdDtoV2): BoforholdFormValues => {
    return {
        ...boforhold,
        husstandsmedlem: boforhold.husstandsmedlem.sort(compareHusstandsBarn),
        begrunnelse: boforhold.begrunnelse.innhold,
    };
};
