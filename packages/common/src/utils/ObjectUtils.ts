import { StringUtils } from "./StringUtils";

// biome-ignore  lint/complexity/noStaticOnlyClass: No decision yet.
export default class ObjectUtils {
    // biome-ignore lint/suspicious/noExplicitAny: The function tests for the type of the value, so any is fine here.
    static isEmpty(value?: any) {
        if (!value) {
            return true;
        }

        if (value && typeof value === "string") {
            return StringUtils.isEmpty(value);
        }
        return Object.keys(value).length === 0;
    }
}
