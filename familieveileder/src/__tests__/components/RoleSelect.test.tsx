import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import RoleSelect from "../../components/select/role-select/RoleSelect";
import { RolleType } from "../../types/rolleveileder";

const NAME = "Mor";
const TEST_ID = `test-role-select-${NAME}`;

describe("RoleSelect", () => {
    it("renders Velg plus default roles BP and BM with given default value", () => {
        render(<RoleSelect name={NAME} defaultValue={RolleType.BM} onSelectRole={vi.fn()} />);

        const select = screen.getByTestId(TEST_ID) as HTMLSelectElement;
        expect(Array.from(select.options).map((o) => o.value)).toEqual(["", RolleType.BP, RolleType.BM]);
        expect(select.value).toBe(RolleType.BM);
    });

    it("has accessible plain-text label with person name", () => {
        render(<RoleSelect name={NAME} defaultValue="" onSelectRole={vi.fn()} />);
        expect(screen.getByLabelText(`Hvilken rolle har ${NAME}`)).toBe(screen.getByTestId(TEST_ID));
    });

    it("renders custom roles and testId", () => {
        render(
            <RoleSelect name={NAME} defaultValue="" onSelectRole={vi.fn()} roles={[RolleType.BA]} testId="custom-id" />
        );
        const select = screen.getByTestId("custom-id") as HTMLSelectElement;
        expect(Array.from(select.options).map((o) => o.value)).toEqual(["", RolleType.BA]);
    });

    it("calls onSelectRole with name and value when changed", async () => {
        const onSelectRole = vi.fn();
        render(<RoleSelect name={NAME} defaultValue="" onSelectRole={onSelectRole} />);

        await userEvent.selectOptions(screen.getByTestId(TEST_ID), RolleType.BP);

        expect(onSelectRole).toHaveBeenCalledExactlyOnceWith({ name: NAME, value: RolleType.BP });
        expect((screen.getByTestId(TEST_ID) as HTMLSelectElement).value).toBe(RolleType.BP);
    });

    it("updates selected value when defaultValue prop changes", () => {
        const { rerender } = render(<RoleSelect name={NAME} defaultValue="" onSelectRole={vi.fn()} />);
        rerender(<RoleSelect name={NAME} defaultValue={RolleType.BP} onSelectRole={vi.fn()} />);
        expect((screen.getByTestId(TEST_ID) as HTMLSelectElement).value).toBe(RolleType.BP);
    });
});
