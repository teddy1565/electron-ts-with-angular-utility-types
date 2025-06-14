import {
    app,
    utilityProcess,
    UtilityProcess,
    MessageChannelMain,
    MessagePortMain,
    ForkOptions,
    MessageEvent
} from "electron";

import {
    EventEmitter
} from "events";

import {
    IPCMessage
} from "./types/child_process-message-struct.model";

import * as path from "path";




/**
 * @deprecated
 * 還需要修改
 */
export interface IElectronChildProcessEventEmitter {
    send<T extends IPCMessage>(ev: string, message: T): void;
    on<T extends IPCMessage>(ev: "message", token: number, listener: (message: T) => void): void;
    once<T extends IPCMessage>(ev: "message", token: number, listener: (message: T) => void): void;
    invoke<T extends IPCMessage, R>(ev: string, token: number, message: T): Promise<R>;
}

/**
 * @deprecated
 * 還需要修改
 */
export class ElectronChildProcessEventEmitter implements IElectronChildProcessEventEmitter {

    private readonly _event_emitter: EventEmitter = new EventEmitter();

    constructor() {
        this._event_emitter.setMaxListeners(Infinity);
    }

    public send<T extends IPCMessage>(ev: string, message: T): void {
        this._event_emitter.emit(ev, message);
    }

    public on<T extends IPCMessage>(ev: string, token: number, listener: (message: T) => void): void {
        this._event_emitter.on(ev, (message: T) => {
            if (message.token === token) {
                listener(message);
            }
        });
    }

    public once<T extends IPCMessage>(ev: string, token: number, listener: (message: T) => void): void {
        this._event_emitter.once(ev, (message: T) => {
            if (message.token === token) {
                listener(message);
            } else {
                this.once(ev, token, listener);
            }
        });
    }

    public invoke<T extends IPCMessage, R>(ev: string, token: number, message: T): Promise<R> {
        const task = new Promise<R>((resolve, reject) => {
            this._event_emitter.once(ev, (message: T) => {
                if (message.token === token) {
                    resolve(<R>message.data);
                } else {
                    this.send(ev, message);
                }
            });
        });

        this.send(ev, message);

        return task;
    }
}


export interface IElectronChildProcess {
    send<T extends IPCMessage>(message: T): void;
    on<T extends IPCMessage>(ev: "message", listener: (message: T | undefined) => void): void;
    once<T extends IPCMessage>(ev: "message", listener: (message: NonNullable<T>) => void): void;
    invoke<T extends IPCMessage, R>(message: T): Promise<R>;
}

export class ElectronChildProcess implements IElectronChildProcess {

    private readonly _childProcess: UtilityProcess;

    private readonly _port_main: MessagePortMain;

    private readonly _port_child: MessagePortMain;

    private readonly _message_queue: Array<any> = [];

    private spawn_ready: boolean = false;

    private readonly _eventEmitter: EventEmitter;

    private constructor(module_path: string, args?: string[], options?: ForkOptions) {
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(Infinity);
        const { port1, port2 } = new MessageChannelMain();
        this._port_main = port1;
        this._port_child = port2;
        if ((args === undefined || args === null) && (options === undefined || options === null)) {
            this._childProcess = utilityProcess.fork(path.join(__dirname, "child_process-instance.module.js"));
        } else if (args !== undefined && args !== null && Array.isArray(args) === true) {
            if (options !== undefined && options !== null) {
                this._childProcess = utilityProcess.fork(path.join(__dirname, "child_process-instance.module.js"), args, options);
            } else if (args.length > 0) {
                this._childProcess = utilityProcess.fork(path.join(__dirname, "child_process-instance.module.js"), args);
            } else {
                this._childProcess = utilityProcess.fork(path.join(__dirname, "child_process-instance.module.js"));
            }
        } else if (options !== undefined && options !== null) {
            this._childProcess = utilityProcess.fork(path.join(__dirname, "child_process-instance.module.js"), [], options);
        } else {
            this._childProcess = utilityProcess.fork(path.join(__dirname, "child_process-instance.module.js"));
        }

        this._port_main.on("message", (message) => {
            try {
                this._eventEmitter.emit("message", message);
            } catch (error) {
                console.log(error);
            }
        });
        this._childProcess.once("spawn", () => {
            this._childProcess.postMessage({
                module_path: module_path
            }, [this._port_child]);
            this._port_main.start();
            for (const message of this._message_queue) {
                this._port_main.postMessage(message);
            }
            this.spawn_ready = true;
        });
    }

    /**
     * Must be after app is ready
     *
     * if app is not ready, it will return a promise that will resolve when app is ready
     * @param module - The module to run in the child
     * @param args - List of string arguments
     * @param options - Options object
     * @returns
     */
    static fork(module: string, args?: string[], options?: ForkOptions): ElectronChildProcess {
        if (app.isReady() === false) {
            throw new Error("App is not ready yet");
        } else {
            return new ElectronChildProcess(module, args, options);
        }
    }

    get main_message_port(): MessagePortMain {
        return this._port_main;
    }

    get child_message_port(): MessagePortMain {
        return this._port_child;
    }

    public send<T>(message: T): void {
        if (this.spawn_ready === true && this._childProcess !== null && this._childProcess !== undefined) {
            this._port_main.postMessage(<T>message);
        } else {
            this._message_queue.push(message);
        }
    }

    public on<T>(ev: "message", listener: (message: T | undefined) => void): void {
        this._eventEmitter.on(ev, (_message: MessageEvent) => {
            listener(_message?.data);
        });
    }

    public once<T>(ev: "message", listener: (message: NonNullable<T>) => void): void {
        this._eventEmitter.once(ev, (_message: MessageEvent) => {
            const result = _message?.data;
            if (result === undefined) {
                this.once(ev, listener);
            } else {
                listener(result);
            }
        });
    }

    public invoke<T, R>(message: T): Promise<R> {
        return new Promise((resolve, reject) => {
            this._port_main.once("message", (message: MessageEvent) => {
                resolve(<R>message.data);
            });
            this.send(message);
        });
    }
}
