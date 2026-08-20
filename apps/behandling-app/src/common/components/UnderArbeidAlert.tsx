import React from "react";

import text from "../constants/texts";
import { BehandlingAlert } from "./BehandlingAlert";
export default function UnderArbeidAlert() {
    return <BehandlingAlert variant="warning">{text.alert.underArbeit}</BehandlingAlert>;
}
