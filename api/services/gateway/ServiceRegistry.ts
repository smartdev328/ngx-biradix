import {IEmailService} from "../atomic/utilities.email/contracts/IEmailService";
import {ILatencyService} from "../atomic/utilities.latency/contracts/ILatencyService";
import {IShortenerService} from "../atomic/utilities.shortener/contracts/IShortenerService";

let emailService: IEmailService = null;
let shortenerService: IShortenerService = null;
let latencyService: ILatencyService;

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

export function setLatencyService(service: ILatencyService) {
    latencyService = service;
}

export function getLatencyService(): ILatencyService {
    return latencyService;
}