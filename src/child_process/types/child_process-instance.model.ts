import { MessagePortMain } from "electron";

import {
    IPCMessage
} from "./child_process-message-struct.model";

// eslint-disable-next-line no-empty-function
export const AsyncFunction = (async() => {}).constructor;
// eslint-disable-next-line no-empty-function
export const GeneratorFunction = (function *() {}).constructor;

// export type AsyncFunctionType<T> = T extends typeof AsyncFunction ? (T extends Function ? (never): (T extends typeof GeneratorFunction? (never) : (T))) : (never);


export interface CustomModule {
    /**
     * The main function that will be executed when the module is loaded.
     */
    main: (<T extends IPCMessage>(data: T) => any) | (<T extends IPCMessage>(data: T) => Promise<any>) | Function | Promise<any>;

    /**
     * The port function that will be executed when the module is loaded.
     *
     * If you want handle MessagePort, your module must have a port function.
     *
     * @description
     * e.g. if you receive a dongle from child process, you can use this function to handle the dongle.
     */
    port?: ((port: MessagePortMain) => void) | ((port: MessagePortMain) => Promise<void>);
}

