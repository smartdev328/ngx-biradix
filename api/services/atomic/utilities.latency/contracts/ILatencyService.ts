export interface ILatencyService {
    init(rabbit: any): Promise<string>;
    latency(): Promise<number>;
}
