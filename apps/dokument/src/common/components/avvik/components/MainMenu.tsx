import "./MainMenu.css";

import { HGrid, LinkPanel } from "@navikt/ds-react";
import React from "react";

import { useGetAvvik } from "../../../../hooks/useDokumentApi";
import type { AvvikViewModel } from "../model/AvvikViewModel";

interface MainMenuProps {
    avvikViewModels: AvvikViewModel[];
    onClick: (avvikViewModel: AvvikViewModel) => void;
}

function MainMenu(props: MainMenuProps) {
    const avvikViewModels = useGetAvvik();
    return (
        <HGrid className="AvvikshandteringMainMenu" columns={{ sm: 2, md: 2, lg: 3, xl: 3 }} gap={"space-4"}>
            {avvikViewModels.map((viewModel) => (
                <MenuEntry avvik={viewModel} onClick={props.onClick} />
            ))}
        </HGrid>
    );
}

interface MenuEntryProps {
    avvik: AvvikViewModel;
    onClick: (avvikViewModel: AvvikViewModel) => void;
}

function MenuEntry(props: MenuEntryProps) {
    return (
        <LinkPanel onClick={() => props.onClick(props.avvik)} href="#" border className="w-full">
            <LinkPanel.Title>{props.avvik.title}</LinkPanel.Title>
        </LinkPanel>
    );
}

export default MainMenu;
