export const TARGET_MODEL_ID = 'onnx-community/Qwen3-8B-ONNX';
export const DTYPE_PREFERENCE = Object.freeze(['q4f16', 'q4', 'q8', 'fp16', 'fp32']);
export const DEFAULT_REMOTE_PATH_TEMPLATE = '/hf/{model}/resolve/{revision}/';
export const QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER = 'onnxruntime/webgpu/webgpu-int4-kld-block-32';
export const BROWSER_EXTERNAL_DATA_ARRAY_BUFFER_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;

export const DTYPE_FILE_NAMES = Object.freeze({
  q4f16: 'model_q4f16.onnx',
  q4: 'model_q4.onnx',
  q8: 'model_quantized.onnx',
  fp16: 'model_fp16.onnx',
  fp32: 'model.onnx'
});

const QWEN3_WEBGPU_REQUIRED_FILES = Object.freeze([
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'model.onnx',
  'model.onnx.data'
]);

export function choosePreferredDtype(available = DTYPE_PREFERENCE) {
  const set = new Set((available || []).map((entry) => String(entry).trim()).filter(Boolean));
  return DTYPE_PREFERENCE.find((dtype) => set.has(dtype)) || 'fp32';
}

export function normalizeTreePaths(input = []) {
  const entries = Array.isArray(input)
    ? input
    : Array.isArray(input.siblings)
      ? input.siblings
      : [];
  return new Set(entries
    .map((entry) => entry && (entry.path || entry.rfilename))
    .filter(Boolean)
    .map((entry) => String(entry).replace(/^\/+/u, '')));
}

function normalizeTreeEntries(input = []) {
  return Array.isArray(input)
    ? input
    : Array.isArray(input.siblings)
      ? input.siblings
      : [];
}

function treeEntryPath(entry) {
  return entry && (entry.path || entry.rfilename)
    ? String(entry.path || entry.rfilename).replace(/^\/+/u, '')
    : '';
}

function treeEntrySize(entry) {
  const direct = Number(entry && entry.size);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const lfs = Number(entry && entry.lfs && entry.lfs.size);
  if (Number.isFinite(lfs) && lfs >= 0) return lfs;
  return 0;
}

function findTreeEntrySize(input, filePath) {
  const entry = normalizeTreeEntries(input).find((item) => treeEntryPath(item) === filePath);
  return entry ? treeEntrySize(entry) : 0;
}

function standardTransformersDtypes(paths) {
  return DTYPE_PREFERENCE.filter((dtype) => paths.has(`onnx/${DTYPE_FILE_NAMES[dtype]}`));
}

function hasQwen3WebGpuRuntimeLayout(paths) {
  return QWEN3_WEBGPU_REQUIRED_FILES.every((fileName) => {
    return paths.has(`${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/${fileName}`);
  });
}

export function createQwen3WebGpuRuntimePlan(modelId = TARGET_MODEL_ID, externalDataSize = 0) {
  return {
    kind: 'onnxruntime-webgpu-layout',
    modelId,
    externalDataSize,
    remotePathTemplate: `${DEFAULT_REMOTE_PATH_TEMPLATE}${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/`,
    availableDtypes: ['int4-webgpu-block-32'],
    selectedDtype: 'int4-webgpu-block-32',
    pipelineOptions: {
      subfolder: '',
      model_file_name: 'model',
      dtype: 'fp32',
      use_external_data_format: false,
      session_options: {
        externalData: [
          {
            path: 'model.onnx.data',
            data: 'model.onnx.data'
          }
        ]
      }
    }
  };
}

export function createModelLoadPlan(modelId, treeEntries = []) {
  const paths = normalizeTreePaths(treeEntries);
  const dtypes = standardTransformersDtypes(paths);
  if (dtypes.length > 0) {
    const selectedDtype = choosePreferredDtype(dtypes);
    return {
      kind: 'transformers-js-layout',
      modelId,
      remotePathTemplate: DEFAULT_REMOTE_PATH_TEMPLATE,
      availableDtypes: dtypes,
      selectedDtype,
      pipelineOptions: {
        subfolder: 'onnx',
        dtype: selectedDtype
      }
    };
  }

  if (modelId === TARGET_MODEL_ID && hasQwen3WebGpuRuntimeLayout(paths)) {
    const externalDataPath = `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/model.onnx.data`;
    const externalDataSize = findTreeEntrySize(treeEntries, externalDataPath);
    if (externalDataSize > BROWSER_EXTERNAL_DATA_ARRAY_BUFFER_LIMIT_BYTES) {
      return {
        kind: 'unsupported-layout',
        modelId,
        remotePathTemplate: `${DEFAULT_REMOTE_PATH_TEMPLATE}${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/`,
        availableDtypes: ['int4-webgpu-block-32'],
        selectedDtype: 'int4-webgpu-block-32',
        externalDataSize,
        reason: [
          `The Qwen3 WebGPU external data file is ${externalDataSize} bytes.`,
          `Transformers.js currently fetches session_options.externalData through the browser ArrayBuffer path before ONNX Runtime sees it.`,
          `This exceeds the configured browser-safe external data limit of ${BROWSER_EXTERNAL_DATA_ARRAY_BUFFER_LIMIT_BYTES} bytes and fails with "Array buffer allocation failed".`,
          'Use npm run test:llm for the answer-smoke model, or update the target model/profile to chunked Transformers.js assets.'
        ].join(' ')
      };
    }
    return createQwen3WebGpuRuntimePlan(modelId, externalDataSize);
  }

  return {
    kind: 'unsupported-layout',
    modelId,
    remotePathTemplate: DEFAULT_REMOTE_PATH_TEMPLATE,
    availableDtypes: [],
    selectedDtype: '',
    pipelineOptions: {},
    reason: [
      'No Transformers.js ONNX assets were found under onnx/model*.onnx.',
      modelId === TARGET_MODEL_ID
        ? `The expected ONNX Runtime WebGPU profile ${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/model.onnx was also not complete.`
        : 'No product-specific compatibility profile exists for this model.'
    ].join(' ')
  };
}

export function formatUnsupportedModelReport(plan) {
  return [
    `Model ${plan.modelId} is not loadable by the XTend Transformers.js runtime.`,
    plan.reason || 'Unsupported model layout.',
    'Expected either onnx/model_q4f16.onnx, onnx/model_q4.onnx, onnx/model_quantized.onnx, onnx/model_fp16.onnx, onnx/model.onnx, or the product Qwen3 WebGPU ONNX Runtime layout.'
  ].join(' ');
}
