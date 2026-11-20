import type { NativeManagedViewProgram, NATIVE_MANAGED_VIEW_RUNTIME } from '@ccslabs/xtend/xtensions/native-managed-view-projection';
import type { ManagedNativeLease } from '@ccslabs/xtend/xtensions/native-component-managed';
export declare const NATIVE_PLATFORM_HOST_API_VERSION: '1.0.0';
export interface MaracaNativePlatformHost {
  dispatch(capability: string, args: Readonly<{ role: string }>, lease: ManagedNativeLease): import('@ccslabs/xtend/components/native-services', {with: {'resolution-mode': 'import'}}).NativePlatformBinding;
  verifyNativeTerminalReceipt(command: string, result: unknown, lease: ManagedNativeLease): boolean;
  dispose(): void;
}
export declare function createMaracaNativePlatformHost(options: { program: NativeManagedViewProgram; nativePort: typeof NATIVE_MANAGED_VIEW_RUNTIME; platform(): Readonly<Record<string, any>> }): MaracaNativePlatformHost;
