import {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    dialog,
    nativeImage,
    NativeImage,
    screen
} from "electron";

import {
    IPCRoute
} from "./ipc-routes";

// 必須在這裡建立IPC路由器，因為這是Electron的主進程入口點
// 你可能會呼叫`ipc_route.on`或`ipc_route.handle`來註冊額外的IPC通道，如果都沒有，也仍然必須建立一個實例
const ipc_route = IPCRoute.create_ipc_router(ipcMain);

// 以下省略
