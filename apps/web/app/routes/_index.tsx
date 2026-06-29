import {LoggerService, SecureLoggerService} from "@bidrag/common";
import {useEffect} from "react";


export default function Index() {

    // useEffect(() => {
        LoggerService.info("Index page loaded");
        SecureLoggerService.info("Index page loaded securely");
    // }, []);


    return <div>Hallo hallo</div>;
}
