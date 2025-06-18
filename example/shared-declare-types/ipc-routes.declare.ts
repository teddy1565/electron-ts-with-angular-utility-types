import {
    IpcMainEvent,           // 如果這個交互是單向的 (也就是event.reply不是一對一回應，可能不回應，或是像stream一樣多次回應)，則使用 IpcMainEvent
    IpcMainInvokeEvent      // 如果這個交互是雙向的 (也就是event.reply是有回應的，一問一答)，則使用 IpcMainInvokeEvent
} from "electron";
import { Data } from "./data";

// A simple fire-and-forget style handler
export interface startup_test<T extends IpcMainInvokeEvent> {
    (_ev: T, ...args: any[]): string;
}

// A handler that takes a typed payload and returns a Promise
export interface ipc_message_wtih_args<T extends IpcMainEvent, U extends Data<string>> {
    (_ev: T, desc: U): Promise<boolean>;
}
