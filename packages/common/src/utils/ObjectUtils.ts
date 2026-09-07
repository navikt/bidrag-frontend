import { StringUtils } from "./StringUtils";

// biome-ignore  lint/complexity/noStaticOnlyClass: No decision yet.
export default class ObjectUtils {
    static isEmpty(value?: unknown) {
        if (!value) {
            return true;
        }

        if (value && typeof value === "string") {
            return StringUtils.isEmpty(value);
        }
        return Object.keys(value).length === 0;
    }
}
