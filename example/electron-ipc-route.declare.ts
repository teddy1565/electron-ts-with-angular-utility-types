import { IpcMainEvent } from "electron";


import {
    IOpenSomeThing
} from "./shared-declare-types/index";

export interface startup_test<T extends IpcMainEvent> {
    /**
     * @param _ev
     * @param str
     * @returns
     */
    (_ev: T, ...args: any[]): "pong";
}

export interface ipc_message_wtih_args<T extends IpcMainEvent, U extends IOpenSomeThing<string>> {
    (_ev: T, options: U): Promise<boolean>;
}
