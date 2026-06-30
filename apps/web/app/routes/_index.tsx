import {LoggerService, SecureLoggerService} from "@bidrag/common";

export default function Index() {
    SecureLoggerService.info("Sikker hei fra index")
    LoggerService.info("Bare hei fra index")
    return <div>Hallo hallo</div>;
}
