export interface IMessage {
    functionName: string;
    payload: any;
    correlationId?: string;
}
