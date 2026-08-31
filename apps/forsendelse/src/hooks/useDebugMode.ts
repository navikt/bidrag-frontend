export default function useIsDebugMode() {
    return window.localStorage.getItem("debugmode") === "true";
}
