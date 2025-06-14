import * as process from "process";
import * as path from "path";
import { MessagePortMain } from "electron";

import { CustomModule, AsyncFunction, GeneratorFunction } from "./types/child_process-instance.model";

function main(custom_module: any, port: MessagePortMain) {
    port.on("message", (message) => {
        try {
            const data = message.data;
            if ((custom_module.main instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) === true) {
                custom_module.main(data).then((result: any) => {
                    port.postMessage(result);
                });
            } else if (custom_module.main && typeof custom_module.main.then === "function" && custom_module.main[Symbol.toStringTag] === "Promise") {
                custom_module.main(data).then((result: any) => {
                    port.postMessage(result);
                });
            } else {
                const result = custom_module.main(data);
                port.postMessage(result);
            }
        } catch (error) {
            console.log(error);
        }
    });
}

// eslint-disable-next-line space-before-function-paren
process.parentPort.on("message", async (initialization_message) => {
    const { module_path } = <{ module_path: string }>initialization_message.data;

    if (module_path === undefined || typeof module_path !== "string" || module_path === null || module_path === "") {
        // 如果引用模組路徑不存在，則不執行，因為有可能做其他事情
        return;
    }

    const port = initialization_message.ports[0];

    const custom_module_import: any = await import(path.join(module_path));
    // eslint-disable-next-line multiline-ternary, no-ternary
    const custom_module: CustomModule = custom_module_import?.default ? custom_module_import.default : custom_module_import;
    if (custom_module?.port !== undefined && custom_module.port !== null) {
        try {
            if ((custom_module.port instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) === true) {
                await custom_module.port(port);
            } else if (custom_module.port && custom_module.port instanceof Promise && typeof custom_module.port.then === "function" && custom_module.port[Symbol.toStringTag] === "Promise") {
                await custom_module.port(port);
            } else {
                custom_module.port(port);
            }
        } catch (error) {
            console.error("Error in port function", error);
        }
    }

    main(custom_module, port);

    port.start();
});
