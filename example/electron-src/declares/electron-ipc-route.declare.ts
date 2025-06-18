import {
    IpcMainEvent,           // 如果這個交互是單向的 (也就是event.reply不是一對一回應，可能不回應，或是像stream一樣多次回應)，則使用 IpcMainEvent
    IpcMainInvokeEvent      // 如果這個交互是雙向的 (也就是event.reply是有回應的，一問一答)，則使用 IpcMainInvokeEvent
} from "electron";

import {
    startup_test,
    ipc_message_wtih_args
} from "../../shared-declare-types/ipc-routes.declare"

import { Data } from "../../shared-declare-types/data";

export interface ElectronIpcMainRouter {
    startup_test: startup_test<IpcMainInvokeEvent>;
    ipc_message_wtih_args: ipc_message_wtih_args<IpcMainEvent, Data<string>>;
}
