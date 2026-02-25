(() => {
    'use strict';

    /*
     * 단일 파일 UI 오케스트레이터입니다.
     * 상수/DOM 캐시/상태를 먼저 정의한 뒤, 공통 유틸리티와
     * 도메인별(Chat/Board/Map/Info) 로직, 라우팅/이벤트/초기화를 순서대로 배치합니다.
     */

    // DOM id/액션 키를 중앙집중식으로 관리해 문자열 중복을 줄입니다.
    const DOM_ID = Object.freeze({
        root: 'main-layout',
        view: {
            chat: 'view-chat',
            board: 'view-board',
            map: 'view-map',
            info: 'view-info',
            postDetail: 'view-post-detail'
        },
        nav: {
            chat: 'nav-chat',
            board: 'nav-board',
            map: 'nav-map',
            info: 'nav-info'
        },
        chat: {
            scrollArea: 'chat-scroll-area',
            container: 'chat-container',
            form: 'chat-form',
            input: 'chat-input',
            jumpLatestButton: 'chat-jump-latest-btn'
        },
        board: {
            list: 'board-list',
            createForm: 'board-create-form',
            createTitleInput: 'board-create-title',
            createContentInput: 'board-create-content',
            createCancelButton: 'board-create-cancel-btn',
            detailTitle: 'post-detail-title',
            detailAuthor: 'post-detail-author',
            detailDate: 'post-detail-date',
            detailContent: 'post-detail-content',
            detailReadonly: 'post-detail-readonly',
            detailCopyButton: 'post-detail-copy-btn',
            detailEditButton: 'post-detail-edit-btn',
            detailDeleteButton: 'post-detail-delete-btn',
            editForm: 'post-edit-form',
            editTitleInput: 'post-edit-title',
            editContentInput: 'post-edit-content',
            editCancelButton: 'post-edit-cancel-btn',
            commentsCount: 'post-comments-count',
            commentsList: 'post-comments-list',
            commentForm: 'post-comment-form',
            commentInput: 'post-comment-input'
        },
        map: {
            stage: 'map-stage',
            currentTitle: 'map-current-title',
            currentIndex: 'map-current-index',
            totalCount: 'map-total-count'
        },
        lobby: {
            layout: 'lobby-layout',
            form: 'login-form',
            nicknameInput: 'lobby-nickname',
            error: 'login-error'
        },
        appSettings: {
            root: 'app-settings',
            launcher: 'app-settings-launcher',
            panel: 'app-settings-panel'
        },
        sendKeymapSetting: {
            select: 'send-keymap-select'
        },
        chatAutoScrollSetting: {
            select: 'chat-auto-scroll-select'
        },
        instantDeleteSetting: {
            toggle: 'instant-delete-toggle'
        },
        unicodeVisualiserSetting: {
            toggle: 'unicode-visualiser-toggle'
        },
        twemojiDisabledSetting: {
            toggle: 'twemoji-disabled-toggle'
        },
        info: {
            scrollTrack: 'app-info-scroll-track',
            aboutPage: 'app-info-page-about',
            helpPage: 'app-info-page-help'
        },
        licenseModal: {
            root: 'license-modal',
            closeButton: 'license-modal-close-btn'
        },
        changelogModal: {
            root: 'changelog-modal',
            closeButton: 'changelog-modal-close-btn'
        },
        logoutConfirmModal: {
            root: 'logout-confirm-modal',
            cancelButton: 'logout-confirm-cancel-btn',
            submitButton: 'logout-confirm-submit-btn'
        },
        toast: {
            root: 'app-toast'
        }
    });

    const VIEW_KEY = Object.freeze({
        chat: 'chat',
        board: 'board',
        map: 'map',
        help: 'help',
        info: 'info',
        postDetail: 'post-detail'
    });

    const ACTION_KEY = Object.freeze({
        navigate: 'navigate',
        viewPost: 'view-post',
        logout: 'logout',
        copyChatOriginal: 'copy-chat-original',
        editChat: 'edit-chat',
        deleteChat: 'delete-chat',
        saveChatEdit: 'save-chat-edit',
        cancelChatEdit: 'cancel-chat-edit',
        createPost: 'create-post',
        copyPostOriginal: 'copy-post-original',
        editPost: 'edit-post',
        deletePost: 'delete-post',
        replyComment: 'reply-comment',
        cancelReply: 'cancel-reply',
        saveCommentReply: 'save-comment-reply',
        copyCommentOriginal: 'copy-comment-original',
        editComment: 'edit-comment',
        deleteComment: 'delete-comment',
        saveCommentEdit: 'save-comment-edit',
        cancelCommentEdit: 'cancel-comment-edit',
        toggleSettingsPanel: 'toggle-settings-panel',
        closeSettingsPanel: 'close-settings-panel',
        toggleInstantDeleteMode: 'toggle-instant-delete-mode',
        toggleUnicodeVisualiserMode: 'toggle-unicode-visualiser-mode',
        toggleTwemojiDisabledMode: 'toggle-twemoji-disabled-mode',
        openLicenseModal: 'open-license-modal',
        closeLicenseModal: 'close-license-modal',
        openChangelogModal: 'open-changelog-modal',
        closeChangelogModal: 'close-changelog-modal',
        closeLogoutConfirmModal: 'close-logout-confirm-modal',
        confirmLogout: 'confirm-logout'
    });

    // localStorage 키, 입력 제한값, 제스처 임계값 등 전역 설정 상수입니다.
    const SESSION_STORAGE_KEY = 'drawingchat.session.v1';
    const CHAT_STORAGE_KEY = 'drawingchat.chat.messages.v1';
    const BOARD_STORAGE_KEY = 'drawingchat.board.posts.v1';
    const BOARD_COMMENT_STORAGE_KEY = 'drawingchat.board.comments.v1';
    const SEND_KEYMAP_STORAGE_KEY = 'drawingchat.settings.send-keymap.v1';
    const LEGACY_ENTER_NEWLINE_MODE_STORAGE_KEY = 'drawingchat.settings.enter-newline.v1';
    const CHAT_AUTO_SCROLL_MODE_STORAGE_KEY = 'drawingchat.settings.chat-auto-scroll.v1';
    const INSTANT_DELETE_MODE_STORAGE_KEY = 'drawingchat.settings.instant-delete.v1';
    const UNICODE_VISUALISER_MODE_STORAGE_KEY = 'drawingchat.settings.unicode-visualiser.v1';
    const TWEMOJI_DISABLED_MODE_STORAGE_KEY = 'drawingchat.settings.twemoji-disabled.v1';
    const SEND_KEYMAP = Object.freeze({
        enter: 'enter',
        ctrlEnter: 'ctrl-enter',
        metaEnter: 'meta-enter'
    });
    const SEND_KEYMAP_SET = new Set(Object.values(SEND_KEYMAP));
    const CHAT_AUTO_SCROLL_MODE = Object.freeze({
        always: 'always',
        nearBottom: 'near-bottom',
        off: 'off'
    });
    const CHAT_AUTO_SCROLL_MODE_SET = new Set(Object.values(CHAT_AUTO_SCROLL_MODE));
    const USER_NAME_SELECTOR = '[data-user-name]';
    const USER_INITIAL_SELECTOR = '[data-user-initial]';
    const NICKNAME_MAX_LENGTH = 24;
    const CHAT_MESSAGE_MAX_LENGTH = 1000;
    const CHAT_AUTO_SCROLL_THRESHOLD_PX = 48;
    const BOARD_COMMENT_MAX_LENGTH = 1000;
    const POST_TITLE_MAX_LENGTH = 120;
    const POST_CONTENT_MAX_LENGTH = 10000;
    const TEXTAREA_AUTO_RESIZE_MAX_HEIGHT_PX = 160;
    const MAP_WHEEL_NAV_LOCK_MS = 360;
    const MAP_WHEEL_TRIGGER_DELTA_PX = 40;
    const MAP_WHEEL_DELTA_LINE_PX = 18;
    const MAP_TOUCH_MIN_SWIPE_PX = 64;
    const MAP_TOUCH_MIN_FLICK_PX = 28;
    const MAP_TOUCH_MIN_FLICK_VELOCITY_PX_PER_MS = 0.38;
    const MAP_TOUCH_AXIS_RATIO = 1.15;
    const INFO_SECTION_SNAP_TOLERANCE_PX = 24;
    const INFO_SECTION_WHEEL_NAV_LOCK_MS = 260;
    const INFO_SECTION_TOUCH_MIN_SWIPE_PX = 72;
    const INFO_SECTION_TOUCH_MIN_FLICK_PX = 36;
    const INFO_SECTION_TOUCH_MIN_FLICK_VELOCITY_PX_PER_MS = 0.45;
    const INFO_SECTION_TOUCH_AXIS_RATIO = 1.2;
    const MAX_ENTITY_ID_LENGTH = 128;
    const CONTROL_CHARACTER_REGEX = /[\u0000-\u001F\u007F]/;
    const APP_ENTRY_PATH = 'index.html';
    // 앱 버전
    const APP_METADATA = Object.freeze({
        name: 'DrawingChat',
        version: '2026.0.100',
        releaseDateLabel: '23 February 2026'
    });
    const APP_VERSION_LINE_SELECTOR = '[data-app-version-line]';
    const APP_VERSION_BADGE_SELECTOR = '[data-app-version-badge]';
    const ROUTE_QUERY_KEY = Object.freeze({
        section: 'section',
        sectionAlias: 'view',
        postId: 'postId',
        postIdAlias: 'post'
    });
    const ROUTE_SECTION_KEY = Object.freeze({
        lobby: 'lobby',
        chat: VIEW_KEY.chat,
        board: VIEW_KEY.board,
        map: VIEW_KEY.map,
        post: 'post',
        help: VIEW_KEY.help,
        info: VIEW_KEY.info
    });
    const ROUTE_SECTION_TO_VIEW_KEY = Object.freeze({
        [ROUTE_SECTION_KEY.chat]: VIEW_KEY.chat,
        [ROUTE_SECTION_KEY.board]: VIEW_KEY.board,
        [ROUTE_SECTION_KEY.map]: VIEW_KEY.map,
        [ROUTE_SECTION_KEY.help]: VIEW_KEY.info,
        [ROUTE_SECTION_KEY.info]: VIEW_KEY.info
    });
    const VIEW_KEY_TO_ROUTE_SECTION = Object.freeze({
        [VIEW_KEY.chat]: ROUTE_SECTION_KEY.chat,
        [VIEW_KEY.board]: ROUTE_SECTION_KEY.board,
        [VIEW_KEY.map]: ROUTE_SECTION_KEY.map,
        [VIEW_KEY.info]: ROUTE_SECTION_KEY.info,
        [VIEW_KEY.postDetail]: ROUTE_SECTION_KEY.board
    });

    const RENDER_TARGET_SELECTOR = '[data-render="md"]';
    const FOOTNOTE_REFERENCE_SELECTOR = 'sup.footnote-ref > a[href^="#fn"]';
    const FOOTNOTE_ITEM_SELECTOR = '.footnotes .footnote-item[id]';
    const FOOTNOTE_BACKREF_SELECTOR = '.footnote-backref';
    const CODE_LANGUAGE_CLASS_REGEX = /^(?:language|lang)-(.+)$/i;
    const CODE_LANGUAGE_ALIAS_MAP = Object.freeze({
        'c++': 'cpp',
        'c#': 'csharp',
        'f#': 'fsharp',
        js: 'javascript',
        sh: 'bash',
        shell: 'bash',
        yml: 'yaml',
        md: 'markdown',
        bf: 'brainfuck'
    });
    const PLAIN_TEXT_LANGUAGE_SET = new Set(['none', 'plain', 'plaintext', 'text', 'txt']);
    const PRISM_AUTOLOADER_LANG_PATH = 'https://cdn.jsdelivr.net/npm/prismjs@1.30.0/components/';
    const FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    // 자주 접근하는 DOM 노드를 초기 캐시합니다.
    const rootEl = document.getElementById(DOM_ID.root);
    const lobbyEls = {
        layout: document.getElementById(DOM_ID.lobby.layout),
        form: document.getElementById(DOM_ID.lobby.form),
        nicknameInput: document.getElementById(DOM_ID.lobby.nicknameInput),
        error: document.getElementById(DOM_ID.lobby.error)
    };

    const viewEls = {
        [VIEW_KEY.chat]: document.getElementById(DOM_ID.view.chat),
        [VIEW_KEY.board]: document.getElementById(DOM_ID.view.board),
        [VIEW_KEY.map]: document.getElementById(DOM_ID.view.map),
        [VIEW_KEY.info]: document.getElementById(DOM_ID.view.info),
        [VIEW_KEY.postDetail]: document.getElementById(DOM_ID.view.postDetail)
    };

    const navEls = {
        [VIEW_KEY.chat]: document.getElementById(DOM_ID.nav.chat),
        [VIEW_KEY.board]: document.getElementById(DOM_ID.nav.board),
        [VIEW_KEY.map]: document.getElementById(DOM_ID.nav.map),
        [VIEW_KEY.info]: document.getElementById(DOM_ID.nav.info)
    };

    const chatEls = {
        scrollArea: document.getElementById(DOM_ID.chat.scrollArea),
        container: document.getElementById(DOM_ID.chat.container),
        form: document.getElementById(DOM_ID.chat.form),
        input: document.getElementById(DOM_ID.chat.input),
        jumpLatestButton: document.getElementById(DOM_ID.chat.jumpLatestButton)
    };

    const boardEls = {
        list: document.getElementById(DOM_ID.board.list),
        createForm: document.getElementById(DOM_ID.board.createForm),
        createTitleInput: document.getElementById(DOM_ID.board.createTitleInput),
        createContentInput: document.getElementById(DOM_ID.board.createContentInput),
        createCancelButton: document.getElementById(DOM_ID.board.createCancelButton),
        detailTitle: document.getElementById(DOM_ID.board.detailTitle),
        detailAuthor: document.getElementById(DOM_ID.board.detailAuthor),
        detailDate: document.getElementById(DOM_ID.board.detailDate),
        detailContent: document.getElementById(DOM_ID.board.detailContent),
        detailReadonly: document.getElementById(DOM_ID.board.detailReadonly),
        detailCopyButton: document.getElementById(DOM_ID.board.detailCopyButton),
        detailEditButton: document.getElementById(DOM_ID.board.detailEditButton),
        detailDeleteButton: document.getElementById(DOM_ID.board.detailDeleteButton),
        editForm: document.getElementById(DOM_ID.board.editForm),
        editTitleInput: document.getElementById(DOM_ID.board.editTitleInput),
        editContentInput: document.getElementById(DOM_ID.board.editContentInput),
        editCancelButton: document.getElementById(DOM_ID.board.editCancelButton),
        commentsCount: document.getElementById(DOM_ID.board.commentsCount),
        commentsList: document.getElementById(DOM_ID.board.commentsList),
        commentForm: document.getElementById(DOM_ID.board.commentForm),
        commentInput: document.getElementById(DOM_ID.board.commentInput)
    };

    const mapEls = {
        stage: document.getElementById(DOM_ID.map.stage),
        currentTitle: document.getElementById(DOM_ID.map.currentTitle),
        currentIndex: document.getElementById(DOM_ID.map.currentIndex),
        totalCount: document.getElementById(DOM_ID.map.totalCount),
        slides: Array.from(document.querySelectorAll('[data-map-slide]'))
    };

    const infoEls = {
        scrollTrack: document.getElementById(DOM_ID.info.scrollTrack),
        aboutPage: document.getElementById(DOM_ID.info.aboutPage),
        helpPage: document.getElementById(DOM_ID.info.helpPage)
    };

    const appSettingsEls = {
        root: document.getElementById(DOM_ID.appSettings.root),
        launcher: document.getElementById(DOM_ID.appSettings.launcher),
        panel: document.getElementById(DOM_ID.appSettings.panel)
    };

    const sendKeymapSettingEls = {
        select: document.getElementById(DOM_ID.sendKeymapSetting.select)
    };

    const chatAutoScrollSettingEls = {
        select: document.getElementById(DOM_ID.chatAutoScrollSetting.select)
    };

    const instantDeleteSettingEls = {
        toggle: document.getElementById(DOM_ID.instantDeleteSetting.toggle)
    };

    const unicodeVisualiserSettingEls = {
        toggle: document.getElementById(DOM_ID.unicodeVisualiserSetting.toggle)
    };

    const twemojiDisabledSettingEls = {
        toggle: document.getElementById(DOM_ID.twemojiDisabledSetting.toggle)
    };

    const licenseModalEls = {
        root: document.getElementById(DOM_ID.licenseModal.root),
        closeButton: document.getElementById(DOM_ID.licenseModal.closeButton)
    };

    const changelogModalEls = {
        root: document.getElementById(DOM_ID.changelogModal.root),
        closeButton: document.getElementById(DOM_ID.changelogModal.closeButton)
    };

    const logoutConfirmModalEls = {
        root: document.getElementById(DOM_ID.logoutConfirmModal.root),
        cancelButton: document.getElementById(DOM_ID.logoutConfirmModal.cancelButton),
        submitButton: document.getElementById(DOM_ID.logoutConfirmModal.submitButton)
    };

    const toastEl = document.getElementById(DOM_ID.toast.root);

    // 앱의 단일 런타임 상태 저장소입니다.
    const state = {
        currentView: VIEW_KEY.chat,
        currentPostId: null,
        session: null,
        chatMessages: [],
        boardPosts: [],
        boardCommentsByPost: {},
        pendingReplyCommentId: null,
        editingChatMessageId: null,
        editingCommentId: null,
        isPostEditing: false,
        isPostCreating: false,
        mapSlideIndex: 0,
        sendKeymap: SEND_KEYMAP.enter,
        chatAutoScrollMode: CHAT_AUTO_SCROLL_MODE.nearBottom,
        isInstantDeleteMode: false,
        isUnicodeVisualiserModeEnabled: false,
        isTwemojiDisabled: false
    };

    // 지연 초기화되는 외부 렌더러/토스트/제스처 상태와 경고 플래그입니다.
    let mdBaseInstance = null;
    let mdPostInstance = null;
    let didWarnMissingMarkdownIt = false;
    let didWarnMissingMarkdownItSup = false;
    let didWarnMissingMarkdownItSub = false;
    let didWarnMissingMarkdownItFootnote = false;
    let didWarnMissingKatexAutoRender = false;
    let didWarnMissingPrism = false;
    let didWarnMissingTwemoji = false;
    let didWarnMissingUnicodeifyVisualiser = false;
    let didWarnUnicodeifyDecodeFailure = false;
    let didConfigurePrismAutoloaderPath = false;
    let activeToastHideTimerId = null;
    let toastSequence = 0;
    const TOAST_VARIANT_SET = new Set(['success', 'warning', 'error', 'info']);
    const TOAST_VARIANT_CLASS_NAMES = Object.freeze(['is-success', 'is-warning', 'is-error', 'is-info']);
    const TOAST_ICON_CLASS_BY_VARIANT = Object.freeze({
        success: 'fa-circle-check',
        warning: 'fa-triangle-exclamation',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info'
    });
    let toastIconEl = null;
    let toastTextEl = null;
    let unicodeVisualiserController = null;
    let isLobbyEventBound = false;
    let mapWheelNavLockedUntil = 0;
    let mapWheelDeltaAccumulator = 0;
    let mapTouchGestureState = null;
    let infoSectionWheelNavLockedUntil = 0;
    let infoTouchGestureState = null;
    let lastFocusedElementBeforeLicenseModal = null;
    let lastFocusedElementBeforeChangelogModal = null;
    let lastFocusedElementBeforeLogoutConfirmModal = null;
    const footnotePreviewTextByTarget = new WeakMap();
    const footnotePreviewElementByTarget = new WeakMap();
    const footnotePreviewEventBoundTargets = new WeakSet();
    const chatItemRenderSignatureByEl = new WeakMap();
    const commentItemRenderSignatureByEl = new WeakMap();

    // markdown-it 인스턴스를 용도별(일반/각주 포함)로 캐시합니다.
    function getMarkdownRenderer({ enableFootnote = false } = {}) {
        if (enableFootnote && mdPostInstance) return mdPostInstance;
        if (!enableFootnote && mdBaseInstance) return mdBaseInstance;

        if (typeof window.markdownit !== 'function') {
            if (!didWarnMissingMarkdownIt) {
                didWarnMissingMarkdownIt = true;
                console.warn('[App UI] markdown-it is not available. Markdown rendering is skipped.');
            }
            return null;
        }

        try {
            const md = window.markdownit({
                html: true, // 의도된 설정임.
                linkify: true,
                typographer: true
            });

            if (typeof window.markdownitSup === 'function') {
                md.use(window.markdownitSup);
            } else if (!didWarnMissingMarkdownItSup) {
                didWarnMissingMarkdownItSup = true;
                console.warn('[App UI] markdown-it-sup is not available. Superscript rendering is skipped.');
            }

            if (typeof window.markdownitSub === 'function') {
                md.use(window.markdownitSub);
            } else if (!didWarnMissingMarkdownItSub) {
                didWarnMissingMarkdownItSub = true;
                console.warn('[App UI] markdown-it-sub is not available. Subscript rendering is skipped.');
            }

            if (enableFootnote) {
                if (typeof window.markdownitFootnote === 'function') {
                    md.use(window.markdownitFootnote);
                } else if (!didWarnMissingMarkdownItFootnote) {
                    didWarnMissingMarkdownItFootnote = true;
                    console.warn('[App UI] markdown-it-footnote is not available. Footnote rendering is skipped.');
                }
            }

            if (enableFootnote) {
                mdPostInstance = md;
            } else {
                mdBaseInstance = md;
            }

            return md;
        } catch (error) {
            console.warn('[App UI] Failed to initialise markdown-it.', error);
            return null;
        }
    }

    const sourceMarkdownByEl = new WeakMap();
    const renderedMarkdownByEl = new WeakSet();
    const TWEMOJI_CLASS_NAME = 'twemoji';
    const EMOJI_ONLY_MARKDOWN_CLASS_NAME = 'markdown-emoji-only';
    const EMOJI_ONLY_MARKDOWN_COUNT_DATA_KEY = 'emojiOnlyCount';
    const EMOJI_ONLY_ALLOWED_WRAPPER_TAG_SET = new Set([
        'P',
        'SPAN',
        'STRONG',
        'EM',
        'B',
        'I',
        'U',
        'S',
        'DEL',
        'INS',
        'MARK',
        'A'
    ]);

    function renderTex(targetEl) {
        if (!targetEl) return;
        if (typeof window.renderMathInElement !== 'function') {
            if (!didWarnMissingKatexAutoRender) {
                didWarnMissingKatexAutoRender = true;
                console.warn('[App UI] KaTeX auto-render is not available. TeX rendering is skipped.');
            }
            return;
        }

        try {
            window.renderMathInElement(targetEl, {
                throwOnError: false,
                trust: true, // 의도된 설정임.
                colorIsTextColor: true,
                delimiters: [
                    //{ left: '$$', right: '$$', display: true },
                    //{ left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
            });
        } catch (error) {
            console.warn('[App UI] Failed to render TeX for target element.', error);
        }
    }

    function renderTwemoji(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;
        if (state.isTwemojiDisabled) return;
        if (typeof window.twemoji?.parse !== 'function') {
            if (!didWarnMissingTwemoji) {
                didWarnMissingTwemoji = true;
                console.warn('[App UI] Twemoji is not available. Emoji rendering is skipped.');
            }
            return;
        }

        try {
            window.twemoji.parse(targetEl, {
                folder: 'svg',
                ext: '.svg',
                className: TWEMOJI_CLASS_NAME
            });
        } catch (error) {
            console.warn('[App UI] Failed to render Twemoji for a target element.', error);
        }
    }

    function isWhitespaceOnlyTextNode(node) {
        if (!(node instanceof Text)) return false;
        return !(/[^\s]/.test(node.textContent ?? ''));
    }

    function isEmojiOnlyMarkdownWrapperElement(el) {
        if (!(el instanceof HTMLElement)) return false;
        if (el.tagName === 'BR') return true;
        return EMOJI_ONLY_ALLOWED_WRAPPER_TAG_SET.has(el.tagName);
    }

    function getEmojiOnlyTwemojiCountInNode(node, rootEl) {
        if (!node) return { isValid: false, twemojiCount: 0 };

        if (node.nodeType === Node.TEXT_NODE) {
            return {
                isValid: isWhitespaceOnlyTextNode(node),
                twemojiCount: 0
            };
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return { isValid: true, twemojiCount: 0 };
        }

        const el = /** @type {HTMLElement} */ (node);
        if (el === rootEl) {
            let totalTwemojiCount = 0;
            for (const childNode of el.childNodes) {
                const result = getEmojiOnlyTwemojiCountInNode(childNode, rootEl);
                if (!result.isValid) {
                    return { isValid: false, twemojiCount: 0 };
                }
                totalTwemojiCount += result.twemojiCount;
            }
            return { isValid: true, twemojiCount: totalTwemojiCount };
        }

        if (el.tagName === 'IMG') {
            if (!el.classList.contains(TWEMOJI_CLASS_NAME)) {
                return { isValid: false, twemojiCount: 0 };
            }
            return { isValid: true, twemojiCount: 1 };
        }

        if (!isEmojiOnlyMarkdownWrapperElement(el)) {
            return { isValid: false, twemojiCount: 0 };
        }

        let totalTwemojiCount = 0;
        for (const childNode of el.childNodes) {
            const result = getEmojiOnlyTwemojiCountInNode(childNode, rootEl);
            if (!result.isValid) {
                return { isValid: false, twemojiCount: 0 };
            }
            totalTwemojiCount += result.twemojiCount;
        }

        return { isValid: true, twemojiCount: totalTwemojiCount };
    }

    function applyEmojiOnlyMarkdownPresentation(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;

        targetEl.classList.remove(EMOJI_ONLY_MARKDOWN_CLASS_NAME);
        delete targetEl.dataset[EMOJI_ONLY_MARKDOWN_COUNT_DATA_KEY];

        const { isValid, twemojiCount } = getEmojiOnlyTwemojiCountInNode(targetEl, targetEl);
        if (!isValid || twemojiCount < 1) return;

        targetEl.classList.add(EMOJI_ONLY_MARKDOWN_CLASS_NAME);
        targetEl.dataset[EMOJI_ONLY_MARKDOWN_COUNT_DATA_KEY] = String(twemojiCount);
    }

    function normaliseCodeLanguageToken(rawLanguage) {
        if (typeof rawLanguage !== 'string') return '';

        const cleanedLanguage = rawLanguage.trim().toLowerCase().replace(/[^a-z0-9#+-]/g, '');
        if (!cleanedLanguage) return '';

        return CODE_LANGUAGE_ALIAS_MAP[cleanedLanguage] ?? cleanedLanguage;
    }

    function normaliseCodeBlockLanguages(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;

        const codeBlockEls = targetEl.querySelectorAll('pre > code');
        codeBlockEls.forEach((codeEl) => {
            const preEl = codeEl.parentElement;
            if (!(preEl instanceof HTMLElement)) return;

            let detectedLanguage = '';
            [...codeEl.classList].forEach((className) => {
                if (detectedLanguage) return;

                const matchedLanguage = className.match(CODE_LANGUAGE_CLASS_REGEX);
                if (matchedLanguage) {
                    detectedLanguage = matchedLanguage[1] ?? '';
                }
            });

            const normalisedLanguage = normaliseCodeLanguageToken(detectedLanguage);
            [...codeEl.classList].forEach((className) => {
                if (CODE_LANGUAGE_CLASS_REGEX.test(className)) {
                    codeEl.classList.remove(className);
                }
            });

            if (normalisedLanguage) {
                codeEl.classList.add(`language-${normalisedLanguage}`);
            } else {
                codeEl.classList.add('language-none');
            }

            preEl.classList.add('md-code-block');

            if (normalisedLanguage && !PLAIN_TEXT_LANGUAGE_SET.has(normalisedLanguage)) {
                preEl.dataset.codeLang = normalisedLanguage;
            } else {
                preEl.removeAttribute('data-code-lang');
            }
        });
    }

    function preparePrismAutoloader() {
        if (didConfigurePrismAutoloaderPath) return;

        const autoloader = window.Prism?.plugins?.autoloader;
        if (!autoloader || typeof autoloader !== 'object') return;

        autoloader.languages_path = PRISM_AUTOLOADER_LANG_PATH;
        didConfigurePrismAutoloaderPath = true;
    }

    function renderCodeHighlight(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;

        targetEl.classList.add('markdown-rendered');
        normaliseCodeBlockLanguages(targetEl);

        if (typeof window.Prism?.highlightAllUnder !== 'function') {
            if (!didWarnMissingPrism) {
                didWarnMissingPrism = true;
                console.warn('[App UI] Prism.js is not available. Code highlighting is skipped.');
            }
            return;
        }

        preparePrismAutoloader();

        try {
            window.Prism.highlightAllUnder(targetEl);
        } catch (error) {
            console.warn('[App UI] Failed to highlight markdown code blocks.', error);
        }
    }

    function supportsHoverInteraction() {
        if (typeof window.matchMedia !== 'function') return true;
        return window.matchMedia('(hover: hover)').matches;
    }

    function normalisePlainText(rawText) {
        if (typeof rawText !== 'string') return '';
        return rawText.replace(/\s+/g, ' ').trim();
    }

    function getFootnoteIdFromReferenceLink(referenceLinkEl) {
        if (!(referenceLinkEl instanceof HTMLAnchorElement)) return '';
        const href = referenceLinkEl.getAttribute('href') ?? '';
        if (!href.startsWith('#')) return '';

        try {
            return decodeURIComponent(href.slice(1)).trim();
        } catch (error) {
            return href.slice(1).trim();
        }
    }

    function extractFootnotePreviewText(footnoteItemEl) {
        if (!(footnoteItemEl instanceof HTMLElement)) return '';

        const cloneEl = footnoteItemEl.cloneNode(true);
        cloneEl.querySelectorAll(FOOTNOTE_BACKREF_SELECTOR).forEach((backrefEl) => backrefEl.remove());
        return normalisePlainText(cloneEl.textContent ?? '');
    }

    function collectFootnotePreviewTextMap(targetEl) {
        const footnoteTextById = new Map();
        if (!(targetEl instanceof HTMLElement)) return footnoteTextById;

        targetEl.querySelectorAll(FOOTNOTE_ITEM_SELECTOR).forEach((footnoteItemEl) => {
            const footnoteId = normalisePlainText(footnoteItemEl.id ?? '');
            if (!footnoteId) return;

            const previewText = extractFootnotePreviewText(footnoteItemEl);
            if (!previewText) return;

            footnoteTextById.set(footnoteId, previewText);
        });

        return footnoteTextById;
    }

    function getFootnotePreviewElement(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return null;

        const cachedPreviewEl = footnotePreviewElementByTarget.get(targetEl);
        if (cachedPreviewEl && targetEl.contains(cachedPreviewEl)) {
            return cachedPreviewEl;
        }

        const previewEl = document.createElement('div');
        previewEl.className = 'md-footnote-preview';
        previewEl.setAttribute('data-footnote-preview', 'true');
        previewEl.setAttribute('aria-hidden', 'true');
        previewEl.hidden = true;
        targetEl.appendChild(previewEl);
        footnotePreviewElementByTarget.set(targetEl, previewEl);
        return previewEl;
    }

    function hideFootnotePreview(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;
        const previewEl = footnotePreviewElementByTarget.get(targetEl);
        if (!previewEl || !targetEl.contains(previewEl)) return;

        previewEl.classList.remove('is-visible');
        previewEl.hidden = true;
        previewEl.textContent = '';
        previewEl.setAttribute('aria-hidden', 'true');
        delete previewEl.dataset.activeFootnoteId;
    }

    function positionFootnotePreview(targetEl, previewEl, referenceLinkEl) {
        if (!(targetEl instanceof HTMLElement)) return;
        if (!(previewEl instanceof HTMLElement)) return;
        if (!(referenceLinkEl instanceof HTMLAnchorElement)) return;

        const containerRect = targetEl.getBoundingClientRect();
        const referenceRect = referenceLinkEl.getBoundingClientRect();
        const previewRect = previewEl.getBoundingClientRect();
        const margin = 12;

        const rawLeft = (referenceRect.left - containerRect.left) + targetEl.scrollLeft + (referenceRect.width / 2);
        const minLeft = margin;
        const maxLeft = Math.max(minLeft, targetEl.clientWidth - margin);
        const left = Math.min(Math.max(rawLeft, minLeft), maxLeft);

        const rawTop = (referenceRect.bottom - containerRect.top) + targetEl.scrollTop + 8;
        const minTop = margin;
        const maxTop = Math.max(minTop, targetEl.scrollHeight - previewRect.height - margin);
        const top = Math.min(Math.max(rawTop, minTop), maxTop);

        previewEl.style.left = `${left}px`;
        previewEl.style.top = `${top}px`;
    }

    function showFootnotePreview(targetEl, referenceLinkEl, previewText) {
        if (!(targetEl instanceof HTMLElement)) return;
        if (!(referenceLinkEl instanceof HTMLAnchorElement)) return;
        if (!previewText) return;

        const previewEl = getFootnotePreviewElement(targetEl);
        if (!previewEl) return;

        previewEl.textContent = previewText;
        previewEl.hidden = false;
        previewEl.setAttribute('aria-hidden', 'false');
        previewEl.classList.add('is-visible');
        previewEl.dataset.activeFootnoteId = getFootnoteIdFromReferenceLink(referenceLinkEl);
        positionFootnotePreview(targetEl, previewEl, referenceLinkEl);
    }

    function getFootnoteReferenceLink(targetEl, eventTarget) {
        if (!(targetEl instanceof HTMLElement)) return null;
        if (!(eventTarget instanceof Element)) return null;

        const referenceLinkEl = eventTarget.closest(FOOTNOTE_REFERENCE_SELECTOR);
        if (!referenceLinkEl || !targetEl.contains(referenceLinkEl)) return null;
        return referenceLinkEl;
    }

    function applyFootnoteFallbackText(targetEl, footnoteTextById) {
        if (!(targetEl instanceof HTMLElement)) return;
        if (!(footnoteTextById instanceof Map)) return;

        targetEl.querySelectorAll(FOOTNOTE_REFERENCE_SELECTOR).forEach((referenceLinkEl) => {
            const footnoteId = getFootnoteIdFromReferenceLink(referenceLinkEl);
            if (!footnoteId) return;

            const previewText = footnoteTextById.get(footnoteId);
            if (!previewText) return;

            referenceLinkEl.setAttribute('title', previewText);
            referenceLinkEl.setAttribute('aria-label', `각주: ${previewText}`);
        });
    }

    function bindFootnotePreviewEvents(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;
        if (footnotePreviewEventBoundTargets.has(targetEl)) return;

        const openPreviewForReference = (referenceLinkEl) => {
            const footnoteId = getFootnoteIdFromReferenceLink(referenceLinkEl);
            if (!footnoteId) return false;

            const footnoteTextById = footnotePreviewTextByTarget.get(targetEl);
            const previewText = footnoteTextById?.get(footnoteId) ?? '';
            if (!previewText) return false;

            showFootnotePreview(targetEl, referenceLinkEl, previewText);
            return true;
        };

        targetEl.addEventListener('click', (event) => {
            const referenceLinkEl = getFootnoteReferenceLink(targetEl, event.target);
            if (referenceLinkEl) {
                const previewEl = getFootnotePreviewElement(targetEl);
                const footnoteId = getFootnoteIdFromReferenceLink(referenceLinkEl);
                const isSamePreviewVisible = Boolean(
                    previewEl &&
                    !previewEl.hidden &&
                    previewEl.dataset.activeFootnoteId === footnoteId
                );

                if (isSamePreviewVisible) {
                    hideFootnotePreview(targetEl);
                    return;
                }

                const didOpenPreview = openPreviewForReference(referenceLinkEl);
                if (didOpenPreview) {
                    event.preventDefault();
                }
                return;
            }

            hideFootnotePreview(targetEl);
        });

        targetEl.addEventListener('mouseover', (event) => {
            if (!supportsHoverInteraction()) return;
            const referenceLinkEl = getFootnoteReferenceLink(targetEl, event.target);
            if (!referenceLinkEl) return;
            openPreviewForReference(referenceLinkEl);
        });

        targetEl.addEventListener('mouseleave', () => {
            if (!supportsHoverInteraction()) return;
            hideFootnotePreview(targetEl);
        });

        targetEl.addEventListener('focusin', (event) => {
            const referenceLinkEl = getFootnoteReferenceLink(targetEl, event.target);
            if (!referenceLinkEl) return;
            openPreviewForReference(referenceLinkEl);
        });

        targetEl.addEventListener('focusout', (event) => {
            const nextFocusedEl = event.relatedTarget;
            if (
                nextFocusedEl instanceof Element &&
                targetEl.contains(nextFocusedEl) &&
                nextFocusedEl.closest(FOOTNOTE_REFERENCE_SELECTOR)
            ) {
                return;
            }

            hideFootnotePreview(targetEl);
        });

        targetEl.addEventListener('scroll', () => {
            hideFootnotePreview(targetEl);
        }, { passive: true });

        footnotePreviewEventBoundTargets.add(targetEl);
    }

    function prepareFootnotePreview(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;

        const footnoteTextById = collectFootnotePreviewTextMap(targetEl);
        footnotePreviewTextByTarget.set(targetEl, footnoteTextById);
        if (!footnoteTextById.size) {
            hideFootnotePreview(targetEl);
            return;
        }

        applyFootnoteFallbackText(targetEl, footnoteTextById);
        bindFootnotePreviewEvents(targetEl);
    }

    // 선택 텍스트 유니코드 비주얼라이저 확장과의 느슨한 연동 지점입니다.
    function getUnicodeifyApi() {
        return window.Unicodeify && typeof window.Unicodeify === 'object'
            ? window.Unicodeify
            : null;
    }

    function decodeUnicodeImeTextForRender(rawText) {
        if (typeof rawText !== 'string') return '';

        const decode = getUnicodeifyApi()?.decodeUnicodeEscapes;
        if (typeof decode !== 'function') {
            return rawText;
        }

        try {
            return decode(rawText);
        } catch (error) {
            if (!didWarnUnicodeifyDecodeFailure) {
                didWarnUnicodeifyDecodeFailure = true;
                console.warn('[App UI] Unicodeify decode failed. Falling back to original text.', error);
            }
            return rawText;
        }
    }

    // `data-render="md"` 대상만 찾아 지연 렌더링 파이프라인에 태웁니다.
    function collectMarkdownRenderTargets(root = document) {
        if (!root) return [];

        if (root instanceof HTMLElement) {
            const targets = [];
            if (root.matches(RENDER_TARGET_SELECTOR)) {
                targets.push(root);
            }
            root.querySelectorAll(RENDER_TARGET_SELECTOR).forEach((targetEl) => {
                if (targetEl instanceof HTMLElement) {
                    targets.push(targetEl);
                }
            });
            return targets;
        }

        if (root instanceof Document || root instanceof DocumentFragment) {
            return [...root.querySelectorAll(RENDER_TARGET_SELECTOR)]
                .filter((targetEl) => targetEl instanceof HTMLElement);
        }

        return [];
    }

    // Markdown -> 코드 하이라이트 -> 수식 -> 각주 프리뷰 -> 트위모지 순으로 적용합니다.
    function renderMarkdownAndMathIfAvailable(root = document) {
        const targets = collectMarkdownRenderTargets(root);
        if (!targets.length) return;

        targets.forEach((targetEl) => {
            if (renderedMarkdownByEl.has(targetEl)) return;

            try {
                if (!sourceMarkdownByEl.has(targetEl)) {
                    sourceMarkdownByEl.set(targetEl, targetEl.textContent ?? '');
                }

                const rawMarkdownSource = sourceMarkdownByEl.get(targetEl) ?? '';
                const markdownSource = decodeUnicodeImeTextForRender(rawMarkdownSource);
                const allowsFootnote = targetEl.dataset?.mdFootnote === 'enabled';
                const md = getMarkdownRenderer({ enableFootnote: allowsFootnote });
                if (md) {
                    targetEl.innerHTML = md.render(markdownSource);
                } else {
                    targetEl.textContent = markdownSource;
                }

                renderCodeHighlight(targetEl);
                renderTex(targetEl);
                if (allowsFootnote) {
                    prepareFootnotePreview(targetEl);
                } else {
                    hideFootnotePreview(targetEl);
                }
                renderTwemoji(targetEl);
                applyEmojiOnlyMarkdownPresentation(targetEl);
                renderedMarkdownByEl.add(targetEl);
            } catch (error) {
                console.warn('[App UI] Failed to render markdown/math for a target element.', error);
            }
        });
    }

    // 입력값/라우트/엔티티 식별자 정규화 계층
    function normaliseNickname(rawNickname) {
        if (typeof rawNickname !== 'string') return '';
        return rawNickname.replace(/\s+/g, ' ').trim();
    }

    function normaliseChatContent(rawContent) {
        if (typeof rawContent !== 'string') return '';
        return rawContent.replace(/\r\n/g, '\n').trim();
    }

    function normalisePostTitle(rawTitle) {
        if (typeof rawTitle !== 'string') return '';
        return rawTitle.replace(/\s+/g, ' ').trim();
    }

    function normalisePostContent(rawContent) {
        if (typeof rawContent !== 'string') return '';
        return rawContent.replace(/\r\n/g, '\n').trim();
    }

    function normaliseCommentContent(rawContent) {
        if (typeof rawContent !== 'string') return '';
        return rawContent.replace(/\r\n/g, '\n').trim();
    }

    function normaliseEntityId(rawId) {
        if (typeof rawId !== 'string') return '';
        const trimmedId = rawId.trim();
        if (!trimmedId || trimmedId.length > MAX_ENTITY_ID_LENGTH) return '';
        if (CONTROL_CHARACTER_REGEX.test(trimmedId)) return '';
        return trimmedId;
    }

    function normaliseRouteSection(rawSection) {
        if (typeof rawSection !== 'string') return '';

        const trimmedSection = rawSection.trim().toLowerCase();
        if (!trimmedSection) return '';

        switch (trimmedSection) {
            case ROUTE_SECTION_KEY.lobby:
            case ROUTE_SECTION_KEY.chat:
            case ROUTE_SECTION_KEY.board:
            case ROUTE_SECTION_KEY.map:
            case ROUTE_SECTION_KEY.help:
            case ROUTE_SECTION_KEY.info:
                return trimmedSection;
            case ROUTE_SECTION_KEY.post:
                return ROUTE_SECTION_KEY.board;
            case VIEW_KEY.postDetail:
            case 'postdetail':
                return ROUTE_SECTION_KEY.board;
            default:
                return '';
        }
    }

    function getRouteStateFromLocation() {
        const searchParams = new URLSearchParams(window.location.search);
        const rawSection = searchParams.get(ROUTE_QUERY_KEY.section) ?? searchParams.get(ROUTE_QUERY_KEY.sectionAlias);
        const rawPostId = searchParams.get(ROUTE_QUERY_KEY.postId) ?? searchParams.get(ROUTE_QUERY_KEY.postIdAlias);

        return {
            section: normaliseRouteSection(rawSection),
            postId: normaliseEntityId(String(rawPostId ?? ''))
        };
    }

    function getRouteSectionForCurrentScreen() {
        if (!state.session) {
            return ROUTE_SECTION_KEY.lobby;
        }

        return VIEW_KEY_TO_ROUTE_SECTION[state.currentView] ?? ROUTE_SECTION_KEY.chat;
    }

    function replaceRouteQuery(section, postId = '') {
        if (typeof window.history?.replaceState !== 'function') return;

        const normalisedSection = normaliseRouteSection(section);
        if (!normalisedSection) return;

        const normalisedPostId = normaliseEntityId(String(postId ?? ''));
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.delete(ROUTE_QUERY_KEY.section);
        searchParams.delete(ROUTE_QUERY_KEY.sectionAlias);
        searchParams.delete(ROUTE_QUERY_KEY.postId);
        searchParams.delete(ROUTE_QUERY_KEY.postIdAlias);
        searchParams.set(ROUTE_QUERY_KEY.section, normalisedSection);

        if (normalisedSection === ROUTE_SECTION_KEY.board && normalisedPostId) {
            searchParams.set(ROUTE_QUERY_KEY.postId, normalisedPostId);
        }

        const nextSearch = searchParams.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextUrl === currentUrl) return;

        window.history.replaceState(null, '', nextUrl);
    }

    function syncRouteQueryWithCurrentScreen() {
        const section = getRouteSectionForCurrentScreen();
        const postId = state.currentView === VIEW_KEY.postDetail ? state.currentPostId : '';
        replaceRouteQuery(section, postId);
    }

    // 공통 배열/DOM 유틸리티
    function filterUniqueItemsById(items) {
        if (!Array.isArray(items)) return [];

        const seenIdSet = new Set();
        return items.filter((item) => {
            const id = item?.id;
            if (typeof id !== 'string' || !id || seenIdSet.has(id)) {
                return false;
            }

            seenIdSet.add(id);
            return true;
        });
    }

    function getCurrentSessionNickname() {
        const nickname = normaliseNickname(state.session?.nickname);
        if (nickname) return nickname;

        window.alert('세션 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
        clearStoredSession();
        state.session = null;
        initLobby();
        return '';
    }

    function findInlineEditInputByDataId(containerEl, editBoxSelector, dataIdKey, targetId, inputSelector) {
        if (!containerEl || !editBoxSelector || !dataIdKey || !targetId || !inputSelector) return null;

        const editBoxEls = containerEl.querySelectorAll(editBoxSelector);
        for (const editBoxEl of editBoxEls) {
            if (editBoxEl.dataset?.[dataIdKey] !== targetId) {
                continue;
            }

            const inputEl = editBoxEl.querySelector(inputSelector);
            if (inputEl) return inputEl;
        }

        return null;
    }

    function autoResizeTextarea(textareaEl, maxHeightPx = TEXTAREA_AUTO_RESIZE_MAX_HEIGHT_PX) {
        if (!(textareaEl instanceof HTMLTextAreaElement)) return;
        const safeMaxHeightPx = Number.isFinite(maxHeightPx) && maxHeightPx > 0
            ? maxHeightPx
            : TEXTAREA_AUTO_RESIZE_MAX_HEIGHT_PX;

        textareaEl.style.height = 'auto';
        const nextHeightPx = Math.min(textareaEl.scrollHeight, safeMaxHeightPx);
        textareaEl.style.height = `${nextHeightPx}px`;
        textareaEl.style.overflowY = textareaEl.scrollHeight > safeMaxHeightPx ? 'auto' : 'hidden';
    }

    function setMarkdownSource(targetEl, markdownSource) {
        if (!targetEl) return;

        const source = typeof markdownSource === 'string' ? markdownSource : '';
        sourceMarkdownByEl.set(targetEl, source);
        renderedMarkdownByEl.delete(targetEl);
        targetEl.textContent = source;
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (char) => {
            switch (char) {
                case '&':
                    return '&amp;';
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '"':
                    return '&quot;';
                case '\'':
                    return '&#39;';
                default:
                    return char;
            }
        });
    }

    function createSingleRootElementFromHtml(html, itemLabel = 'list item') {
        if (typeof html !== 'string') {
            throw new TypeError(`[App UI] ${itemLabel} HTML must be a string.`);
        }

        const templateEl = document.createElement('template');
        templateEl.innerHTML = html.trim();

        const { content } = templateEl;
        if (content.childElementCount !== 1) {
            throw new Error(`[App UI] ${itemLabel} HTML must have exactly one root element.`);
        }

        const firstElementChild = content.firstElementChild;
        if (!(firstElementChild instanceof HTMLElement)) {
            throw new Error(`[App UI] ${itemLabel} root element is invalid.`);
        }

        for (const childNode of content.childNodes) {
            if (childNode === firstElementChild) continue;
            if (childNode.nodeType === Node.TEXT_NODE && !(/\S/.test(childNode.textContent ?? ''))) {
                continue;
            }
            throw new Error(`[App UI] ${itemLabel} HTML contains unexpected sibling nodes.`);
        }

        return firstElementChild;
    }

    // 시그니처가 바뀐 항목만 교체해 채팅/댓글 리스트 재렌더 비용을 줄입니다.
    function patchKeyedListChildren(containerEl, itemDescriptors, {
        markerAttr,
        idDatasetKey,
        signatureByEl
    }) {
        if (!(containerEl instanceof HTMLElement)) {
            throw new TypeError('[App UI] Keyed list patch target must be an HTMLElement.');
        }
        if (!Array.isArray(itemDescriptors)) {
            throw new TypeError('[App UI] Keyed list descriptors must be an array.');
        }
        if (typeof markerAttr !== 'string' || !markerAttr) {
            throw new TypeError('[App UI] Keyed list marker attribute is required.');
        }
        if (typeof idDatasetKey !== 'string' || !idDatasetKey) {
            throw new TypeError('[App UI] Keyed list dataset key is required.');
        }
        if (!(signatureByEl instanceof WeakMap)) {
            throw new TypeError('[App UI] Keyed list signature cache must be a WeakMap.');
        }

        const existingById = new Map();
        [...containerEl.children].forEach((childEl) => {
            if (!(childEl instanceof HTMLElement)) return;
            if (!childEl.hasAttribute(markerAttr)) return;

            const itemId = normaliseEntityId(String(childEl.dataset?.[idDatasetKey] ?? ''));
            if (!itemId) {
                childEl.remove();
                return;
            }

            if (existingById.has(itemId)) {
                childEl.remove();
                return;
            }

            existingById.set(itemId, childEl);
        });

        const seenIdSet = new Set();
        const changedRootEls = [];
        let cursorNode = containerEl.firstChild;

        itemDescriptors.forEach((descriptor, index) => {
            const itemId = normaliseEntityId(String(descriptor?.id ?? ''));
            if (!itemId) {
                throw new Error(`[App UI] Invalid keyed list item id at index ${index}.`);
            }
            if (seenIdSet.has(itemId)) {
                throw new Error(`[App UI] Duplicate keyed list item id "${itemId}".`);
            }

            const html = typeof descriptor?.html === 'string' ? descriptor.html : '';
            if (!html) {
                throw new Error(`[App UI] Empty keyed list item HTML for id "${itemId}".`);
            }

            const signature = typeof descriptor?.signature === 'string'
                ? descriptor.signature
                : html;

            let itemEl = existingById.get(itemId) ?? null;
            const hasSameSignature = itemEl instanceof HTMLElement
                && signatureByEl.get(itemEl) === signature;

            if (!hasSameSignature) {
                const previousEl = itemEl;
                const nextEl = createSingleRootElementFromHtml(html, `keyed list item "${itemId}"`);
                if (!nextEl.hasAttribute(markerAttr)) {
                    throw new Error(`[App UI] Keyed list item "${itemId}" is missing marker attribute "${markerAttr}".`);
                }

                const renderedItemId = normaliseEntityId(String(nextEl.dataset?.[idDatasetKey] ?? ''));
                if (renderedItemId !== itemId) {
                    throw new Error(`[App UI] Keyed list item "${itemId}" root dataset id mismatch.`);
                }

                signatureByEl.set(nextEl, signature);

                if (previousEl instanceof HTMLElement && previousEl.parentNode === containerEl) {
                    containerEl.replaceChild(nextEl, previousEl);
                    if (cursorNode === previousEl) {
                        cursorNode = nextEl;
                    }
                }

                itemEl = nextEl;
                existingById.set(itemId, nextEl);
                changedRootEls.push(nextEl);
            }

            if (!(itemEl instanceof HTMLElement)) {
                throw new Error(`[App UI] Failed to resolve keyed list item "${itemId}".`);
            }

            if (itemEl.parentNode !== containerEl || itemEl !== cursorNode) {
                containerEl.insertBefore(itemEl, cursorNode);
            }

            seenIdSet.add(itemId);
            cursorNode = itemEl.nextSibling;
        });

        [...containerEl.childNodes].forEach((childNode) => {
            if (!(childNode instanceof HTMLElement)) {
                if (childNode.nodeType === Node.TEXT_NODE && !(/\S/.test(childNode.textContent ?? ''))) {
                    childNode.remove();
                    return;
                }
                if (childNode.nodeType === Node.TEXT_NODE) {
                    childNode.remove();
                }
                return;
            }

            if (!childNode.hasAttribute(markerAttr)) {
                childNode.remove();
                return;
            }

            const itemId = normaliseEntityId(String(childNode.dataset?.[idDatasetKey] ?? ''));
            if (!itemId || !seenIdSet.has(itemId)) {
                childNode.remove();
            }
        });

        return changedRootEls;
    }

    // 로비, 세션, localStorage 로드/저장 로직
    function showLobbyError(message) {
        if (!lobbyEls.error) return;
        lobbyEls.error.textContent = message;
        lobbyEls.error.classList.remove('hide');
    }

    function clearLobbyError() {
        if (!lobbyEls.error) return;
        lobbyEls.error.textContent = '';
        lobbyEls.error.classList.add('hide');
    }

    function applyAppMetadataToUi() {
        const versionLine = `${APP_METADATA.name} Version ${APP_METADATA.version} | ${APP_METADATA.releaseDateLabel}`;
        const versionBadge = `Version ${APP_METADATA.version}`;

        document.querySelectorAll(APP_VERSION_LINE_SELECTOR).forEach((targetEl) => {
            targetEl.textContent = versionLine;
        });

        document.querySelectorAll(APP_VERSION_BADGE_SELECTOR).forEach((targetEl) => {
            targetEl.textContent = versionBadge;
        });
    }

    function setLobbyVisible(isVisible) {
        if (!lobbyEls.layout) return;
        const nextVisible = Boolean(isVisible);
        lobbyEls.layout.classList.toggle('hide', !nextVisible);
        lobbyEls.layout.setAttribute('aria-hidden', nextVisible ? 'false' : 'true');
    }

    function setAppVisible(isVisible) {
        if (!rootEl) return;
        const nextVisible = Boolean(isVisible);
        rootEl.classList.toggle('hide', !nextVisible);
        rootEl.setAttribute('aria-hidden', nextVisible ? 'false' : 'true');
    }

    function showLobbyScreen() {
        setAppVisible(false);
        setLobbyVisible(true);
    }

    function showAppScreen() {
        setLobbyVisible(false);
        setAppVisible(true);
    }

    function clearStoredSession() {
        try {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to clear session from localStorage.', error);
            return false;
        }
    }

    function loadSession() {
        try {
            const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
            if (!rawSession) return null;

            const parsedSession = JSON.parse(rawSession);
            const nickname = normaliseNickname(parsedSession?.nickname);
            if (!nickname || nickname.length > NICKNAME_MAX_LENGTH) {
                clearStoredSession();
                return null;
            }

            return Object.freeze({
                nickname,
                createdAt: typeof parsedSession?.createdAt === 'string' ? parsedSession.createdAt : null
            });
        } catch (error) {
            console.warn('[App UI] Failed to load session from localStorage.', error);
            clearStoredSession();
            return null;
        }
    }

    function saveSession(nickname) {
        try {
            const session = {
                nickname,
                createdAt: new Date().toISOString()
            };
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save session to localStorage.', error);
            return false;
        }
    }

    // 설정값 직렬화/역직렬화(localStorage)
    function normaliseSendKeymap(value) {
        const candidate = typeof value === 'string' ? value.trim().toLowerCase() : '';
        return SEND_KEYMAP_SET.has(candidate) ? candidate : SEND_KEYMAP.enter;
    }

    function parseStoredValue(rawValue) {
        if (typeof rawValue !== 'string') return null;
        try {
            return JSON.parse(rawValue);
        } catch {
            return rawValue;
        }
    }

    function saveSendKeymap(keymap) {
        try {
            const safeKeymap = normaliseSendKeymap(keymap);
            window.localStorage.setItem(SEND_KEYMAP_STORAGE_KEY, JSON.stringify(safeKeymap));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save send-keymap setting to localStorage.', error);
            return false;
        }
    }

    function loadSendKeymap() {
        try {
            const rawKeymap = window.localStorage.getItem(SEND_KEYMAP_STORAGE_KEY);
            if (rawKeymap) {
                return normaliseSendKeymap(parseStoredValue(rawKeymap));
            }

            const rawLegacyMode = window.localStorage.getItem(LEGACY_ENTER_NEWLINE_MODE_STORAGE_KEY);
            if (!rawLegacyMode) return SEND_KEYMAP.enter;
            const isLegacyEnterNewlineEnabled = parseStoredValue(rawLegacyMode) === true;
            return isLegacyEnterNewlineEnabled ? SEND_KEYMAP.ctrlEnter : SEND_KEYMAP.enter;
        } catch (error) {
            console.warn('[App UI] Failed to load send-keymap setting from localStorage.', error);
            return SEND_KEYMAP.enter;
        }
    }

    function normaliseChatAutoScrollMode(value) {
        const candidate = typeof value === 'string' ? value.trim().toLowerCase() : '';
        return CHAT_AUTO_SCROLL_MODE_SET.has(candidate) ? candidate : CHAT_AUTO_SCROLL_MODE.nearBottom;
    }

    function saveChatAutoScrollMode(mode) {
        try {
            const safeMode = normaliseChatAutoScrollMode(mode);
            window.localStorage.setItem(CHAT_AUTO_SCROLL_MODE_STORAGE_KEY, JSON.stringify(safeMode));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save chat auto-scroll mode to localStorage.', error);
            return false;
        }
    }

    function loadChatAutoScrollMode() {
        try {
            const rawMode = window.localStorage.getItem(CHAT_AUTO_SCROLL_MODE_STORAGE_KEY);
            if (!rawMode) return CHAT_AUTO_SCROLL_MODE.nearBottom;
            return normaliseChatAutoScrollMode(parseStoredValue(rawMode));
        } catch (error) {
            console.warn('[App UI] Failed to load chat auto-scroll mode from localStorage.', error);
            return CHAT_AUTO_SCROLL_MODE.nearBottom;
        }
    }

    function saveInstantDeleteMode(isEnabled) {
        try {
            window.localStorage.setItem(INSTANT_DELETE_MODE_STORAGE_KEY, JSON.stringify(Boolean(isEnabled)));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save instant-delete mode to localStorage.', error);
            return false;
        }
    }

    function loadInstantDeleteMode() {
        try {
            const rawMode = window.localStorage.getItem(INSTANT_DELETE_MODE_STORAGE_KEY);
            if (!rawMode) return false;

            return JSON.parse(rawMode) === true;
        } catch (error) {
            console.warn('[App UI] Failed to load instant-delete mode from localStorage.', error);
            return false;
        }
    }

    function saveUnicodeVisualiserMode(isEnabled) {
        try {
            window.localStorage.setItem(UNICODE_VISUALISER_MODE_STORAGE_KEY, JSON.stringify(Boolean(isEnabled)));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save unicode-visualiser mode to localStorage.', error);
            return false;
        }
    }

    function loadUnicodeVisualiserMode() {
        try {
            const rawMode = window.localStorage.getItem(UNICODE_VISUALISER_MODE_STORAGE_KEY);
            if (!rawMode) return false;

            return JSON.parse(rawMode) === true;
        } catch (error) {
            console.warn('[App UI] Failed to load unicode-visualiser mode from localStorage.', error);
            return false;
        }
    }

    function saveTwemojiDisabledMode(isEnabled) {
        try {
            window.localStorage.setItem(TWEMOJI_DISABLED_MODE_STORAGE_KEY, JSON.stringify(Boolean(isEnabled)));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save twemoji-disabled mode to localStorage.', error);
            return false;
        }
    }

    function loadTwemojiDisabledMode() {
        try {
            const rawMode = window.localStorage.getItem(TWEMOJI_DISABLED_MODE_STORAGE_KEY);
            if (!rawMode) return false;

            return JSON.parse(rawMode) === true;
        } catch (error) {
            console.warn('[App UI] Failed to load twemoji-disabled mode from localStorage.', error);
            return false;
        }
    }

    // 설정 패널 및 모달 포커스 트랩/열림 상태 제어
    function isSettingsPanelOpen() {
        return Boolean(appSettingsEls.root?.classList.contains('is-open'));
    }

    function setSettingsPanelOpen(isOpen) {
        const rootSettingEl = appSettingsEls.root;
        if (!rootSettingEl) return;

        const nextOpen = Boolean(isOpen);
        rootSettingEl.classList.toggle('is-open', nextOpen);
        appSettingsEls.launcher?.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        appSettingsEls.launcher?.setAttribute('aria-label', nextOpen ? '설정 닫기' : '설정 열기');
        appSettingsEls.panel?.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
    }

    function toggleSettingsPanel() {
        setSettingsPanelOpen(!isSettingsPanelOpen());
    }

    function isLogoutConfirmModalOpen() {
        return Boolean(logoutConfirmModalEls.root && !logoutConfirmModalEls.root.classList.contains('hide'));
    }

    function setLogoutConfirmModalOpen(isOpen) {
        const modalRootEl = logoutConfirmModalEls.root;
        if (!modalRootEl) return;

        const nextOpen = Boolean(isOpen);
        if (nextOpen) {
            const activeEl = document.activeElement;
            lastFocusedElementBeforeLogoutConfirmModal = activeEl instanceof HTMLElement ? activeEl : null;
        }

        modalRootEl.classList.toggle('hide', !nextOpen);
        modalRootEl.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');

        if (nextOpen) {
            logoutConfirmModalEls.cancelButton?.focus();
            return;
        }

        if (lastFocusedElementBeforeLogoutConfirmModal instanceof HTMLElement) {
            lastFocusedElementBeforeLogoutConfirmModal.focus();
        }
        lastFocusedElementBeforeLogoutConfirmModal = null;
    }

    function handleLogoutConfirmModalTabKeydown(event) {
        const modalRootEl = logoutConfirmModalEls.root;
        if (!modalRootEl) return;

        const focusableEls = [...modalRootEl.querySelectorAll(FOCUSABLE_SELECTOR)]
            .filter((el) => el instanceof HTMLElement && !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');
        const fallbackFocusableEl = logoutConfirmModalEls.cancelButton ?? logoutConfirmModalEls.submitButton;

        if (!focusableEls.length) {
            event.preventDefault();
            fallbackFocusableEl?.focus();
            return;
        }

        const firstFocusableEl = focusableEls[0];
        const lastFocusableEl = focusableEls[focusableEls.length - 1];
        const activeEl = document.activeElement;
        const isActiveInsideModal = activeEl instanceof Element && modalRootEl.contains(activeEl);

        if (event.shiftKey) {
            if (activeEl === firstFocusableEl || !isActiveInsideModal) {
                event.preventDefault();
                lastFocusableEl.focus();
            }
            return;
        }

        if (activeEl === lastFocusableEl || !isActiveInsideModal) {
            event.preventDefault();
            firstFocusableEl.focus();
        }
    }

    function isLicenseModalOpen() {
        return Boolean(licenseModalEls.root && !licenseModalEls.root.classList.contains('hide'));
    }

    function isChangelogModalOpen() {
        return Boolean(changelogModalEls.root && !changelogModalEls.root.classList.contains('hide'));
    }

    function isAppInfoDialogModalOpen() {
        return isLicenseModalOpen() || isChangelogModalOpen();
    }

    function setLicenseModalOpen(isOpen) {
        const modalRootEl = licenseModalEls.root;
        if (!modalRootEl) return;

        const nextOpen = Boolean(isOpen);
        if (nextOpen) {
            const activeEl = document.activeElement;
            lastFocusedElementBeforeLicenseModal = activeEl instanceof HTMLElement ? activeEl : null;
        }

        modalRootEl.classList.toggle('hide', !nextOpen);
        modalRootEl.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');

        if (nextOpen) {
            licenseModalEls.closeButton?.focus();
            return;
        }

        if (lastFocusedElementBeforeLicenseModal instanceof HTMLElement) {
            lastFocusedElementBeforeLicenseModal.focus();
        }
        lastFocusedElementBeforeLicenseModal = null;
    }

    function handleLicenseModalTabKeydown(event) {
        const modalRootEl = licenseModalEls.root;
        if (!modalRootEl) return;

        const focusableEls = [...modalRootEl.querySelectorAll(FOCUSABLE_SELECTOR)]
            .filter((el) => el instanceof HTMLElement && !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');

        if (!focusableEls.length) {
            event.preventDefault();
            licenseModalEls.closeButton?.focus();
            return;
        }

        const firstFocusableEl = focusableEls[0];
        const lastFocusableEl = focusableEls[focusableEls.length - 1];
        const activeEl = document.activeElement;
        const isActiveInsideModal = activeEl instanceof Element && modalRootEl.contains(activeEl);

        if (event.shiftKey) {
            if (activeEl === firstFocusableEl || !isActiveInsideModal) {
                event.preventDefault();
                lastFocusableEl.focus();
            }
            return;
        }

        if (activeEl === lastFocusableEl || !isActiveInsideModal) {
            event.preventDefault();
            firstFocusableEl.focus();
        }
    }

    function setChangelogModalOpen(isOpen) {
        const modalRootEl = changelogModalEls.root;
        if (!modalRootEl) return;

        const nextOpen = Boolean(isOpen);
        if (nextOpen) {
            const activeEl = document.activeElement;
            lastFocusedElementBeforeChangelogModal = activeEl instanceof HTMLElement ? activeEl : null;
        }

        modalRootEl.classList.toggle('hide', !nextOpen);
        modalRootEl.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');

        if (nextOpen) {
            changelogModalEls.closeButton?.focus();
            return;
        }

        if (lastFocusedElementBeforeChangelogModal instanceof HTMLElement) {
            lastFocusedElementBeforeChangelogModal.focus();
        }
        lastFocusedElementBeforeChangelogModal = null;
    }

    function handleChangelogModalTabKeydown(event) {
        const modalRootEl = changelogModalEls.root;
        if (!modalRootEl) return;

        const focusableEls = [...modalRootEl.querySelectorAll(FOCUSABLE_SELECTOR)]
            .filter((el) => el instanceof HTMLElement && !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');

        if (!focusableEls.length) {
            event.preventDefault();
            changelogModalEls.closeButton?.focus();
            return;
        }

        const firstFocusableEl = focusableEls[0];
        const lastFocusableEl = focusableEls[focusableEls.length - 1];
        const activeEl = document.activeElement;
        const isActiveInsideModal = activeEl instanceof Element && modalRootEl.contains(activeEl);

        if (event.shiftKey) {
            if (activeEl === firstFocusableEl || !isActiveInsideModal) {
                event.preventDefault();
                lastFocusableEl.focus();
            }
            return;
        }

        if (activeEl === lastFocusableEl || !isActiveInsideModal) {
            event.preventDefault();
            firstFocusableEl.focus();
        }
    }

    function syncAppSettingsPlacement(viewKey = state.currentView) {
        const appSettingsRootEl = appSettingsEls.root;
        if (!appSettingsRootEl) return;

        appSettingsRootEl.classList.toggle('is-board-main', viewKey === VIEW_KEY.board);
        appSettingsRootEl.classList.toggle('is-chat-main', viewKey === VIEW_KEY.chat);
    }

    function getSendKeymapTitle(keymap) {
        switch (keymap) {
            case SEND_KEYMAP.ctrlEnter:
                return 'Ctrl + Enter로 전송합니다.';
            case SEND_KEYMAP.metaEnter:
                return 'Cmd + Enter로 전송합니다.';
            case SEND_KEYMAP.enter:
            default:
                return 'Enter로 전송합니다.';
        }
    }

    function syncSendKeymapUi() {
        const selectEl = sendKeymapSettingEls.select;
        if (!selectEl) return;

        selectEl.value = state.sendKeymap;
        selectEl.setAttribute('title', getSendKeymapTitle(state.sendKeymap));
    }

    function setSendKeymap(keymap, { shouldPersist = false } = {}) {
        const nextKeymap = normaliseSendKeymap(keymap);
        state.sendKeymap = nextKeymap;
        syncSendKeymapUi();

        if (!shouldPersist) return;
        saveSendKeymap(nextKeymap);
    }

    function getChatAutoScrollModeTitle(mode) {
        switch (mode) {
            case CHAT_AUTO_SCROLL_MODE.always:
                return '새 메시지가 오면 항상 최신 위치로 이동합니다.';
            case CHAT_AUTO_SCROLL_MODE.off:
                return '새 메시지가 와도 자동으로 이동하지 않습니다.';
            case CHAT_AUTO_SCROLL_MODE.nearBottom:
            default:
                return '끝부분을 보고 있을 때만 자동 이동합니다.';
        }
    }

    function syncChatAutoScrollModeUi() {
        const selectEl = chatAutoScrollSettingEls.select;
        if (!selectEl) return;

        selectEl.value = state.chatAutoScrollMode;
        selectEl.setAttribute('title', getChatAutoScrollModeTitle(state.chatAutoScrollMode));
    }

    function setChatAutoScrollMode(mode, { shouldPersist = false } = {}) {
        const nextMode = normaliseChatAutoScrollMode(mode);
        state.chatAutoScrollMode = nextMode;
        syncChatAutoScrollModeUi();
        updateChatJumpLatestButtonVisibility();

        if (!shouldPersist) return;
        saveChatAutoScrollMode(nextMode);
    }

    function syncInstantDeleteModeUi() {
        const toggleEl = instantDeleteSettingEls.toggle;
        if (!toggleEl) return;

        const isEnabled = state.isInstantDeleteMode;
        toggleEl.classList.toggle('is-on', isEnabled);
        toggleEl.setAttribute('aria-checked', isEnabled ? 'true' : 'false');
        toggleEl.setAttribute('title', isEnabled
            ? '채팅/댓글 삭제 전 확인합니다.'
            : '채팅/댓글을 즉시 삭제합니다.');
    }

    function ensureUnicodeVisualiserController() {
        if (unicodeVisualiserController) {
            return unicodeVisualiserController;
        }

        const createVisualiser = getUnicodeifyApi()?.createVisualiser;
        if (typeof createVisualiser !== 'function') {
            if (!didWarnMissingUnicodeifyVisualiser) {
                didWarnMissingUnicodeifyVisualiser = true;
                console.warn('[App UI] Unicodeify visualiser is not available. Toggle will have no effect.');
            }
            return null;
        }

        try {
            const controller = createVisualiser({
                enabled: false,
                showOverlay: true,
                maxEntries: 64
            });
            if (!controller || typeof controller.setEnabled !== 'function') {
                return null;
            }
            unicodeVisualiserController = controller;
            return unicodeVisualiserController;
        } catch (error) {
            console.warn('[App UI] Failed to initialise Unicodeify visualiser.', error);
            return null;
        }
    }

    function destroyUnicodeVisualiserController() {
        if (!unicodeVisualiserController) return;

        try {
            unicodeVisualiserController.destroy?.();
        } catch (error) {
            console.warn('[App UI] Failed to dispose Unicodeify visualiser.', error);
        }

        unicodeVisualiserController = null;
    }

    function syncUnicodeVisualiserModeUi() {
        const toggleEl = unicodeVisualiserSettingEls.toggle;
        if (!toggleEl) return;

        const isEnabled = state.isUnicodeVisualiserModeEnabled;
        toggleEl.classList.toggle('is-on', isEnabled);
        toggleEl.setAttribute('aria-checked', isEnabled ? 'true' : 'false');
        toggleEl.setAttribute('title', isEnabled
            ? '드래그한 텍스트의 유니코드 번호를 표시합니다.'
            : '텍스트를 드래그해도 유니코드 번호를 표시하지 않습니다.');
    }

    function syncTwemojiDisabledModeUi() {
        const toggleEl = twemojiDisabledSettingEls.toggle;
        if (!toggleEl) return;

        const isEnabled = state.isTwemojiDisabled;
        toggleEl.classList.toggle('is-on', isEnabled);
        toggleEl.setAttribute('aria-checked', isEnabled ? 'true' : 'false');
        toggleEl.setAttribute('title', isEnabled
            ? '트위모지를 사용하지 않고 일반 텍스트로 이모지를 표시합니다.'
            : '트위모지로 이모지를 렌더링합니다.');
    }

    function refreshTwemojiPresentation() {
        document.querySelectorAll(RENDER_TARGET_SELECTOR).forEach((targetEl) => {
            renderedMarkdownByEl.delete(targetEl);
        });
        renderMarkdownAndMathIfAvailable();

        renderBoardList();

        const currentPost = state.currentPostId ? getBoardPostById(state.currentPostId) : null;
        if (currentPost && boardEls.detailTitle) {
            boardEls.detailTitle.textContent = decodeUnicodeImeTextForRender(currentPost.title);
            renderTwemoji(boardEls.detailTitle);
        }
    }

    function setUnicodeVisualiserMode(isEnabled, { shouldPersist = false } = {}) {
        const nextMode = Boolean(isEnabled);
        state.isUnicodeVisualiserModeEnabled = nextMode;
        syncUnicodeVisualiserModeUi();

        if (nextMode) {
            const controller = ensureUnicodeVisualiserController();
            controller?.setEnabled(true);
        } else {
            destroyUnicodeVisualiserController();
        }

        if (!shouldPersist) return;
        saveUnicodeVisualiserMode(nextMode);
    }

    function setTwemojiDisabledMode(isEnabled, { shouldPersist = false, shouldRefresh = true } = {}) {
        const nextMode = Boolean(isEnabled);
        const didChange = state.isTwemojiDisabled !== nextMode;
        state.isTwemojiDisabled = nextMode;
        syncTwemojiDisabledModeUi();

        if (shouldRefresh && didChange) {
            refreshTwemojiPresentation();
        }

        if (!shouldPersist) return;
        saveTwemojiDisabledMode(nextMode);
    }

    function setInstantDeleteMode(isEnabled, { shouldPersist = false } = {}) {
        const nextMode = Boolean(isEnabled);
        state.isInstantDeleteMode = nextMode;
        syncInstantDeleteModeUi();

        if (!shouldPersist) return;
        saveInstantDeleteMode(nextMode);
    }

    // 로그인/세션 전환 흐름
    function validateNickname(nickname) {
        if (!nickname) {
            return '닉네임을 입력해 주세요.';
        }

        if (nickname.length > NICKNAME_MAX_LENGTH) {
            return `닉네임은 ${NICKNAME_MAX_LENGTH}자 이하로 입력해 주세요.`;
        }

        return '';
    }

    function refreshApp() {
        const search = typeof window.location?.search === 'string' ? window.location.search : '';
        const hash = typeof window.location?.hash === 'string' ? window.location.hash : '';
        window.location.replace(`${APP_ENTRY_PATH}${search}${hash}`);
    }

    function handleLoginSubmit(event) {
        event.preventDefault();
        clearLobbyError();

        const nickname = normaliseNickname(lobbyEls.nicknameInput?.value ?? '');
        const validationMessage = validateNickname(nickname);
        if (validationMessage) {
            showLobbyError(validationMessage);
            return;
        }

        const didSaveSession = saveSession(nickname);
        if (!didSaveSession) {
            showLobbyError('브라우저 저장소에 접근할 수 없습니다. 설정을 확인해 주세요.');
            return;
        }

        refreshApp();
    }

    function initLobby() {
        showLobbyScreen();
        const { section } = getRouteStateFromLocation();
        if (!section || section === ROUTE_SECTION_KEY.lobby) {
            replaceRouteQuery(ROUTE_SECTION_KEY.lobby);
        }
        clearLobbyError();

        if (!lobbyEls.form || !lobbyEls.nicknameInput) return;

        if (!isLobbyEventBound) {
            lobbyEls.form.addEventListener('submit', handleLoginSubmit);
            lobbyEls.nicknameInput.addEventListener('input', clearLobbyError);
            isLobbyEventBound = true;
        }

        lobbyEls.nicknameInput.focus();
    }

    function logout() {
        setLogoutConfirmModalOpen(false);
        const didClearSession = clearStoredSession();
        if (!didClearSession) {
            window.alert('로그아웃에 실패했습니다. 브라우저 저장소 설정을 확인해 주세요.');
            return;
        }

        state.session = null;
        refreshApp();
    }

    function getUserInitial(nickname) {
        const compactName = nickname.replace(/\s+/g, '');
        if (!compactName) return 'ME';
        return Array.from(compactName).slice(0, 2).join('').toUpperCase();
    }

    function applySessionToUi(session) {
        const nickname = session.nickname;
        const initial = getUserInitial(nickname);

        document.querySelectorAll(USER_NAME_SELECTOR).forEach((targetEl) => {
            targetEl.textContent = nickname;
        });

        document.querySelectorAll(USER_INITIAL_SELECTOR).forEach((targetEl) => {
            targetEl.textContent = initial;
        });
    }

    function setChatEditingMessageId(messageId) {
        state.editingChatMessageId = messageId ?? null;
    }

    function setCommentEditingId(commentId) {
        state.editingCommentId = commentId ?? null;
    }

    function setPostEditMode(isEditMode, post = null) {
        const nextEditMode = Boolean(isEditMode);
        state.isPostEditing = nextEditMode;

        if (!boardEls.editForm || !boardEls.detailReadonly) {
            return;
        }

        boardEls.editForm.classList.toggle('hide', !nextEditMode);
        boardEls.detailReadonly.classList.toggle('hide', nextEditMode);

        if (nextEditMode && post && boardEls.editTitleInput && boardEls.editContentInput) {
            boardEls.editTitleInput.value = post.title;
            boardEls.editContentInput.value = post.content;
            boardEls.editTitleInput.focus();
            boardEls.editTitleInput.setSelectionRange(post.title.length, post.title.length);
        }
    }

    function setPostCreateMode(isCreateMode) {
        const nextCreateMode = Boolean(isCreateMode);
        state.isPostCreating = nextCreateMode;

        if (!boardEls.createForm) return;

        boardEls.createForm.classList.toggle('hide', !nextCreateMode);
        if (!nextCreateMode) return;

        if (boardEls.createTitleInput) {
            boardEls.createTitleInput.value = '';
            boardEls.createTitleInput.focus();
        }
        if (boardEls.createContentInput) {
            boardEls.createContentInput.value = '';
        }
    }

    function clearAllEditStates({ keepPostEdit = false, keepPostCreate = false } = {}) {
        setChatEditingMessageId(null);
        setCommentEditingId(null);

        if (!keepPostEdit) {
            setPostEditMode(false);
        }

        if (!keepPostCreate) {
            setPostCreateMode(false);
        }
    }

    // 공통 엔티티 생성/시간 포맷/토스트 UI
    function generateMessageId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        const nonce = Math.random().toString(16).slice(2, 10);
        return `msg-${Date.now()}-${nonce}`;
    }

    function createChatMessage(author, content, createdAt = null) {
        return {
            id: generateMessageId(),
            author,
            content,
            createdAt: createdAt ?? new Date().toISOString(),
            updatedAt: null
        };
    }

    function sanitiseStoredChatMessage(rawMessage) {
        if (!rawMessage || typeof rawMessage !== 'object') return null;

        const author = normaliseNickname(rawMessage.author);
        const content = normaliseChatContent(rawMessage.content);
        if (!author || !content || content.length > CHAT_MESSAGE_MAX_LENGTH) {
            return null;
        }

        const createdAtDate = new Date(rawMessage.createdAt);
        const updatedAtDate = rawMessage.updatedAt ? new Date(rawMessage.updatedAt) : null;
        const messageId = normaliseEntityId(rawMessage.id) || generateMessageId();

        return {
            id: messageId,
            author,
            content,
            createdAt: Number.isNaN(createdAtDate.getTime()) ? new Date().toISOString() : createdAtDate.toISOString(),
            updatedAt: updatedAtDate && !Number.isNaN(updatedAtDate.getTime()) ? updatedAtDate.toISOString() : null
        };
    }

    function buildDefaultChatMessages() {
        return [];
    }

    function saveChatMessages(messages) {
        try {
            window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save chat messages to localStorage.', error);
            return false;
        }
    }

    function loadChatMessages() {
        try {
            const rawMessages = window.localStorage.getItem(CHAT_STORAGE_KEY);
            if (!rawMessages) {
                const defaultMessages = buildDefaultChatMessages();
                saveChatMessages(defaultMessages);
                return defaultMessages;
            }

            const parsedMessages = JSON.parse(rawMessages);
            if (!Array.isArray(parsedMessages)) {
                const defaultMessages = buildDefaultChatMessages();
                saveChatMessages(defaultMessages);
                return defaultMessages;
            }

            const sanitisedMessages = filterUniqueItemsById(parsedMessages
                .map((rawMessage) => sanitiseStoredChatMessage(rawMessage))
                .filter(Boolean));

            if (!sanitisedMessages.length) {
                const defaultMessages = buildDefaultChatMessages();
                saveChatMessages(defaultMessages);
                return defaultMessages;
            }

            return sanitisedMessages;
        } catch (error) {
            console.warn('[App UI] Failed to load chat messages from localStorage.', error);
            const defaultMessages = buildDefaultChatMessages();
            saveChatMessages(defaultMessages);
            return defaultMessages;
        }
    }

    function isOwnChatMessage(message) {
        return message.author === state.session?.nickname;
    }

    function padToTwoDigits(value) {
        return String(value).padStart(2, '0');
    }

    function formatDateTimeForUi(isoDateTime) {
        const parsedDate = new Date(isoDateTime);
        if (Number.isNaN(parsedDate.getTime())) {
            return '----. --. --. --:--:--';
        }

        const year = parsedDate.getFullYear();
        const month = padToTwoDigits(parsedDate.getMonth() + 1);
        const day = padToTwoDigits(parsedDate.getDate());
        const hour = padToTwoDigits(parsedDate.getHours());
        const minute = padToTwoDigits(parsedDate.getMinutes());
        const second = padToTwoDigits(parsedDate.getSeconds());

        return `${year}. ${month}. ${day}. ${hour}:${minute}:${second}`;
    }

    function clearToastVariantClasses() {
        if (!(toastEl instanceof HTMLElement)) return;
        toastEl.classList.remove(...TOAST_VARIANT_CLASS_NAMES);
    }

    function ensureToastContentNodes() {
        if (!(toastEl instanceof HTMLElement)) {
            return {
                iconEl: null,
                textEl: null
            };
        }

        const shouldRebuild = !(toastIconEl instanceof HTMLElement)
            || !(toastTextEl instanceof HTMLElement)
            || !toastEl.contains(toastIconEl)
            || !toastEl.contains(toastTextEl);

        if (shouldRebuild) {
            toastEl.textContent = '';

            toastIconEl = document.createElement('i');
            toastIconEl.className = `app-toast-icon fa-solid ${TOAST_ICON_CLASS_BY_VARIANT.info}`;
            toastIconEl.setAttribute('aria-hidden', 'true');

            toastTextEl = document.createElement('span');
            toastTextEl.className = 'app-toast-text';

            toastEl.append(toastIconEl, toastTextEl);
        }

        return {
            iconEl: toastIconEl,
            textEl: toastTextEl
        };
    }

    function hideToast({ clearText = false } = {}) {
        if (!(toastEl instanceof HTMLElement)) return;

        toastEl.classList.remove('is-visible');
        if (activeToastHideTimerId) {
            window.clearTimeout(activeToastHideTimerId);
            activeToastHideTimerId = null;
        }

        if (!clearText) return;
        clearToastVariantClasses();
        const { iconEl, textEl } = ensureToastContentNodes();
        if (textEl instanceof HTMLElement) {
            textEl.textContent = '';
        }
        if (iconEl instanceof HTMLElement) {
            iconEl.className = `app-toast-icon fa-solid ${TOAST_ICON_CLASS_BY_VARIANT.info}`;
        }
    }

    function showToast(message, { durationMs = 1800, variant = 'info' } = {}) {
        if (!(toastEl instanceof HTMLElement)) return false;
        if (typeof message !== 'string') return false;

        const trimmedMessage = message.trim();
        if (!trimmedMessage) return false;
        const safeVariant = TOAST_VARIANT_SET.has(variant) ? variant : 'info';

        const currentSequence = ++toastSequence;
        hideToast({ clearText: true });

        window.setTimeout(() => {
            if (!(toastEl instanceof HTMLElement)) return;
            if (toastSequence !== currentSequence) return;

            const { iconEl, textEl } = ensureToastContentNodes();
            if (!(iconEl instanceof HTMLElement) || !(textEl instanceof HTMLElement)) return;

            const iconClassName = TOAST_ICON_CLASS_BY_VARIANT[safeVariant] ?? TOAST_ICON_CLASS_BY_VARIANT.info;
            iconEl.className = `app-toast-icon fa-solid ${iconClassName}`;
            textEl.textContent = trimmedMessage;
            clearToastVariantClasses();
            if (safeVariant !== 'info') {
                toastEl.classList.add(`is-${safeVariant}`);
            }
            toastEl.classList.add('is-visible');
            activeToastHideTimerId = window.setTimeout(() => {
                hideToast();
            }, Math.max(600, durationMs));
        }, 20);

        return true;
    }

    function copyOriginalTextToClipboard(rawText, failureMessage = '원본 복사에 실패했습니다.') {
        if (typeof rawText !== 'string') {
            const didShowToast = showToast('복사할 원본을 찾지 못했습니다.', {
                durationMs: 2200,
                variant: 'warning'
            });
            if (!didShowToast) {
                window.alert('복사할 원본을 찾지 못했습니다.');
            }
            return;
        }

        if (!window.isSecureContext || !navigator.clipboard?.writeText) {
            const message = '클립보드 복사를 사용할 수 없습니다. HTTPS 또는 localhost 환경에서 다시 시도해 주세요.';
            const didShowToast = showToast(message, {
                durationMs: 3400,
                variant: 'warning'
            });
            if (!didShowToast) {
                window.alert(message);
            }
            return;
        }

        try {
            navigator.clipboard.writeText(rawText)
                .then(() => {
                    showToast('원본을 복사했습니다.', {
                        variant: 'success'
                    });
                })
                .catch((error) => {
                    console.warn('[App UI] Failed to copy original text to clipboard.', error);

                    const isNotAllowedError = error?.name === 'NotAllowedError';
                    const errorMessage = isNotAllowedError
                        ? '클립보드 권한이 허용되지 않아 복사하지 못했습니다.'
                        : failureMessage;
                    const didShowToast = showToast(errorMessage, {
                        durationMs: isNotAllowedError ? 3000 : 2600,
                        variant: isNotAllowedError ? 'warning' : 'error'
                    });

                    if (!didShowToast) {
                        window.alert(errorMessage);
                    }
                });
        } catch (error) {
            console.warn('[App UI] Clipboard API threw before writeText completion.', error);
            const didShowToast = showToast(failureMessage, {
                durationMs: 2600,
                variant: 'error'
            });
            if (!didShowToast) {
                window.alert(failureMessage);
            }
        }
    }

    // Chat 도메인: 렌더링, 편집, 전송, 입력 핸들링
    function renderChatMessageItem(message) {
        const isOwn = isOwnChatMessage(message);
        const safeMessageId = escapeHtml(message.id);
        const safeAuthor = escapeHtml(message.author);
        const safeContent = escapeHtml(message.content);
        const displayTime = escapeHtml(formatDateTimeForUi(message.createdAt));
        const editedBadgeHtml = message.updatedAt
            ? '<span class="text-xs text-gray-500">(수정됨)</span>'
            : '';
        const isEditing = isOwn && state.editingChatMessageId === message.id;

        const avatarHtml = isOwn
            ? `<div class="w-10 h-10 rounded-full bg-[#ff4040] flex items-center justify-center shrink-0"><span data-user-initial class="font-bold">${escapeHtml(getUserInitial(message.author))}</span></div>`
            : '<div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-user text-white text-lg"></i></div>';

        const authorClass = isOwn ? 'font-bold text-[#ff4040]' : 'font-bold text-gray-200';
        const inlineActionHtml = isEditing
            ? ''
            : `<div class="content-action-group whitespace-nowrap">
                    <button
                        type="button"
                        data-action="${ACTION_KEY.copyChatOriginal}"
                        data-message-id="${safeMessageId}"
                        class="content-action-btn"
                        aria-label="메시지 원본 복사"
                        title="원본 복사"
                    >
                        <i class="fa-solid fa-copy" aria-hidden="true"></i>
                    </button>
                    ${isOwn
                        ? `<button
                                type="button"
                                data-action="${ACTION_KEY.editChat}"
                                data-message-id="${safeMessageId}"
                                class="content-action-btn"
                                aria-label="메시지 수정"
                                title="수정"
                           >
                                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                           </button>
                           <button
                                type="button"
                                data-action="${ACTION_KEY.deleteChat}"
                                data-message-id="${safeMessageId}"
                                class="content-action-btn is-danger"
                                aria-label="메시지 삭제"
                                title="삭제"
                           >
                                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                           </button>`
                        : ''}
               </div>`;
        const editBoxHtml = isOwn && isEditing
            ? `<div class="inline-edit-box mt-2" data-chat-edit-box data-message-id="${safeMessageId}">
                    <textarea class="inline-edit-input" data-chat-edit-input maxlength="${CHAT_MESSAGE_MAX_LENGTH}">${safeContent}</textarea>
                    <div class="inline-edit-actions">
                        <button type="button" data-action="${ACTION_KEY.cancelChatEdit}" data-message-id="${safeMessageId}" class="inline-edit-btn inline-edit-cancel">취소</button>
                        <button type="button" data-action="${ACTION_KEY.saveChatEdit}" data-message-id="${safeMessageId}" class="inline-edit-btn inline-edit-save">저장</button>
                    </div>
               </div>`
            : '';

        return `<div data-chat-item="true" data-message-id="${safeMessageId}" class="flex items-start gap-4 group">
                    ${avatarHtml}
                    <div class="chat-message-body">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-baseline gap-2">
                                <span class="${authorClass}">${safeAuthor}</span>
                                <span class="text-xs text-gray-500">${displayTime}</span>
                                ${editedBadgeHtml}
                            </div>
                            ${inlineActionHtml}
                        </div>
                        ${isEditing ? '' : `<div data-render="md" class="text-gray-300 mt-1">${safeContent}</div>`}
                        ${editBoxHtml}
                    </div>
                </div>`;
    }

    function buildChatMessageRenderDescriptors(messages) {
        if (!Array.isArray(messages)) return [];

        return messages.map((message, index) => {
            const itemId = normaliseEntityId(String(message?.id ?? ''));
            if (!itemId) {
                throw new Error(`[App UI] Invalid chat message id at index ${index}.`);
            }

            const html = renderChatMessageItem(message);
            return {
                id: itemId,
                html,
                signature: html
            };
        });
    }

    function renderChatMessagesFull(containerEl, itemDescriptors) {
        if (!(containerEl instanceof HTMLElement)) return;

        containerEl.innerHTML = itemDescriptors.map((descriptor) => descriptor.html).join('');

        if (state.session) {
            applySessionToUi(state.session);
        }
        renderMarkdownAndMathIfAvailable(containerEl);
    }

    function getChatScrollTargetEl() {
        return chatEls.scrollArea ?? chatEls.container;
    }

    function isChatNearBottom(scrollTargetEl, thresholdPx = CHAT_AUTO_SCROLL_THRESHOLD_PX) {
        if (!scrollTargetEl) return true;

        const distanceFromBottom = scrollTargetEl.scrollHeight - scrollTargetEl.clientHeight - scrollTargetEl.scrollTop;
        return distanceFromBottom <= Math.max(0, thresholdPx);
    }

    function setChatJumpLatestButtonVisible(isVisible) {
        if (!chatEls.jumpLatestButton) return;
        chatEls.jumpLatestButton.classList.toggle('hide', !isVisible);
    }

    function updateChatJumpLatestButtonVisibility() {
        const scrollTargetEl = getChatScrollTargetEl();
        if (!scrollTargetEl || !state.chatMessages.length) {
            setChatJumpLatestButtonVisible(false);
            return;
        }

        const hasScrollableHistory = (scrollTargetEl.scrollHeight - scrollTargetEl.clientHeight) > 1;
        const shouldShowButton = hasScrollableHistory && !isChatNearBottom(scrollTargetEl);
        setChatJumpLatestButtonVisible(shouldShowButton);
    }

    function shouldAutoScrollOnNewMessage(wasNearBottom) {
        switch (state.chatAutoScrollMode) {
            case CHAT_AUTO_SCROLL_MODE.always:
                return true;
            case CHAT_AUTO_SCROLL_MODE.off:
                return false;
            case CHAT_AUTO_SCROLL_MODE.nearBottom:
            default:
                return Boolean(wasNearBottom);
        }
    }

    function handleChatScroll() {
        updateChatJumpLatestButtonVisibility();
    }

    function handleJumpLatestButtonClick() {
        scrollChatToBottom();
    }

    function renderChatMessages() {
        if (!chatEls.container) return;

        if (!state.chatMessages.length) {
            chatEls.container.innerHTML = '<p class="text-sm text-gray-500">첫 메시지를 남겨 보세요.</p>';
            setChatJumpLatestButtonVisible(false);
            return;
        }

        let itemDescriptors = null;
        try {
            itemDescriptors = buildChatMessageRenderDescriptors(state.chatMessages);
            const changedRootEls = patchKeyedListChildren(chatEls.container, itemDescriptors, {
                markerAttr: 'data-chat-item',
                idDatasetKey: 'messageId',
                signatureByEl: chatItemRenderSignatureByEl
            });

            if (state.session) {
                applySessionToUi(state.session);
            }

            changedRootEls.forEach((changedRootEl) => {
                renderMarkdownAndMathIfAvailable(changedRootEl);
            });
        } catch (error) {
            console.warn('[App UI] Incremental chat render failed. Falling back to full render.', error);
            try {
                if (!Array.isArray(itemDescriptors)) {
                    itemDescriptors = buildChatMessageRenderDescriptors(state.chatMessages);
                }
                renderChatMessagesFull(chatEls.container, itemDescriptors);
            } catch (fallbackError) {
                console.warn('[App UI] Full chat render fallback failed.', fallbackError);
                chatEls.container.innerHTML = '<p class="text-sm text-red-500">채팅을 표시하지 못했습니다. 새로고침해 주세요.</p>';
                setChatJumpLatestButtonVisible(false);
                return;
            }
        }

        window.requestAnimationFrame(() => {
            updateChatJumpLatestButtonVisibility();
        });
    }

    function scrollChatToBottom() {
        const scrollTargetEl = getChatScrollTargetEl();
        if (!scrollTargetEl) return;
        scrollTargetEl.scrollTop = scrollTargetEl.scrollHeight;
        setChatJumpLatestButtonVisible(false);
    }

    function appendChatMessage(rawContent) {
        const wasNearBottom = isChatNearBottom(getChatScrollTargetEl());
        const author = getCurrentSessionNickname();
        if (!author) return false;

        const content = normaliseChatContent(rawContent);
        if (!content) return false;

        if (content.length > CHAT_MESSAGE_MAX_LENGTH) {
            window.alert(`메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자 이하로 입력해 주세요.`);
            return false;
        }

        const message = createChatMessage(author, content);
        const nextMessages = [...state.chatMessages, message];
        const didSave = saveChatMessages(nextMessages);
        if (!didSave) {
            window.alert('메시지를 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요.');
            return false;
        }

        state.chatMessages = nextMessages;
        renderChatMessages();
        if (shouldAutoScrollOnNewMessage(wasNearBottom)) {
            scrollChatToBottom();
        } else {
            updateChatJumpLatestButtonVisibility();
        }
        return true;
    }

    function editChatMessage(messageId) {
        if (!messageId) return;

        const targetMessage = state.chatMessages.find((message) => message.id === messageId);
        if (!isOwnChatMessage(targetMessage)) return;

        clearAllEditStates();
        setChatEditingMessageId(messageId);
        renderChatMessages();

        const editInputEl = findInlineEditInputByDataId(
            chatEls.container,
            '[data-chat-edit-box]',
            'messageId',
            messageId,
            '[data-chat-edit-input]'
        );
        if (editInputEl) {
            autoResizeTextarea(editInputEl);
            editInputEl.focus();
            editInputEl.setSelectionRange(editInputEl.value.length, editInputEl.value.length);
        }
    }

    function copyChatMessageOriginal(messageId) {
        if (!messageId) return;

        const targetMessage = state.chatMessages.find((message) => message.id === messageId);
        if (!targetMessage) return;

        copyOriginalTextToClipboard(targetMessage.content, '메시지 원본 복사에 실패했습니다.');
    }

    function saveChatMessageEdit(messageId, editedRawContent) {
        if (!messageId) return;

        const messageIndex = state.chatMessages.findIndex((message) => message.id === messageId);
        if (messageIndex < 0) return;

        const targetMessage = state.chatMessages[messageIndex];
        if (!isOwnChatMessage(targetMessage)) return;

        const editedContent = normaliseChatContent(editedRawContent);
        if (!editedContent) {
            window.alert('메시지는 비워둘 수 없습니다.');
            return;
        }

        if (editedContent.length > CHAT_MESSAGE_MAX_LENGTH) {
            window.alert(`메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자 이하로 입력해 주세요.`);
            return;
        }

        if (editedContent === targetMessage.content) {
            cancelChatMessageEdit();
            return;
        }

        const nextMessages = [...state.chatMessages];
        nextMessages[messageIndex] = {
            ...targetMessage,
            content: editedContent,
            updatedAt: new Date().toISOString()
        };

        const didSave = saveChatMessages(nextMessages);
        if (!didSave) {
            window.alert('수정 내용을 저장하지 못했습니다.');
            return;
        }

        state.chatMessages = nextMessages;
        setChatEditingMessageId(null);
        renderChatMessages();
    }

    function cancelChatMessageEdit() {
        if (!state.editingChatMessageId) return;
        setChatEditingMessageId(null);
        renderChatMessages();
    }

    function deleteChatMessage(messageId) {
        if (!messageId) return;

        const targetMessage = state.chatMessages.find((message) => message.id === messageId);
        if (!targetMessage || !isOwnChatMessage(targetMessage)) return;

        if (!state.isInstantDeleteMode) {
            const shouldDelete = window.confirm('이 메시지를 삭제하시겠습니까?');
            if (!shouldDelete) return;
        }

        const nextMessages = state.chatMessages.filter((message) => message.id !== messageId);
        const didSave = saveChatMessages(nextMessages);
        if (!didSave) {
            window.alert('삭제 내용을 저장하지 못했습니다.');
            return;
        }

        state.chatMessages = nextMessages;
        if (state.editingChatMessageId === messageId) {
            setChatEditingMessageId(null);
        }
        renderChatMessages();
    }

    function handleChatFormSubmit(event) {
        event.preventDefault();
        const inputEl = chatEls.input;
        if (!inputEl) return;

        const didSend = appendChatMessage(inputEl.value);
        if (!didSend) return;

        inputEl.value = '';
        autoResizeTextarea(inputEl);
        inputEl.focus();
    }

    function toggleInstantDeleteMode() {
        const nextMode = !state.isInstantDeleteMode;
        setInstantDeleteMode(nextMode, { shouldPersist: true });
        showToast(nextMode
            ? '채팅/댓글을 물어보지 않고 즉시 삭제합니다.'
            : '채팅/댓글을 삭제할 때 물어봅니다.');
    }

    function toggleUnicodeVisualiserMode() {
        const nextMode = !state.isUnicodeVisualiserModeEnabled;
        setUnicodeVisualiserMode(nextMode, { shouldPersist: true });
        showToast(nextMode
            ? '유니코드 비주얼라이저를 켰습니다.'
            : '유니코드 비주얼라이저를 껐습니다.');
    }

    function toggleTwemojiDisabledMode() {
        const nextMode = !state.isTwemojiDisabled;
        setTwemojiDisabledMode(nextMode, { shouldPersist: true });
        showToast(nextMode
            ? '트위모지를 사용하지 않습니다.'
            : '트위모지를 사용합니다.');
    }

    function handleSendKeymapSettingChange(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLSelectElement)) return;
        setSendKeymap(targetEl.value, { shouldPersist: true });
    }

    function handleChatAutoScrollSettingChange(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLSelectElement)) return;
        setChatAutoScrollMode(targetEl.value, { shouldPersist: true });
    }

    function shouldSubmitBySendKeymap(event) {
        if (event.key !== 'Enter') return false;
        if (event.isComposing) return false;

        switch (state.sendKeymap) {
            case SEND_KEYMAP.ctrlEnter:
                return event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
            case SEND_KEYMAP.metaEnter:
                return event.metaKey && !event.shiftKey && !event.altKey && !event.ctrlKey;
            case SEND_KEYMAP.enter:
            default:
                return !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;
        }
    }

    function requestFormSubmit(formEl) {
        if (!formEl) return;

        if (typeof formEl.requestSubmit === 'function') {
            formEl.requestSubmit();
            return;
        }

        formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }

    function handleChatInputKeydown(event) {
        if (!shouldSubmitBySendKeymap(event)) return;
        event.preventDefault();
        requestFormSubmit(chatEls.form);
    }

    function handleChatInputAutoResize(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLTextAreaElement)) return;
        autoResizeTextarea(targetEl);
    }

    function handleCommentInputKeydown(event) {
        if (!shouldSubmitBySendKeymap(event)) return;
        event.preventDefault();
        requestFormSubmit(boardEls.commentForm);
    }

    function handleCommentInputAutoResize(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLTextAreaElement)) return;
        autoResizeTextarea(targetEl);
    }

    function handleChatInlineEditKeydown(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLTextAreaElement)) return;
        if (!targetEl.matches('[data-chat-edit-input]')) return;
        if (!shouldSubmitBySendKeymap(event)) return;

        event.preventDefault();

        const editBoxEl = targetEl.closest('[data-chat-edit-box]');
        const messageId = editBoxEl?.dataset?.messageId;
        if (!messageId) return;

        saveChatMessageEdit(messageId, targetEl.value ?? '');
    }

    function handleChatInlineEditInput(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLTextAreaElement)) return;
        if (!targetEl.matches('[data-chat-edit-input]')) return;
        autoResizeTextarea(targetEl);
    }

    function handleCommentInlineEditKeydown(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLTextAreaElement)) return;
        if (!shouldSubmitBySendKeymap(event)) return;

        if (targetEl.matches('[data-comment-edit-input]')) {
            event.preventDefault();

            const editBoxEl = targetEl.closest('[data-comment-edit-box]');
            const commentId = editBoxEl?.dataset?.commentId;
            if (!commentId) return;

            saveCommentEdit(commentId, targetEl.value ?? '');
            return;
        }

        if (!targetEl.matches('[data-comment-reply-input]')) return;
        event.preventDefault();

        const replyBoxEl = targetEl.closest('[data-comment-reply-box]');
        const commentId = replyBoxEl?.dataset?.commentId;
        if (!commentId) return;

        createCommentReply(commentId, targetEl.value ?? '');
    }

    function handleCommentInlineEditInput(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof HTMLTextAreaElement)) return;
        if (!targetEl.matches('[data-comment-edit-input]') && !targetEl.matches('[data-comment-reply-input]')) return;
        autoResizeTextarea(targetEl);
    }

    function initChat() {
        state.chatMessages = loadChatMessages();
        renderChatMessages();

        window.requestAnimationFrame(() => {
            if (state.chatAutoScrollMode !== CHAT_AUTO_SCROLL_MODE.off) {
                scrollChatToBottom();
            }
            updateChatJumpLatestButtonVisibility();
        });
    }

    // Board 도메인: 게시글/댓글 저장 및 상세 화면 로직
    function createBoardPost(author, title, content, createdAt = null) {
        return {
            id: generateMessageId(),
            author,
            title,
            content,
            createdAt: createdAt ?? new Date().toISOString(),
            updatedAt: null
        };
    }

    function sanitiseStoredBoardPost(rawPost) {
        if (!rawPost || typeof rawPost !== 'object') return null;

        const author = normaliseNickname(rawPost.author);
        const title = normalisePostTitle(rawPost.title);
        const content = normalisePostContent(rawPost.content);
        if (!author || !title || !content) return null;
        if (title.length > POST_TITLE_MAX_LENGTH || content.length > POST_CONTENT_MAX_LENGTH) return null;

        const createdAtDate = new Date(rawPost.createdAt);
        const updatedAtDate = rawPost.updatedAt ? new Date(rawPost.updatedAt) : null;
        const postId = normaliseEntityId(rawPost.id) || generateMessageId();

        return {
            id: postId,
            author,
            title,
            content,
            createdAt: Number.isNaN(createdAtDate.getTime()) ? new Date().toISOString() : createdAtDate.toISOString(),
            updatedAt: updatedAtDate && !Number.isNaN(updatedAtDate.getTime()) ? updatedAtDate.toISOString() : null
        };
    }

    function sortBoardPostsByCreatedAtDesc(posts) {
        return [...posts].sort((leftPost, rightPost) => {
            return new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime();
        });
    }

    function saveBoardPosts(posts) {
        try {
            window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(posts));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save board posts to localStorage.', error);
            return false;
        }
    }

    function buildDefaultBoardPosts() {
        return [];
    }

    function loadBoardPosts() {
        try {
            const rawPosts = window.localStorage.getItem(BOARD_STORAGE_KEY);
            if (!rawPosts) {
                const defaultPosts = buildDefaultBoardPosts();
                saveBoardPosts(defaultPosts);
                return defaultPosts;
            }

            const parsedPosts = JSON.parse(rawPosts);
            if (!Array.isArray(parsedPosts)) {
                const defaultPosts = buildDefaultBoardPosts();
                saveBoardPosts(defaultPosts);
                return defaultPosts;
            }

            const sanitisedPosts = filterUniqueItemsById(parsedPosts
                .map((rawPost) => sanitiseStoredBoardPost(rawPost))
                .filter(Boolean));

            return sortBoardPostsByCreatedAtDesc(sanitisedPosts);
        } catch (error) {
            console.warn('[App UI] Failed to load board posts from localStorage.', error);
            const defaultPosts = buildDefaultBoardPosts();
            saveBoardPosts(defaultPosts);
            return defaultPosts;
        }
    }

    function formatBoardDate(isoDateTime) {
        return formatDateTimeForUi(isoDateTime);
    }

    function getBoardPostById(postId) {
        const normalisedPostId = normaliseEntityId(String(postId ?? ''));
        if (!normalisedPostId) return null;
        return state.boardPosts.find((post) => post.id === normalisedPostId) ?? null;
    }

    function isOwnBoardPost(post) {
        return post?.author === state.session?.nickname;
    }

    function renderBoardList() {
        if (!boardEls.list) return;

        if (!state.boardPosts.length) {
            boardEls.list.innerHTML = '<div class="p-6 text-sm text-gray-500">아직 게시글이 없습니다. 첫 글을 작성해 보세요.</div>';
            renderTwemoji(boardEls.list);
            return;
        }

        boardEls.list.innerHTML = state.boardPosts.map((post) => {
            const safePostId = escapeHtml(post.id);
            const safeTitle = escapeHtml(decodeUnicodeImeTextForRender(post.title));
            const safeAuthor = escapeHtml(post.author);
            const safeDate = escapeHtml(formatBoardDate(post.createdAt));
            const editedTag = post.updatedAt ? ' · 수정됨' : '';

            return `<button
                        type="button"
                        data-action="${ACTION_KEY.viewPost}"
                        data-post-id="${safePostId}"
                        class="w-full border-b border-gray-800 p-4 hover:bg-[#252525] cursor-pointer transition-colors flex justify-between items-center group text-left"
                    >
                        <div>
                            <h3 class="font-medium text-gray-200 group-hover:text-[#ff4040] transition-colors">${safeTitle}</h3>
                            <div class="text-xs text-gray-500 mt-1">작성자: ${safeAuthor}${editedTag}</div>
                        </div>
                        <span class="text-sm text-gray-500">${safeDate}</span>
                    </button>`;
        }).join('');
        renderTwemoji(boardEls.list);
    }

    function renderPostDetail(post) {
        if (!post) return;
        if (!boardEls.detailTitle || !boardEls.detailAuthor || !boardEls.detailDate || !boardEls.detailContent) return;

        const isCurrentPost = state.currentPostId === post.id;
        const isEditingCurrentPost = isCurrentPost && state.isPostEditing;
        boardEls.detailTitle.textContent = decodeUnicodeImeTextForRender(post.title);
        renderTwemoji(boardEls.detailTitle);
        boardEls.detailAuthor.textContent = post.author;
        boardEls.detailDate.textContent = formatBoardDate(post.createdAt);
        setMarkdownSource(boardEls.detailContent, post.content);
        renderMarkdownAndMathIfAvailable(boardEls.detailContent);

        const isOwn = isOwnBoardPost(post);
        if (boardEls.detailCopyButton) {
            boardEls.detailCopyButton.classList.remove('hide');
            boardEls.detailCopyButton.disabled = false;
            boardEls.detailCopyButton.setAttribute('aria-disabled', 'false');
            boardEls.detailCopyButton.title = '원본 복사';
        }

        if (boardEls.detailEditButton) {
            const isActionBlocked = isOwn && isEditingCurrentPost;
            boardEls.detailEditButton.classList.toggle('hide', !isOwn);
            boardEls.detailEditButton.disabled = false;
            boardEls.detailEditButton.setAttribute('aria-disabled', isActionBlocked ? 'true' : 'false');
            boardEls.detailEditButton.title = isActionBlocked
                ? '수정 중입니다.'
                : '수정';
        }
        if (boardEls.detailDeleteButton) {
            const isActionBlocked = isOwn && isEditingCurrentPost;
            boardEls.detailDeleteButton.classList.toggle('hide', !isOwn);
            boardEls.detailDeleteButton.disabled = false;
            boardEls.detailDeleteButton.setAttribute('aria-disabled', isActionBlocked ? 'true' : 'false');
            boardEls.detailDeleteButton.title = isActionBlocked
                ? '수정 중에는 삭제할 수 없습니다.'
                : '삭제';
        }

        setPostEditMode(isEditingCurrentPost, post);
        renderPostComments(post.id);
    }

    function createBoardComment(postId, author, content, parentCommentId = null, createdAt = null) {
        return {
            id: generateMessageId(),
            postId,
            author,
            content,
            parentCommentId,
            createdAt: createdAt ?? new Date().toISOString(),
            updatedAt: null
        };
    }

    function sanitiseStoredBoardComment(rawComment, postId) {
        if (!rawComment || typeof rawComment !== 'object') return null;

        const author = normaliseNickname(rawComment.author);
        const content = normaliseCommentContent(rawComment.content);
        if (!author || !content || content.length > BOARD_COMMENT_MAX_LENGTH) {
            return null;
        }

        const createdAtDate = new Date(rawComment.createdAt);
        const updatedAtDate = rawComment.updatedAt ? new Date(rawComment.updatedAt) : null;
        const commentId = normaliseEntityId(rawComment.id) || generateMessageId();
        const parentCommentId = normaliseEntityId(rawComment.parentCommentId);

        return {
            id: commentId,
            postId,
            author,
            content,
            parentCommentId: parentCommentId && parentCommentId !== commentId ? parentCommentId : null,
            createdAt: Number.isNaN(createdAtDate.getTime()) ? new Date().toISOString() : createdAtDate.toISOString(),
            updatedAt: updatedAtDate && !Number.isNaN(updatedAtDate.getTime()) ? updatedAtDate.toISOString() : null
        };
    }

    function sortBoardCommentsByCreatedAtAsc(comments) {
        return [...comments].sort((leftComment, rightComment) => {
            return new Date(leftComment.createdAt).getTime() - new Date(rightComment.createdAt).getTime();
        });
    }

    function saveBoardCommentsByPost(commentsByPost) {
        try {
            window.localStorage.setItem(BOARD_COMMENT_STORAGE_KEY, JSON.stringify(commentsByPost));
            return true;
        } catch (error) {
            console.warn('[App UI] Failed to save board comments to localStorage.', error);
            return false;
        }
    }

    function buildDefaultBoardCommentsByPost() {
        return {};
    }

    function sanitiseBoardCommentsByPost(rawCommentsByPost, posts) {
        const validPostIdSet = new Set(posts.map((post) => post.id));
        const nextCommentsByPost = {};

        if (!rawCommentsByPost || typeof rawCommentsByPost !== 'object' || Array.isArray(rawCommentsByPost)) {
            return nextCommentsByPost;
        }

        Object.entries(rawCommentsByPost).forEach(([postId, rawComments]) => {
            if (!validPostIdSet.has(postId) || !Array.isArray(rawComments)) return;

            const sanitisedComments = filterUniqueItemsById(rawComments
                .map((rawComment) => sanitiseStoredBoardComment(rawComment, postId))
                .filter(Boolean));

            nextCommentsByPost[postId] = sortBoardCommentsByCreatedAtAsc(sanitisedComments);
        });

        return nextCommentsByPost;
    }

    function loadBoardCommentsByPost(posts) {
        try {
            const rawCommentsByPost = window.localStorage.getItem(BOARD_COMMENT_STORAGE_KEY);
            if (!rawCommentsByPost) {
                const defaultComments = buildDefaultBoardCommentsByPost();
                saveBoardCommentsByPost(defaultComments);
                return defaultComments;
            }

            const parsedCommentsByPost = JSON.parse(rawCommentsByPost);
            const sanitisedCommentsByPost = sanitiseBoardCommentsByPost(parsedCommentsByPost, posts);
            return sanitisedCommentsByPost;
        } catch (error) {
            console.warn('[App UI] Failed to load board comments from localStorage.', error);
            const fallbackComments = buildDefaultBoardCommentsByPost();
            saveBoardCommentsByPost(fallbackComments);
            return fallbackComments;
        }
    }

    function getBoardCommentsForPost(postId) {
        if (!postId) return [];
        const comments = state.boardCommentsByPost[postId];
        if (!Array.isArray(comments)) return [];
        return sortBoardCommentsByCreatedAtAsc(comments);
    }

    function getBoardCommentById(postId, commentId) {
        const normalisedPostId = normaliseEntityId(String(postId ?? ''));
        const normalisedCommentId = normaliseEntityId(String(commentId ?? ''));
        if (!normalisedPostId || !normalisedCommentId) return null;
        const comments = getBoardCommentsForPost(normalisedPostId);
        return comments.find((comment) => comment.id === normalisedCommentId) ?? null;
    }

    function isOwnBoardComment(comment) {
        return comment?.author === state.session?.nickname;
    }

    function setPendingReplyCommentId(commentId, { shouldRender = true } = {}) {
        const normalisedCommentId = normaliseEntityId(String(commentId ?? ''));
        state.pendingReplyCommentId = normalisedCommentId || null;

        if (!shouldRender) return;
        if (state.currentPostId) {
            renderPostComments(state.currentPostId);
        }
    }

    function renderBoardCommentItem(comment, depth = 0) {
        const safeCommentId = escapeHtml(comment.id);
        const safeAuthor = escapeHtml(comment.author);
        const safeContent = escapeHtml(comment.content);
        const safeDate = escapeHtml(formatBoardDate(comment.createdAt));
        const isOwn = isOwnBoardComment(comment);
        const isReply = depth > 0;
        const isEditing = isOwn && state.editingCommentId === comment.id;
        const isReplying = state.pendingReplyCommentId === comment.id;
        const editedTag = comment.updatedAt
            ? '<span class="text-xs text-gray-500">(수정됨)</span>'
            : '';

        const wrapperClass = isReply
            ? 'flex gap-4 mb-6 ml-14 group'
            : 'flex gap-4 mb-6 group';

        const avatarHtml = isOwn
            ? isReply
                ? `<div class="w-8 h-8 rounded-full bg-[#ff4040] flex items-center justify-center shrink-0"><span class="font-bold text-white text-xs">${escapeHtml(getUserInitial(comment.author))}</span></div>`
                : `<div class="w-10 h-10 rounded-full bg-[#ff4040] flex items-center justify-center shrink-0"><span class="font-bold">${escapeHtml(getUserInitial(comment.author))}</span></div>`
            : isReply
                ? '<div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-user text-gray-300 text-xs"></i></div>'
                : '<div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-user text-gray-300 text-lg"></i></div>';

        const authorClass = isOwn ? 'font-bold text-[#ff4040] text-sm' : 'font-bold text-gray-200 text-sm';
        const contentActionHtml = isEditing
            ? ''
            : `<div class="content-action-group">
                    <button
                        type="button"
                        data-action="${ACTION_KEY.copyCommentOriginal}"
                        data-comment-id="${safeCommentId}"
                        class="content-action-btn"
                        aria-label="댓글 원본 복사"
                        title="원본 복사"
                    >
                        <i class="fa-solid fa-copy" aria-hidden="true"></i>
                    </button>
                    ${isOwn
                        ? `<button
                                type="button"
                                data-action="${ACTION_KEY.editComment}"
                                data-comment-id="${safeCommentId}"
                                class="content-action-btn"
                                aria-label="댓글 수정"
                                title="수정"
                           >
                                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                           </button>
                           <button
                                type="button"
                                data-action="${ACTION_KEY.deleteComment}"
                                data-comment-id="${safeCommentId}"
                                class="content-action-btn is-danger"
                                aria-label="댓글 삭제"
                                title="삭제"
                           >
                                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                           </button>`
                        : ''}
               </div>`;
        const editBoxHtml = isEditing
            ? `<div class="inline-edit-box mt-2" data-comment-edit-box data-comment-id="${safeCommentId}">
                    <textarea class="inline-edit-input" data-comment-edit-input maxlength="${BOARD_COMMENT_MAX_LENGTH}">${safeContent}</textarea>
                    <div class="inline-edit-actions">
                        <button type="button" data-action="${ACTION_KEY.cancelCommentEdit}" data-comment-id="${safeCommentId}" class="inline-edit-btn inline-edit-cancel">취소</button>
                        <button type="button" data-action="${ACTION_KEY.saveCommentEdit}" data-comment-id="${safeCommentId}" class="inline-edit-btn inline-edit-save">저장</button>
                    </div>
               </div>`
            : '';
        const replyButtonHtml = isEditing
            ? ''
            : `<button type="button" data-action="${ACTION_KEY.replyComment}" data-comment-id="${safeCommentId}" class="text-xs text-gray-500 hover:text-[#ff4040] transition-colors">답글</button>`;
        const replyBoxHtml = isReplying && !isEditing
            ? `<div class="inline-edit-box mt-3" data-comment-reply-box data-comment-id="${safeCommentId}">
                    <textarea class="inline-edit-input" data-comment-reply-input maxlength="${BOARD_COMMENT_MAX_LENGTH}" placeholder="${safeAuthor} 님에게 답글을 입력하세요..."></textarea>
                    <div class="inline-edit-actions">
                        <button type="button" data-action="${ACTION_KEY.cancelReply}" data-comment-id="${safeCommentId}" class="inline-edit-btn inline-edit-cancel">취소</button>
                        <button type="button" data-action="${ACTION_KEY.saveCommentReply}" data-comment-id="${safeCommentId}" class="inline-edit-btn inline-edit-save">등록</button>
                    </div>
               </div>`
            : '';

        return `<div data-comment-item="true" data-comment-id="${safeCommentId}" class="${wrapperClass}">
                    ${avatarHtml}
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <div class="flex items-center gap-2">
                                <span class="${authorClass}">${safeAuthor}</span>
                                <span class="text-xs text-gray-500">${safeDate}</span>
                                ${editedTag}
                            </div>
                            <div class="flex items-center gap-2">
                                ${replyButtonHtml}
                                ${contentActionHtml}
                            </div>
                        </div>
                        ${isEditing ? '' : `<div data-render="md" class="text-gray-300 text-sm leading-relaxed">${safeContent}</div>`}
                        ${editBoxHtml}
                        ${replyBoxHtml}
                    </div>
                </div>`;
    }

    function renderPostCommentsFull(containerEl, itemDescriptors) {
        if (!(containerEl instanceof HTMLElement)) return;

        containerEl.innerHTML = itemDescriptors.map((descriptor) => descriptor.html).join('');
        renderMarkdownAndMathIfAvailable(containerEl);
    }

    function renderPostComments(postId) {
        if (!boardEls.commentsList || !boardEls.commentsCount) return;

        const comments = getBoardCommentsForPost(postId);
        if (state.pendingReplyCommentId) {
            const hasReplyTarget = comments.some((comment) => comment.id === state.pendingReplyCommentId);
            if (!hasReplyTarget) {
                state.pendingReplyCommentId = null;
            }
        }
        boardEls.commentsCount.textContent = String(comments.length);

        if (!comments.length) {
            boardEls.commentsList.innerHTML = '<p class="text-sm text-gray-500 mb-6">아직 댓글이 없습니다. 첫 댓글을 작성해 주세요.</p>';
            return;
        }

        const commentById = new Map(comments.map((comment) => [comment.id, comment]));
        const childrenByParentId = new Map();
        const ROOT_KEY = '__root__';

        comments.forEach((comment) => {
            const parentKey = comment.parentCommentId && commentById.has(comment.parentCommentId)
                ? comment.parentCommentId
                : ROOT_KEY;

            const siblings = childrenByParentId.get(parentKey) ?? [];
            siblings.push(comment);
            childrenByParentId.set(parentKey, siblings);
        });

        const buildCommentItemDescriptors = () => {
            const nextDescriptors = [];

            const renderTree = (parentId, depth, ancestors = new Set()) => {
                const nodes = childrenByParentId.get(parentId) ?? [];
                nodes.forEach((comment) => {
                    if (ancestors.has(comment.id)) {
                        return;
                    }

                    const nextAncestors = new Set(ancestors);
                    nextAncestors.add(comment.id);
                    const itemId = normaliseEntityId(String(comment.id ?? ''));
                    if (!itemId) {
                        throw new Error('[App UI] Invalid board comment id while rendering comment tree.');
                    }

                    const html = renderBoardCommentItem(comment, depth);
                    nextDescriptors.push({
                        id: itemId,
                        html,
                        signature: html
                    });
                    renderTree(comment.id, depth + 1, nextAncestors);
                });
            };

            renderTree(ROOT_KEY, 0);
            return nextDescriptors;
        };

        try {
            const itemDescriptors = buildCommentItemDescriptors();
            const changedRootEls = patchKeyedListChildren(boardEls.commentsList, itemDescriptors, {
                markerAttr: 'data-comment-item',
                idDatasetKey: 'commentId',
                signatureByEl: commentItemRenderSignatureByEl
            });

            changedRootEls.forEach((changedRootEl) => {
                renderMarkdownAndMathIfAvailable(changedRootEl);
            });
        } catch (error) {
            console.warn('[App UI] Incremental comment render failed. Falling back to full render.', error);
            try {
                const itemDescriptors = buildCommentItemDescriptors();
                renderPostCommentsFull(boardEls.commentsList, itemDescriptors);
            } catch (fallbackError) {
                console.warn('[App UI] Full comment render fallback failed.', fallbackError);
                boardEls.commentsList.innerHTML = '<p class="text-sm text-red-500 mb-6">댓글을 표시하지 못했습니다. 새로고침해 주세요.</p>';
            }
        }
    }

    function updateBoardCommentsForPost(postId, nextComments) {
        const normalisedComments = sortBoardCommentsByCreatedAtAsc(nextComments);
        if (state.editingCommentId) {
            const stillExists = normalisedComments.some((comment) => comment.id === state.editingCommentId);
            if (!stillExists) {
                setCommentEditingId(null);
            }
        }

        const nextCommentsByPost = {
            ...state.boardCommentsByPost,
            [postId]: normalisedComments
        };

        const didSave = saveBoardCommentsByPost(nextCommentsByPost);
        if (!didSave) {
            window.alert('댓글 내용을 저장하지 못했습니다.');
            return false;
        }

        state.boardCommentsByPost = nextCommentsByPost;
        renderPostComments(postId);
        return true;
    }

    function createComment() {
        const postId = state.currentPostId;
        const commentInputEl = boardEls.commentInput;
        if (!postId || !commentInputEl) return;
        const author = getCurrentSessionNickname();
        if (!author) return;

        const content = normaliseCommentContent(commentInputEl.value);
        if (!content) return;
        if (content.length > BOARD_COMMENT_MAX_LENGTH) {
            window.alert(`댓글은 ${BOARD_COMMENT_MAX_LENGTH}자 이하로 입력해 주세요.`);
            return;
        }

        const nextComments = [
            ...getBoardCommentsForPost(postId),
            createBoardComment(postId, author, content, null)
        ];

        const didUpdate = updateBoardCommentsForPost(postId, nextComments);
        if (!didUpdate) return;

        commentInputEl.value = '';
        autoResizeTextarea(commentInputEl);
        commentInputEl.focus();
    }

    function createCommentReply(parentCommentId, editedRawContent) {
        const postId = state.currentPostId;
        if (!postId || !parentCommentId) return;
        const author = getCurrentSessionNickname();
        if (!author) return;

        const targetComment = getBoardCommentById(postId, parentCommentId);
        if (!targetComment) {
            setPendingReplyCommentId(null);
            return;
        }

        const content = normaliseCommentContent(editedRawContent);
        if (!content) {
            window.alert('답글 내용을 입력해 주세요.');
            return;
        }
        if (content.length > BOARD_COMMENT_MAX_LENGTH) {
            window.alert(`답글은 ${BOARD_COMMENT_MAX_LENGTH}자 이하로 입력해 주세요.`);
            return;
        }

        const nextComments = [
            ...getBoardCommentsForPost(postId),
            createBoardComment(postId, author, content, targetComment.id)
        ];

        const didUpdate = updateBoardCommentsForPost(postId, nextComments);
        if (!didUpdate) return;
        setPendingReplyCommentId(null);
    }

    function replyToComment(commentId) {
        const postId = state.currentPostId;
        if (!postId || !commentId) return;

        const comment = getBoardCommentById(postId, commentId);
        if (!comment) return;

        if (state.editingCommentId) {
            setCommentEditingId(null);
        }
        if (state.pendingReplyCommentId === comment.id) {
            setPendingReplyCommentId(null);
            return;
        }
        setPendingReplyCommentId(comment.id);

        const replyInputEl = findInlineEditInputByDataId(
            boardEls.commentsList,
            '[data-comment-reply-box]',
            'commentId',
            comment.id,
            '[data-comment-reply-input]'
        );
        if (replyInputEl) {
            autoResizeTextarea(replyInputEl);
            replyInputEl.focus();
        }
    }

    function copyCommentOriginal(commentId) {
        const postId = state.currentPostId;
        if (!postId || !commentId) return;

        const targetComment = getBoardCommentById(postId, commentId);
        if (!targetComment) return;

        copyOriginalTextToClipboard(targetComment.content, '댓글 원본 복사에 실패했습니다.');
    }

    function editComment(commentId) {
        const postId = state.currentPostId;
        if (!postId || !commentId) return;

        const targetComment = getBoardCommentById(postId, commentId);
        if (!targetComment) return;
        if (!isOwnBoardComment(targetComment)) {
            window.alert('본인이 작성한 댓글만 수정할 수 있습니다.');
            return;
        }

        clearAllEditStates();
        setPendingReplyCommentId(null, { shouldRender: false });
        setCommentEditingId(commentId);
        renderPostComments(postId);

        const editInputEl = findInlineEditInputByDataId(
            boardEls.commentsList,
            '[data-comment-edit-box]',
            'commentId',
            commentId,
            '[data-comment-edit-input]'
        );
        if (editInputEl) {
            autoResizeTextarea(editInputEl);
            editInputEl.focus();
            editInputEl.setSelectionRange(editInputEl.value.length, editInputEl.value.length);
        }
    }

    function saveCommentEdit(commentId, editedRawContent) {
        const postId = state.currentPostId;
        if (!postId || !commentId) return;

        const targetComment = getBoardCommentById(postId, commentId);
        if (!targetComment) return;
        if (!isOwnBoardComment(targetComment)) return;

        const editedContent = normaliseCommentContent(editedRawContent);
        if (!editedContent) {
            window.alert('댓글 내용을 입력해 주세요.');
            return;
        }
        if (editedContent.length > BOARD_COMMENT_MAX_LENGTH) {
            window.alert(`댓글은 ${BOARD_COMMENT_MAX_LENGTH}자 이하로 입력해 주세요.`);
            return;
        }
        if (editedContent === targetComment.content) return;

        const nextComments = getBoardCommentsForPost(postId).map((comment) => {
            if (comment.id !== commentId) return comment;
            return {
                ...comment,
                content: editedContent,
                updatedAt: new Date().toISOString()
            };
        });

        setCommentEditingId(null);
        const didUpdate = updateBoardCommentsForPost(postId, nextComments);
        if (!didUpdate) {
            setCommentEditingId(commentId);
            renderPostComments(postId);
        }
    }

    function cancelCommentEdit() {
        if (!state.editingCommentId) return;
        const postId = state.currentPostId;
        setCommentEditingId(null);
        if (postId) {
            renderPostComments(postId);
        }
    }

    function deleteComment(commentId) {
        const postId = state.currentPostId;
        if (!postId || !commentId) return;

        const targetComment = getBoardCommentById(postId, commentId);
        if (!targetComment) return;
        if (!isOwnBoardComment(targetComment)) {
            window.alert('본인이 작성한 댓글만 삭제할 수 있습니다.');
            return;
        }

        if (!state.isInstantDeleteMode) {
            const shouldDelete = window.confirm('이 댓글을 삭제하시겠습니까? 답글도 함께 삭제됩니다.');
            if (!shouldDelete) return;
        }

        const comments = getBoardCommentsForPost(postId);
        const commentIdsToDelete = new Set([commentId]);

        let didFindDescendant = true;
        while (didFindDescendant) {
            didFindDescendant = false;
            comments.forEach((comment) => {
                if (!comment.parentCommentId) return;
                if (commentIdsToDelete.has(comment.parentCommentId) && !commentIdsToDelete.has(comment.id)) {
                    commentIdsToDelete.add(comment.id);
                    didFindDescendant = true;
                }
            });
        }

        const nextComments = comments.filter((comment) => !commentIdsToDelete.has(comment.id));
        const didUpdate = updateBoardCommentsForPost(postId, nextComments);
        if (!didUpdate) return;

        if (state.pendingReplyCommentId && commentIdsToDelete.has(state.pendingReplyCommentId)) {
            setPendingReplyCommentId(null, { shouldRender: false });
        }
    }

    function handleCommentFormSubmit(event) {
        event.preventDefault();
        createComment();
    }

    function handlePostCreateFormSubmit(event) {
        event.preventDefault();
        savePostCreate();
    }

    function handlePostEditFormSubmit(event) {
        event.preventDefault();
        saveCurrentPostEdit();
    }

    function getValidatedPostInput(titleRaw, contentRaw) {
        const title = normalisePostTitle(titleRaw);
        if (!title) {
            window.alert('게시글 제목을 입력해 주세요.');
            return null;
        }
        if (title.length > POST_TITLE_MAX_LENGTH) {
            window.alert(`게시글 제목은 ${POST_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`);
            return null;
        }

        const content = normalisePostContent(contentRaw);
        if (!content) {
            window.alert('게시글 본문을 입력해 주세요.');
            return null;
        }
        if (content.length > POST_CONTENT_MAX_LENGTH) {
            window.alert(`게시글 본문은 ${POST_CONTENT_MAX_LENGTH}자 이하로 입력해 주세요.`);
            return null;
        }

        return { title, content };
    }

    function createPost() {
        if (state.currentView !== VIEW_KEY.board) {
            navigate(VIEW_KEY.board);
        }

        if (state.isPostCreating) {
            boardEls.createTitleInput?.focus();
            return;
        }

        clearAllEditStates({ keepPostCreate: true });
        setPendingReplyCommentId(null);
        setPostCreateMode(true);
    }

    function savePostCreate() {
        if (!state.isPostCreating) return;
        if (!boardEls.createTitleInput || !boardEls.createContentInput) return;
        const author = getCurrentSessionNickname();
        if (!author) return;

        const input = getValidatedPostInput(boardEls.createTitleInput.value, boardEls.createContentInput.value);
        if (!input) return;

        const newPost = createBoardPost(author, input.title, input.content);
        const nextPosts = sortBoardPostsByCreatedAtDesc([newPost, ...state.boardPosts]);
        const didSave = saveBoardPosts(nextPosts);
        if (!didSave) {
            window.alert('게시글을 저장하지 못했습니다.');
            return;
        }

        state.boardPosts = nextPosts;
        renderBoardList();

        if (!state.boardCommentsByPost[newPost.id]) {
            const nextCommentsByPost = {
                ...state.boardCommentsByPost,
                [newPost.id]: []
            };
            const didSaveComments = saveBoardCommentsByPost(nextCommentsByPost);
            if (didSaveComments) {
                state.boardCommentsByPost = nextCommentsByPost;
            }
        }

        setPostCreateMode(false);
        viewPost(newPost.id);
    }

    function cancelPostCreate() {
        if (!state.isPostCreating) return;
        setPostCreateMode(false);
    }

    function copyCurrentPostOriginal() {
        const post = getBoardPostById(state.currentPostId);
        if (!post) return;

        copyOriginalTextToClipboard(post.content, '게시글 원본 복사에 실패했습니다.');
    }

    function editCurrentPost() {
        const post = getBoardPostById(state.currentPostId);
        if (!post) return;
        if (!isOwnBoardPost(post)) {
            window.alert('본인이 작성한 글만 수정할 수 있습니다.');
            return;
        }

        setPendingReplyCommentId(null, { shouldRender: false });
        setChatEditingMessageId(null);
        setCommentEditingId(null);
        setPostEditMode(true, post);
        renderPostDetail(post);
    }

    function saveCurrentPostEdit() {
        const post = getBoardPostById(state.currentPostId);
        if (!post) return;
        if (!isOwnBoardPost(post)) {
            window.alert('본인이 작성한 글만 수정할 수 있습니다.');
            return;
        }
        if (!boardEls.editTitleInput || !boardEls.editContentInput) return;

        const input = getValidatedPostInput(boardEls.editTitleInput.value, boardEls.editContentInput.value);
        if (!input) return;
        if (input.title === post.title && input.content === post.content) {
            cancelCurrentPostEdit();
            return;
        }

        const nextPosts = state.boardPosts.map((currentPost) => {
            if (currentPost.id !== post.id) return currentPost;
            return {
                ...currentPost,
                title: input.title,
                content: input.content,
                updatedAt: new Date().toISOString()
            };
        });

        const didSave = saveBoardPosts(nextPosts);
        if (!didSave) {
            window.alert('수정 내용을 저장하지 못했습니다.');
            return;
        }

        state.isPostEditing = false;
        state.boardPosts = sortBoardPostsByCreatedAtDesc(nextPosts);
        renderBoardList();
        renderPostDetail(getBoardPostById(post.id));
    }

    function cancelCurrentPostEdit() {
        if (!state.isPostEditing) return;
        state.isPostEditing = false;
        const currentPost = getBoardPostById(state.currentPostId);
        if (!currentPost) return;
        renderPostDetail(currentPost);
    }

    function deleteCurrentPost() {
        const post = getBoardPostById(state.currentPostId);
        if (!post) return;
        if (state.isPostEditing) {
            window.alert('게시글 수정 중에는 삭제할 수 없습니다.');
            return;
        }
        if (!isOwnBoardPost(post)) {
            window.alert('본인이 작성한 글만 삭제할 수 있습니다.');
            return;
        }

        const shouldDelete = window.confirm('이 게시글을 삭제하시겠습니까?');
        if (!shouldDelete) return;

        const nextPosts = state.boardPosts.filter((currentPost) => currentPost.id !== post.id);
        const didSave = saveBoardPosts(nextPosts);
        if (!didSave) {
            window.alert('삭제 내용을 저장하지 못했습니다.');
            return;
        }

        const nextCommentsByPost = { ...state.boardCommentsByPost };
        delete nextCommentsByPost[post.id];
        const didSaveComments = saveBoardCommentsByPost(nextCommentsByPost);
        if (!didSaveComments) {
            window.alert('게시글 삭제 후 댓글 정보를 정리하지 못했습니다.');
        }

        state.boardPosts = sortBoardPostsByCreatedAtDesc(nextPosts);
        state.boardCommentsByPost = nextCommentsByPost;
        state.currentPostId = null;
        setPendingReplyCommentId(null);
        renderBoardList();
        navigate(VIEW_KEY.board);
    }

    function initBoard() {
        state.boardPosts = loadBoardPosts();
        state.boardCommentsByPost = loadBoardCommentsByPost(state.boardPosts);
        renderBoardList();
    }

    // Map 도메인: 슬라이드 전환(휠/키보드/터치) 처리
    function getMapStageEl() {
        return mapEls.stage instanceof HTMLElement ? mapEls.stage : null;
    }

    function getMapSlideCount() {
        return Array.isArray(mapEls.slides) ? mapEls.slides.length : 0;
    }

    function normaliseMapSlideIndex(index, { allowWrap = true } = {}) {
        const slideCount = getMapSlideCount();
        if (slideCount <= 0) return 0;

        const numericIndex = Number(index);
        const safeIndex = Number.isFinite(numericIndex) ? Math.trunc(numericIndex) : 0;

        if (!allowWrap) {
            return Math.max(0, Math.min(slideCount - 1, safeIndex));
        }

        return ((safeIndex % slideCount) + slideCount) % slideCount;
    }

    function getMapSlideTitle(index) {
        const slideEl = mapEls.slides?.[index];
        if (!(slideEl instanceof HTMLElement)) return '';
        return typeof slideEl.dataset.mapTitle === 'string' ? slideEl.dataset.mapTitle.trim() : '';
    }

    function resetMapWheelAccumulator() {
        mapWheelDeltaAccumulator = 0;
    }

    function syncMapStageUi() {
        const slideCount = getMapSlideCount();
        const stageEl = getMapStageEl();

        if (mapEls.totalCount) {
            mapEls.totalCount.textContent = String(slideCount);
        }

        if (slideCount <= 0) {
            if (mapEls.currentTitle) {
                mapEls.currentTitle.textContent = '표시할 지도가 없습니다.';
            }
            if (mapEls.currentIndex) {
                mapEls.currentIndex.textContent = '0';
            }
            if (stageEl) {
                stageEl.setAttribute('aria-label', '지도 화면 (표시할 지도가 없음)');
            }
            return;
        }

        const activeIndex = normaliseMapSlideIndex(state.mapSlideIndex);
        state.mapSlideIndex = activeIndex;

        mapEls.slides.forEach((slideEl, slideIndex) => {
            if (!(slideEl instanceof HTMLElement)) return;
            const isActive = slideIndex === activeIndex;
            slideEl.classList.toggle('is-active', isActive);
            slideEl.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        const title = getMapSlideTitle(activeIndex) || `지도 ${activeIndex + 1}`;
        if (mapEls.currentTitle) {
            mapEls.currentTitle.textContent = title;
        }
        if (mapEls.currentIndex) {
            mapEls.currentIndex.textContent = String(activeIndex + 1);
        }
        if (stageEl) {
            stageEl.setAttribute('aria-label', `${title} (${activeIndex + 1}/${slideCount}) - 스크롤 또는 방향키로 지도 전환`);
        }
    }

    function setMapSlideIndex(nextIndex, { allowWrap = true } = {}) {
        const slideCount = getMapSlideCount();
        if (slideCount <= 0) return false;

        const normalisedIndex = normaliseMapSlideIndex(nextIndex, { allowWrap });
        const didChange = normalisedIndex !== state.mapSlideIndex;
        state.mapSlideIndex = normalisedIndex;
        syncMapStageUi();
        return didChange;
    }

    function stepMapSlide(step, { allowWrap = true } = {}) {
        const numericStep = Number(step);
        if (!Number.isFinite(numericStep) || numericStep === 0) return false;
        return setMapSlideIndex(state.mapSlideIndex + (numericStep > 0 ? 1 : -1), { allowWrap });
    }

    function normaliseWheelDeltaToPixels(event) {
        const deltaY = Number(event?.deltaY);
        if (!Number.isFinite(deltaY)) return 0;

        const deltaMode = Number(event?.deltaMode);
        if (deltaMode === 1) {
            return deltaY * MAP_WHEEL_DELTA_LINE_PX;
        }
        if (deltaMode === 2) {
            return deltaY * Math.max(1, window.innerHeight || 1);
        }

        return deltaY;
    }

    function clearMapTouchGestureState() {
        mapTouchGestureState = null;
    }

    function handleMapStageTouchStart(event) {
        const stageEl = getMapStageEl();
        if (!(stageEl instanceof HTMLElement)) return;
        if (event.currentTarget !== stageEl) return;
        if (state.currentView !== VIEW_KEY.map) return;

        if (event.touches.length !== 1) {
            clearMapTouchGestureState();
            return;
        }

        const touch = event.touches[0];
        if (!touch) {
            clearMapTouchGestureState();
            return;
        }

        mapTouchGestureState = {
            identifier: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            startAtMs: Date.now()
        };
    }

    function handleMapStageTouchEnd(event) {
        const stageEl = getMapStageEl();
        if (!(stageEl instanceof HTMLElement)) return;
        if (event.currentTarget !== stageEl) return;

        const gestureState = mapTouchGestureState;
        clearMapTouchGestureState();
        if (!gestureState) return;

        if (state.currentView !== VIEW_KEY.map) return;

        const touch = getTouchFromListByIdentifier(event.changedTouches, gestureState.identifier)
            ?? event.changedTouches?.[0]
            ?? null;
        if (!touch) return;

        const deltaX = touch.clientX - gestureState.startX;
        const deltaY = touch.clientY - gestureState.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaY < 1) return;
        if (absDeltaY <= (absDeltaX * MAP_TOUCH_AXIS_RATIO)) return;

        const elapsedMs = Math.max(1, Date.now() - gestureState.startAtMs);
        const swipeVelocityPxPerMs = absDeltaY / elapsedMs;
        const isQualifiedSwipe = absDeltaY >= MAP_TOUCH_MIN_SWIPE_PX
            || (
                absDeltaY >= MAP_TOUCH_MIN_FLICK_PX
                && swipeVelocityPxPerMs >= MAP_TOUCH_MIN_FLICK_VELOCITY_PX_PER_MS
            );
        if (!isQualifiedSwipe) return;

        const now = Date.now();
        if (now < mapWheelNavLockedUntil) return;

        const didChange = stepMapSlide(deltaY < 0 ? 1 : -1, { allowWrap: true });
        if (didChange) {
            mapWheelNavLockedUntil = now + MAP_WHEEL_NAV_LOCK_MS;
            resetMapWheelAccumulator();
        }
    }

    function handleMapStageTouchCancel() {
        clearMapTouchGestureState();
    }

    function handleMapStageWheel(event) {
        if (state.currentView !== VIEW_KEY.map) return;
        if (event.ctrlKey) return;

        const stageEl = getMapStageEl();
        if (!(stageEl instanceof HTMLElement)) return;
        if (event.currentTarget !== stageEl) return;

        const slideCount = getMapSlideCount();
        if (slideCount <= 0) return;

        const deltaY = normaliseWheelDeltaToPixels(event);
        if (!Number.isFinite(deltaY) || Math.abs(deltaY) < 1) return;
        if (Math.abs(Number(event.deltaX) || 0) > Math.abs(Number(event.deltaY) || deltaY)) return;

        event.preventDefault();

        if (slideCount === 1) return;

        const now = Date.now();
        if (now < mapWheelNavLockedUntil) {
            return;
        }

        if ((mapWheelDeltaAccumulator > 0 && deltaY < 0) || (mapWheelDeltaAccumulator < 0 && deltaY > 0)) {
            mapWheelDeltaAccumulator = 0;
        }
        mapWheelDeltaAccumulator += deltaY;
        if (Math.abs(mapWheelDeltaAccumulator) < MAP_WHEEL_TRIGGER_DELTA_PX) {
            return;
        }

        const didChange = stepMapSlide(mapWheelDeltaAccumulator > 0 ? 1 : -1, { allowWrap: true });
        resetMapWheelAccumulator();
        if (didChange) {
            mapWheelNavLockedUntil = now + MAP_WHEEL_NAV_LOCK_MS;
        }
    }

    function handleMapStageKeydown(event) {
        if (state.currentView !== VIEW_KEY.map) return;

        const stageEl = getMapStageEl();
        if (!(stageEl instanceof HTMLElement)) return;
        if (event.currentTarget !== stageEl) return;

        const slideCount = getMapSlideCount();
        if (slideCount <= 0) return;

        let didHandle = false;
        switch (event.key) {
            case 'ArrowDown':
            case 'PageDown':
                didHandle = stepMapSlide(1, { allowWrap: true });
                break;
            case 'ArrowUp':
            case 'PageUp':
                didHandle = stepMapSlide(-1, { allowWrap: true });
                break;
            case 'Home':
                didHandle = setMapSlideIndex(0, { allowWrap: false });
                break;
            case 'End':
                didHandle = setMapSlideIndex(slideCount - 1, { allowWrap: false });
                break;
            default:
                return;
        }

        event.preventDefault();
        if (didHandle) {
            mapWheelNavLockedUntil = Date.now() + MAP_WHEEL_NAV_LOCK_MS;
        }
        resetMapWheelAccumulator();
    }

    function initMap() {
        state.mapSlideIndex = 0;
        mapWheelNavLockedUntil = 0;
        resetMapWheelAccumulator();
        clearMapTouchGestureState();
        syncMapStageUi();
    }

    // Info/Help 도메인: 섹션 스냅 스크롤 및 제스처 처리
    function getInfoScrollTrackEl() {
        return infoEls.scrollTrack instanceof HTMLElement ? infoEls.scrollTrack : null;
    }

    function getInfoPageEl(pageKey) {
        if (pageKey === 'help') {
            return infoEls.helpPage instanceof HTMLElement ? infoEls.helpPage : null;
        }

        if (pageKey === 'about') {
            return infoEls.aboutPage instanceof HTMLElement ? infoEls.aboutPage : null;
        }

        return null;
    }

    function getInfoPageTop(pageKey, trackEl = getInfoScrollTrackEl()) {
        if (!(trackEl instanceof HTMLElement)) return 0;
        const pageEl = getInfoPageEl(pageKey);
        if (!(pageEl instanceof HTMLElement)) return 0;

        const trackRect = trackEl.getBoundingClientRect();
        const pageRect = pageEl.getBoundingClientRect();
        return Math.max(0, trackEl.scrollTop + (pageRect.top - trackRect.top));
    }

    function scrollInfoPageTo(pageKey, { behavior = 'smooth' } = {}) {
        const trackEl = getInfoScrollTrackEl();
        if (!(trackEl instanceof HTMLElement)) return false;

        const nextTop = getInfoPageTop(pageKey, trackEl);
        if (!Number.isFinite(nextTop)) return false;

        if (typeof trackEl.scrollTo === 'function') {
            try {
                trackEl.scrollTo({ top: nextTop, behavior });
                return true;
            } catch (error) {
                // 구형 브라우저 옵션 객체 폴백
            }
        }

        trackEl.scrollTop = nextTop;
        return true;
    }

    function clearInfoTouchGestureState() {
        infoTouchGestureState = null;
    }

    function getTouchFromListByIdentifier(touchList, identifier) {
        if (!touchList || typeof touchList.length !== 'number') return null;

        for (let index = 0; index < touchList.length; index += 1) {
            const touch = touchList[index];
            if (touch?.identifier === identifier) {
                return touch;
            }
        }

        return null;
    }

    function handleInfoScrollTrackTouchStart(event) {
        const trackEl = getInfoScrollTrackEl();
        if (!(trackEl instanceof HTMLElement)) return;
        if (event.currentTarget !== trackEl) return;
        if (state.currentView !== VIEW_KEY.info) return;
        if (isAppInfoDialogModalOpen()) return;

        if (event.touches.length !== 1) {
            clearInfoTouchGestureState();
            return;
        }

        const touch = event.touches[0];
        if (!touch) {
            clearInfoTouchGestureState();
            return;
        }

        infoTouchGestureState = {
            identifier: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            startAtMs: Date.now(),
            startScrollTop: trackEl.scrollTop
        };
    }

    function handleInfoScrollTrackTouchEnd(event) {
        const trackEl = getInfoScrollTrackEl();
        if (!(trackEl instanceof HTMLElement)) return;
        if (event.currentTarget !== trackEl) return;

        const gestureState = infoTouchGestureState;
        clearInfoTouchGestureState();
        if (!gestureState) return;

        if (state.currentView !== VIEW_KEY.info) return;
        if (isAppInfoDialogModalOpen()) return;

        const touch = getTouchFromListByIdentifier(event.changedTouches, gestureState.identifier)
            ?? event.changedTouches?.[0]
            ?? null;
        if (!touch) return;

        const deltaX = touch.clientX - gestureState.startX;
        const deltaY = touch.clientY - gestureState.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaY < 1) return;
        if (absDeltaY <= (absDeltaX * INFO_SECTION_TOUCH_AXIS_RATIO)) return;

        const elapsedMs = Math.max(1, Date.now() - gestureState.startAtMs);
        const swipeVelocityPxPerMs = absDeltaY / elapsedMs;
        const isQualifiedSwipe = absDeltaY >= INFO_SECTION_TOUCH_MIN_SWIPE_PX
            || (
                absDeltaY >= INFO_SECTION_TOUCH_MIN_FLICK_PX
                && swipeVelocityPxPerMs >= INFO_SECTION_TOUCH_MIN_FLICK_VELOCITY_PX_PER_MS
            );
        if (!isQualifiedSwipe) return;

        const now = Date.now();
        if (now < infoSectionWheelNavLockedUntil) return;

        const helpTop = getInfoPageTop('help', trackEl);
        if (helpTop <= 0) return;

        const isNearAboutTop = gestureState.startScrollTop <= INFO_SECTION_SNAP_TOLERANCE_PX;
        const isNearHelpTop = Math.abs(gestureState.startScrollTop - helpTop) <= INFO_SECTION_SNAP_TOLERANCE_PX;
        const didSwipeUp = deltaY < 0;
        const didSwipeDown = deltaY > 0;

        if (didSwipeUp && isNearAboutTop) {
            infoSectionWheelNavLockedUntil = now + INFO_SECTION_WHEEL_NAV_LOCK_MS;
            window.requestAnimationFrame(() => {
                scrollInfoPageTo('help');
            });
            return;
        }

        if (didSwipeDown && isNearHelpTop) {
            infoSectionWheelNavLockedUntil = now + INFO_SECTION_WHEEL_NAV_LOCK_MS;
            window.requestAnimationFrame(() => {
                scrollInfoPageTo('about');
            });
        }
    }

    function handleInfoScrollTrackTouchCancel() {
        clearInfoTouchGestureState();
    }

    function handleInfoScrollTrackWheel(event) {
        if (state.currentView !== VIEW_KEY.info) return;
        if (isAppInfoDialogModalOpen()) return;
        if (event.ctrlKey) return;

        const trackEl = getInfoScrollTrackEl();
        if (!(trackEl instanceof HTMLElement)) return;
        if (event.currentTarget !== trackEl) return;

        const deltaY = Number(event.deltaY);
        if (!Number.isFinite(deltaY) || Math.abs(deltaY) < 1) return;
        if (Math.abs(event.deltaX) > Math.abs(deltaY)) return;

        const helpTop = getInfoPageTop('help', trackEl);
        if (helpTop <= 0) return;

        const now = Date.now();
        if (now < infoSectionWheelNavLockedUntil) {
            event.preventDefault();
            return;
        }

        const currentTop = trackEl.scrollTop;
        const isNearAboutTop = currentTop <= INFO_SECTION_SNAP_TOLERANCE_PX;
        const isNearHelpTop = Math.abs(currentTop - helpTop) <= INFO_SECTION_SNAP_TOLERANCE_PX;

        if (deltaY > 0 && isNearAboutTop) {
            event.preventDefault();
            infoSectionWheelNavLockedUntil = now + INFO_SECTION_WHEEL_NAV_LOCK_MS;
            scrollInfoPageTo('help');
            return;
        }

        if (deltaY < 0 && isNearHelpTop) {
            event.preventDefault();
            infoSectionWheelNavLockedUntil = now + INFO_SECTION_WHEEL_NAV_LOCK_MS;
            scrollInfoPageTo('about');
        }
    }

    // URL 쿼리 기반 초기 진입 라우팅 복원
    function applyInitialRouteFromQuery() {
        const { section, postId } = getRouteStateFromLocation();
        if (!section) {
            syncRouteQueryWithCurrentScreen();
            return;
        }

        if (section === ROUTE_SECTION_KEY.lobby) {
            navigate(VIEW_KEY.chat, { shouldSyncRoute: false });
            syncRouteQueryWithCurrentScreen();
            return;
        }

        if (section === ROUTE_SECTION_KEY.board) {
            const didOpenPost = postId
                ? viewPost(postId, { shouldSyncRoute: false, showNotFoundAlert: false })
                : false;
            if (!didOpenPost) {
                navigate(VIEW_KEY.board, { shouldSyncRoute: false });
            }
            syncRouteQueryWithCurrentScreen();
            return;
        }

        if (section === ROUTE_SECTION_KEY.help) {
            navigate(VIEW_KEY.info, { shouldSyncRoute: false });
            scrollInfoPageTo('help', { behavior: 'auto' });
            syncRouteQueryWithCurrentScreen();
            return;
        }

        const viewKey = ROUTE_SECTION_TO_VIEW_KEY[section];
        if (viewKey) {
            navigate(viewKey, { shouldSyncRoute: false });
        }
        syncRouteQueryWithCurrentScreen();
    }

    // 외부(디버깅/확장 스크립트)에서 접근 가능한 최소 API만 노출합니다.
    const app = {
        state,
        navigate,
        viewPost,
        appendChatMessage,
        editChatMessage,
        saveChatMessageEdit,
        cancelChatMessageEdit,
        deleteChatMessage,
        createPost,
        savePostCreate,
        cancelPostCreate,
        editCurrentPost,
        saveCurrentPostEdit,
        cancelCurrentPostEdit,
        deleteCurrentPost,
        createComment,
        editComment,
        saveCommentEdit,
        cancelCommentEdit,
        deleteComment,
        replyToComment,
        setUnicodeVisualiserMode,
        toggleUnicodeVisualiserMode,
        get md() {
            return getMarkdownRenderer();
        },
        renderTex,
        renderMarkdownAndMathIfAvailable,
        renderChatMessages,
        renderBoardList,
        renderPostComments
    };

    // 화면 전환 코어: 뷰 표시 + 부가 상태 정리 + 라우트 동기화
    function navigate(viewKey, { shouldSyncRoute = true } = {}) {
        if (viewKey === VIEW_KEY.help) {
            viewKey = VIEW_KEY.info;
        }

        const nextViewEl = viewEls[viewKey];
        if (!nextViewEl) return false;

        hideAllViews();
        nextViewEl.classList.remove('hide');
        setActiveNav(viewKey);

        state.currentView = viewKey;
        syncAppSettingsPlacement(viewKey);
        if (viewKey !== VIEW_KEY.chat) {
            setChatEditingMessageId(null);
        }
        if (viewKey !== VIEW_KEY.board) {
            setPostCreateMode(false);
        }
        if (viewKey !== VIEW_KEY.map) {
            mapWheelNavLockedUntil = 0;
            resetMapWheelAccumulator();
            clearMapTouchGestureState();
        }
        if (viewKey !== VIEW_KEY.postDetail) {
            state.currentPostId = null;
            setPendingReplyCommentId(null);
            setCommentEditingId(null);
            setPostEditMode(false);
        }

        if (viewKey === VIEW_KEY.board) {
            renderBoardList();
        }

        if (viewKey !== VIEW_KEY.info) {
            if (isLicenseModalOpen()) {
                setLicenseModalOpen(false);
            }
            if (isChangelogModalOpen()) {
                setChangelogModalOpen(false);
            }
        }
        if (isLogoutConfirmModalOpen()) {
            setLogoutConfirmModalOpen(false);
        }

        if (shouldSyncRoute) {
            syncRouteQueryWithCurrentScreen();
        }

        return true;
    }

    function viewPost(postId, { shouldSyncRoute = true, showNotFoundAlert = true } = {}) {
        const normalisedPostId = normaliseEntityId(String(postId ?? ''));
        if (!normalisedPostId) return false;

        const post = getBoardPostById(normalisedPostId);
        if (!post) {
            if (showNotFoundAlert) {
                window.alert('게시글을 찾을 수 없습니다.');
            }
            return false;
        }

        state.currentPostId = normalisedPostId;
        setPendingReplyCommentId(null, { shouldRender: false });
        setCommentEditingId(null);
        setPostCreateMode(false);
        setPostEditMode(false);
        renderPostDetail(post);
        navigate(VIEW_KEY.postDetail, { shouldSyncRoute });
        return true;
    }

    function hideAllViews() {
        Object.values(viewEls).forEach((viewEl) => {
            viewEl?.classList.add('hide');
        });
    }

    function setActiveNav(viewKey) {
        Object.values(navEls).forEach((navEl) => {
            navEl?.classList.remove('active-nav');
        });

        const activeViewKey = viewKey === VIEW_KEY.postDetail ? VIEW_KEY.board : viewKey;
        const activeNavEl = navEls[activeViewKey];
        activeNavEl?.classList.add('active-nav');
    }

    function getInlineEditInputValue(actionTarget, containerSelector, inputSelector) {
        if (!actionTarget) return '';
        const containerEl = actionTarget.closest(containerSelector);
        if (!containerEl) return '';
        const inputEl = containerEl.querySelector(inputSelector);
        if (!inputEl) return '';
        return inputEl.value ?? '';
    }

    // `data-action` 값과 실제 핸들러를 매핑합니다.
    const actionHandlers = {
        [ACTION_KEY.navigate]: (targetEl) => {
            navigate(targetEl.dataset.tab);
        },
        [ACTION_KEY.viewPost]: (targetEl) => {
            viewPost(targetEl.dataset.postId);
        },
        [ACTION_KEY.copyChatOriginal]: (targetEl) => {
            copyChatMessageOriginal(targetEl.dataset.messageId);
        },
        [ACTION_KEY.editChat]: (targetEl) => {
            editChatMessage(targetEl.dataset.messageId);
        },
        [ACTION_KEY.deleteChat]: (targetEl) => {
            deleteChatMessage(targetEl.dataset.messageId);
        },
        [ACTION_KEY.saveChatEdit]: (targetEl) => {
            const editedContent = getInlineEditInputValue(targetEl, '[data-chat-edit-box]', '[data-chat-edit-input]');
            saveChatMessageEdit(targetEl.dataset.messageId, editedContent);
        },
        [ACTION_KEY.cancelChatEdit]: () => {
            cancelChatMessageEdit();
        },
        [ACTION_KEY.createPost]: () => {
            createPost();
        },
        [ACTION_KEY.copyPostOriginal]: () => {
            copyCurrentPostOriginal();
        },
        [ACTION_KEY.editPost]: () => {
            editCurrentPost();
        },
        [ACTION_KEY.deletePost]: () => {
            deleteCurrentPost();
        },
        [ACTION_KEY.replyComment]: (targetEl) => {
            replyToComment(targetEl.dataset.commentId);
        },
        [ACTION_KEY.cancelReply]: () => {
            setPendingReplyCommentId(null);
        },
        [ACTION_KEY.saveCommentReply]: (targetEl) => {
            const replyContent = getInlineEditInputValue(targetEl, '[data-comment-reply-box]', '[data-comment-reply-input]');
            createCommentReply(targetEl.dataset.commentId, replyContent);
        },
        [ACTION_KEY.copyCommentOriginal]: (targetEl) => {
            copyCommentOriginal(targetEl.dataset.commentId);
        },
        [ACTION_KEY.editComment]: (targetEl) => {
            editComment(targetEl.dataset.commentId);
        },
        [ACTION_KEY.deleteComment]: (targetEl) => {
            deleteComment(targetEl.dataset.commentId);
        },
        [ACTION_KEY.saveCommentEdit]: (targetEl) => {
            const editedContent = getInlineEditInputValue(targetEl, '[data-comment-edit-box]', '[data-comment-edit-input]');
            saveCommentEdit(targetEl.dataset.commentId, editedContent);
        },
        [ACTION_KEY.cancelCommentEdit]: () => {
            cancelCommentEdit();
        },
        [ACTION_KEY.toggleSettingsPanel]: () => {
            toggleSettingsPanel();
        },
        [ACTION_KEY.closeSettingsPanel]: () => {
            setSettingsPanelOpen(false);
        },
        [ACTION_KEY.toggleInstantDeleteMode]: () => {
            toggleInstantDeleteMode();
        },
        [ACTION_KEY.toggleUnicodeVisualiserMode]: () => {
            toggleUnicodeVisualiserMode();
        },
        [ACTION_KEY.toggleTwemojiDisabledMode]: () => {
            toggleTwemojiDisabledMode();
        },
        [ACTION_KEY.openLicenseModal]: () => {
            if (isChangelogModalOpen()) {
                setChangelogModalOpen(false);
            }
            setLicenseModalOpen(true);
        },
        [ACTION_KEY.closeLicenseModal]: () => {
            setLicenseModalOpen(false);
        },
        [ACTION_KEY.openChangelogModal]: () => {
            if (isLicenseModalOpen()) {
                setLicenseModalOpen(false);
            }
            setChangelogModalOpen(true);
        },
        [ACTION_KEY.closeChangelogModal]: () => {
            setChangelogModalOpen(false);
        },
        [ACTION_KEY.closeLogoutConfirmModal]: () => {
            setLogoutConfirmModalOpen(false);
        },
        [ACTION_KEY.confirmLogout]: () => {
            logout();
        },
        [ACTION_KEY.logout]: () => {
            setLogoutConfirmModalOpen(true);
        }
    };

    function handleRootClick(event) {
        const targetEl = event.target;
        if (!(targetEl instanceof Element)) return;

        if (isSettingsPanelOpen() && !targetEl.closest(`#${DOM_ID.appSettings.root}`)) {
            setSettingsPanelOpen(false);
        }

        const actionTarget = targetEl.closest('[data-action]');
        if (!actionTarget) return;

        const { action } = actionTarget.dataset;
        try {
            actionHandlers[action]?.(actionTarget);
        } catch (error) {
            console.warn(`[App UI] Failed to handle action "${action}".`, error);
        }
    }

    function handleGlobalKeydown(event) {
        if (isLogoutConfirmModalOpen()) {
            if (event.key === 'Tab') {
                handleLogoutConfirmModalTabKeydown(event);
                return;
            }

            if (event.key !== 'Escape') return;
            setLogoutConfirmModalOpen(false);
            return;
        }

        if (isLicenseModalOpen()) {
            if (event.key === 'Tab') {
                handleLicenseModalTabKeydown(event);
                return;
            }

            if (event.key !== 'Escape') return;
            setLicenseModalOpen(false);
            return;
        }

        if (isChangelogModalOpen()) {
            if (event.key === 'Tab') {
                handleChangelogModalTabKeydown(event);
                return;
            }

            if (event.key !== 'Escape') return;
            setChangelogModalOpen(false);
            return;
        }

        if (event.key !== 'Escape') return;

        if (isSettingsPanelOpen()) {
            setSettingsPanelOpen(false);
            return;
        }

        if (state.isPostEditing) {
            cancelCurrentPostEdit();
            return;
        }

        if (state.isPostCreating) {
            cancelPostCreate();
            return;
        }

        if (state.editingCommentId) {
            cancelCommentEdit();
            return;
        }

        if (state.pendingReplyCommentId) {
            setPendingReplyCommentId(null);
            return;
        }

        if (state.editingChatMessageId) {
            cancelChatMessageEdit();
        }
    }

    // 앱 부트스트랩: 저장소 복원 -> 화면 초기화 -> 이벤트 바인딩
    function init() {
        if (!rootEl) return;

        applyAppMetadataToUi();

        const sendKeymap = loadSendKeymap();
        setSendKeymap(sendKeymap, { shouldPersist: false });
        const chatAutoScrollMode = loadChatAutoScrollMode();
        setChatAutoScrollMode(chatAutoScrollMode, { shouldPersist: false });
        const instantDeleteMode = loadInstantDeleteMode();
        setInstantDeleteMode(instantDeleteMode, { shouldPersist: false });
        const unicodeVisualiserMode = loadUnicodeVisualiserMode();
        setUnicodeVisualiserMode(unicodeVisualiserMode, { shouldPersist: false });
        const twemojiDisabledMode = loadTwemojiDisabledMode();
        setTwemojiDisabledMode(twemojiDisabledMode, { shouldPersist: false, shouldRefresh: false });
        setSettingsPanelOpen(false);
        setLicenseModalOpen(false);
        setChangelogModalOpen(false);
        setLogoutConfirmModalOpen(false);
        syncAppSettingsPlacement(state.currentView);

        const session = loadSession();
        if (!session) {
            state.session = null;
            initLobby();
            return;
        }

        showAppScreen();
        state.session = session;
        applySessionToUi(session);
        initChat();
        initBoard();
        initMap();
        applyInitialRouteFromQuery();

        // 중앙 이벤트 위임 + 뷰별 입력 이벤트 바인딩
        rootEl.addEventListener('click', handleRootClick);
        document.addEventListener('keydown', handleGlobalKeydown);
        sendKeymapSettingEls.select?.addEventListener('change', handleSendKeymapSettingChange);
        chatAutoScrollSettingEls.select?.addEventListener('change', handleChatAutoScrollSettingChange);
        chatEls.form?.addEventListener('submit', handleChatFormSubmit);
        chatEls.input?.addEventListener('keydown', handleChatInputKeydown);
        chatEls.input?.addEventListener('input', handleChatInputAutoResize);
        getChatScrollTargetEl()?.addEventListener('scroll', handleChatScroll);
        chatEls.container?.addEventListener('keydown', handleChatInlineEditKeydown);
        chatEls.container?.addEventListener('input', handleChatInlineEditInput);
        chatEls.jumpLatestButton?.addEventListener('click', handleJumpLatestButtonClick);
        boardEls.createForm?.addEventListener('submit', handlePostCreateFormSubmit);
        boardEls.createCancelButton?.addEventListener('click', cancelPostCreate);
        boardEls.commentForm?.addEventListener('submit', handleCommentFormSubmit);
        boardEls.commentInput?.addEventListener('keydown', handleCommentInputKeydown);
        boardEls.commentInput?.addEventListener('input', handleCommentInputAutoResize);
        boardEls.commentsList?.addEventListener('keydown', handleCommentInlineEditKeydown);
        boardEls.commentsList?.addEventListener('input', handleCommentInlineEditInput);
        boardEls.editForm?.addEventListener('submit', handlePostEditFormSubmit);
        boardEls.editCancelButton?.addEventListener('click', cancelCurrentPostEdit);
        mapEls.stage?.addEventListener('wheel', handleMapStageWheel, { passive: false });
        mapEls.stage?.addEventListener('keydown', handleMapStageKeydown);
        mapEls.stage?.addEventListener('touchstart', handleMapStageTouchStart, { passive: true });
        mapEls.stage?.addEventListener('touchend', handleMapStageTouchEnd, { passive: true });
        mapEls.stage?.addEventListener('touchcancel', handleMapStageTouchCancel, { passive: true });
        infoEls.scrollTrack?.addEventListener('wheel', handleInfoScrollTrackWheel, { passive: false });
        infoEls.scrollTrack?.addEventListener('touchstart', handleInfoScrollTrackTouchStart, { passive: true });
        infoEls.scrollTrack?.addEventListener('touchend', handleInfoScrollTrackTouchEnd, { passive: true });
        infoEls.scrollTrack?.addEventListener('touchcancel', handleInfoScrollTrackTouchCancel, { passive: true });
        autoResizeTextarea(chatEls.input);
        autoResizeTextarea(boardEls.commentInput);

        // 초기 정적 마크다운은 즉시 한 번, load 시점에 한 번 더 안전하게 렌더링합니다.
        try {
            renderMarkdownAndMathIfAvailable();
        } catch (error) {
            console.warn('[App UI] Initial markdown/math render failed.', error);
        }

        window.addEventListener('load', () => {
            try {
                renderMarkdownAndMathIfAvailable();
            } catch (error) {
                console.warn('[App UI] Deferred markdown/math render failed.', error);
            }
        }, { once: true });
    }

    // 중복 초기화를 막기 위한 1회 실행 게이트
    let didInitApp = false;
    function initAppOnce() {
        if (didInitApp) return;
        didInitApp = true;
        init();
    }

    window.app = app;
    if (document.readyState === 'complete') {
        initAppOnce();
    } else {
        // 다른 defer 스크립트(예: 확장)가 모두 실행된 뒤 초기화되도록 DOMContentLoaded까지 대기
        document.addEventListener('DOMContentLoaded', initAppOnce, { once: true });
        window.addEventListener('load', initAppOnce, { once: true });
    }
})();
