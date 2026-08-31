import { MDXProvider, useMDXComponents } from "@mdx-js/react";
import { ArrowRightIcon } from "@navikt/aksel-icons";
import { BodyLong, BodyShort, Heading, Label, Loader } from "@navikt/ds-react";
import { useThemedStylesWithMdx } from "@theme-ui/mdx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { type PropsWithChildren, Suspense } from "react";
import { type Theme, ThemeUIProvider } from "theme-ui";

import DokumentLinkedTag from "../components/dokument/DokumentLinkedTag";
import DokumentStatusTag from "../components/dokument/DokumentStatusTag";
import ErrorProvider from "../context/ErrorProvider";
import { ForsendelseCommonsProvider } from "../ForsendelseCommonsProvider";

const mdxComponents = { Heading, DokumentStatusTag, BodyShort, ArrowRightIcon, DokumentLinkedTag, BodyLong, Label };

dayjs.extend(customParseFormat);

interface PageWrapperProps {
    name: string;
}

const theme: Theme = {
    config: {
        useRootStyles: false,
    },
    fonts: {
        body: 'var(--ax-font-family,"Source Sans Pro",Arial,sans-serif)',
    },
    fontWeights: {
        body: "var(--ax-font-weight-regular)",
    },
    lineHeights: {
        body: "var(--ax-font-line-height-medium)",
    },
    styles: {
        root: {
            fontFamily: 'var(--ax-font-family,"Source Sans Pro",Arial,sans-serif)',
            lineHeight: "var(--ax-font-line-height-medium)",
            fontWeight: "var(--ax-font-weight-regular)",
            fontSize: "var(--ax-font-size-large)",
        },
        p: {
            maxWidth: "65rem",
            fontWeight: "var(--ax-font-weight-regular)",
        },
        h1: {
            fontSize: "var(--ax-font-size-heading-xlarge)",
        },
        h2: {
            fontSize: "var(--ax-font-size-heading-large)",
            marginTop: 0,
        },
        h3: {
            fontSize: "var(--ax-font-size-heading-medium)",
        },
        h4: {
            fontSize: "var(--ax-font-size-heading-small)",
        },
        h5: {
            fontSize: "var(--ax-font-size-heading-xsmall)",
            marginTop: "5px",
            marginBottom: "5px",
        },
    },
};

export default function PageWrapper({ children, name }: PropsWithChildren<PageWrapperProps>) {
    const componentsWithStyles = useThemedStylesWithMdx(useMDXComponents());

    return (
        <ThemeUIProvider theme={theme}>
            <MDXProvider components={{ ...mdxComponents, ...componentsWithStyles }}>
                <ErrorProvider>
                    <ForsendelseCommonsProvider>
                        <Suspense fallback={<Loader size={"3xlarge"} title={"Laster..."} />}>
                            <div id={name} className={"w-full bidrag-forsendelse-ui"}>
                                {children}
                            </div>
                        </Suspense>
                    </ForsendelseCommonsProvider>
                </ErrorProvider>
            </MDXProvider>
        </ThemeUIProvider>
    );
}
