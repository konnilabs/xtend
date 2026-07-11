#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  compileRmtVNextSource
} = require('../tools/rmt-language/vnext-compiler');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_PATH = 'docs/rmt-animation-engine-demo.rmt';
const OUTPUT_PATH = 'docs/generated/rmt-animation-engine-demo.plan.json';
const DEMO_SCHEMA = 'xtend.docs.animation-engine-demo.v1';
const EXPECTED_EFFECTS = Object.freeze([
  'fade',
  'crossfade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'scale',
  'pop',
  'zoom',
  'flip',
  'rotate',
  'expand',
  'collapse',
  'fade-blur',
  'shared-element',
  'layout-flip',
  'none'
]);
const DURATIONS = Object.freeze([120, 180, 240, 280, 300, 420, 650]);
const EASINGS = Object.freeze([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier(.2,.8,.2,1)',
  'cubic-bezier(.18,.9,.22,1)'
]);
const REDUCED_MOTION_PREVIEWS = Object.freeze(['system', 'fade', 'instant', 'none']);

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function serialize(value) {
  return `${JSON.stringify(stableSort(value), null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function blockingDiagnostics(result) {
  return (result && Array.isArray(result.diagnostics) ? result.diagnostics : [])
    .filter((diagnostic) => diagnostic && ['error', 'warning'].includes(diagnostic.severity));
}

function createRuntimeAnimationPlan(plan = {}) {
  return {
    schema: plan.schema,
    supportedEffects: plan.supportedEffects || [],
    safeKeyframeProperties: plan.safeKeyframeProperties || [],
    optInKeyframeProperties: plan.optInKeyframeProperties || [],
    supportedInterruptPolicies: plan.supportedInterruptPolicies || [],
    supportedReducedMotionPolicies: plan.supportedReducedMotionPolicies || [],
    defaultEffect: plan.defaultEffect || 'fade',
    defaultReducedMotion: plan.defaultReducedMotion || 'fade',
    animations: (plan.animations || []).map((animation) => ({
      id: animation.id,
      name: animation.name,
      preset: animation.preset,
      effect: animation.effect,
      durationMs: animation.durationMs,
      easing: animation.easing,
      spring: animation.spring,
      keyframes: animation.keyframes,
      springSamples: animation.springSamples,
      timeline: animation.timeline,
      reducedMotion: animation.reducedMotion,
      allowFilter: animation.allowFilter === true
    })),
    transitions: (plan.transitions || []).map((transition) => ({
      id: transition.id,
      name: transition.name,
      trigger: transition.trigger,
      from: transition.from,
      to: transition.to,
      animation: transition.animation,
      effect: transition.effect,
      durationMs: transition.durationMs,
      easing: transition.easing,
      lane: transition.lane,
      layoutKey: transition.layoutKey,
      interrupt: transition.interrupt,
      reducedMotion: transition.reducedMotion,
      timeline: transition.timeline,
      phasing: transition.phasing,
      keyframes: transition.keyframes,
      spring: transition.spring,
      springSamples: transition.springSamples
    }))
  };
}

function buildDocsAnimationEngineDemo(options = {}) {
  const rootDir = path.resolve(options.rootDir || ROOT_DIR);
  const sourcePath = path.join(rootDir, SOURCE_PATH);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const compiled = compileRmtVNextSource({
    text: source,
    filePath: SOURCE_PATH
  });
  const diagnostics = blockingDiagnostics(compiled);
  if (compiled.ok !== true || diagnostics.length) {
    throw new Error(`AnimationEngine demo source did not compile cleanly: ${JSON.stringify(diagnostics, null, 2)}`);
  }

  const orchestration = compiled.orchestrationArtifacts || {};
  const compiledAnimationPlan = orchestration.animationEngine || {};
  const hydrationPlan = orchestration.hydration || {};
  if (compiledAnimationPlan.schema !== 'xtend.rmt.animation-engine.v1') {
    throw new Error('AnimationEngine demo compile did not emit xtend.rmt.animation-engine.v1.');
  }

  const effects = Array.from(new Set((compiledAnimationPlan.animations || []).map((animation) => animation.effect)));
  const missingEffects = EXPECTED_EFFECTS.filter((effect) => !effects.includes(effect));
  if (missingEffects.length) {
    throw new Error(`AnimationEngine demo is missing effects: ${missingEffects.join(', ')}`);
  }

  const hydrationRecords = Array.isArray(hydrationPlan.records) ? hydrationPlan.records : [];
  if (!hydrationRecords.length || hydrationRecords.some((record) => record.insularHydration !== true || record.lane !== 'idle')) {
    throw new Error('AnimationEngine demo hydration records must stay insular on the idle lane.');
  }
  const animationPlan = createRuntimeAnimationPlan(compiledAnimationPlan);

  const artifact = {
    schema: DEMO_SCHEMA,
    source: SOURCE_PATH,
    sourceFingerprint: sha256(source),
    planSchema: animationPlan.schema,
    planFingerprint: sha256(serialize(animationPlan)),
    animationPlan,
    hydration: {
      schema: hydrationPlan.schema || null,
      records: hydrationRecords.map((record) => ({
        id: record.id,
        surface: record.surface,
        component: record.component,
        lane: record.lane,
        policy: record.policy,
        mode: record.mode,
        insularHydration: record.insularHydration === true
      }))
    },
    controls: {
      effects: EXPECTED_EFFECTS.slice(),
      durations: DURATIONS.slice(),
      easings: EASINGS.slice(),
      reducedMotionPreviews: REDUCED_MOTION_PREVIEWS.slice(),
      defaults: {
        effect: 'crossfade',
        durationMs: 280,
        easing: 'cubic-bezier(.2,.8,.2,1)',
        reducedMotionPreview: 'system',
        interrupt: 'replace',
        layoutKey: 'docs-animation-article',
        lane: 'transition'
      }
    }
  };

  return {
    artifact,
    outputPath: path.join(rootDir, OUTPUT_PATH),
    serialized: serialize(artifact)
  };
}

function run(argv = process.argv.slice(2)) {
  const options = {
    write: argv.includes('--write'),
    check: argv.includes('--check') || !argv.includes('--write')
  };
  const result = buildDocsAnimationEngineDemo();

  if (options.write) {
    fs.mkdirSync(path.dirname(result.outputPath), { recursive: true });
    fs.writeFileSync(result.outputPath, result.serialized, 'utf8');
    process.stdout.write(`Wrote ${OUTPUT_PATH}\n`);
  }

  if (options.check) {
    const current = fs.existsSync(result.outputPath) ? fs.readFileSync(result.outputPath, 'utf8') : '';
    if (current !== result.serialized) {
      process.stderr.write(`${OUTPUT_PATH} is missing or stale. Run node scripts/build_docs_animation_engine_demo.js --write.\n`);
      return 1;
    }
    process.stdout.write(`AnimationEngine docs artifact is current (${result.artifact.planFingerprint}).\n`);
  }

  return 0;
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = {
  DEMO_SCHEMA,
  DURATIONS,
  EASINGS,
  EXPECTED_EFFECTS,
  OUTPUT_PATH,
  REDUCED_MOTION_PREVIEWS,
  SOURCE_PATH,
  buildDocsAnimationEngineDemo,
  createRuntimeAnimationPlan,
  serialize
};
