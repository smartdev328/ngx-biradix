import {IEmailService} from "../atomic/utilities.email/contracts/IEmailService";
import {IShortenerService} from "../atomic/utilities.shortener/contracts/IShortenerService";
let emailService: IEmailService = null;
let shortenerService: IShortenerService = null;

export function setEmailService(service: IEmailService) {
    emailService = service;
}

export function getEmailService(): IEmailService {
    return emailService;
}

export function setShortenerService(service: IShortenerService) {
    shortenerService = service;
}

export function getShortenerService(): IShortenerService {
    return shortenerService;
}
