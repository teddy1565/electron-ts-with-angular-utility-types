/* eslint-disable arrow-body-style */
import { Injectable, OnInit, Inject, Optional } from "@angular/core";
import { switchMap, distinctUntilChanged, catchError, map } from "rxjs/operators";
import { forkJoin, of, takeUntil, ReplaySubject, Observable, lastValueFrom, from, mergeMap, share  } from "rxjs";

import { IPCRenderer, Params } from "../shared-declare-types/ipc";
import { IPCValidChannel } from "../shared-declare-types/ipc-valid-channel";

import { IPCRendererService } from "./ipc-renderer.service";

import {
    startup_test
} from "../shared-declare-types/ipc-routes.declare"

({
    providedIn: "root"
})

export class SomeService {

    private _destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);


    constructor(private ipcRenderer: IPCRendererService) {
    }

    public ping() {
        return from(this.ipcRenderer.invoke<Params<startup_test<any>>, ReturnType<startup_test<any>>>("startup_test"));
    }
}

