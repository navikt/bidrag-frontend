import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import DefaultButton from "../../components/button/default-button/DefaultButton";

describe("DefaultButton", () => {
    it("renders title, testId and forwards onClick", async () => {
        const onClick = vi.fn();
        render(<DefaultButton title="Velg" testId="test-knapp" onClick={onClick} />);

        const button = screen.getByRole("button", { name: "Velg" });
        expect(button).toBe(screen.getByTestId("test-knapp"));
        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("is secondary by default and primary when isPrimary", () => {
        const { rerender } = render(<DefaultButton title="Knapp" />);
        expect(screen.getByRole("button").dataset.variant).toBe("secondary");
        rerender(<DefaultButton title="Knapp" isPrimary />);
        expect(screen.getByRole("button").dataset.variant).toBe("primary");
    });

    it("uses xsmall size by default", () => {
        render(<DefaultButton title="Knapp" />);
        expect(screen.getByRole("button").className).toContain("aksel-button--xsmall");
    });

    it("forwards native button attributes", () => {
        render(<DefaultButton title="Knapp" type="submit" disabled />);
        const button = screen.getByRole("button") as HTMLButtonElement;
        expect(button.type).toBe("submit");
        expect(button.disabled).toBe(true);
    });
});
