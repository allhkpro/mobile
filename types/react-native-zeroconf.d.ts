declare module "react-native-zeroconf" {
  export default class Zeroconf {
    constructor();
    on(event: string, cb: (...args: any[]) => void): void;
    scan(type: string, protocol: string): void;
    stop(): void;
    removeDeviceListeners(): void;
  }
}
