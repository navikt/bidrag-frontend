import { type IRolleDetaljer, RolleTypeAbbreviation } from "@bidrag/common";
import { Heading, Select } from "@navikt/ds-react";
import { useFormContext } from "react-hook-form";

interface GjelderSelectProps {
    roller: IRolleDetaljer[];
}
export default function GjelderSelect({ roller }: GjelderSelectProps) {
    const {
        register,
        getValues,
        formState: { errors },
    } = useFormContext<{ gjelderIdent: string }>();
    const rollerFiltrert = roller
        .sort((_, rolleB) => (rolleB.rolleType === RolleTypeAbbreviation.BP ? 1 : -1))
        .filter((rolle) =>
            [RolleTypeAbbreviation.BA, RolleTypeAbbreviation.BM, RolleTypeAbbreviation.BP].includes(
                rolle.rolleType as RolleTypeAbbreviation,
            ),
        );
    const rollerIkkeBarn = rollerFiltrert.filter((rolle) => rolle.rolleType !== RolleTypeAbbreviation.BA);

    function renderBarnOptions() {
        const barn = rollerFiltrert.filter((rolle) => rolle.rolleType === RolleTypeAbbreviation.BA);
        if (barn.length === 0) return null;
        return (
            <optgroup label="Barn">
                {barn.map((rolle) => (
                    <option key={rolle.ident} value={rolle.ident}>
                        {rolle.navn} / {rolle.ident}
                    </option>
                ))}
            </optgroup>
        );
    }
    return (
        <div>
            <Select
                style={{ width: "max-content" }}
                className="pb-2 pt-2"
                size="small"
                label={<Heading size="small">Gjelder</Heading>}
                {...register("gjelderIdent", { required: "Gjelder må velges" })}
                defaultValue={getValues("gjelderIdent")}
                error={errors?.gjelderIdent?.message}
            >
                <option key={"empty"} value="">
                    Velg gjelder
                </option>
                {rollerIkkeBarn.map((rolle) => (
                    <option key={rolle.ident} value={rolle.ident}>
                        {rolle.navn} / {rolle.ident}
                    </option>
                ))}
                {renderBarnOptions()}
            </Select>
        </div>
    );
}
