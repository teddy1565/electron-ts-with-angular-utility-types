import {
    IpcMainEvent,
    IpcMainInvokeEvent
} from "electron";

import {
    Data
} from "../../shared-declare-types/data";

import { ElectronIpcMainRouter } from "./electron-ipc-route.declare"; // Adjust path as needed

export class AppRouter implements ElectronIpcMainRouter {

    public static create_router(): AppRouter {
        return new AppRouter();
    }

    private constructor() {

    }

    startup_test(_ev: IpcMainInvokeEvent): string {
        return "Pong";
    }

    ipc_message_wtih_args(_ev: IpcMainEvent, desc: Data<string>): Promise<boolean> {
        return Promise.resolve(true);
    }
}
