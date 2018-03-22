export interface IAttachment {
    filename: string;
}

export interface IStringAttachment extends IAttachment {
    content: string;
    contentType: string;
}

export interface IBufferAttachment extends IAttachment {
    content: Buffer;
    contentType: string;
}

export interface IEmail {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
    bcc?: string;
    cc?: string;
    attachments?: IAttachment[];
}
