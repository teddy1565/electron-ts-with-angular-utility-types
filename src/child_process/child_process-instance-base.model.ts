import { MessagePortMain } from "electron";

/**
 * TSElectronUtilityProcess Base Class
 */
export abstract class ChildProcessModuleBase {

    protected abstract ipc_port: MessagePortMain | null;

    /**
     * export IPC port for outer container. inject IPC port for outer container used
     */
    public abstract set_ipc_port(port: MessagePortMain): void;


    public abstract route(message: unknown): void;
}
