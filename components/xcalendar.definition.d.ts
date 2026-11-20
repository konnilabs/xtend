// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XCalendarElement} from './xcalendar.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xcalendar.js';
export type XCalendar = XCalendarElement & NativeWritablePropertiesV2<"x-calendar">;
export declare const XCalendar: NativeDefinitionConstructorV2<"x-calendar",XCalendarElement>;
export default XCalendar;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
