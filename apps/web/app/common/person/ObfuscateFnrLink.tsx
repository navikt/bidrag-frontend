import {Link, type LinkProps} from "react-router";
import {useObfuscateFnr} from "~/common/person/useObfuscateFnr.ts";

interface BrukerLinkProps extends LinkProps {
}

export const ObfuscateFnrLink = ({children, to, ...linkProps}: BrukerLinkProps) => {
    const {encodeFnr} = useObfuscateFnr();

    const modifiedTo =
        typeof to === "string"
            ? to.replace(/\b\d{11}\b/g, (match) => encodeFnr(match))
            : {
                ...to,
                pathname: to.pathname?.replace(/\b\d{11}\b/g, (match) =>
                    encodeFnr(match),
                ),
            };
    // TODO Legge til obfuscation på queryparams også?
    return (
        <Link {...linkProps} to={modifiedTo}>
            {children}
        </Link>
    );
};
