export interface IMessage {
    payload: any;
    correlationId?: string;
}

export interface IRPCMessage extends IMessage {
    functionName: string;
}

export interface IEventMessage extends IMessage {
    eventName: string;
}
