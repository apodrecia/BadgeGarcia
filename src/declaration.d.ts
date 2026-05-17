declare module 'enmity/managers/plugins' {
  export class Plugin {
    internalSettings: { raw: any };
    constructor();
    onStart(): void;
    onStop(): void;
    getSettingsPanel(args: { settings: any }): any;
  }
  export function registerPlugin(plugin: Plugin): void;
}

declare module 'enmity/metro/common' {
  export const React: any;
  export const Flux: any;
  export const Constants: any;
}

declare namespace React {
  type FunctionComponent<P = {}> = any;
  type FC<P = {}> = any;
  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  const Fragment: any;
  function createElement(type: any, props?: any, ...children: any[]): any;
}

declare module 'enmity/metro' {
  export function getByProps(...props: string[]): any;
  export function getModule(filter: (m: any) => boolean): any;
}

declare module 'enmity/patcher' {
  export function create(id: string): any;
}

declare module 'enmity/components' {
  export const Switch: any;
  export const Text: any;
  export const Button: any;
  export const TextInput: any;
  export const ScrollView: any;
}
