/** Static authoring markers. This module is not a JSX runtime or a model type SDK. */
type Operator = 'Program' | 'State' | 'Action' | 'Input' | 'Reduce' | 'Portal' | 'Surface' | 'Lane' | 'Mount';
export declare const RMT: Readonly<Record<Operator, (attributes: Readonly<Record<string, unknown>>) => null>>;
export declare const model: Readonly<Record<string, unknown>>;
export declare const input: Readonly<Record<string, unknown>>;
