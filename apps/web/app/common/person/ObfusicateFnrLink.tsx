import {Link, type LinkProps} from "react-router";
import {useObfusicateFnr} from "~/common/person/useObfusicateFnr.ts";

interface BrukerLinkProps extends LinkProps {
}

export const ObfusicateFnrLink = ({children, to, ...linkProps}: BrukerLinkProps) => {
    const {encodeFnr} = useObfusicateFnr();

    const modifiedTo =
        typeof to === "string"
            ? to.replace(/\b\d{11}\b/g, (match) => encodeFnr(match))
            : {
                ...to,
                pathname: to.pathname?.replace(/\b\d{11}\b/g, (match) =>
                    encodeFnr(match),
                ),
            };
    return (
        <Link {...linkProps} to={modifiedTo}>
            {children}
        </Link>
    );
};
