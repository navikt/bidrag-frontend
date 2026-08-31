import { useQuery } from "@tanstack/react-query";

interface UserInfo {
    displayName: string;
    firstname: string;
    surname: string;
    navIdent: string;
    email: string;
    officeLocation: string;
}

const useUserInfoQuery = () => {
    return useQuery<UserInfo>({
        queryKey: ["userinfo"],
        queryFn: () => fetch("/me").then((res) => res.json()),
    });
};

export const useHentSaksbehandlerNavn = () => {
    const userInfo = useUserInfoQuery();
    return userInfo.data.displayName;
};
