// SPDX-License-Identifier: Apache-2.0
import scopes from '@ccslabs/xtend-compiler/xtensions/native-surface-scopes';
import {createNativeSurfaceGraphProfile} from './native-surface-graph-core.mjs';
export const NATIVE_SURFACE_GRAPH_API_VERSION = '3.0.0';
export const NATIVE_SURFACE_GRAPH_SCHEMA = 'xtend.maraca.native-surface-graph.v3';
/** Delegates the actual Graph2/Controller with the unchanged Source7 ports. */
export function createMaracaNativeSurfaceGraph(options = {}) { return createNativeSurfaceGraphProfile(options, scopes, NATIVE_SURFACE_GRAPH_SCHEMA); }
export default Object.freeze({ NATIVE_SURFACE_GRAPH_API_VERSION, NATIVE_SURFACE_GRAPH_SCHEMA, createMaracaNativeSurfaceGraph });
