import { Alert, BodyShort, Heading, Skeleton } from "@navikt/ds-react";

export function GrunnlagLoadingSkeleton() {
    return (
        <div className="bg-ax-neutral-100">
            <div className="min-h-screen p-4 m-auto max-w-[1272px] min-[1440px]:max-w-[1920px] grid grid-cols-[max-content_auto]">
                <div className="flex h-screen">
                    {/* Sidebar with 8 tabs */}
                    <div className=" top-0 z-10 sticky border-solid border-0 border-r-2 border-r-ax-accent-500 max-w-[1200px] p-3">
                        <div className="w-80 bg-[white] border-r border-ax-neutral-300 flex flex-col max-h-[600px] mt-[50px] ">
                            {/* Navigation tabs */}
                            <div className="flex-1 p-4">
                                {Array.from({ length: 8 }, (_, i) => (
                                    <div key={i} className="flex items-center space-x-3 rounded-lg">
                                        <Skeleton variant="text" width="360px" height="60px" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Main content area */}
                    <div className="flex-1 flex flex-col w-[1092px]">
                        {/* Top alert */}
                        <div className="border-b border-ax-neutral-300 m-auto pl-[15%] w-full">
                            <Alert variant="info" className="max-w-2xl" size="small">
                                <Heading size="small" spacing>
                                    Laster grunnlag
                                </Heading>
                                <BodyShort size="small">
                                    Laster nye grunnlagsdata for rollene i behandlingen. Dette kan ta noen sekunder.
                                    Vennligst vent...
                                </BodyShort>
                            </Alert>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 p-6 overflow-auto">
                            <div className="max-w-8xl  space-y-6">
                                {/* Header section */}
                                <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1">
                                            <Skeleton variant="text" width="250px" height="28px" />
                                            <Skeleton variant="text" width="180px" height="20px" className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content sections */}
                                {/* Left column */}
                                <div className="space-y-6">
                                    <div className="bg-[white] rounded-lg shadow-sm border border-ax-neutral-300 p-6">
                                        <Skeleton variant="text" width="200px" height="24px" className="mb-4" />
                                        <div className="space-y-3">
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                            <Skeleton variant="rectangle" width="100%" height="40px" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
