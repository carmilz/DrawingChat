(() => {
    'use strict';

    /*
     * Unicodeify 확장 스크립트
     * - `\uXXXX`, `\UXXXXXX` 형태 텍스트 디코딩
     * - 선택된 텍스트의 코드포인트 목록 생성
     * - 오버레이 비주얼라이저(툴팁) 생성/관리
     */

    // 디코딩/표시 동작에 필요한 전역 상수
    const HEX_DIGIT_REGEX = /^[0-9A-Fa-f]$/;
    const MAX_UNICODE_CODE_POINT = 0x10FFFF;
    const DEFAULT_VISUALISER_MAX_ENTRIES = 64;
    const VISUALISER_STYLE_ID = 'unicodeify-visualiser-style';
    const VISUALISER_CLASS_NAME = 'unicodeify-visualiser';
    const VISUALISER_HIDDEN_CLASS_NAME = 'is-hidden';
    const TEXT_INPUT_TYPE_SET = new Set([
        'text',
        'search',
        'url',
        'tel',
        'password',
        'email'
    ]);

    function isHexDigit(char) {
        return HEX_DIGIT_REGEX.test(char);
    }

    // 사용자가 입력한 문자열에서 유니코드 이스케이프를 실제 문자로 변환합니다.
    // 단, `\\uXXXX`는 "리터럴 이스케이프"로 간주해 보존합니다.
    function decodeUnicodeEscapes(rawText) {
        if (typeof rawText !== 'string' || !rawText) return '';

        let output = '';
        let index = 0;
        const { length } = rawText;

        while (index < length) {
            const currentChar = rawText[index];

            if (currentChar !== '\\') {
                output += currentChar;
                index += 1;
                continue;
            }

            const nextChar = rawText[index + 1];
            if (!nextChar) {
                output += currentChar;
                index += 1;
                continue;
            }

            if (nextChar === '\\') {
                const escapedMarker = rawText[index + 2];
                const escapedMarkerNext = rawText[index + 3];
                const isEscapedUnicodeMarker = (escapedMarker === 'u' || escapedMarker === 'U')
                    && isHexDigit(escapedMarkerNext ?? '');

                // `\\uXXXX` -> `\uXXXX` (리터럴 유지), 그 외 `\\`는 보존한다.
                if (isEscapedUnicodeMarker) {
                    output += '\\';
                    output += escapedMarker;

                    let cursor = index + 3;
                    let hex = '';
                    while (cursor < length && hex.length < 6 && isHexDigit(rawText[cursor])) {
                        hex += rawText[cursor];
                        cursor += 1;
                    }

                    output += hex;
                    index = cursor;
                    continue;
                }

                output += '\\\\';
                index += 2;
                continue;
            }

            if (nextChar !== 'u' && nextChar !== 'U') {
                output += currentChar;
                index += 1;
                continue;
            }

            let cursor = index + 2;
            let hex = '';
            while (cursor < length && hex.length < 6 && isHexDigit(rawText[cursor])) {
                hex += rawText[cursor];
                cursor += 1;
            }

            if (!hex) {
                output += currentChar;
                index += 1;
                continue;
            }

            const codePoint = Number.parseInt(hex, 16);
            if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > MAX_UNICODE_CODE_POINT) {
                output += currentChar;
                index += 1;
                continue;
            }

            try {
                output += String.fromCodePoint(codePoint);
                index = cursor;
            } catch (error) {
                output += currentChar;
                index += 1;
            }
        }

        return output;
    }

    function formatCodePoint(codePoint) {
        if (!Number.isInteger(codePoint) || codePoint < 0) return 'U+????';
        const hex = codePoint.toString(16).toUpperCase();
        const minWidth = codePoint <= 0xFFFF ? 4 : 5;
        return `U+${hex.padStart(minWidth, '0')}`;
    }

    function getDisplayLabelForChar(char) {
        switch (char) {
            case ' ':
                return 'SPACE';
            case '\n':
                return 'LF';
            case '\r':
                return 'CR';
            case '\t':
                return 'TAB';
            default:
                break;
        }

        if (/[\u0000-\u001F\u007F-\u009F]/.test(char)) {
            return 'CTRL';
        }

        return char;
    }

    // 문자열을 코드포인트 단위로 분해해 UI 표시용 메타데이터를 만듭니다.
    function getCodePointEntries(text, { maxEntries = Number.POSITIVE_INFINITY } = {}) {
        if (typeof text !== 'string' || !text) {
            return {
                entries: [],
                totalCount: 0,
                isTruncated: false
            };
        }

        const safeMaxEntries = Number.isFinite(maxEntries)
            ? Math.max(0, Math.floor(maxEntries))
            : Number.POSITIVE_INFINITY;

        const entries = [];
        let totalCount = 0;

        for (const char of text) {
            const codePoint = char.codePointAt(0);
            if (!Number.isInteger(codePoint)) continue;

            totalCount += 1;
            if (entries.length >= safeMaxEntries) {
                continue;
            }

            entries.push({
                char,
                label: getDisplayLabelForChar(char),
                codePoint,
                code: formatCodePoint(codePoint)
            });
        }

        return {
            entries,
            totalCount,
            isTruncated: totalCount > entries.length
        };
    }

    function formatSelectionText(text, { maxEntries = DEFAULT_VISUALISER_MAX_ENTRIES } = {}) {
        const { entries, totalCount, isTruncated } = getCodePointEntries(text, { maxEntries });
        if (!entries.length) return '';

        const parts = entries.map((entry) => `${entry.label} \u2192 ${entry.code}`);
        if (isTruncated) {
            parts.push(`… (${totalCount}개 중 ${entries.length}개 표시)`);
        }

        return parts.join(' | ');
    }

    function formatSelectionTextFromCodePointInfo(codePointInfo) {
        const entries = Array.isArray(codePointInfo?.entries) ? codePointInfo.entries : [];
        if (!entries.length) return '';

        const parts = entries.map((entry) => `${entry.label} \u2192 ${entry.code}`);
        if (codePointInfo?.isTruncated) {
            parts.push(`… (${codePointInfo.totalCount}개 중 ${entries.length}개 표시)`);
        }

        return parts.join(' | ');
    }

    function isTextControlElement(el) {
        if (typeof HTMLTextAreaElement !== 'undefined' && el instanceof HTMLTextAreaElement) {
            return true;
        }

        if (typeof HTMLInputElement === 'undefined' || !(el instanceof HTMLInputElement)) {
            return false;
        }

        const type = String(el.type || 'text').toLowerCase();
        return TEXT_INPUT_TYPE_SET.has(type);
    }

    // textarea/input 선택 영역은 document.getSelection()으로 잡히지 않을 수 있어 별도 처리합니다.
    function readTextControlSelection(doc) {
        if (!doc || typeof doc !== 'object') return null;

        const activeEl = doc.activeElement;
        if (!isTextControlElement(activeEl)) return null;

        const start = Number(activeEl.selectionStart);
        const end = Number(activeEl.selectionEnd);
        if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) {
            return null;
        }

        const value = typeof activeEl.value === 'string' ? activeEl.value : '';
        const selectedText = value.slice(start, end);
        if (!selectedText) return null;

        return {
            text: selectedText,
            kind: 'text-control',
            anchorRect: null
        };
    }

    // DOMRect/유사 객체를 안전한 plain object로 정규화합니다.
    function normaliseRectLike(rect) {
        if (!rect) return null;

        const x = Number(rect.x);
        const y = Number(rect.y);
        const left = Number(rect.left);
        const top = Number(rect.top);
        const width = Number(rect.width);
        const height = Number(rect.height);
        const right = Number(rect.right);
        const bottom = Number(rect.bottom);

        const hasFiniteRect = [left, top, width, height].every(Number.isFinite)
            || [x, y, width, height].every(Number.isFinite);
        if (!hasFiniteRect) return null;

        const resolvedLeft = Number.isFinite(left) ? left : x;
        const resolvedTop = Number.isFinite(top) ? top : y;
        const resolvedWidth = Number.isFinite(width) ? width : 0;
        const resolvedHeight = Number.isFinite(height) ? height : 0;

        return {
            left: resolvedLeft,
            top: resolvedTop,
            width: resolvedWidth,
            height: resolvedHeight,
            right: Number.isFinite(right) ? right : (resolvedLeft + resolvedWidth),
            bottom: Number.isFinite(bottom) ? bottom : (resolvedTop + resolvedHeight)
        };
    }

    function getSelectionAnchorRect(selection) {
        if (!selection || typeof selection.rangeCount !== 'number' || selection.rangeCount < 1) {
            return null;
        }

        let range = null;
        try {
            range = selection.getRangeAt(0);
        } catch (error) {
            return null;
        }

        if (!range) return null;

        let rect = null;
        if (typeof range.getBoundingClientRect === 'function') {
            rect = normaliseRectLike(range.getBoundingClientRect());
        }

        if (rect && (rect.width > 0 || rect.height > 0)) {
            return rect;
        }

        if (typeof range.getClientRects !== 'function') {
            return rect;
        }

        const rectList = range.getClientRects();
        if (!rectList || typeof rectList.length !== 'number' || rectList.length < 1) {
            return rect;
        }

        return normaliseRectLike(rectList[0]) ?? rect;
    }

    // 일반 문서 선택 영역(본문 텍스트 드래그)을 읽습니다.
    function readDocumentSelection(doc) {
        if (!doc || typeof doc.getSelection !== 'function') return null;

        const selection = doc.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount < 1) {
            return null;
        }

        const text = String(selection.toString() ?? '');
        if (!text) return null;

        return {
            text,
            kind: 'document',
            anchorRect: getSelectionAnchorRect(selection)
        };
    }

    // 입력 컨트롤 선택과 일반 문서 선택 중 하나를 골라 통합 정보로 반환합니다.
    function getSelectionInfo(doc, { maxEntries = DEFAULT_VISUALISER_MAX_ENTRIES } = {}) {
        const textControlSelection = readTextControlSelection(doc);
        const documentSelection = readDocumentSelection(doc);
        const selected = textControlSelection ?? documentSelection;
        if (!selected) return null;

        const codePointInfo = getCodePointEntries(selected.text, { maxEntries });
        if (!codePointInfo.entries.length) return null;

        return {
            ...selected,
            ...codePointInfo,
            message: formatSelectionTextFromCodePointInfo(codePointInfo)
        };
    }

    // 비주얼라이저 스타일은 1회만 주입합니다.
    function ensureVisualiserStyle(doc) {
        if (!doc || !doc.head) return;
        if (doc.getElementById(VISUALISER_STYLE_ID)) return;

        const styleEl = doc.createElement('style');
        styleEl.id = VISUALISER_STYLE_ID;
        styleEl.textContent = `
.${VISUALISER_CLASS_NAME} {
    position: fixed;
    z-index: 2147483647;
    max-width: min(42rem, calc(100vw - 16px));
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(12, 14, 18, 0.94);
    color: #F4F7FB;
    font: 500 12px/1.4 "Consolas", "Cascadia Mono", "SFMono-Regular", monospace;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    white-space: pre-wrap;
    word-break: break-word;
}
.${VISUALISER_CLASS_NAME}.${VISUALISER_HIDDEN_CLASS_NAME} {
    display: none;
}
`;
        doc.head.appendChild(styleEl);
    }

    function createTooltipElement(doc) {
        if (!doc) return null;
        ensureVisualiserStyle(doc);

        const tooltipEl = doc.createElement('div');
        tooltipEl.className = `${VISUALISER_CLASS_NAME} ${VISUALISER_HIDDEN_CLASS_NAME}`;
        tooltipEl.setAttribute('aria-live', 'polite');
        tooltipEl.setAttribute('role', 'status');
        return tooltipEl;
    }

    function ensureTooltipMounted(doc, tooltipEl) {
        if (!doc || !tooltipEl) return false;

        if (tooltipEl.isConnected) return true;
        if (!doc.body) return false;

        doc.body.appendChild(tooltipEl);
        return true;
    }

    function hideTooltip(tooltipEl) {
        if (!tooltipEl) return;
        tooltipEl.classList.add(VISUALISER_HIDDEN_CLASS_NAME);
        tooltipEl.textContent = '';
    }

    function clamp(value, min, max) {
        if (!Number.isFinite(value)) return min;
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    // 선택 영역 주변에 툴팁을 배치하되, 뷰포트 밖으로 나가지 않도록 보정합니다.
    function positionTooltip(doc, tooltipEl, anchorRect) {
        if (!doc || !tooltipEl) return;

        const win = doc.defaultView;
        const viewportWidth = Number(win?.innerWidth) || 1024;
        const viewportHeight = Number(win?.innerHeight) || 768;
        const margin = 8;

        if (!anchorRect) {
            tooltipEl.style.left = `${viewportWidth - margin}px`;
            tooltipEl.style.top = `${viewportHeight - margin}px`;
            tooltipEl.style.transform = 'translate(-100%, -100%)';
            return;
        }

        tooltipEl.style.left = `${Math.round(anchorRect.left)}px`;
        tooltipEl.style.top = `${Math.round(anchorRect.bottom + 8)}px`;
        tooltipEl.style.transform = 'none';

        const measuredRect = tooltipEl.getBoundingClientRect();
        const nextLeft = clamp(
            anchorRect.left,
            margin,
            Math.max(margin, viewportWidth - measuredRect.width - margin)
        );

        let nextTop = anchorRect.bottom + 8;
        if (Number.isFinite(measuredRect.height) && (nextTop + measuredRect.height + margin) > viewportHeight) {
            nextTop = anchorRect.top - measuredRect.height - 8;
        }

        nextTop = clamp(nextTop, margin, Math.max(margin, viewportHeight - measuredRect.height - margin));

        tooltipEl.style.left = `${Math.round(nextLeft)}px`;
        tooltipEl.style.top = `${Math.round(nextTop)}px`;
    }

    // 선택 변화 이벤트를 구독하고 오버레이 갱신을 담당하는 컨트롤러를 생성합니다.
    function createVisualiser(options = {}) {
        const doc = options.document ?? (typeof document !== 'undefined' ? document : null);
        const maxEntries = Number.isFinite(options.maxEntries)
            ? Math.max(1, Math.floor(options.maxEntries))
            : DEFAULT_VISUALISER_MAX_ENTRIES;
        const showOverlay = options.showOverlay !== false;
        const onUpdate = typeof options.onUpdate === 'function' ? options.onUpdate : null;

        if (!doc || typeof doc.addEventListener !== 'function') {
            return Object.freeze({
                setEnabled() {},
                isEnabled() {
                    return false;
                },
                refresh() {
                    return null;
                },
                destroy() {}
            });
        }

        const tooltipEl = showOverlay ? createTooltipElement(doc) : null;
        let enabled = options.enabled === true;
        let isDestroyed = false;

        function emit(info) {
            if (!onUpdate) return;
            try {
                onUpdate(info);
            } catch (error) {
                // 콜백 에러가 비주얼라이저 동작을 깨뜨리지 않도록 격리
                console.warn('[Unicodeify] Unicode visualiser callback failed.', error);
            }
        }

        function renderOverlay(info) {
            if (!showOverlay || !tooltipEl) return;
            if (!info?.message) {
                hideTooltip(tooltipEl);
                return;
            }

            if (!ensureTooltipMounted(doc, tooltipEl)) return;
            tooltipEl.textContent = info.message;
            tooltipEl.classList.remove(VISUALISER_HIDDEN_CLASS_NAME);
            positionTooltip(doc, tooltipEl, info.anchorRect);
        }

        // 현재 선택 상태를 다시 읽어 콜백/오버레이를 동기화합니다.
        function refresh() {
            if (isDestroyed || !enabled) {
                renderOverlay(null);
                emit(null);
                return null;
            }

            const info = getSelectionInfo(doc, { maxEntries });
            if (!info) {
                renderOverlay(null);
                emit(null);
                return null;
            }

            renderOverlay(info);
            emit(info);
            return info;
        }

        function handleSelectionLikeChange() {
            if (isDestroyed) return;
            refresh();
        }

        function handleScrollOrResize() {
            if (isDestroyed || !enabled) return;
            if (tooltipEl?.classList.contains(VISUALISER_HIDDEN_CLASS_NAME)) return;
            refresh();
        }

        doc.addEventListener('selectionchange', handleSelectionLikeChange);
        doc.addEventListener('select', handleSelectionLikeChange, true);
        doc.addEventListener('pointerup', handleSelectionLikeChange, true);
        doc.addEventListener('keyup', handleSelectionLikeChange, true);
        doc.defaultView?.addEventListener('resize', handleScrollOrResize);
        doc.defaultView?.addEventListener('scroll', handleScrollOrResize, true);

        if (enabled) {
            refresh();
        } else {
            hideTooltip(tooltipEl);
        }

        function setEnabled(nextEnabled) {
            if (isDestroyed) return false;
            enabled = Boolean(nextEnabled);
            if (!enabled) {
                renderOverlay(null);
                emit(null);
                return true;
            }
            refresh();
            return true;
        }

        function destroy() {
            if (isDestroyed) return;
            isDestroyed = true;
            doc.removeEventListener('selectionchange', handleSelectionLikeChange);
            doc.removeEventListener('select', handleSelectionLikeChange, true);
            doc.removeEventListener('pointerup', handleSelectionLikeChange, true);
            doc.removeEventListener('keyup', handleSelectionLikeChange, true);
            doc.defaultView?.removeEventListener('resize', handleScrollOrResize);
            doc.defaultView?.removeEventListener('scroll', handleScrollOrResize, true);
            if (tooltipEl?.isConnected) {
                tooltipEl.remove();
            }
        }

        return Object.freeze({
            setEnabled,
            isEnabled() {
                return enabled;
            },
            refresh,
            destroy
        });
    }

    // 전역에서 재사용할 수 있도록 작은 API 표면만 노출합니다.
    const unicodeifyApi = Object.freeze({
        decode: decodeUnicodeEscapes,
        decodeUnicodeEscapes,
        formatCodePoint,
        getCodePointEntries,
        formatSelectionText,
        getSelectionInfo,
        createVisualiser
    });

    globalThis.Unicodeify = unicodeifyApi;
})();
