/* eslint-disable arrow-body-style */
import { Injectable, OnInit, Inject, Optional } from "@angular/core";
import { switchMap, distinctUntilChanged, catchError, map } from "rxjs/operators";
import { forkJoin, of, takeUntil, ReplaySubject, Observable, lastValueFrom, from, mergeMap, share  } from "rxjs";

import { IPCRenderer, Params } from "../shared-declare-types/ipc";
import { IPCValidChannel } from "../shared-declare-types/ipc-valid-channel";

// 定義全域的Window介面，讓TypeScript知道有ipcRenderer這個屬性
declare global {
    interface Window {
        ipcRenderer: IPCRenderer<IPCValidChannel>;
    }
}

({
    providedIn: "root"
})

export class IPCRendererService {

    private _destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

    private readonly receive_map: Map<IPCValidChannel, Observable<any>> = new Map<IPCValidChannel, Observable<any>>();

    constructor() {
        console.info("[IPCRendererService.constructor]IPCRendererService constructed.");
    }

    public send<T=never|undefined>(channel: IPCValidChannel): void;
    public send<T extends any[]>(channel: IPCValidChannel, ...data: T): void;
    public send<T extends any[]>(...args: T): void {
        // eslint-disable-next-line no-undef
        if (window.ipcRenderer && window.ipcRenderer.send) {
            if (args.length === 1) {
                // eslint-disable-next-line no-undef
                window.ipcRenderer.send<T>(args[0]);
            } else if (args.length > 1) {
                // eslint-disable-next-line no-undef
                window.ipcRenderer.send<Array<any>>(args[0], ...args.slice(1));
            } else {
                console.error(`[IPCRendererService.send]Invalid IPC channel: ${args[0]}`);
            }
        } else {
            console.error(`[IPCRendererService.send]Invalid IPC channel: ${args[0]}`);
        }
    }

    public invoke<P extends any[], R>(channel: IPCValidChannel, ...args: P): Promise<R> {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            if (window.ipcRenderer && window.ipcRenderer.invoke) {
                // eslint-disable-next-line no-undef
                window.ipcRenderer.invoke<P, R>(channel, ...args).then((data: R) => {
                    resolve(data);
                }).catch((error: Error) => {
                    reject(error);
                });
            } else {
                console.error(`[IPCRendererService.invoke]Invalid IPC channel: ${channel}`);
                return reject(new Error(`[IPCRendererService.invoke]Invalid IPC channel: ${channel}`));
            }
        });
    }

    public receive<T>(channel: IPCValidChannel): Observable<T> {
        if (this.receive_map.has(channel)) {
            return this.receive_map.get(channel) as Observable<T>;
        }
        const observable = (new Observable((subscriber) => {
            // eslint-disable-next-line no-undef
            if (window.ipcRenderer && window.ipcRenderer.receive) {
                // eslint-disable-next-line no-undef
                window.ipcRenderer.receive<T>(channel, (data) => {
                    subscriber.next(data);
                });
            } else {
                console.error(`[IPCRendererService.receive]Invalid IPC channel: ${channel}`);
                subscriber.error(new Error(`[IPCRendererService.receive]Invalid IPC channel: ${channel}`));
            }
        })).pipe<T>(share<any>());



        this.receive_map.set(channel, observable);

        observable.subscribe((data) => {
        });

        return observable;
    }
}
