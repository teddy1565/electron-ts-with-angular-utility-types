

import { IpcMainEvent } from "electron";

import {
    startup_test,
    ipc_message_wtih_args
} from "./electron-ipc-route.declare";


import {
    IOpenSomeThing
} from "./shared-declare-types/index";

export interface ElectronIpcMainRouter {
    startup_test: startup_test<IpcMainEvent>;
    ipc_message_wtih_args: ipc_message_wtih_args<IpcMainEvent, IOpenSomeThing<string>>;
}
