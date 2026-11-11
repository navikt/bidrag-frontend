import { Box, Heading, Skeleton } from "@navikt/ds-react";

type Props = {
    tekst: string;
};

export default function LasterSkeleton({ tekst }: Props) {
    return (
        <Box width="30rem">
            <Heading as={Skeleton} size="large">
                {tekst}
            </Heading>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
        </Box>
    );
}
