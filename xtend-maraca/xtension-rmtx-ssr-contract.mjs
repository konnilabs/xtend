// SPDX-License-Identifier: Apache-2.0
import { fields, json, freeze, copy } from './xtension-composition-contract.mjs';

export const RMTX_XTENSION_SSR_API_VERSION = '3.0.0';
export const RMTX_SSR_SOURCE_IDENTITY_SCHEMA = 'xtend.maraca.rmtx-ssr-source-identity.v1';
const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const exact = (value, keys, label) => {
  fields(value, keys, label);
  if (Object.keys(value).length !== keys.length) throw new TypeError(`Incomplete ${label}.`);
};

/** Captured compiler/project provenance, never a caller-selected provider grant.
 * The build owner supplies this descriptor independently from snapshot data. */
export function normalizeRmtxSSRSourceIdentity(input, { sourceHash } = {}) {
  json(input);
  exact(input, ['schema', 'sourceProfile', 'sourceHash', 'project'], 'RMTX SSR source identity');
  exact(input.sourceProfile, ['syntax', 'version'], 'RMTX SSR source profile');
  exact(input.project, ['schema', 'apiVersion', 'identity', 'sourceSyntax'], 'RMTX SSR project identity');
  if (input.schema !== RMTX_SSR_SOURCE_IDENTITY_SCHEMA || input.sourceProfile.syntax !== 'rmtx'
    || !/^[1-8]\.0\.0$/u.test(input.sourceProfile.version) || !sha256(input.sourceHash)
    || sourceHash !== undefined && input.sourceHash !== sourceHash
    || input.project.schema !== 'xtend.rmt.project-report.v1' || input.project.apiVersion !== '1.0.0'
    || !sha256(input.project.identity) || !['rmtx', 'rmt-vnext'].includes(input.project.sourceSyntax)) {
    throw new TypeError('A versioned compiled RMTX source/project identity is required.');
  }
  return freeze(copy(input));
}

/** Native-only RMTX has no fabricated XTension composition. Its independent
 * handoff signs the compiled native program and the same source provenance. */
export function createRmtxSSRNativeArtifact(program, sourceIdentity) {
  const identity = normalizeRmtxSSRSourceIdentity(sourceIdentity);
  json(program);
  const version = Number(identity.sourceProfile.version[0]);
  if (version < 5 || program?.schema !== `xtend.rmt.app-orchestration.v${version - 2}`
    || !program.render?.nativeView || !Array.isArray(program.state?.states) || !Array.isArray(program.surfaces)) {
    throw new TypeError('Native-only SSR requires the exact compiled Source5..8 native program.');
  }
  return freeze({ schema: 'xtend.maraca.rmtx-ssr-native-artifact.v1', apiVersion: '1.0.0', sourceIdentity: identity, program: copy(program) });
}

export function validateRmtxSSRNativeArtifact(input) {
  json(input);
  exact(input, ['schema', 'apiVersion', 'sourceIdentity', 'program'], 'native-only RMTX SSR artifact');
  if (input.schema !== 'xtend.maraca.rmtx-ssr-native-artifact.v1' || input.apiVersion !== '1.0.0') throw new TypeError('A native-only RMTX SSR artifact v1 is required.');
  return createRmtxSSRNativeArtifact(input.program, input.sourceIdentity);
}
