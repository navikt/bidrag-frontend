import { createContext } from "react-router";
import type {NavUser} from "~/server/auth/NavUser.ts";


export const userContext = createContext<NavUser | null>(null);
