# electron-ts-with-angular-utility-types

This project provides a collection of utility classes and type definitions designed to create a strongly-typed and robust communication layer in Electron applications that use TypeScript. It offers solutions for both Inter-Process Communication (IPC) between the main and renderer processes, and for managing child utility processes.

## Core Features

- Type-Safe IPC: Eliminates runtime errors by enforcing a strict contract for IPC channels, payloads, and return types between the main process and renderer processes.
- Simplified Utility Process Management: Provides a straightforward wrapper for creating, communicating with, and managing Electron's utilityProcess.
- Angular-Friendly Service: Includes an example of an injectable Angular service (IPCRendererService) that wraps IPC calls in an RxJS-friendly way.

## Type-Safe IPC Communication

This utility enforces a "contract" for your IPC communications. Instead of using raw strings for channel names and any for data, you define the entire structure with TypeScript interfaces. This allows for autocompletion and compile-time checks, significantly reducing bugs.

The process follows these steps:

1. Define Shared Data Structures: Create interfaces for any complex data objects that will be sent over IPC. These types are shared between the main and renderer code.
2. Declare IPC Route Signatures: Define the function signature for each individual IPC channel.
3. Assemble the Main Process Router: Combine all route signatures into a single interface that represents your complete IPC API.
4. Implement the Handlers in the Main Process: Write the logic for each IPC channel using the IPCMainOverwrite class, which ensures your implementation matches the declared signatures.
5. Call from the Renderer Process: Use the provided IPCRendererService in your Angular application to communicate with the main process in a type-safe manner.

### Step 1: Define Shared Data Structures

> Create a file for types that both your main and renderer process will use.

Example: `example/shared-declare-types/index.ts`

```typescript
export interface IOpenSomeThing<T extends any> {
    path: string;
    options?: T;
}
```

### Step 2: Declare IPC Route Signatures

> Define the specific inputs and outputs for each IPC channel.
>
> This creates a clear contract for what each channel does.

**Example**: `example/electron-ipc-route.declare.ts`

```typescript
import { IpcMainEvent } from "electron";
import { IOpenSomeThing } from "./shared-declare-types/index";

// A simple fire-and-forget style handler
export interface startup_test<T extends IpcMainEvent> {
    (_ev: T, ...args: any[]): "pong";
}

// A handler that takes a typed payload and returns a Promise
export interface ipc_message_wtih_args<T extends IpcMainEvent, U extends IOpenSomeThing<string>> {
    (_ev: T, options: U): Promise<boolean>;
}
```

### Step 3: Assemble the Main Process Router

> Combine all the route signatures into one master interface. This interface represents the entire API surface of your IPC system.

**Example**: `example/electron-ipc-main.declare.ts`

```typescript
import { IpcMainEvent } from "electron";
import { startup_test, ipc_message_wtih_args } from "./electron-ipc-route.declare";
import { IOpenSomeThing } from "./shared-declare-types/index";

export interface ElectronIpcMainRouter {
    startup_test: startup_test<IpcMainEvent>;
    ipc_message_wtih_args: ipc_message_wtih_args<IpcMainEvent, IOpenSomeThing<string>>;
}
```

### Step 4: Implement in the Main Process

In your Electron main process file, use the `IPCMainOverwrite` class to implement the router you defined. TypeScript will enforce that your implementation (the function bodies) matches the signatures from your router interface.

**Example**: `main.ts (Hypothetical)`

```typescript
import { ipcMain, IpcMainEvent } from "electron";
import { IPCMainOverwrite } from "./dist/ipc/ipc.model"; // Adjust path as needed
import { ElectronIpcMainRouter } from "./example/electron-ipc-main.declare"; // Adjust path as needed
import { IOpenSomeThing } from "./example/shared-declare-types"; // Adjust path as needed

// Instantiate the type-safe IPC wrapper
const ipc = new IPCMainOverwrite<keyof ElectronIpcMainRouter>(ipcMain);

// Implement a handler using .on for one-way communication
ipc.on('startup_test', (channel, _ev, ...args) => {
    console.log(`Received ping on channel: ${channel}`);
    return "pong";
});

// Implement a handler using .handle for two-way, async communication
ipc.handle('ipc_message_wtih_args', async (_ev, options: IOpenSomeThing<string>) => {
    console.log('Path to open:', options.path);
    // ...do some async work...
    return true;
});
```

> **The IPCMainOverwrite class provides two key methods for this:**
>
- > `on<R>(channel, callback)`: For handling one-way renderer-to-main communication. The return value of the callback is automatically sent back on the same channel via `event.reply()`.
- > `handle<R>(channel, callback)`: For handling two-way invoke/handle style communication, which is ideal for asynchronous operations that return a result.

### Step 5: Use in the Renderer Process (Angular)

The provided `IPCRendererService` makes it easy to interact with the main process from your Angular components or services.

> File: `example/angular-ipc-render.ts`

```typescript
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { IPCValidChannel } from "../dist/ipc/ipc.model";

// This service is defined in the provided file and can be used in your Angular app
@Injectable({
    providedIn: "root"
})
export class IPCRendererService<L extends string = string> {
    // ... implementation from file ...

    /**
     * Sends a one-way message to the main process.
     */
    public send<T extends any[]>(channel: IPCValidChannel<L>, ...data: T): void;

    /**
     * Invokes a handler in the main process and waits for a result.
     */
    public invoke<P extends any[], R>(channel: IPCValidChannel<L>, ...args: P): Promise<R>;

    /**
     * Listens for messages sent from the main process on a specific channel.
     * Returns an RxJS Observable.
     */
    public receive<T>(channel: IPCValidChannel<L>): Observable<T>;
}
```

### **Usage in an Angular Component**

```typescript
import { Component, OnInit } from '@angular/core';
import { IPCRendererService } from './ipc-renderer.service'; // Adjust path
import { IOpenSomeThing } from './shared-declare-types'; // Adjust path
import { ElectronIpcMainRouter } from './electron-ipc-main.declare'; // Adjust path

@Component({
  selector: 'app-root',
  template: `<button (click)="testInvoke()">Test Invoke</button>`
})
export class AppComponent implements OnInit {

  constructor(private ipcService: IPCRendererService<keyof ElectronIpcMainRouter>) {}

  ngOnInit() {
    // Listen for replies from the 'startup_test' channel
    this.ipcService.receive('startup_test').subscribe((response: 'pong') => {
      console.log('Received response from main:', response);
    });

    // Send the initial message
    this.ipcService.send('startup_test');
  }

  async testInvoke() {
    const payload: IOpenSomeThing<string> = { path: '/path/to/my/file.txt' };
    try {
      const success = await this.ipcService.invoke('ipc_message_wtih_args', payload);
      console.log('Main process responded with:', success);
    } catch (error) {
      console.error('IPC invoke failed:', error);
    }
  }
}
```

---

## Utility Process Management

The `ElectronChildProcess` class is a wrapper around Electron's `utilityProcess.fork`. It simplifies the process of running a script in a separate, sandboxed process and establishing a communication channel with it. This is useful for offloading heavy, blocking tasks from the main UI thread.

### Example Usage

1. Create a Child Process Module: Write the script that will be executed in the child process. It must export a main function.
2. Fork and Communicate from the Main Process: Use the ElectronChildProcess.fork() static method to spawn the process and then use its instance methods (send, on, invoke) to communicate with it.

### Step 1: Create a Child Process Module

The module to be forked must have a specific structure, defined by the CustomModule interface. It requires a main function that will receive data from the parent process.

> **Example**: `my-heavy-task.ts`

```typescript
import { IPCMessage } from "./dist/child_process/types/child_process-message-struct.model"; // Adjust path

// This main function is the entry point for the child process logic.
// It will be called every time a message is received from the parent.
export function main(data: IPCMessage) {
    console.log("Child process received data:", data);
    // ... perform some heavy computation ...
    const result = `Processed data for key: ${data.key}`;

    // The return value is automatically sent back to the parent.
    return {
        ...data,
        data: result
    };
}
```

### Step 2: Fork and Communicate from the Main Process

From your main process code (e.g., `main.ts`), you can now fork this module.

> **Example**: `main.ts (Hypothetical)`

```typescript
import { app } from "electron";
import { ElectronChildProcess } from "./dist/child_process/child_process.module"; // Adjust path
import { IPCMessage } from "./dist/child_process/types/child_process-message-struct.model"; // Adjust path
import * as path from "path";

app.whenReady().then(() => {
    const modulePath = path.join(__dirname, "my-heavy-task.js"); // Path to the compiled child module

    try {
        // Fork the child process
        const child = ElectronChildProcess.fork(modulePath);
        console.log("Forked child process.");

        // --- Method 1: invoke (send and wait for a single response) ---
        const message_to_invoke: IPCMessage = { key: 'task-1', token: 1 };
        child.invoke<IPCMessage, IPCMessage>(message_to_invoke).then(response => {
            console.log("Received invoke response:", response.data);
        });

        // --- Method 2: send/on (for continuous, event-based communication) ---
        child.on<IPCMessage>((message) => {
            if (message?.key === 'task-2-response') {
                console.log("Received 'on' response:", message.data);
            }
        });

        const message_to_send: IPCMessage = { key: 'task-2-response', token: 2 };
        child.send(message_to_send);

    } catch (error) {
        console.error("Failed to fork child process:", error);
    }
});
```

> The `ElectronChildProcess` class handles the underlying `MessageChannelMain` setup, providing you with a clean API:

- `static fork(module)`: Creates and returns a new `ElectronChildProcess` instance. Must be called after the app is ready.
- `send<T>(message)`: Sends a message to the child process.
- `on<T>(ev, listener)`: Listens for messages coming from the child process.
- `invoke<T, R>(message)`: Sends a message and returns a `Promise` that resolves with the child process's first response.

---

## Dependencies

- @angular/core: ^20.0.3
- electron: ^36.4.0
- rxjs: ^7.8.2

## License

This project is licensed under the MIT License.
