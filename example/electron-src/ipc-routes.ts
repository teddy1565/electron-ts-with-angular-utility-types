import { IpcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { IPCMainOverwrite } from "./declares/ipc-main-overwrite.declare.ts"; // Adjust path as needed
import { AppRouter } from "./declares/app-router"; // Adjust path as needed

import {
    IPCValidChannel
} from "../shared-declare-types/ipc-valid-channel.ts";

export class IPCRoute {
    private ipc: IPCMainOverwrite;

    private router: AppRouter;

    public static create_ipc_router(ipc: IpcMain): IPCRoute {
        const router = AppRouter.create_router();
        return new IPCRoute(ipc, router);
    }

    private constructor(_parent_ipc: IpcMain, router: AppRouter) {
        this.ipc = new IPCMainOverwrite(_parent_ipc);
        this.router = router;

        // 註冊IPC路由
        this.ipc.handle("startup_test", router.startup_test);
    }

    public handle(channel: IPCValidChannel, callback: <T extends IpcMainInvokeEvent>(_ev: T, ...args: any[]) => any): void {
        this.ipc.handle(channel, callback);
    }

    public on(channel: IPCValidChannel, callback: <T extends IpcMainEvent>(channel: string, _ev: T, ...args: any[]) => any): void {
        this.ipc.on(channel, callback);
    }

}
