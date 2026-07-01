import {createContext} from "react-router";
import type {NavUser} from "~/common/NavUser.ts";

export const userContext = createContext<NavUser | null>(null);
export const authTokenContext = createContext<string | null>(null);
