/******/ var __webpack_modules__ = ({

/***/ 523
(module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.codex-editor__redactor {
    position: relative;
}

.cdx-realtime-block--selected .ce-block__content {
    position: relative;
}

.cdx-realtime-block--selected:not(.ce-block--drop-target) .ce-block__content::before {
    content: '';
    position: absolute;
    inset: 0px;
    z-index: -1;
    background-color: #e1f2ff99;
}

.cdx-realtime-block--delete-pending .ce-block__content::before {
    content: '';
    position: absolute;
    inset: 0px;
    z-index: -1;
    background-color: #E24A4A;
}

.cdx-realtime-block--selected .ce-block__content [contenteditable] {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.cdx-realtime-block--selected .ce-block__content img,
.cdx-realtime-block--selected .ce-block__content .ce-stub {
    opacity: 0.55;
}

.cdx-realtime-inline-cursor {
    position: absolute;
    background-color: var(--realtime-inline-cursor-color, #0d0c0f);
    width: 2px;
    height: 1ch;
    transform: translateX(-50%);
    animation: cursor-blink 0.6s 1s infinite alternate ease-in-out;
    -webkit-animation: cursor-blink 0.6s 1s infinite alternate ease-in-out;
    -webkit-transform: translateX(-50%);
    -moz-transform: translateX(-50%);
    -ms-transform: translateX(-50%);
    -o-transform: translateX(-50%);
}


@keyframes cursor-blink {

    0%,
    30% {
        background-color: var(--realtime-inline-cursor-color, #0d0c0f);
    }

    100%,
    70% {
        background-color: transparent;
    }
}

.cdx-realtime-block--locked {
    pointer-events: none;
    opacity: 0.6;
}

.cdx-realtime-block--locked [contenteditable] {
    overflow-wrap: break-word;
    line-break: after-white-space;
    -webkit-line-break: after-white-space;
}


.cdx-realtime-inline-selection {
    position: absolute;
    background-color: var(--realtime-inline-selection-color, #0d0c0f33);
    opacity: 0.5;
    pointer-events: none;
}`, ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ 314
(module) {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ },

/***/ 601
(module) {



module.exports = function (i) {
  return i[1];
};

/***/ },

/***/ 72
(module) {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ },

/***/ 659
(module) {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ },

/***/ 540
(module) {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ },

/***/ 56
(module, __unused_webpack_exports, __webpack_require__) {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ },

/***/ 825
(module) {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ },

/***/ 113
(module) {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		id: moduleId,
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat get default export */
/******/ (() => {
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = (module) => {
/******/ 		var getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__webpack_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/nonce */
/******/ (() => {
/******/ 	__webpack_require__.nc = undefined;
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

;// ./node_modules/throttle-debounce/esm/index.js
/* eslint-disable no-undefined,no-param-reassign,no-shadow */

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param {number} delay -                  A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher)
 *                                            are most useful.
 * @param {Function} callback -               A function to be executed after delay milliseconds. The `this` context and all arguments are passed through,
 *                                            as-is, to `callback` when the throttled-function is executed.
 * @param {object} [options] -              An object to configure options.
 * @param {boolean} [options.noTrailing] -   Optional, defaults to false. If noTrailing is true, callback will only execute every `delay` milliseconds
 *                                            while the throttled-function is being called. If noTrailing is false or unspecified, callback will be executed
 *                                            one final time after the last throttled-function call. (After the throttled-function has not been called for
 *                                            `delay` milliseconds, the internal counter is reset).
 * @param {boolean} [options.noLeading] -   Optional, defaults to false. If noLeading is false, the first throttled-function call will execute callback
 *                                            immediately. If noLeading is true, the first the callback execution will be skipped. It should be noted that
 *                                            callback will never executed if both noLeading = true and noTrailing = true.
 * @param {boolean} [options.debounceMode] - If `debounceMode` is true (at begin), schedule `clear` to execute after `delay` ms. If `debounceMode` is
 *                                            false (at end), schedule `callback` to execute after `delay` ms.
 *
 * @returns {Function} A new, throttled, function.
 */
function throttle (delay, callback, options) {
  var _ref = options || {},
    _ref$noTrailing = _ref.noTrailing,
    noTrailing = _ref$noTrailing === void 0 ? false : _ref$noTrailing,
    _ref$noLeading = _ref.noLeading,
    noLeading = _ref$noLeading === void 0 ? false : _ref$noLeading,
    _ref$debounceMode = _ref.debounceMode,
    debounceMode = _ref$debounceMode === void 0 ? undefined : _ref$debounceMode;
  /*
   * After wrapper has stopped being called, this timeout ensures that
   * `callback` is executed at the proper times in `throttle` and `end`
   * debounce modes.
   */
  var timeoutID;
  var cancelled = false;

  // Keep track of the last time `callback` was executed.
  var lastExec = 0;

  // Function to clear existing timeout
  function clearExistingTimeout() {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
  }

  // Function to cancel next exec
  function cancel(options) {
    var _ref2 = options || {},
      _ref2$upcomingOnly = _ref2.upcomingOnly,
      upcomingOnly = _ref2$upcomingOnly === void 0 ? false : _ref2$upcomingOnly;
    clearExistingTimeout();
    cancelled = !upcomingOnly;
  }

  /*
   * The `wrapper` function encapsulates all of the throttling / debouncing
   * functionality and when executed will limit the rate at which `callback`
   * is executed.
   */
  function wrapper() {
    for (var _len = arguments.length, arguments_ = new Array(_len), _key = 0; _key < _len; _key++) {
      arguments_[_key] = arguments[_key];
    }
    var self = this;
    var elapsed = Date.now() - lastExec;
    if (cancelled) {
      return;
    }

    // Execute `callback` and update the `lastExec` timestamp.
    function exec() {
      lastExec = Date.now();
      callback.apply(self, arguments_);
    }

    /*
     * If `debounceMode` is true (at begin) this is used to clear the flag
     * to allow future `callback` executions.
     */
    function clear() {
      timeoutID = undefined;
    }
    if (!noLeading && debounceMode && !timeoutID) {
      /*
       * Since `wrapper` is being called for the first time and
       * `debounceMode` is true (at begin), execute `callback`
       * and noLeading != true.
       */
      exec();
    }
    clearExistingTimeout();
    if (debounceMode === undefined && elapsed > delay) {
      if (noLeading) {
        /*
         * In throttle mode with noLeading, if `delay` time has
         * been exceeded, update `lastExec` and schedule `callback`
         * to execute after `delay` ms.
         */
        lastExec = Date.now();
        if (!noTrailing) {
          timeoutID = setTimeout(debounceMode ? clear : exec, delay);
        }
      } else {
        /*
         * In throttle mode without noLeading, if `delay` time has been exceeded, execute
         * `callback`.
         */
        exec();
      }
    } else if (noTrailing !== true) {
      /*
       * In trailing throttle mode, since `delay` time has not been
       * exceeded, schedule `callback` to execute `delay` ms after most
       * recent execution.
       *
       * If `debounceMode` is true (at begin), schedule `clear` to execute
       * after `delay` ms.
       *
       * If `debounceMode` is false (at end), schedule `callback` to
       * execute after `delay` ms.
       */
      timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
    }
  }
  wrapper.cancel = cancel;

  // Return the wrapper function.
  return wrapper;
}

/* eslint-disable no-undefined */

/**
 * Debounce execution of a function. Debouncing, unlike throttling,
 * guarantees that a function is only executed a single time, either at the
 * very beginning of a series of calls, or at the very end.
 *
 * @param {number} delay -               A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 * @param {Function} callback -          A function to be executed after delay milliseconds. The `this` context and all arguments are passed through, as-is,
 *                                        to `callback` when the debounced-function is executed.
 * @param {object} [options] -           An object to configure options.
 * @param {boolean} [options.atBegin] -  Optional, defaults to false. If atBegin is false or unspecified, callback will only be executed `delay` milliseconds
 *                                        after the last debounced-function call. If atBegin is true, callback will be executed only at the first debounced-function call.
 *                                        (After the throttled-function has not been called for `delay` milliseconds, the internal counter is reset).
 *
 * @returns {Function} A new, debounced function.
 */
function debounce (delay, callback, options) {
  var _ref = options || {},
    _ref$atBegin = _ref.atBegin,
    atBegin = _ref$atBegin === void 0 ? false : _ref$atBegin;
  return throttle(delay, callback, {
    debounceMode: atBegin !== false
  });
}


//# sourceMappingURL=index.js.map

// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(72);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleDomAPI.js
var styleDomAPI = __webpack_require__(825);
var styleDomAPI_default = /*#__PURE__*/__webpack_require__.n(styleDomAPI);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertBySelector.js
var insertBySelector = __webpack_require__(659);
var insertBySelector_default = /*#__PURE__*/__webpack_require__.n(insertBySelector);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js
var setAttributesWithoutAttributes = __webpack_require__(56);
var setAttributesWithoutAttributes_default = /*#__PURE__*/__webpack_require__.n(setAttributesWithoutAttributes);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertStyleElement.js
var insertStyleElement = __webpack_require__(540);
var insertStyleElement_default = /*#__PURE__*/__webpack_require__.n(insertStyleElement);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleTagTransform.js
var styleTagTransform = __webpack_require__(113);
var styleTagTransform_default = /*#__PURE__*/__webpack_require__.n(styleTagTransform);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./src/index.css
var cjs_js_src = __webpack_require__(523);
;// ./src/index.css

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (styleTagTransform_default());
options.setAttributes = (setAttributesWithoutAttributes_default());

      options.insert = insertBySelector_default().bind(null, "head");
    
options.domAPI = (styleDomAPI_default());
options.insertStyleElement = (insertStyleElement_default());

var update = injectStylesIntoStyleTag_default()(cjs_js_src/* default */.A, options);




       /* harmony default export */ const src = (cjs_js_src/* default */.A && cjs_js_src/* default */.A.locals ? cjs_js_src/* default */.A.locals : undefined);

;// ./src/index.ts


const UserInlineSelectionAsk = 'inline-selection-request';
const UserInlineSelectionChangeType = 'inline-selection-change';
const UserBlockSelectionChangeType = 'block-selection-change';
const UserBlockDeletionChangeType = 'block-deletion-change';
const UserDisconnectedType = 'user-disconnected';
const UserPresencePingType = 'user-presence-ping';
const BlockLockedType = 'block-locked';
const BlockUnlockedType = 'block-unlocked';
class GroupCollab {
    // Config
    editor;
    socket;
    config;
    _isListening = false;
    _currentEditorLockingBlockId = null;
    _lockedBlocks = [];
    _externalUserSelections = [];
    _customToolsInternalState = {};
    // events to ignore until next render
    ignoreEvents = {};
    redactorObserver;
    toolboxObserver;
    editorStyleElement;
    throttledBlockChange = undefined;
    throttledInlineSelectionChange = undefined;
    _debouncedBlockUnlockingsMap = {};
    localBlockStates = {};
    externalUserLastSeenMap = {};
    externalUsersCleanupInterval;
    presencePingInterval;
    editorBlockEvent = 'block changed';
    editorDomChangedEvent = 'redactor dom changed'; // this might need more investigation before any usage
    blockIdAttributeName = 'data-id';
    inlineFakeCursorAttributeName = 'data-realtime-fake-inline-cursor';
    inlineFakeSelectionAttributeName = 'data-realtime-fake-inline-selection';
    connectionIdAttributeName = 'data-realtime-connection-id';
    constructor({ editor, socket, ...config }) {
        this.editor = editor;
        this.socket = socket;
        if (!this.socket.connectionId) {
            console.error("{connectionId} is not set for EditorJSGroupCollab plugin. Some features might not work");
            this.socket.connectionId = "random-" + crypto.randomUUID();
        }
        const defaultConfig = {
            blockChangeThrottleDelay: 300,
            blockLockDebounceTime: 1500,
            externalUserIdleTimeout: 60_000,
            toolsWithDataCheck: ["table"],
        };
        this.config = {
            ...defaultConfig,
            ...(config ?? {}),
        };
        this.redactorObserver = new MutationObserver((mutations, observer) => {
            for (let mutation of mutations) {
                this.handleMutation(mutation);
            }
        });
        this.toolboxObserver = new MutationObserver((mutations, observer) => {
            const lastMutation = mutations.at(-1);
            if (!lastMutation)
                return;
            this.handleToolboxMutation(lastMutation);
        });
        this.editorStyleElement = document.createElement('style');
        this.setupStyleElement();
        this.setupThrottledListeners();
        this.initializeCustomToolsState();
    }
    //#region Public API
    get isListening() {
        return this._isListening;
    }
    get lockedBlocks() {
        return this._lockedBlocks.map(b => ({ ...b }));
    }
    set lockedBlocks(value) {
        const oldLockedBlocks = this._lockedBlocks;
        this._lockedBlocks = value.map(b => ({ ...b }));
        this.renderLockedBlocks(oldLockedBlocks, this._lockedBlocks);
    }
    get currentLockedBlockId() {
        return this._currentEditorLockingBlockId;
    }
    get externalUserSelections() {
        return this._externalUserSelections.map(s => ({ ...s }));
    }
    set externalUserSelections(value) {
        const oldSelections = this._externalUserSelections;
        this._externalUserSelections = value.map(s => ({ ...s }));
        this.renderExternalUserSelections(oldSelections, this._externalUserSelections);
    }
    /**
     * Remove event listeners on socket and editor
     */
    unlisten() {
        this.socket.off();
        this.editor.off(this.editorBlockEvent, this.onEditorBlockEvent);
        this.redactorObserver.disconnect();
        this.toolboxObserver.disconnect();
        document.removeEventListener('selectionchange', this.throttledInlineSelectionChange);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('focus', this.onWindowFocus);
        window.removeEventListener('blur', this.onWindowBlur);
        window.removeEventListener("beforeunload", this.onDisconnect, { capture: true });
        this.stopPreviousExternalUserInactivityTracking();
        this.stopPreviousPresencePing();
        this.socket.send({ type: UserDisconnectedType, connectionId: this.socket.connectionId });
        // remove cursors, selections and block lockings
        this.externalUserSelections = [];
        this.lockedBlocks = [];
        this._isListening = false;
    }
    /**
     * Start listening for events.
     */
    listen() {
        this.socket.on(this.onReceiveChange);
        this.editor.on(this.editorBlockEvent, this.onEditorBlockEvent);
        const redactor = this.getRedactor();
        if (!redactor) {
            console.error("Could not initialize redactor observer.");
            return;
        }
        this.redactorObserver.observe(redactor, {
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        });
        const toolboxSettingsEl = this.getEditorHolder()?.querySelector(`.${this.EditorCSS.toolbarSettings}`) ?? document.querySelector(`.${this.EditorCSS.toolbarSettings}`);
        if (toolboxSettingsEl)
            this.toolboxObserver.observe(toolboxSettingsEl, {
                childList: true,
                attributes: true,
                attributeFilter: ["class"],
                subtree: true
            });
        else
            console.error("Could not initialize toolbox observer.");
        if (this.throttledInlineSelectionChange)
            document.addEventListener('selectionchange', this.throttledInlineSelectionChange);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        window.addEventListener('focus', this.onWindowFocus);
        window.addEventListener('blur', this.onWindowBlur);
        window.addEventListener("beforeunload", this.onDisconnect, { capture: true });
        this._isListening = true;
        this.startExternalUserInactivityTracking();
        this.startPresencePing();
        this.syncExternalCursors();
    }
    /**
     * Manually trigger cursor syncronization for other users. This is already called when a new user joins and wants to see other users' cursors, but can be useful in other edge cases as well.
     */
    syncExternalCursors() {
        if (!this.isListening)
            return;
        this.externalUserSelections = [];
        this.socket.send({ type: UserInlineSelectionAsk });
    }
    getSelectionAsData() {
        if (!document.hasFocus())
            return null;
        if (document.visibilityState !== 'visible')
            return null;
        const selection = document.getSelection();
        if (!selection)
            return null;
        if (!selection.rangeCount)
            return null;
        const { anchorNode, anchorOffset, focusOffset } = selection;
        if (!anchorNode)
            return null;
        if (!anchorNode.isConnected)
            return null;
        if (!this.isNodeInsideOfEditor(anchorNode))
            return null;
        const { parentElement } = anchorNode;
        if (!parentElement)
            return null;
        const contentAndBlockId = this.getContentAndBlockIdFromNode(anchorNode);
        if (!contentAndBlockId)
            return null;
        const { blockId, contentElement } = contentAndBlockId;
        const elementNodeIndex = this.getNodeRelativeChildIndex(anchorNode);
        if (elementNodeIndex === null)
            return null;
        const path = this.getElementXPath(parentElement);
        const containerWidth = contentElement.clientWidth;
        const data = {
            type: UserInlineSelectionChangeType,
            blockId,
            elementXPath: path,
            containerWidth,
            anchorOffset,
            focusOffset,
            elementNodeIndex,
            // rects: finalRects,
            color: this.config.cursor?.color ?? '',
            selectionColor: this.config.cursor?.selectionColor ?? '',
            connectionId: this.socket.connectionId
        };
        return data;
    }
    //#endregion
    //#region Private APIs
    get CSS() {
        return {
            selected: 'cdx-realtime-block--selected',
            inlineCursor: 'cdx-realtime-inline-cursor',
            inlineSelection: 'cdx-realtime-inline-selection',
            deletePending: "cdx-realtime-block--delete-pending",
            lockedBlock: "cdx-realtime-block--locked",
        };
    }
    get EditorCSS() {
        return {
            baseBlock: 'ce-block',
            focused: 'ce-block--focused',
            selected: 'ce-block--selected',
            editorWrapper: "codex-editor",
            editorRedactor: 'codex-editor__redactor',
            blockContent: 'ce-block__content',
            toolbar: "ce-toolbar",
            toolbarSettings: "ce-settings",
            toolbarDeleteSetting: "[data-item-name='delete']",
            table: {
                row: "tc-row",
                cell: "tc-cell"
            }
        };
    }
    handleMutation(mutation) {
        if (mutation.type !== 'attributes')
            return;
        const { target } = mutation;
        if (!(target instanceof HTMLElement))
            return;
        const isSelected = target.classList.contains(this.EditorCSS.selected);
        const isFocused = target.classList.contains(this.EditorCSS.focused);
        const blockId = target.getAttribute(this.blockIdAttributeName);
        if (!blockId)
            return;
        // we need to save the current selected & focus state for each block or else we are sending too much data through socket
        if (this.localBlockStates[blockId]?.has('selected') != isSelected) {
            if (this.ignoreEvents[blockId]?.has(UserBlockSelectionChangeType))
                return;
            this.localBlockStates[blockId] ??= new Set();
            if (isSelected)
                this.localBlockStates[blockId].add('selected');
            else
                this.localBlockStates[blockId].delete('selected');
            this.socket.send({
                type: UserBlockSelectionChangeType,
                blockId,
                isSelected,
            });
        }
        // Focused class doesnt have any important styles fo i wont implement this now
        // if (this.localBlockStates[blockId]?.has('focused') != isFocused) {
        //     this.localBlockStates[blockId] ??= new Set()
        //     if (isFocused) this.localBlockStates[blockId].add('focused')
        //     else this.localBlockStates[blockId].delete('focused')
        // }
        if (!this.localBlockStates[blockId].size)
            delete this.localBlockStates[blockId];
    }
    handleToolboxMutation(mutation) {
        const { target } = mutation;
        if (!(target instanceof HTMLElement))
            return;
        //? This might not work for all editor versions
        const isToolbarClosing = target.innerHTML === '';
        const currentIndex = this.editor.blocks.getCurrentBlockIndex();
        const blockApi = this.editor.blocks.getBlockByIndex(currentIndex);
        if (!blockApi)
            return;
        let isDeletePending = false;
        if (!isToolbarClosing) {
            const toolboxDeleteSetting = this.getEditorHolder()?.querySelector(`.${this.EditorCSS.toolbar} ${this.EditorCSS.toolbarDeleteSetting}`);
            if (!(toolboxDeleteSetting instanceof HTMLElement))
                return;
            isDeletePending = toolboxDeleteSetting.classList.contains("ce-popover-item--confirmation");
        }
        const blockId = blockApi.id;
        if (this.localBlockStates[blockId]?.has('deleting') != isDeletePending) {
            if (this.ignoreEvents[blockId]?.has(UserBlockDeletionChangeType))
                return;
            this.localBlockStates[blockId] ??= new Set();
            if (isDeletePending)
                this.localBlockStates[blockId].add('deleting');
            else
                this.localBlockStates[blockId].delete('deleting');
            this.socket.send({
                type: UserBlockDeletionChangeType,
                blockId,
                isDeletePending
            });
        }
    }
    //#region Inline Selection Change Handling
    onInlineSelectionChange = (e) => {
        const data = this.getSelectionAsData();
        if (!data)
            return;
        const blockId = data.blockId;
        // this makes blocks be at least up to date before trying to set the cursor (which uses selections on actual dom elements)
        const blockIsLocked = blockId === this._currentEditorLockingBlockId;
        if (!blockIsLocked) {
            this.socket.send(data);
            return;
        }
        setTimeout(() => {
            this.socket.send(data);
        }, 40);
    };
    onDisconnect = (e) => {
        this.socket.send({ type: UserDisconnectedType, connectionId: this.socket.connectionId });
    };
    onVisibilityChange = () => {
        if (!this.isListening)
            return;
        if (document.visibilityState !== 'visible')
            return;
        this.syncExternalCursors();
        this.onInlineSelectionChange();
    };
    onWindowFocus = () => {
        if (!this.isListening)
            return;
        this.syncExternalCursors();
        this.onInlineSelectionChange();
    };
    onWindowBlur = () => {
        if (!this.isListening)
            return;
        this.getFakeSelections({ connectionId: this.socket.connectionId })?.forEach(selection => selection.remove());
        this.getFakeCursors({ connectionId: this.socket.connectionId })?.forEach(cursor => cursor.remove());
    };
    //#region Receive Changes Handling
    onReceiveChange = (response) => {
        this.markExternalUserSeen(response);
        switch (response.type) {
            case 'block-added': {
                const { index, block } = response;
                this.addBlockToIgnoreListUntilNextRender(block.id, response.type);
                this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id);
                const shouldHaveInternalState = this.config.toolsWithDataCheck.includes(block.tool);
                if (shouldHaveInternalState) {
                    this._customToolsInternalState[block.id] = { data: block.data, tunes: block.tunes ?? {} };
                }
                break;
            }
            case 'block-changed': {
                const { index, block } = response;
                this.addBlockToIgnoreListUntilNextRender(block.id, response.type);
                const shouldHaveInternalState = this.config.toolsWithDataCheck.includes(block.tool);
                if (shouldHaveInternalState) {
                    this._customToolsInternalState[block.id] = { data: block.data, tunes: block.tunes ?? {} };
                }
                const customClassList = this.getDOMBlockById(block.id)?.classList;
                const blockApi = this.editor.blocks.getById(block.id);
                if (!blockApi)
                    return;
                this.editor.blocks
                    .update(block.id, block.data)
                    .catch((e) => {
                    if (e.message === `Block with id "${block.id}" not found`) {
                        this.addBlockToIgnoreListUntilNextRender(block.id, 'block-added');
                        this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id);
                    }
                })
                    .then(() => {
                    const lockedBlock = this.lockedBlocks.find(b => b.blockId === block.id && b.connectionId !== this.socket.connectionId);
                    if (lockedBlock) {
                        this.renderLockedBlocks([], [lockedBlock]);
                    }
                    // some blocks when being selected emit a block-changed event
                    if (customClassList?.contains(this.CSS.selected)) {
                        const domBlock = this.getDOMBlockById(block.id);
                        if (!domBlock)
                            return;
                        domBlock.classList.add(this.CSS.selected);
                        if (this.config.overrideStyles?.selectedClass)
                            domBlock.classList.add(this.config.overrideStyles.selectedClass);
                    }
                });
                break;
            }
            case 'block-moved': {
                const { toBlockId, fromBlockId, toBlockIndex } = response;
                const toIndex = this.editor.blocks.getBlockIndex(toBlockId);
                const fromIndex = this.editor.blocks.getBlockIndex(fromBlockId);
                const blocksAreNowInSync = toBlockIndex === fromIndex;
                if (blocksAreNowInSync)
                    return;
                this.addBlockToIgnoreListUntilNextRender(fromBlockId, response.type);
                this.editor.blocks.move(toIndex, fromIndex);
                // Remove selections for affected blocks
                this.externalUserSelections = this._externalUserSelections.filter(s => s.blockId !== fromBlockId && s.blockId !== toBlockId);
                break;
            }
            case 'block-removed': {
                const { blockId } = response;
                this.addBlockToIgnoreListUntilNextRender(blockId, response.type);
                const blockIndex = this.editor.blocks.getBlockIndex(blockId);
                const blockName = this.editor.blocks.getBlockByIndex(blockIndex)?.name ?? "";
                this.editor.blocks.delete(blockIndex);
                const shouldHaveInternalState = this.config.toolsWithDataCheck.includes(blockName);
                if (shouldHaveInternalState) {
                    delete this._customToolsInternalState[blockId];
                }
                // Remove selections for deleted block
                this.externalUserSelections = this._externalUserSelections.filter(s => s.blockId !== blockId);
                break;
            }
            case 'block-selection-change': {
                const { blockId, isSelected } = response;
                this.addBlockToIgnoreListUntilNextRender(blockId, response.type);
                const block = this.getDOMBlockById(blockId);
                if (!block)
                    return;
                if (isSelected) {
                    block.classList.add(this.CSS.selected);
                    if (this.config.overrideStyles?.selectedClass)
                        block.classList.add(this.config.overrideStyles.selectedClass);
                }
                else {
                    block.classList.remove(this.CSS.selected);
                    if (this.config.overrideStyles?.selectedClass)
                        block.classList.remove(this.config.overrideStyles.selectedClass);
                }
                break;
            }
            case 'block-deletion-change': {
                const { blockId, isDeletePending } = response;
                this.addBlockToIgnoreListUntilNextRender(blockId, response.type);
                const block = this.getDOMBlockById(blockId);
                if (!block)
                    return;
                if (isDeletePending) {
                    block.classList.add(this.CSS.deletePending);
                    if (this.config.overrideStyles?.pendingDeletionClass)
                        block.classList.add(this.config.overrideStyles.pendingDeletionClass);
                }
                else {
                    block.classList.remove(this.CSS.deletePending);
                    if (this.config.overrideStyles?.pendingDeletionClass)
                        block.classList.remove(this.config.overrideStyles.pendingDeletionClass);
                }
                break;
            }
            case 'inline-selection-change': {
                const { type, elementXPath, blockId, connectionId, anchorOffset, elementNodeIndex, focusOffset, color, selectionColor, containerWidth } = response;
                // Build the new selection data
                const newSelectionData = {
                    elementXPath,
                    blockId,
                    connectionId,
                    anchorOffset,
                    focusOffset,
                    elementNodeIndex,
                    containerWidth,
                    color,
                    selectionColor,
                };
                // Update state: remove old selection for this connectionId, add new one
                const updatedSelections = this._externalUserSelections.filter(s => s.connectionId !== connectionId);
                updatedSelections.push(newSelectionData);
                this.externalUserSelections = updatedSelections;
                break;
            }
            case UserInlineSelectionAsk: {
                this.onInlineSelectionChange();
                break;
            }
            case UserDisconnectedType: {
                const { connectionId } = response;
                this.externalUserSelections = this._externalUserSelections.filter(s => s.connectionId !== connectionId);
                this.lockedBlocks = this.lockedBlocks.filter(b => b.connectionId !== connectionId);
                delete this.externalUserLastSeenMap[connectionId];
                break;
            }
            case UserPresencePingType: {
                break;
            }
            case BlockLockedType: {
                const { blockId, connectionId } = response;
                const alreadyLocked = this.lockedBlocks.some(b => b.blockId === blockId);
                if (alreadyLocked)
                    break;
                this.lockedBlocks = [...this.lockedBlocks, { blockId, connectionId }];
                this.addBlockToIgnoreListUntilNextRender(blockId, 'block-changed');
                const blockApi = this.editor.blocks.getById(blockId);
                if (!blockApi)
                    return;
                //? This fixes the visual flickering btw when updating block data from remote sources
                const Xpath = this.getElementXPath(blockApi.holder);
                this.addStyleToDOM(Xpath, {
                    animationName: 'none',
                }, blockId);
                // Remove selections for locked block
                this.externalUserSelections = this._externalUserSelections.filter(s => s.blockId !== blockId);
                break;
            }
            case BlockUnlockedType: {
                const { blockId, connectionId } = response;
                this.lockedBlocks = this.lockedBlocks.filter(b => !(b.blockId === blockId && b.connectionId === connectionId));
                this.addBlockToIgnoreListUntilNextRender(blockId, 'block-changed');
                this.removeStyleFromDOM(blockId);
                break;
            }
            default: {
            }
        }
    };
    //#region Emit Editor Block Event Handling
    onEditorBlockEvent = async (data) => {
        if (!(data?.event instanceof CustomEvent) || !data.event) {
            console.error('block changed but its not custom event');
            return;
        }
        const { event } = data;
        if (!this.validateEventDetail(event))
            return;
        const type = event.type;
        const { target, ...otherData } = event.detail;
        otherData.type = type;
        const targetId = target.id;
        if (this.ignoreEvents[targetId]?.has(type))
            return;
        const isBlockLocked = this.lockedBlocks.some(b => b.blockId === targetId && b.connectionId !== this.socket.connectionId);
        if (isBlockLocked)
            return;
        const shouldBlockHaveInternalState = this.config.toolsWithDataCheck.includes(target.name);
        // block changes are throttled, thus se have this separate from the other DOM events
        if (type === 'block-changed') {
            // some tools, such as table, emit block-changed events even if i click on another block in the redactor 🤦‍♂️
            if (shouldBlockHaveInternalState) {
                // TODO this might cause an async race.
                const savedData = await target.save();
                if (!savedData)
                    return;
                const dataToCompareWith = { data: savedData.data, tunes: savedData.tunes };
                const hasSameData = this.compareToolsData(this._customToolsInternalState[targetId], dataToCompareWith);
                if (hasSameData && this._currentEditorLockingBlockId !== targetId)
                    return; // skip this nonsense if false alarms are detected
                this._customToolsInternalState[targetId] = dataToCompareWith;
            }
            if (this._currentEditorLockingBlockId == targetId) {
                this.debouncedBlockUnlocking(targetId, this.socket.connectionId);
            }
            else {
                this._currentEditorLockingBlockId = targetId;
                this.socket.send({ type: BlockLockedType, blockId: targetId, connectionId: this.socket.connectionId });
                // Remove any other user's cursor/selection in this block
                this.externalUserSelections = this._externalUserSelections.filter(s => s.blockId !== targetId);
                this.debouncedBlockUnlocking(targetId, this.socket.connectionId);
            }
        }
        //save after dom changes have been propagated to the necessary tools
        setTimeout(async () => {
            if (type === 'block-changed') {
                if (!('index' in otherData) || typeof otherData.index !== 'number')
                    return;
                this.throttledBlockChange?.(target, otherData.index ?? 0);
                setTimeout(() => {
                    this.throttledInlineSelectionChange?.();
                }, 0);
                return;
            }
            const savedData = await target.save();
            if (!savedData)
                return;
            const socketData = {
                type,
                block: savedData,
            };
            if (socketData.type === 'block-added') {
                socketData.index = otherData.index;
                if (shouldBlockHaveInternalState)
                    this._customToolsInternalState[targetId] = { data: savedData.data, tunes: savedData.tunes ?? {} };
            }
            if (socketData.type === 'block-removed') {
                socketData.blockId = targetId;
                if (shouldBlockHaveInternalState)
                    delete this._customToolsInternalState[targetId];
            }
            if (socketData.type === 'block-moved') {
                const { fromIndex, toIndex } = otherData;
                socketData.fromBlockId = targetId;
                socketData.toBlockIndex = toIndex;
                //at this point the blocks already switched places
                socketData.toBlockId = this.editor.blocks.getBlockByIndex(fromIndex)?.id;
            }
            this.socket.send(socketData);
        }, 0);
    };
    //#region Throttled & Debounced Handlers
    setupThrottledListeners() {
        this.throttledInlineSelectionChange = throttle(this.config.blockChangeThrottleDelay, (event) => {
            if (!this.isListening)
                return;
            this.onInlineSelectionChange(event);
        });
        this.throttledBlockChange = throttle(this.config.blockChangeThrottleDelay, async (target, index) => {
            if (!this.isListening)
                return;
            const targetId = target.id;
            const savedData = await target.save();
            if (!savedData)
                return;
            this.applyNeccessaryChanges(target, savedData);
            const socketData = {
                type: 'block-changed',
                block: savedData,
                index,
            };
            if (!this.isListening)
                return;
            this.socket.send(socketData);
            this.addBlockToIgnoreListUntilNextRender(targetId, 'block-changed');
        });
    }
    debouncedBlockUnlocking(blockId, connectionId) {
        const debouncedFunc = this._debouncedBlockUnlockingsMap?.[blockId];
        if (debouncedFunc) {
            debouncedFunc(blockId, connectionId);
            return;
        }
        const newDebouncedFunc = debounce(this.config.blockLockDebounceTime, (bId, connId) => {
            this.socket.send({ type: BlockUnlockedType, blockId: bId, connectionId: connId });
            if (this.currentLockedBlockId === bId)
                this._currentEditorLockingBlockId = null;
            delete this._debouncedBlockUnlockingsMap?.[bId];
        });
        this._debouncedBlockUnlockingsMap = {
            ...(this._debouncedBlockUnlockingsMap),
            [blockId]: newDebouncedFunc
        };
        newDebouncedFunc(blockId, connectionId);
    }
    //#region DOM & utils
    getFakeCursors({ blockId, connectionId }) {
        const editorHolder = this.getEditorHolder();
        if (!blockId && !connectionId)
            return editorHolder?.querySelectorAll(`[${this.inlineFakeCursorAttributeName}]`);
        const connectionQuery = connectionId ? `[${this.connectionIdAttributeName}='${connectionId}']` : "";
        const blockIdQuery = blockId ? `[${this.inlineFakeCursorAttributeName}='${blockId}']` : "";
        const domCursors = editorHolder?.querySelectorAll(`${blockIdQuery}${connectionQuery}`);
        return domCursors;
    }
    createFakeCursor({ blockId, connectionId, color }) {
        const cursor = document.createElement('div');
        cursor.setAttribute(this.inlineFakeCursorAttributeName, blockId);
        cursor.setAttribute(this.connectionIdAttributeName, connectionId);
        cursor.classList.add(this.CSS.inlineCursor);
        if (color)
            cursor.style.setProperty('--realtime-inline-cursor-color', color);
        const { cursorClass } = this.config.overrideStyles ?? {};
        if (cursorClass)
            cursor.classList.add(...cursorClass.split(' '));
        return cursor;
    }
    getFakeSelections({ blockId, connectionId }) {
        const connectionQuery = connectionId ? `[${this.connectionIdAttributeName}='${connectionId}']` : "";
        return this.getEditorHolder()?.querySelectorAll(`[${this.inlineFakeSelectionAttributeName}${blockId ? `='${blockId}'` : ""}]${connectionQuery}`);
    }
    createSelectionElement({ blockId, connectionId }) {
        const selection = document.createElement('div');
        selection.setAttribute(this.inlineFakeSelectionAttributeName, blockId);
        selection.setAttribute(this.connectionIdAttributeName, connectionId);
        selection.classList.add(this.CSS.inlineSelection);
        if (this.config.overrideStyles?.inlineSelectionClass)
            selection.classList.add(this.config.overrideStyles.inlineSelectionClass);
        return selection;
    }
    markExternalUserSeen(data) {
        if (!('connectionId' in data))
            return;
        const { connectionId } = data;
        if (!connectionId || connectionId === this.socket.connectionId)
            return;
        this.externalUserLastSeenMap[connectionId] = Date.now();
    }
    startExternalUserInactivityTracking() {
        this.stopPreviousExternalUserInactivityTracking();
        this.externalUsersCleanupInterval = window.setInterval(() => {
            this.cleanupStaleExternalUsers();
        }, Math.max(1_000, Math.floor(this.config.externalUserIdleTimeout / 3)));
    }
    stopPreviousExternalUserInactivityTracking() {
        if (!this.externalUsersCleanupInterval)
            return;
        window.clearInterval(this.externalUsersCleanupInterval);
        this.externalUsersCleanupInterval = undefined;
    }
    cleanupStaleExternalUsers() {
        const now = Date.now();
        const staleConnectionIds = Object.entries(this.externalUserLastSeenMap)
            .filter(([, lastSeen]) => now - lastSeen >= this.config.externalUserIdleTimeout)
            .map(([connectionId]) => connectionId);
        if (!staleConnectionIds.length)
            return;
        const staleConnectionIdSet = new Set(staleConnectionIds);
        // Remove selections for stale users via setter
        this.externalUserSelections = this._externalUserSelections.filter(s => !staleConnectionIdSet.has(s.connectionId));
        // Also clean up locked blocks and last seen map
        this.lockedBlocks = this.lockedBlocks.filter(b => !staleConnectionIdSet.has(b.connectionId));
        for (const connectionId of staleConnectionIds) {
            delete this.externalUserLastSeenMap[connectionId];
        }
    }
    startPresencePing() {
        this.stopPreviousPresencePing();
        this.presencePingInterval = window.setInterval(() => {
            if (!this.isListening)
                return;
            if (document.visibilityState !== 'visible')
                return;
            if (!document.hasFocus())
                return;
            this.socket.send({ type: UserPresencePingType, connectionId: this.socket.connectionId });
        }, Math.max(1_000, Math.floor(this.config.externalUserIdleTimeout / 2)));
    }
    stopPreviousPresencePing() {
        if (!this.presencePingInterval)
            return;
        window.clearInterval(this.presencePingInterval);
        this.presencePingInterval = undefined;
    }
    validateEventDetail(ev) {
        return (typeof ev.detail === 'object' &&
            ev.detail &&
            (('index' in ev.detail && typeof ev.detail.index === 'number') ||
                ('fromIndex' in ev.detail &&
                    typeof ev.detail.fromIndex === 'number' &&
                    'toIndex' in ev.detail &&
                    typeof ev.detail.toIndex === 'number')) &&
            'target' in ev.detail &&
            typeof ev.detail.target === 'object' &&
            ev.detail.target);
    }
    addBlockToIgnoreListUntilNextRender(blockId, type) {
        this.addBlockToIgnorelist(blockId, type);
        setTimeout(() => {
            this.removeBlockFromIgnorelist(blockId, type);
        }, 0);
    }
    addBlockToIgnorelist(blockId, type) {
        if (!this.ignoreEvents[blockId])
            this.ignoreEvents[blockId] = new Set();
        this.ignoreEvents[blockId].add(type);
    }
    removeBlockFromIgnorelist(blockId, type) {
        if (!this.ignoreEvents[blockId])
            return;
        this.ignoreEvents[blockId].delete(type);
        if (!this.ignoreEvents[blockId].size)
            delete this.ignoreEvents[blockId];
    }
    addStyleToDOM(selector, styles, nonce) {
        const styleElement = this.editorStyleElement;
        if (!styleElement)
            return;
        const stringifiedStyles = this.stringifyStyles(styles);
        const comment = document.createComment(`nonce: ${nonce}`);
        styleElement.insertAdjacentText('beforeend', `${selector} {  ${stringifiedStyles} }`);
        styleElement.insertBefore(comment, styleElement.lastChild);
    }
    removeStyleFromDOM(nonce) {
        const styleElement = this.editorStyleElement;
        if (!styleElement)
            return;
        const comments = Array.from(styleElement.childNodes).filter(n => n.nodeType === Node.COMMENT_NODE);
        const targetComment = comments.find(c => c.data.trim() === `nonce: ${nonce}`);
        if (!targetComment)
            return;
        targetComment.nextSibling?.remove();
        targetComment.remove();
    }
    stringifyStyles(styleObject) {
        const sheet = new CSSStyleSheet();
        sheet.insertRule(':root {}');
        const rule = sheet.cssRules[0];
        if (!rule || !(rule instanceof CSSStyleRule))
            return;
        Object.assign(rule.style, styleObject);
        return rule.style.cssText;
    }
    getDOMBlockById(blockId) {
        const block = this.getEditorHolder()?.querySelector(`[${this.blockIdAttributeName}='${blockId}']`);
        if (block instanceof HTMLElement)
            return block;
        return null;
    }
    getRedactor() {
        const redactor = this.editor?.ui.redactor ??
            this.getEditorHolder()?.querySelector(`.${this.EditorCSS.editorRedactor}`) ??
            document.querySelector(`.${this.EditorCSS.editorRedactor}`);
        if (!(redactor instanceof HTMLElement))
            return null;
        return redactor;
    }
    getEditorHolder() {
        return this.editor?.ui.wrapper ??
            document.querySelector(`#${this.editor?.configuration.holder} .${this.EditorCSS.editorWrapper}`) ??
            document.querySelector(`.${this.EditorCSS.editorWrapper}`);
    }
    renderLockedBlocks(oldLockedBlocks, newLockedBlocks) {
        const blocksToUnlock = oldLockedBlocks.filter(ob => !newLockedBlocks.some(nb => nb.blockId === ob.blockId && nb.connectionId === ob.connectionId));
        const blocksToLock = newLockedBlocks.filter(nb => !oldLockedBlocks.some(ob => ob.blockId === nb.blockId && ob.connectionId === nb.connectionId));
        const collabAttribute = 'data-realtime-collab-locked';
        for (const block of blocksToUnlock) {
            const domBlock = this.getDOMBlockById(block.blockId);
            if (!domBlock)
                continue;
            const contentEditableElements = domBlock.querySelectorAll(`[contenteditable="false"][${collabAttribute}]`);
            domBlock.classList.remove(this.CSS.lockedBlock);
            contentEditableElements.forEach(el => {
                el.setAttribute('contenteditable', 'true');
                el.removeAttribute(collabAttribute);
            });
            if (this.config.overrideStyles?.lockedBlockClass)
                domBlock.classList.remove(this.config.overrideStyles.lockedBlockClass);
        }
        for (const block of blocksToLock) {
            const domBlock = this.getDOMBlockById(block.blockId);
            if (!domBlock)
                continue;
            const contentEditableElements = domBlock.querySelectorAll('[contenteditable="true"]');
            contentEditableElements.forEach(el => {
                el.setAttribute('contenteditable', 'false');
                el.setAttribute(collabAttribute, '');
            });
            domBlock.classList.add(this.CSS.lockedBlock);
            if (this.config.overrideStyles?.lockedBlockClass)
                domBlock.classList.add(this.config.overrideStyles.lockedBlockClass);
        }
    }
    renderExternalUserSelections(oldSelections, newSelections) {
        const editorHolder = this.getEditorHolder();
        if (!editorHolder)
            return;
        // Find connectionIds to remove (in old but not in new)
        const oldConnectionIds = new Set(oldSelections.map(s => s.connectionId));
        const newConnectionIds = new Set(newSelections.map(s => s.connectionId));
        // Remove DOM for connectionIds no longer in state
        for (const connectionId of oldConnectionIds) {
            if (!newConnectionIds.has(connectionId)) {
                this.getFakeCursors({ connectionId })?.forEach(cursor => cursor.remove());
                this.getFakeSelections({ connectionId })?.forEach(selection => selection.remove());
            }
        }
        // For each new selection, check if it changed from old and re-render if so
        for (const newSel of newSelections) {
            const oldSel = oldSelections.find(s => s.connectionId === newSel.connectionId);
            const hasChanged = !oldSel || !this.selectionsAreEqual(oldSel, newSel);
            if (hasChanged) {
                this.renderSingleExternalSelection(newSel, editorHolder);
            }
        }
    }
    selectionsAreEqual(a, b) {
        return a.elementXPath === b.elementXPath &&
            a.blockId === b.blockId &&
            a.connectionId === b.connectionId &&
            a.anchorOffset === b.anchorOffset &&
            a.focusOffset === b.focusOffset &&
            a.elementNodeIndex === b.elementNodeIndex &&
            a.containerWidth === b.containerWidth &&
            a.color === b.color &&
            a.selectionColor === b.selectionColor;
    }
    renderSingleExternalSelection(selection, editorHolder) {
        const { elementXPath, blockId, connectionId, anchorOffset, focusOffset, elementNodeIndex, color, selectionColor } = selection;
        // Remove existing DOM elements for this connectionId
        this.getFakeCursors({ connectionId })?.forEach(cursor => cursor.remove());
        this.getFakeSelections({ connectionId })?.forEach(sel => sel.remove());
        // Validate that the block content exists
        const blockContent = this.getDOMBlockById(blockId)?.querySelector(`.${this.EditorCSS.blockContent}`);
        if (!blockContent)
            return;
        // Resolve XPath to actual DOM element
        const parentElement = editorHolder.querySelector(elementXPath);
        if (!(parentElement instanceof HTMLElement))
            return;
        const nodeElement = parentElement.childNodes[elementNodeIndex];
        if (!nodeElement)
            return;
        // TODO test this when anchor and focus are in different nodes, currently we only support selections within a single node
        const calculatedSelectionRects = this.getBoundingClientRectForSelection(nodeElement, anchorOffset, focusOffset);
        if (!calculatedSelectionRects)
            return;
        const parentElementRect = editorHolder.getBoundingClientRect();
        const isSelection = anchorOffset !== focusOffset;
        if (isSelection) {
            // Render selection highlights
            for (let i = 0; i < calculatedSelectionRects.length; i++) {
                const rect = calculatedSelectionRects.item(i);
                if (!rect)
                    continue;
                const selectionElement = this.createSelectionElement({ blockId, connectionId });
                selectionElement.style.top = `${rect.top - parentElementRect.top}px`;
                selectionElement.style.left = `${rect.left - parentElementRect.left}px`;
                selectionElement.style.width = `${rect.width}px`;
                selectionElement.style.height = `${rect.height}px`;
                if (selectionColor)
                    selectionElement.style.setProperty('--realtime-inline-selection-color', selectionColor);
                editorHolder.insertAdjacentElement('beforeend', selectionElement);
                this.addBlockToIgnoreListUntilNextRender(blockId, 'block-changed');
            }
        }
        else {
            // Render cursor (collapsed selection)
            const cursor = this.createFakeCursor({ connectionId, blockId, color });
            const rect = calculatedSelectionRects.item(0);
            if (!rect)
                return;
            const { fontSize } = window.getComputedStyle(parentElement);
            cursor.style.height = fontSize;
            cursor.style.top = `${rect.top - parentElementRect.top}px`;
            cursor.style.left = `${rect.left - parentElementRect.left}px`;
            editorHolder.insertAdjacentElement('beforeend', cursor);
        }
    }
    // With stringify, the order of the keys might differ, so we need a deep comparison
    compareToolsData(toolData1, toolData2) {
        function recursiveCompare(obj1, obj2) {
            if (typeof obj1 !== typeof obj2)
                return false;
            if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
                return obj1 === obj2;
            }
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            if (keys1.length !== keys2.length)
                return false;
            for (const key of keys1) {
                if (!keys2.includes(key))
                    return false;
                if (!recursiveCompare(obj1[key], obj2[key]))
                    return false;
            }
            return true;
        }
        const value = recursiveCompare(toolData1, toolData2);
        return value;
    }
    initializeCustomToolsState() {
        const allBlocks = this.editor.configuration.data?.blocks ?? [];
        for (const block of allBlocks) {
            if (this.config.toolsWithDataCheck.includes(block.type)) {
                this._customToolsInternalState[block.id] = { data: block.data, tunes: block.tunes ?? {} };
            }
        }
    }
    setupStyleElement() {
        this.editorStyleElement.setAttribute('data-realtime-collab-styles', '');
        this.getEditorHolder()?.insertAdjacentElement('afterbegin', this.editorStyleElement);
    }
    getContentAndBlockIdFromNode(node) {
        if (!this.isNodeInsideOfEditor(node))
            return null;
        let el = node.parentElement;
        const isContentElement = (el) => el?.classList.contains(this.EditorCSS.blockContent) &&
            el?.parentElement?.classList.contains(this.EditorCSS.baseBlock) &&
            el?.parentElement.hasAttribute(this.blockIdAttributeName);
        while (el && !isContentElement(el)) {
            el = el.parentElement;
        }
        if (!el)
            return null;
        const blockId = el.parentElement?.getAttribute(this.blockIdAttributeName);
        if (!blockId)
            return null;
        return {
            contentElement: el,
            blockId,
        };
    }
    getBoundingClientRectForSelection(node, anchorOffset, focusOffset) {
        try {
            const range = document.createRange();
            const start = Math.min(anchorOffset, focusOffset);
            const end = Math.max(anchorOffset, focusOffset);
            range.setStart(node, start);
            range.setEnd(node, end);
            const rect = range.getClientRects();
            return rect;
        }
        catch (e) {
            const message = `Failed to set cursor/selection range for node. This can happen if the offsets are out of bounds for the given node (Data is not synced at the DOM level, even if json level is).`;
            console.error(message, { cause: e });
            return null;
        }
    }
    isNodeInsideOfEditor(node) {
        const redactor = this.editor?.ui?.nodes?.redactor;
        if (redactor instanceof HTMLElement)
            return redactor.contains(node);
        const holder = this.editor?.configuration?.holder;
        if (holder && typeof holder === 'string')
            return document.getElementById(holder)?.contains(node);
        let currentElement = node.parentElement;
        while (currentElement && currentElement !== document.body) {
            const blockId = currentElement.getAttribute(this.blockIdAttributeName);
            const isEditorBlockElement = currentElement.classList.contains(this.EditorCSS.baseBlock);
            const isCurrentEditorElement = blockId && Boolean(this.editor.blocks.getById(blockId));
            if (isEditorBlockElement && isCurrentEditorElement)
                return true;
            currentElement = currentElement.parentElement;
        }
        return false;
    }
    getElementXPath(selectedNode, omitCountForBlock = false) {
        let element = selectedNode;
        // If the element does not have an ID, construct the XPath based on its ancestors
        const paths = [];
        while (element.parentNode instanceof HTMLElement && !element.classList.contains(this.EditorCSS.editorRedactor)) {
            const dataId = element.getAttribute(this.blockIdAttributeName);
            let elementSelector = element.localName.toLowerCase();
            if (dataId)
                elementSelector += `[${this.blockIdAttributeName}='${dataId}']`;
            const ignoreNthChild = omitCountForBlock && dataId;
            if (!ignoreNthChild && element.previousElementSibling) {
                let sibling = element;
                let count = 1;
                while ((sibling = sibling.previousElementSibling)) {
                    count++;
                }
                elementSelector += `:nth-child(${count})`;
            }
            paths.unshift(elementSelector);
            element = element.parentNode;
        }
        paths.unshift(`.${this.EditorCSS.editorRedactor}`);
        const directChildSelector = ' > ';
        return paths.join(directChildSelector);
    }
    getNodeRelativeChildIndex(node) {
        const { parentElement } = node;
        if (!parentElement)
            return null;
        for (let i = 0; i < parentElement.childNodes.length; i++) {
            if (node === parentElement.childNodes[i])
                return i;
        }
        return null;
    }
    applyNeccessaryChanges(target, savedData) {
        switch (target.name) {
            case "table": {
                const rows = target.holder.querySelectorAll(`.${this.EditorCSS.table.row}`);
                rows.forEach((row, idx) => {
                    const cells = Array.from(row.querySelectorAll(`.${this.EditorCSS.table.cell}`));
                    const areAllEmpty = cells.every(cell => !cell.textContent?.trim());
                    if (!areAllEmpty)
                        return;
                    // i need to make this row not disappear on one screen but remain on the other.
                    const content = savedData.data?.content;
                    if (content instanceof Array) {
                        content.splice(idx, 0, cells.map(c => c.textContent));
                    }
                });
                break;
            }
        }
    }
}

export { GroupCollab as default };
