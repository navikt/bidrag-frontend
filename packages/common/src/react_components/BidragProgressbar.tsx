import { ProgressBar } from "@navikt/ds-react";
import { useState } from "react";

export const BidragProgressbar = ({ melding }: { melding?: string }) => {
    const [value, setValue] = useState(melding || "Laster innhold. Straks i mål");

    return (
        <>
            <div id="loading" className="mb-2 text-center">
                {value}
            </div>
            <div className="w-full">
                <ProgressBar
                    simulated={{
                        seconds: 30,
                        onTimeout: () => setValue("Dette tar litt lengre tid enn forventet. Takk for at du venter."),
                    }}
                    aria-labelledby="loading"
                />
            </div>
        </>
    );
};

export const BidragProgressbarFullScreen = () => {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center">
            <BidragProgressbar />
        </div>
    );
};
