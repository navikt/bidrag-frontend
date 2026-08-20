import { MDXProvider, useMDXComponents } from "@mdx-js/react";
import { ArrowRightIcon, Buildings2Icon, PersonIcon, SackKronerFillIcon } from "@navikt/aksel-icons";
import { BodyLong, BodyShort, Heading, Label } from "@navikt/ds-react";
import { useThemedStylesWithMdx } from "@theme-ui/mdx";
import React, { type PropsWithChildren } from "react";
import { type Theme, ThemeUIProvider } from "theme-ui";

import { AdminPanelFloatingButton } from "../barnebidrag/admin/AdminPanel";
import { useTracker } from "./hooks/useTracker";

interface PageWrapperProps {
    name: string;
}
const mdxComponents = {
    Heading,
    BodyShort,
    ArrowRightIcon,
    BodyLong,
    Label,
    SackKronerFillIcon,
    Buildings2Icon,
    PersonIcon,
};

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
        ul: {
            marginTop: "5px",
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
            marginBottom: "5px",
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
    useTracker();
    return (
        <>
            <ThemeUIProvider theme={theme}>
                <MDXProvider components={{ ...mdxComponents, ...componentsWithStyles }}>
                    <div className={name}>{children}</div>
                </MDXProvider>
                <AdminPanelFloatingButton />
            </ThemeUIProvider>
        </>
    );
}
