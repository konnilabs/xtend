/* modules/rmt-template-trust-model.js */
(function registerRmtTemplateTrustModelModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const TRUSTED_DOM_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';
    const TRUSTED_DOM_SANITIZER_SCHEMA = 'xtend.security.trusted-dom-sanitizer.v1';

    function decodeAttributeValue(value) {
        return String(value || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);?/gi, (match, entity) => {
            const normalizedEntity = String(entity || '').toLowerCase();
            if (normalizedEntity[0] === '#') {
                const radix = normalizedEntity[1] === 'x' ? 16 : 10;
                const digits = radix === 16 ? normalizedEntity.slice(2) : normalizedEntity.slice(1);
                const codePoint = parseInt(digits, radix);
                if (Number.isFinite(codePoint)) {
                    try {
                        return String.fromCodePoint(codePoint);
                    } catch (_error) {
                        return match;
                    }
                }
                return match;
            }
            return ({
                amp: '&',
                apos: "'",
                colon: ':',
                gt: '>',
                lt: '<',
                newline: '\n',
                quot: '"',
                tab: '\t'
            })[normalizedEntity] || match;
        });
    }

    function isAllowedUrl(value) {
        const normalized = decodeAttributeValue(value)
            .trim()
            .replace(/[\u0000-\u001F\u007F\s]+/g, '')
            .toLowerCase();
        if (!normalized) return true;
        if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) {
            return true;
        }
        if (normalized.startsWith('data:')) return normalized.startsWith('data:image/');
        return !(
            normalized.startsWith('javascript:')
            || normalized.startsWith('data:text/html')
            || normalized.startsWith('data:text/javascript')
            || normalized.startsWith('data:application/javascript')
            || normalized.startsWith('data:application/ecmascript')
            || normalized.startsWith('vbscript:')
        );
    }

    appModules.createRmtTemplateTrustModel = function createRmtTemplateTrustModel(deps = {}) {
        const sanitizeHtml = typeof deps.sanitizeHtml === 'function' ? deps.sanitizeHtml
            : (() => ({ok: false, html: '', removed: [], removedCount: 0}));
        return Object.freeze({
            kind: 'rmt_template_trust_model',
            version: '1.0',
            boundary: TRUSTED_DOM_BOUNDARY,
            sanitizerSchema: TRUSTED_DOM_SANITIZER_SCHEMA,
            isAllowedUrl,
            sanitizeHtml
        });
    };
})(__XTENDRMT_GLOBAL__);
