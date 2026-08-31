import { Button, LinkPanel } from "@navikt/ds-react";

import { useAvvikModalContext } from "../AvvikshandteringButton";
import type { AvvikViewModel } from "../model/AvvikViewModel";

interface MainMenuProps {
    avvikViewModels: AvvikViewModel[];
    onClick: (avvikViewModel: AvvikViewModel) => void;
}

function MainMenu({ avvikViewModels, onClick }: MainMenuProps) {
    const { onCancel } = useAvvikModalContext();
    return (
        <div>
            <div
                className="grid gap-[5px] mt-4 w-full max-w-[505px]"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))" }}
            >
                {avvikViewModels.map((viewModel) => (
                    <MenuEntry avvik={viewModel} onClick={onClick} />
                ))}
            </div>
            <div className="flex-wrap flex-row-reverse flex flex-row">
                <Button className="mt-4" onClick={onCancel} size="small" variant="primary">
                    Avbryt
                </Button>
            </div>
        </div>
    );
}

interface MenuEntryProps {
    avvik: AvvikViewModel;
    onClick: (avvikViewModel: AvvikViewModel) => void;
}

function MenuEntry(props: MenuEntryProps) {
    function getTitle() {
        if (typeof props.avvik.title === "function") return props.avvik.title(props.avvik.metadata);
        return props.avvik.title;
    }
    return (
        <LinkPanel onClick={() => props.onClick(props.avvik)} href="#" border={true} className="w-[500px]">
            <LinkPanel.Title className="flex flex-row gap-[5px]">
                <div className="menu-icon">
                    <props.avvik.IconComponent className="w-[30px] h-[30px]" />
                </div>
                {getTitle()}
            </LinkPanel.Title>
            {props.avvik.description && <LinkPanel.Description>{props.avvik.description}</LinkPanel.Description>}
        </LinkPanel>
    );
}

export default MainMenu;
