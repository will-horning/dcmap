(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.2'

!function(root, String){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + _s.escapeRegExp(characters) + ']';
  };

  // Helper for toBoolean
  function boolMatch(s, matchers) {
    var i, matcher, down = s.toLowerCase();
    matchers = [].concat(matchers);
    for (i = 0; i < matchers.length; i += 1) {
      matcher = matchers[i];
      if (!matcher) continue;
      if (matcher.test && matcher.test(s)) return true;
      if (matcher.toLowerCase() === down) return true;
    }
  }

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'"
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars) reversedEscapeChars[escapeChars[key]] = key;
  reversedEscapeChars["'"] = '#39';

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.3.0',

    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return _s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;

      str = String(str);
      substr = String(substr);

      var count = 0,
        pos = 0,
        length = substr.length;

      while (true) {
        pos = str.indexOf(substr, pos);
        if (pos === -1) break;
        count++;
        pos += length;
      }

      return count;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = _s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return _s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return _s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      str  = String(str).toLowerCase();
      return str.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c ? c.toUpperCase() : ""; });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return _s.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
    },

    humanize: function(str){
      return _s.capitalize(_s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrim) return nativeTrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/rwz
     */
    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = _s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (_s.isBlank(str)) return [];
      return _s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      if (!str) return 0;
      str = _s.trim(str);
      if (!str.match(/^-?\d+(?:\.\d+)?$/)) return NaN;
      return parseNumber(parseNumber(str).toFixed(~~decimals));
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = typeof tsep == 'string' ? tsep : ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    strRight: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', ';
      lastSeparator = lastSeparator || ' and ';
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return _s.toSentence.apply(_s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
          to    = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str, quoteChar) {
      return _s.surround(str, quoteChar || '"');
    },

    unquote: function(str, quoteChar) {
      quoteChar = quoteChar || '"';
      if (str[0] === quoteChar && str[str.length-1] === quoteChar)
        return str.slice(1,str.length-1);
      else return str;
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
        result[prop] = this[prop];
      }

      return result;
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    naturalCmp: function(str1, str2){
      if (str1 == str2) return 0;
      if (!str1) return -1;
      if (!str2) return 1;

      var cmpRegex = /(\.\d+)|(\d+)|(\D+)/g,
        tokens1 = String(str1).toLowerCase().match(cmpRegex),
        tokens2 = String(str2).toLowerCase().match(cmpRegex),
        count = Math.min(tokens1.length, tokens2.length);

      for(var i = 0; i < count; i++) {
        var a = tokens1[i], b = tokens2[i];

        if (a !== b){
          var num1 = parseInt(a, 10);
          if (!isNaN(num1)){
            var num2 = parseInt(b, 10);
            if (!isNaN(num2) && num1 - num2)
              return num1 - num2;
          }
          return a < b ? -1 : 1;
        }
      }

      if (tokens1.length === tokens2.length)
        return tokens1.length - tokens2.length;

      return str1 < str2 ? -1 : 1;
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    },

    toBoolean: function(str, trueValues, falseValues) {
      if (typeof str === "number") str = "" + str;
      if (typeof str !== "string") return !!str;
      str = _s.trim(str);
      if (boolMatch(str, trueValues || ["true", "1"])) return true;
      if (boolMatch(str, falseValues || ["false", "0"])) return false;
    }
  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;
  _s.q        = _s.quote;
  _s.toBool   = _s.toBoolean;

  // Exporting

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = _s;

    exports._s = _s;
  }

  // Register as a named module with AMD.
  if (typeof define === 'function' && define.amd)
    define('underscore.string', [], function(){ return _s; });


  // Integrate with Underscore.js if defined
  // or create our own underscore object.
  root._ = root._ || {};
  root._.string = root._.str = _s;
}(this, String);

},{}],3:[function(require,module,exports){
var _ = require('lodash');
_.str = require('underscore.string');

var oldOnAdd = L.Marker.prototype.onAdd;
var oldOnRemove = L.Marker.prototype.onRemove;

module.exports = {
    addCircleMarker: function(map, latlon){
        var circle_marker = L.marker(
            latlon, 
            {icon: L.divIcon({
                className: 'circleMarker',
                iconAnchor: [24, 24],
                iconSize: [48,48]
        })}).addTo(map);
        setTimeout(function() {map.removeLayer(circle_marker);}, 2000);
    },
    
    FadeMarker: L.Marker.extend({
        onAdd: function(map){
            L.Marker.prototype.onAdd.call(this, map);
            $(this._icon).removeClass('fadeOut').addClass('fadeIn');
            $(this._icon).css('opacity', 1);
        },
        onRemove: function(map){
            $(this._icon).removeClass('fadeIn').addClass('fadeOut');
            $(this._icon).css('opacity', 0);
            var this_marker = this;
            setTimeout(function(){
                L.Marker.prototype.onRemove.call(this_marker, map)
            }, 500);
    }})
}
},{"lodash":1,"underscore.string":2}],4:[function(require,module,exports){
var config = {};
config.MARKER_QUEUE_SIZE = 30;
config.MAP_CENTER = [  38.896149, -77.036617];
config.MAP_ZOOM = 12;
config.instagram = {};
config.twitter = {};
config.instagram.ICON_PATH = "/images/mascoticons/32x32/instagram-32x32.png";
config.twitter.ICON_PATH = "/images/mascoticons/32x32/twitter-32x32.png";
config.SIDEBAR_WIDTH = '250px';
config.CAMERA_ICON_URL = '/images/mapicons.nicolasmollet.com/road-transportation-78005c/trafficcamera.png';
config.WIFI_ICON_URL = '/images/mapicons.nicolasmollet.com/interior/wifi.png';
config.CRIME_ICON_URLS = {
        'THEFT F/AUTO': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'HOMICIDE': '/images/mapicons.nicolasmollet.com/crime/crimescene.png',
        'ASSAULT W/DANGEROUS WEAPON': '/images/mapicons.nicolasmollet.com/crime/shooting.png',
        'ROBBERY': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'BURGLARY': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'MOTOR VEHICLE THEFT': '/images/mapicons.nicolasmollet.com/road-transportation-c72222/car.png',
        'THEFT/OTHER': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'SEX ABUSE': '/images/mapicons.nicolasmollet.com/crime/rape.png',
        'ARSON': '/images/mapicons.nicolasmollet.com/crime/fire.png'
};

config.NOMINATIM_URL = 'http://nominatim.openstreetmap.org/';

config.DNC_ICON = '/images/democrat.png';
config.GOP_ICON = '/images/republican.png';
config.NO_PARTY_ICON = '/images/nonparty.png';

config.metro = {};
config.metro.UPDATES_URL =  'http://www.wmata.com/rider_tools/pids/showpid.cfm?station_id=%s';

config.metro.LINE_COLOR = {
    BL: '#0000B0',
    RD: '#9E0003',
    OR: '#C97600',
    YL: '#DBD800',
    GR: '#059600',
    SV: '#AAAAAA'
};

module.exports = config;
},{}],5:[function(require,module,exports){
var config = require('./client_config');

module.exports = function(map, layers){
    L.control.fullscreen({position: 'topright'}).addTo(map);

    $.get('/sidebar', function(data){
        $('#sidebar').html(data);
        $('.layerToggle').click(function(){
            var layer = layers[$(this).attr('id')];
            if(map.hasLayer(layer)) map.removeLayer(layer);
            else map.addLayer(layer);
        });
        $('.btn-group-vertical').css('margin-left', '25px');
        $('#sidebar').ready(function(){$('#sidebar').show();});
    });

    sidebar = L.control.sidebar('sidebar', {position:'left', autoPan: false});
    map.addControl(sidebar);
    $('.leaflet-sidebar').css('width', config.SIDEBAR_WIDTH);

    L.Control.SidebarOpen = L.Control.extend({
        options: {position: 'topleft'},
        onAdd: function (map) {
            var controlDiv = L.DomUtil.create('div', 'leaflet-control-sidebar-open');
            var glyphspan = $('<span></span>');
            glyphspan.addClass('glyphicon');
            glyphspan.addClass('glyphicon-cog');
            L.DomEvent
                .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function(){
                sidebar.toggle();            
            });

            var controlUI = L.DomUtil.create('div', 'leaflet-control-sidebar-open-interior', controlDiv);
            controlUI.title = 'Map Commands';
            return controlDiv;
        }
    });

    sidebarOpenControl = new L.Control.SidebarOpen();


    sidebar.on('show', function(){
        sidebarOpenControl.removeFrom(map);    
    });
    sidebar.on('hidden', function(){
        sidebarOpenControl.addTo(map);  
            $('.leaflet-control-sidebar-open-interior').append('<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-cog"></span> </button>');
  
    });

    map.addControl(sidebarOpenControl);
        $('.leaflet-control-sidebar-open-interior').append('<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-cog"></span> </button>');

    module.sidebar = sidebar;
    module.sidebarOpenControl = sidebarOpenControl;
}
},{"./client_config":4}],6:[function(require,module,exports){
module.exports=[{"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Barbara Comstock", "district": "", "title": "Candidate", "image_available": null, "state": "", "affiliate": "", "crp_id": "", "party": "R", "id": 19027, "resource_uri": "/api/v1/lawmaker/19027/"}], "id": 37490, "entertainment": "Fundraiser", "lon": -78.4927721, "party": "R", "start_date": "2014-09-30", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": null, "lat": 37.1232245, "is_presidential": false, "more_details": "", "contributions_info": "", "venue": {"city": "McLean", "venue_name": "Home of Bobbie & Bill Kilberg", "address1": "", "address2": "", "zipcode": "", "state": "VA", "id": 6251, "resource_uri": "/api/v1/venue/6251/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [{"resource_uri": "/api/v1/host/5310/", "crp_id": "N00006424", "name": "Bobbie Kilberg", "id": 5310}, {"resource_uri": "/api/v1/host/5311/", "crp_id": "Y00000405991", "name": "Bill Kilberg", "id": 5311}], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37490/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S000320", "name": "Richard Shelby", "district": "", "title": "Sen.", "image_available": true, "state": "AL", "affiliate": "", "crp_id": "N00009920", "party": "R", "id": 680, "resource_uri": "/api/v1/lawmaker/680/"}], "id": 37683, "entertainment": "Lunch", "lon": -77.002217, "party": "R", "start_date": "2014-09-25", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8934047, "is_presidential": false, "more_details": "", "contributions_info": "$2,000", "venue": {"city": "Washington", "venue_name": "The 116 Club", "address1": "234 3rd Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 5122, "resource_uri": "/api/v1/venue/5122/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37683/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S000320", "name": "Richard Shelby", "district": "", "title": "Sen.", "image_available": true, "state": "AL", "affiliate": "", "crp_id": "N00009920", "party": "R", "id": 680, "resource_uri": "/api/v1/lawmaker/680/"}], "id": 37775, "entertainment": "Lunch", "lon": -77.002217, "party": "R", "start_date": "2014-09-24", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8934047, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $1,000 PAC: $2,000", "venue": {"city": "Washington", "venue_name": "116 Club", "address1": "234 3rd St Ne", "address2": "", "zipcode": "20002", "state": "DC", "id": 233, "resource_uri": "/api/v1/venue/233/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37775/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B001261", "name": "John Barrasso", "district": "", "title": "Sen.", "image_available": true, "state": "WY", "affiliate": "", "crp_id": "N00006236", "party": "R", "id": 157, "resource_uri": "/api/v1/lawmaker/157/"}], "id": 37573, "entertainment": "Annual Italian Night!!", "lon": -77.0057709, "party": "R", "start_date": "2014-09-23", "rsvp_info": "Amy Bradley", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 38.8809437, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,000", "venue": {"city": "Washington", "venue_name": "UPS Townhouse", "address1": "421 New Jersey Ave SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 412, "resource_uri": "/api/v1/venue/412/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37573/"}, {"canceled": false, "beneficiaries": [{"bioguide": "I000024", "name": "Jim Inhofe", "district": "", "title": "Sen.", "image_available": true, "state": "OK", "affiliate": "", "crp_id": "N00005582", "party": "R", "id": 59, "resource_uri": "/api/v1/lawmaker/59/"}], "id": 37658, "entertainment": "Lunch Patio Cookout", "lon": -77.0034034096495, "party": "R", "start_date": "2014-09-18", "rsvp_info": "Direct Connect Consulting Group", "checks_payable_to_address": "", "end_date": null, "start_time": "13:00:00", "lat": 38.8954928220203, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$5,000/$2,500/$1,000 Individual: $2,600/$1,000/$250", "venue": {"city": "Washington", "venue_name": "National Republican Senatorial Committee", "address1": "425 2nd Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 27, "resource_uri": "/api/v1/venue/27/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37658/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S000320", "name": "Richard Shelby", "district": "", "title": "Sen.", "image_available": true, "state": "AL", "affiliate": "", "crp_id": "N00009920", "party": "R", "id": 680, "resource_uri": "/api/v1/lawmaker/680/"}], "id": 37681, "entertainment": "Agriculture Industry Lunch", "lon": -77.002217, "party": "R", "start_date": "2014-09-18", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8934047, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,000 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "116 Club", "address1": "234 3rd St Ne", "address2": "", "zipcode": "20002", "state": "DC", "id": 233, "resource_uri": "/api/v1/venue/233/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37681/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "More Conservatives PAC", "district": "", "title": "", "image_available": null, "state": "", "affiliate": "Patrick McHenry", "crp_id": "C00540187", "party": "R", "id": 19088, "resource_uri": "/api/v1/lawmaker/19088/"}], "id": 36779, "entertainment": "North Carolina Brew Tasting Series", "lon": -77.0068813793103, "party": "R", "start_date": "2014-09-17", "rsvp_info": "Bill Oorbeek", "checks_payable_to_address": "", "end_date": null, "start_time": "16:00:00", "lat": 38.8849845862069, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,000", "venue": {"city": "Washington", "venue_name": "Associated General Contractors (AGC) of America Townhouse", "address1": "53 D Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 594, "resource_uri": "/api/v1/venue/594/"}, "make_checks_payable_to": "McPAC", "distribution_paid_for_by": "McPAC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/36779/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001184", "name": "Tim Scott", "district": "", "title": "Sen.", "image_available": true, "state": "SC", "affiliate": "", "crp_id": "N00031782", "party": "R", "id": 18588, "resource_uri": "/api/v1/lawmaker/18588/"}], "id": 37680, "entertainment": "Financial Services Dinner", "lon": -77.0282154, "party": "R", "start_date": "2014-09-16", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 38.8973427, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,500 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "NoPa Kitchen & Bar", "address1": "800 F Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 6320, "resource_uri": "/api/v1/venue/6320/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37680/"}, {"canceled": false, "beneficiaries": [{"bioguide": "F000444", "name": "Jeff Flake", "district": "", "title": "Sen.", "image_available": true, "state": "AZ", "affiliate": "", "crp_id": "N00009573", "party": "R", "id": 18581, "resource_uri": "/api/v1/lawmaker/18581/"}], "id": 37602, "entertainment": "Cold Stone Creamery Reception Honoring Senator Jeff Flake", "lon": -77.0057709, "party": "R", "start_date": "2014-09-16", "rsvp_info": "Meredith Mino Bonyun", "checks_payable_to_address": "", "end_date": null, "start_time": "17:30:00", "lat": 38.8809437, "is_presidential": false, "more_details": "", "contributions_info": "$500/$1,000/$2,500", "venue": {"city": "Washington", "venue_name": "419 New Jersey Avenue SE", "address1": "419 New Jersey Avenue SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 5116, "resource_uri": "/api/v1/venue/5116/"}, "make_checks_payable_to": "Jeff Flake for US Senate", "distribution_paid_for_by": "", "hosts": [], "end_time": "19:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37602/"}, {"canceled": false, "beneficiaries": [{"bioguide": "J000293", "name": "Ron Johnson", "district": "", "title": "Sen.", "image_available": true, "state": "WI", "affiliate": "", "crp_id": "N00032546", "party": "R", "id": 18093, "resource_uri": "/api/v1/lawmaker/18093/"}], "id": 37663, "entertainment": "Lunch", "lon": -77.0158755, "party": "R", "start_date": "2014-09-15", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "13:00:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$500", "venue": {"city": "Washington", "venue_name": "Charlie Palmer Steak", "address1": "101 Constitution Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 22, "resource_uri": "/api/v1/venue/22/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37663/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000577", "name": "Mike Lee", "district": "", "title": "Sen.", "image_available": true, "state": "UT", "affiliate": "", "crp_id": "N00031696", "party": "R", "id": 17946, "resource_uri": "/api/v1/lawmaker/17946/"}], "id": 37668, "entertainment": "Dinner", "lon": -77.5708067, "party": "R", "start_date": "2014-09-15", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 39.6566765, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,000 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "The Capital Grille - Downtown", "address1": "601 Pennsylvania Avenue, NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 4881, "resource_uri": "/api/v1/venue/4881/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37668/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001184", "name": "Tim Scott", "district": "", "title": "Sen.", "image_available": true, "state": "SC", "affiliate": "", "crp_id": "N00031782", "party": "R", "id": 18588, "resource_uri": "/api/v1/lawmaker/18588/"}], "id": 37679, "entertainment": "Breakfast", "lon": -77.0366456, "party": "R", "start_date": "2014-09-11", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "09:00:00", "lat": 38.8949549, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$500", "venue": {"city": "Washington", "venue_name": "TBD", "address1": "", "address2": "", "zipcode": "", "state": "DC", "id": 2421, "resource_uri": "/api/v1/venue/2421/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37679/"}, {"canceled": false, "beneficiaries": [{"bioguide": "A000368", "name": "Kelly A. Ayotte", "district": "", "title": "Sen.", "image_available": true, "state": "NH", "affiliate": "", "crp_id": "N00030980", "party": "R", "id": 17726, "resource_uri": "/api/v1/lawmaker/17726/"}], "id": 37559, "entertainment": "Lunch", "lon": -77.002217, "party": "R", "start_date": "2014-09-11", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8934047, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "116 Club", "address1": "234 3rd St Ne", "address2": "", "zipcode": "20002", "state": "DC", "id": 233, "resource_uri": "/api/v1/venue/233/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37559/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Barbara Comstock", "district": "", "title": "Candidate", "image_available": null, "state": "", "affiliate": "", "crp_id": "", "party": "R", "id": 19027, "resource_uri": "/api/v1/lawmaker/19027/"}], "id": 37540, "entertainment": "Fundraiser", "lon": -78.4927721, "party": "R", "start_date": "2014-09-10", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": null, "lat": 37.1232245, "is_presidential": false, "more_details": "", "contributions_info": "$150/$2,600", "venue": {"city": "Middleburg", "venue_name": "Home of Kristi & Vito Germinario", "address1": "", "address2": "", "zipcode": "", "state": "VA", "id": 6281, "resource_uri": "/api/v1/venue/6281/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [{"resource_uri": "/api/v1/host/13960/", "crp_id": "", "name": "Vito Germinario", "id": 13960}, {"resource_uri": "/api/v1/host/14857/", "crp_id": "", "name": "Kristi Germinario", "id": 14857}], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37540/"}, {"canceled": false, "beneficiaries": [{"bioguide": "F000444", "name": "Jeff Flake", "district": "", "title": "Sen.", "image_available": true, "state": "AZ", "affiliate": "", "crp_id": "N00009573", "party": "R", "id": 18581, "resource_uri": "/api/v1/lawmaker/18581/"}], "id": 37599, "entertainment": "Washington Nationals vs. Arizona Diamondbacks", "lon": -77.0085268, "party": "R", "start_date": "2014-08-21", "rsvp_info": "Meredith Mino Bonyun", "checks_payable_to_address": "", "end_date": null, "start_time": "16:05:00", "lat": 38.8723594, "is_presidential": false, "more_details": "", "contributions_info": "$1,000 per ticket", "venue": {"city": "Washington", "venue_name": "Nationals Park", "address1": "1500 South Capitol Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 390, "resource_uri": "/api/v1/venue/390/"}, "make_checks_payable_to": "Jeff Flake for US Senate", "distribution_paid_for_by": "", "hosts": [{"resource_uri": "/api/v1/host/3395/", "crp_id": "Y00000184470", "name": "Beth Jafari", "id": 3395}, {"resource_uri": "/api/v1/host/3399/", "crp_id": "", "name": "Glen Chambers", "id": 3399}, {"resource_uri": "/api/v1/host/4013/", "crp_id": "Y00000177800", "name": "Rob Lehman", "id": 4013}, {"resource_uri": "/api/v1/host/4565/", "crp_id": "Y00000306940", "name": "Chris Gahan", "id": 4565}, {"resource_uri": "/api/v1/host/7486/", "crp_id": "", "name": "Todd Novascone", "id": 7486}, {"resource_uri": "/api/v1/host/7490/", "crp_id": "", "name": "Doug Schwartz", "id": 7490}, {"resource_uri": "/api/v1/host/14868/", "crp_id": "Y0000009132L", "name": "Steven Voeller", "id": 14868}, {"resource_uri": "/api/v1/host/14869/", "crp_id": "", "name": "Mac Abrams", "id": 14869}], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37599/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Rip Sullivan", "district": "48", "title": "Candidate", "image_available": null, "state": "VA", "affiliate": "", "crp_id": "", "party": "D", "id": 19326, "resource_uri": "/api/v1/lawmaker/19326/"}], "id": 37373, "entertainment": "Fundraiser", "lon": -82.6581081, "party": "D", "start_date": "2014-08-02", "rsvp_info": "Kate Petersen", "checks_payable_to_address": "", "end_date": null, "start_time": "12:30:00", "lat": 27.8083165, "is_presidential": false, "more_details": "", "contributions_info": "$100/$200/$500", "venue": {"city": "Arlington", "venue_name": "Home of Barbara Favola & Doug Weik", "address1": "2319 18th St. N", "address2": "", "zipcode": "22201", "state": "VA", "id": 6005, "resource_uri": "/api/v1/venue/6005/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "Rip Sullivan for Delegate", "hosts": [], "end_time": "14:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37373/"}, {"canceled": false, "beneficiaries": [{"bioguide": "T000461", "name": "Pat Toomey", "district": "", "title": "Sen.", "image_available": true, "state": "PA", "affiliate": "", "crp_id": "N00001489", "party": "R", "id": 17787, "resource_uri": "/api/v1/lawmaker/17787/"}], "id": 37735, "entertainment": "Breakfast", "lon": -77.0089927, "party": "R", "start_date": "2014-07-31", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37735/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B000575", "name": "Roy Blunt", "district": "", "title": "Sen.", "image_available": true, "state": "MO", "affiliate": "", "crp_id": "N00005195", "party": "R", "id": 18017, "resource_uri": "/api/v1/lawmaker/18017/"}], "id": 37576, "entertainment": "Breakfast", "lon": -76.99951, "party": "R", "start_date": "2014-07-31", "rsvp_info": "Keri Ann Hayes", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.894786, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,000", "venue": {"city": "Washington", "venue_name": "The Monocle Restaurant", "address1": "107 D Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 65, "resource_uri": "/api/v1/venue/65/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37576/"}, {"canceled": false, "beneficiaries": [{"bioguide": null, "name": "Dan Coats", "district": "", "title": "Sen.", "image_available": false, "state": "IN", "affiliate": "", "crp_id": "", "party": "R", "id": 17858, "resource_uri": "/api/v1/lawmaker/17858/"}], "id": 37583, "entertainment": "Lunch", "lon": -77.002217, "party": "R", "start_date": "2014-07-31", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8934047, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "116 Club", "address1": "234 3rd St Ne", "address2": "", "zipcode": "20002", "state": "DC", "id": 233, "resource_uri": "/api/v1/venue/233/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37583/"}, {"canceled": false, "beneficiaries": [{"bioguide": "G000386", "name": "Chuck Grassley", "district": "", "title": "Sen.", "image_available": true, "state": "IA", "affiliate": "", "crp_id": "N00001758", "party": "R", "id": 334, "resource_uri": "/api/v1/lawmaker/334/"}], "id": 37655, "entertainment": "Breakfast", "lon": -76.99951, "party": "R", "start_date": "2014-07-30", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.894786, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,000", "venue": {"city": "Washington", "venue_name": "The Monocle Restaurant", "address1": "107 D Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 65, "resource_uri": "/api/v1/venue/65/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37655/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Walt Havenstein", "district": "", "title": "Candidate", "image_available": null, "state": "NH", "affiliate": "", "crp_id": "", "party": "R", "id": 19239, "resource_uri": "/api/v1/lawmaker/19239/"}], "id": 37413, "entertainment": "Fundraiser", "lon": -77.0691780778441, "party": "R", "start_date": "2014-07-30", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": null, "lat": 38.859694859688, "is_presidential": false, "more_details": "", "contributions_info": "$250/$2,000", "venue": {"city": "Arlington", "venue_name": "Army Navy Golf Club", "address1": "1700 Army Navy Drive", "address2": "", "zipcode": "22202", "state": "VA", "id": 131, "resource_uri": "/api/v1/venue/131/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37413/"}, {"canceled": false, "beneficiaries": [{"bioguide": "P000595", "name": "Gary Peters", "district": "9", "title": "Rep.", "image_available": true, "state": "MI", "affiliate": "", "crp_id": "N00029277", "party": "D", "id": 562, "resource_uri": "/api/v1/lawmaker/562/"}], "id": 37364, "entertainment": "Luncheon", "lon": -77.0089927, "party": "D", "start_date": "2014-07-30", "rsvp_info": "Jennifer Frost", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "$500/$1,000/$2,500/$5,000", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "Peters for Michigan", "distribution_paid_for_by": "Peters for Michigan", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37364/"}, {"canceled": false, "beneficiaries": [{"bioguide": "J000293", "name": "Ron Johnson", "district": "", "title": "Sen.", "image_available": true, "state": "WI", "affiliate": "", "crp_id": "N00032546", "party": "R", "id": 18093, "resource_uri": "/api/v1/lawmaker/18093/"}], "id": 37662, "entertainment": "Breakfast", "lon": -77.0089927, "party": "R", "start_date": "2014-07-29", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "08:00:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,000/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "Gula Graham", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37662/"}, {"canceled": false, "beneficiaries": [{"bioguide": "K000360", "name": "Mark Kirk", "district": "", "title": "Sen.", "image_available": true, "state": "IL", "affiliate": "", "crp_id": "N00012539", "party": "R", "id": 18090, "resource_uri": "/api/v1/lawmaker/18090/"}], "id": 37665, "entertainment": "Luncheon", "lon": -77.0031162827036, "party": "R", "start_date": "2014-07-29", "rsvp_info": "Endicott Group", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8962053816757, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$500", "venue": {"city": "Washington", "venue_name": "", "address1": "220 E Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 2128, "resource_uri": "/api/v1/venue/2128/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37665/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001184", "name": "Tim Scott", "district": "", "title": "Sen.", "image_available": true, "state": "SC", "affiliate": "", "crp_id": "N00031782", "party": "R", "id": 18588, "resource_uri": "/api/v1/lawmaker/18588/"}], "id": 37678, "entertainment": "Lunch", "lon": -77.002217, "party": "R", "start_date": "2014-07-29", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8934047, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "The 116 Club", "address1": "234 3rd Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 5122, "resource_uri": "/api/v1/venue/5122/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37678/"}, {"canceled": false, "beneficiaries": [{"bioguide": "D000622", "name": "Tammy Duckworth", "district": "08", "title": "Rep.", "image_available": true, "state": "IL", "affiliate": "", "crp_id": "N00027860", "party": "D", "id": 18209, "resource_uri": "/api/v1/lawmaker/18209/"}], "id": 37717, "entertainment": "Breakfast", "lon": -77.0089927, "party": "D", "start_date": "2014-07-29", "rsvp_info": "Duckworth for Congress", "checks_payable_to_address": "PO Box 59568 Schaumburg, IL 60159", "end_date": null, "start_time": "08:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$5,000/$2,500/$1,000 Individual: $500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "Duckworth for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37717/"}, {"canceled": false, "beneficiaries": [{"bioguide": "T000461", "name": "Pat Toomey", "district": "", "title": "Sen.", "image_available": true, "state": "PA", "affiliate": "", "crp_id": "N00001489", "party": "R", "id": 17787, "resource_uri": "/api/v1/lawmaker/17787/"}], "id": 37734, "entertainment": "Dinner", "lon": -77.0213706, "party": "R", "start_date": "2014-07-29", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:30:00", "lat": 38.894978, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,500 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Rasika", "address1": "633 D Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 792, "resource_uri": "/api/v1/venue/792/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37734/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "More Conservatives PAC", "district": "", "title": "", "image_available": null, "state": "", "affiliate": "Patrick McHenry", "crp_id": "C00540187", "party": "R", "id": 19088, "resource_uri": "/api/v1/lawmaker/19088/"}], "id": 36784, "entertainment": "North Carolina Brew Tasting Series", "lon": -77.0068813793103, "party": "R", "start_date": "2014-07-29", "rsvp_info": "Bill Oorbeek", "checks_payable_to_address": "", "end_date": null, "start_time": "16:00:00", "lat": 38.8849845862069, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,000", "venue": {"city": "Washington", "venue_name": "Associated General Contractors (AGC) of America Townhouse", "address1": "53 D Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 594, "resource_uri": "/api/v1/venue/594/"}, "make_checks_payable_to": "McPAC", "distribution_paid_for_by": "McPAC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/36784/"}, {"canceled": false, "beneficiaries": [{"bioguide": "A000368", "name": "Kelly A. Ayotte", "district": "", "title": "Sen.", "image_available": true, "state": "NH", "affiliate": "", "crp_id": "N00030980", "party": "R", "id": 17726, "resource_uri": "/api/v1/lawmaker/17726/"}], "id": 37558, "entertainment": "Breakfast", "lon": -77.022829, "party": "R", "start_date": "2014-07-29", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "09:00:00", "lat": 38.89858, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "Mercury Public Affairs", "address1": "701 8th Street NW", "address2": "Suite 650", "zipcode": "20001", "state": "DC", "id": 4182, "resource_uri": "/api/v1/venue/4182/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37558/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001035", "name": "Susan Collins", "district": "", "title": "Sen.", "image_available": true, "state": "ME", "affiliate": "", "crp_id": "N00000491", "party": "R", "id": 446, "resource_uri": "/api/v1/lawmaker/446/"}], "id": 37588, "entertainment": "Breakfast", "lon": -76.99951, "party": "R", "start_date": "2014-07-29", "rsvp_info": "Magda Patrick or Heather Moore", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.894786, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "The Monocle Restaurant", "address1": "107 D Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 65, "resource_uri": "/api/v1/venue/65/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [{"resource_uri": "/api/v1/host/83/", "crp_id": "Y00000420921", "name": "Smitty Davis", "id": 83}], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37588/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000577", "name": "Mike Lee", "district": "", "title": "Sen.", "image_available": true, "state": "UT", "affiliate": "", "crp_id": "N00031696", "party": "R", "id": 17946, "resource_uri": "/api/v1/lawmaker/17946/"}], "id": 37667, "entertainment": "Dinner", "lon": -77.5708067, "party": "R", "start_date": "2014-07-28", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 39.6566765, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,000 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "The Capital Grille - Downtown", "address1": "601 Pennsylvania Avenue, NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 4881, "resource_uri": "/api/v1/venue/4881/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37667/"}, {"canceled": false, "beneficiaries": [{"bioguide": "N000147", "name": "Eleanor Holmes Norton", "district": "", "title": "Rep.", "image_available": true, "state": "DC", "affiliate": "", "crp_id": "N00001692", "party": "D", "id": 18028, "resource_uri": "/api/v1/lawmaker/18028/"}], "id": 37692, "entertainment": "Luncheon", "lon": -77.0089927, "party": "D", "start_date": "2014-07-28", "rsvp_info": "AB Consulting DC", "checks_payable_to_address": "499 S Capitol Street, SW Suite 422 Washington, DC 20003", "end_date": null, "start_time": "12:00:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "Citizens for Eleanor Holmes Norton", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37692/"}, {"canceled": false, "beneficiaries": [{"bioguide": "N000147", "name": "Eleanor Holmes Norton", "district": "", "title": "Rep.", "image_available": true, "state": "DC", "affiliate": "", "crp_id": "N00001692", "party": "D", "id": 18028, "resource_uri": "/api/v1/lawmaker/18028/"}], "id": 37693, "entertainment": "Evening Reception", "lon": -77.0491931, "party": "D", "start_date": "2014-07-28", "rsvp_info": "AB Consulting DC", "checks_payable_to_address": "499 S Capitol Street, SW Suite 422 Washington, DC 20003", "end_date": null, "start_time": "17:00:00", "lat": 38.9024869, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$1,000/$500/$250", "venue": {"city": "Washington", "venue_name": "PJ Clarke's", "address1": "1600 K Street NW", "address2": "", "zipcode": "20006", "state": "DC", "id": 6317, "resource_uri": "/api/v1/venue/6317/"}, "make_checks_payable_to": "Citizens for Eleanor Holmes Norton", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "18:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37693/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001175", "name": "Jackie Speier", "district": "12", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00029649", "party": "D", "id": 877, "resource_uri": "/api/v1/lawmaker/877/"}], "id": 37699, "entertainment": "Evening Reception", "lon": -77.017216, "party": "D", "start_date": "2014-07-28", "rsvp_info": "Jackie for Congress", "checks_payable_to_address": "PO Box 112 Burlingame, CA 90411", "end_date": null, "start_time": "17:00:00", "lat": 38.912194, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "Art and Soul", "address1": "415 New Jersey Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 2638, "resource_uri": "/api/v1/venue/2638/"}, "make_checks_payable_to": "Jackie for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "19:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37699/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000557", "name": "John Larson", "district": "1", "title": "Rep.", "image_available": true, "state": "CT", "affiliate": "", "crp_id": "N00000575", "party": "D", "id": 217, "resource_uri": "/api/v1/lawmaker/217/"}], "id": 37702, "entertainment": "Lunch", "lon": -77.0213706, "party": "D", "start_date": "2014-07-28", "rsvp_info": "ymwdc@yahoo.com", "checks_payable_to_address": "236 Massachusetts Ave., NW, Ste. 603, Washington, D.C. 20002", "end_date": null, "start_time": "12:00:00", "lat": 38.894978, "is_presidential": false, "more_details": "", "contributions_info": "$1,500", "venue": {"city": "Washington", "venue_name": "Rasika", "address1": "633 D Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 792, "resource_uri": "/api/v1/venue/792/"}, "make_checks_payable_to": "Larson for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37702/"}, {"canceled": false, "beneficiaries": [{"bioguide": null, "name": "Karen Bass", "district": "33", "title": "Rep.", "image_available": false, "state": "CA", "affiliate": "", "crp_id": "", "party": "D", "id": 17917, "resource_uri": "/api/v1/lawmaker/17917/"}], "id": 37704, "entertainment": "Dinner", "lon": -77.0305721, "party": "D", "start_date": "2014-07-28", "rsvp_info": "Karen Bass for Congress", "checks_payable_to_address": "PO Box 34531 Washington, DC 20043", "end_date": null, "start_time": "19:00:00", "lat": 38.897585, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$2,500/$500", "venue": {"city": "Washington", "venue_name": "Noelia Restaurant", "address1": "1319 F Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 6315, "resource_uri": "/api/v1/venue/6315/"}, "make_checks_payable_to": "Karen Bass for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37704/"}, {"canceled": false, "beneficiaries": [{"bioguide": "M001191", "name": "Patrick Murphy", "district": "18", "title": "Rep.", "image_available": true, "state": "FL", "affiliate": "", "crp_id": "N00033091", "party": "D", "id": 18603, "resource_uri": "/api/v1/lawmaker/18603/"}], "id": 37713, "entertainment": "Luncheon", "lon": -77.0434687, "party": "D", "start_date": "2014-07-28", "rsvp_info": "Campaign Finance Group", "checks_payable_to_address": "33 R St. NW, Washington, DC 20001", "end_date": null, "start_time": "12:00:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $10,000/$2,500 Individual:$250", "venue": {"city": "Washington", "venue_name": "Bistro Bis", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 15, "resource_uri": "/api/v1/venue/15/"}, "make_checks_payable_to": "Friends of Patrick Murphy", "distribution_paid_for_by": "DCCC", "hosts": [{"resource_uri": "/api/v1/host/1928/", "crp_id": "C00033969", "name": "Novartis", "id": 1928}, {"resource_uri": "/api/v1/host/3816/", "crp_id": "C00251876", "name": "Amgen PAC", "id": 3816}], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37713/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001056", "name": "John Cornyn", "district": "", "title": "Sen.", "image_available": true, "state": "TX", "affiliate": "", "crp_id": "N00024852", "party": "R", "id": 52, "resource_uri": "/api/v1/lawmaker/52/"}], "id": 37592, "entertainment": "Lunch", "lon": -77.0089927, "party": "R", "start_date": "2014-07-28", "rsvp_info": "Magda Patrick or Heather Moore", "checks_payable_to_address": "", "end_date": null, "start_time": "11:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": "12:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37592/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S000030", "name": "Loretta Sanchez", "district": "47", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00008274", "party": "D", "id": 392, "resource_uri": "/api/v1/lawmaker/392/"}], "id": 37705, "entertainment": "Billy Joel Concert at Nationals Park", "lon": -77.0085268, "party": "D", "start_date": "2014-07-26", "rsvp_info": "Committee to Re-Elect Loretta Sanchez", "checks_payable_to_address": "PO Box 6037 Santa Ana, CA 92706", "end_date": null, "start_time": "20:00:00", "lat": 38.8723594, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500 Individual:$500", "venue": {"city": "Washington", "venue_name": "Nationals Park", "address1": "1500 South Capitol Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 390, "resource_uri": "/api/v1/venue/390/"}, "make_checks_payable_to": "Committee to Re-Elect Loretta Sanchez", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "22:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37705/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B001287", "name": "Ameriash Bera", "district": "03", "title": "", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00030717", "party": "D", "id": 16998, "resource_uri": "/api/v1/lawmaker/16998/"}], "id": 37686, "entertainment": "Space Industry Breakfast", "lon": -77.0158755, "party": "D", "start_date": "2014-07-25", "rsvp_info": "Kalik Associates", "checks_payable_to_address": "PO Box 582496 Elk Grove, CA 95758", "end_date": null, "start_time": "08:30:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $250/$100", "venue": {"city": "Washington ", "venue_name": "Honeywell International", "address1": "101 Constitution Avenue NW", "address2": "Suite 500 West", "zipcode": "20001", "state": "DC", "id": 4101, "resource_uri": "/api/v1/venue/4101/"}, "make_checks_payable_to": "Bera for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37686/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001061", "name": "Emanuel Cleaver", "district": "5", "title": "Rep.", "image_available": true, "state": "MO", "affiliate": "", "crp_id": "N00026790", "party": "D", "id": 312, "resource_uri": "/api/v1/lawmaker/312/"}], "id": 37694, "entertainment": "Breakfast", "lon": -77.0089927, "party": "D", "start_date": "2014-07-25", "rsvp_info": "ymwdc@yahoo.com", "checks_payable_to_address": "236 Massachusetts Ave., NW, Ste. 603, Washington, D.C. 20002", "end_date": null, "start_time": "08:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$1,500 Individual:$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "Cleaver for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37694/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001175", "name": "Jackie Speier", "district": "14", "title": "Rep.", "image_available": null, "state": "CA", "affiliate": "", "crp_id": "N00029649", "party": "D", "id": 19427, "resource_uri": "/api/v1/lawmaker/19427/"}], "id": 37698, "entertainment": "Breakfast Reception", "lon": -77.017216, "party": "D", "start_date": "2014-07-25", "rsvp_info": "Jackie for Congress", "checks_payable_to_address": "PO Box 112 Burlingame, CA 90411", "end_date": null, "start_time": "08:30:00", "lat": 38.912194, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "Art and Soul", "address1": "415 New Jersey Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 2638, "resource_uri": "/api/v1/venue/2638/"}, "make_checks_payable_to": "Jackie for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "10:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37698/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "John Delaney", "district": "6", "title": "Representative", "image_available": null, "state": "MD", "affiliate": "", "crp_id": "N00033897", "party": "D", "id": 18769, "resource_uri": "/api/v1/lawmaker/18769/"}], "id": 37701, "entertainment": "Breakfast", "lon": -77.0434687, "party": "D", "start_date": "2014-07-25", "rsvp_info": "Frost Group", "checks_payable_to_address": "PO Box 60320 Potomac, MD 20859", "end_date": null, "start_time": "09:00:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "Bistro Bis", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 15, "resource_uri": "/api/v1/venue/15/"}, "make_checks_payable_to": "Friends of John Delaney", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "10:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37701/"}, {"canceled": false, "beneficiaries": [{"bioguide": "V000130", "name": "Juan Vargas", "district": "51", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00007021", "party": "D", "id": 18225, "resource_uri": "/api/v1/lawmaker/18225/"}], "id": 37703, "entertainment": "Breakfast", "lon": -77.0089927, "party": "D", "start_date": "2014-07-25", "rsvp_info": "Fiorello Consulting", "checks_payable_to_address": "PO Box 636 Annandale, VA 22003", "end_date": null, "start_time": "08:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "Juan Vargas for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37703/"}, {"canceled": false, "beneficiaries": [{"bioguide": "K000009", "name": "Marcy Kaptur", "district": "9", "title": "Rep.", "image_available": true, "state": "OH", "affiliate": "", "crp_id": "N00003522", "party": "D", "id": 159, "resource_uri": "/api/v1/lawmaker/159/"}], "id": 37706, "entertainment": "Breakfast", "lon": -77.0079626, "party": "D", "start_date": "2014-07-25", "rsvp_info": "Lori Silverman", "checks_payable_to_address": "2605 S. Kenmore Court Arlington, VA 22206", "end_date": null, "start_time": "08:30:00", "lat": 38.8843778, "is_presidential": false, "more_details": "", "contributions_info": "$5,000 write or raise/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "National Democratic Club", "address1": "30 Ivy Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 340, "resource_uri": "/api/v1/venue/340/"}, "make_checks_payable_to": "Kaptur for Congrses", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37706/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001195", "name": "Mark Pocan", "district": "2", "title": "Rep.", "image_available": false, "state": "WI", "affiliate": "", "crp_id": "N00033549", "party": "D", "id": 18481, "resource_uri": "/api/v1/lawmaker/18481/"}], "id": 37707, "entertainment": "Happy Hour", "lon": -77.0081974632043, "party": "D", "start_date": "2014-07-25", "rsvp_info": "AB Consulting", "checks_payable_to_address": "499 S Capitol Street, SW Suite 422 Washington, DC 20003", "end_date": null, "start_time": "15:00:00", "lat": 38.8842570536741, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "National Democratic Club Townhouse", "address1": "40 Ivy Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 1674, "resource_uri": "/api/v1/venue/1674/"}, "make_checks_payable_to": "Mark Pocan for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "16:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37707/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B001279", "name": "Ron Barber", "district": "08", "title": "Rep.", "image_available": false, "state": "AZ", "affiliate": "", "crp_id": "N00033981", "party": "D", "id": 18213, "resource_uri": "/api/v1/lawmaker/18213/"}], "id": 37714, "entertainment": "Lunch", "lon": -77.0213706, "party": "D", "start_date": "2014-07-25", "rsvp_info": "Molly Allen Associates", "checks_payable_to_address": "PAC: $2,500/$1,000 Individual: $500", "end_date": null, "start_time": "12:00:00", "lat": 38.894978, "is_presidential": false, "more_details": "", "contributions_info": "", "venue": {"city": "Washington", "venue_name": "Rasika", "address1": "633 D Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 792, "resource_uri": "/api/v1/venue/792/"}, "make_checks_payable_to": "Ron Barber for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37714/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001185", "name": "Terrycina Andrea Sewell", "district": "07", "title": "Rep.", "image_available": true, "state": "AL", "affiliate": "", "crp_id": "N00030622", "party": "D", "id": 16976, "resource_uri": "/api/v1/lawmaker/16976/"}], "id": 37718, "entertainment": "Breakfast", "lon": -77.0089927, "party": "D", "start_date": "2014-07-25", "rsvp_info": "AB Consulting", "checks_payable_to_address": "499 South Capitol St. SW Suire 422 Washington, DC 20003", "end_date": null, "start_time": "08:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "Terri Sewell for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37718/"}, {"canceled": false, "beneficiaries": [{"bioguide": "J000293", "name": "Ron Johnson", "district": "", "title": "Sen.", "image_available": true, "state": "WI", "affiliate": "", "crp_id": "N00032546", "party": "R", "id": 18093, "resource_uri": "/api/v1/lawmaker/18093/"}], "id": 37661, "entertainment": "Lunch", "lon": -77.0089927, "party": "R", "start_date": "2014-07-24", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "11:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,000/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37661/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000579", "name": "Alan Lowenthal", "district": "47", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00033274", "party": "D", "id": 18609, "resource_uri": "/api/v1/lawmaker/18609/"}], "id": 37685, "entertainment": "Reception", "lon": -77.0057709, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Kieloch Consulting", "checks_payable_to_address": "Bruchert Development, 4320 Atlantic Ave. Suite 125 Long Beach, CA 90807", "end_date": null, "start_time": "17:30:00", "lat": 38.8809437, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "UPS Townhouse", "address1": "421 New Jersey Ave SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 412, "resource_uri": "/api/v1/venue/412/"}, "make_checks_payable_to": "Alan Lowenthal for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "19:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37685/"}, {"canceled": false, "beneficiaries": [{"bioguide": "F000043", "name": "Chaka Fattah", "district": "2", "title": "Rep.", "image_available": true, "state": "PA", "affiliate": "", "crp_id": "N00001746", "party": "D", "id": 764, "resource_uri": "/api/v1/lawmaker/764/"}], "id": 37689, "entertainment": "Lunch", "lon": -77.0081974632043, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Jeremiah Pope Consulting", "checks_payable_to_address": "PO Box 30743 Philadelphia, PA 19104", "end_date": null, "start_time": "12:00:00", "lat": 38.8842570536741, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "National Democratic Club Townhouse", "address1": "40 Ivy Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 1674, "resource_uri": "/api/v1/venue/1674/"}, "make_checks_payable_to": "Fattah for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37689/"}, {"canceled": false, "beneficiaries": [{"bioguide": "M001137", "name": "Gregory Meeks", "district": "6", "title": "Rep.", "image_available": true, "state": "NY", "affiliate": "", "crp_id": "N00001171", "party": "D", "id": 195, "resource_uri": "/api/v1/lawmaker/195/"}], "id": 37695, "entertainment": "Dinner", "lon": -77.0213706, "party": "D", "start_date": "2014-07-24", "rsvp_info": "AB Consulting", "checks_payable_to_address": "499 S Capitol Street, SW Suite 422 Washington, DC 20003", "end_date": null, "start_time": "18:30:00", "lat": 38.894978, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "Rasika", "address1": "633 D Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 792, "resource_uri": "/api/v1/venue/792/"}, "make_checks_payable_to": "Meeks for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "20:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37695/"}, {"canceled": false, "beneficiaries": [{"bioguide": "J000288", "name": "Hank Johnson", "district": "4", "title": "Rep.", "image_available": true, "state": "GA", "affiliate": "", "crp_id": "N00027848", "party": "D", "id": 696, "resource_uri": "/api/v1/lawmaker/696/"}], "id": 37697, "entertainment": "Lunch", "lon": -77.0213706, "party": "D", "start_date": "2014-07-24", "rsvp_info": "ymwdc@yahoo.com", "checks_payable_to_address": "236 Massachusetts Ave., NW, Ste. 603, Washington, D.C. 20002", "end_date": null, "start_time": "12:00:00", "lat": 38.894978, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,500 Individual:$500", "venue": {"city": "Washington", "venue_name": "Rasika", "address1": "633 D Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 792, "resource_uri": "/api/v1/venue/792/"}, "make_checks_payable_to": "Committee to Re-Elect Hank Johnson", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37697/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001083", "name": "John Carney", "district": "01", "title": "Rep.", "image_available": true, "state": "DE", "affiliate": "", "crp_id": "N00030736", "party": "D", "id": 17091, "resource_uri": "/api/v1/lawmaker/17091/"}], "id": 37700, "entertainment": "Reception", "lon": -77.0205631, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Conrad Group", "checks_payable_to_address": "410 1st Street SE Suite 310 Washington, DC 20003", "end_date": null, "start_time": "18:00:00", "lat": 38.8932649, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "Offices of Intuit", "address1": "601 Pennsylvania Ave NW", "address2": "Suite 200", "zipcode": "20004", "state": "DC", "id": 685, "resource_uri": "/api/v1/venue/685/"}, "make_checks_payable_to": "John Carney for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "20:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37700/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Mary Rose Wilcox", "district": "07", "title": "Candidate", "image_available": null, "state": "AZ", "affiliate": "", "crp_id": "", "party": "D", "id": 19426, "resource_uri": "/api/v1/lawmaker/19426/"}], "id": 37708, "entertainment": "Fundraiser", "lon": -77.0081974632043, "party": "D", "start_date": "2014-07-24", "rsvp_info": "For The Record, PPA", "checks_payable_to_address": "PO Box 24507 Phoenix, AZ 85704", "end_date": null, "start_time": "17:30:00", "lat": 38.8842570536741, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$1,00 Individual: $500/$250", "venue": {"city": "Washington", "venue_name": "National Democratic Club Townhouse", "address1": "40 Ivy Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 1674, "resource_uri": "/api/v1/venue/1674/"}, "make_checks_payable_to": "Mary Rose Wilcox for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "19:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37708/"}, {"canceled": false, "beneficiaries": [{"bioguide": "H001034", "name": "Mike Honda", "district": "15", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00012611", "party": "D", "id": 387, "resource_uri": "/api/v1/lawmaker/387/"}], "id": 37709, "entertainment": "Lunch Reception", "lon": -77.0028597, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Arum Group", "checks_payable_to_address": "625 3rd Street NE, Suite #2 Washington, DC 20002", "end_date": null, "start_time": "12:00:00", "lat": 38.887089, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $5,000/$2,500 Individual: $1,000/$500", "venue": {"city": "Washington", "venue_name": "Hunan Dynasty", "address1": "215 Pennsylvania Ave SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 56, "resource_uri": "/api/v1/venue/56/"}, "make_checks_payable_to": "Mike Honda for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37709/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000480", "name": "Nita Lowey", "district": "18", "title": "Rep.", "image_available": true, "state": "NY", "affiliate": "", "crp_id": "N00001024", "party": "D", "id": 492, "resource_uri": "/api/v1/lawmaker/492/"}], "id": 37710, "entertainment": "Breakfast", "lon": -77.0434687, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Frost Group", "checks_payable_to_address": "PO Box 271 White Plains, NY 10605", "end_date": null, "start_time": "08:00:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "Bistro Bis", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 15, "resource_uri": "/api/v1/venue/15/"}, "make_checks_payable_to": "Nita Lowey for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37710/"}, {"canceled": false, "beneficiaries": [{"bioguide": "M001191", "name": "Patrick Murphy", "district": "18", "title": "Rep.", "image_available": true, "state": "FL", "affiliate": "", "crp_id": "N00033091", "party": "D", "id": 18603, "resource_uri": "/api/v1/lawmaker/18603/"}], "id": 37711, "entertainment": "Reception", "lon": -77.021552, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Campaign Finance Group", "checks_payable_to_address": "33 R St. NW, Washington, DC 20001", "end_date": null, "start_time": "17:00:00", "lat": 38.897175, "is_presidential": false, "more_details": "", "contributions_info": "Form", "venue": {"city": "Washington", "venue_name": "Rosa Mexicano", "address1": "575 7th Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 283, "resource_uri": "/api/v1/venue/283/"}, "make_checks_payable_to": "Friends of Patrick Murphy", "distribution_paid_for_by": "DCCC", "hosts": [{"resource_uri": "/api/v1/host/14870/", "crp_id": "", "name": "Grant Thornton LLP", "id": 14870}], "end_time": "18:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37711/"}, {"canceled": false, "beneficiaries": [{"bioguide": "D000617", "name": "Suzan DelBene", "district": "08", "title": "", "image_available": true, "state": "WA", "affiliate": "", "crp_id": "N00030693", "party": "D", "id": 17513, "resource_uri": "/api/v1/lawmaker/17513/"}], "id": 37715, "entertainment": "Lunch", "lon": -77.017963, "party": "D", "start_date": "2014-07-24", "rsvp_info": "AB Consulting", "checks_payable_to_address": "499 S Capitol Street, SW Suite 422 Washington, DC 20003", "end_date": null, "start_time": "12:00:00", "lat": 38.862783, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "8 E Street, SE", "address1": "8 E Street, SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 4886, "resource_uri": "/api/v1/venue/4886/"}, "make_checks_payable_to": "Delbene for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37715/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B001278", "name": "Suzanne Bonamici", "district": "1", "title": "Rep.", "image_available": false, "state": "OR", "affiliate": "", "crp_id": "N00033474", "party": "D", "id": 18490, "resource_uri": "/api/v1/lawmaker/18490/"}], "id": 37716, "entertainment": "Summer Luncheon", "lon": -76.9958987, "party": "D", "start_date": "2014-07-24", "rsvp_info": "AB Consulting", "checks_payable_to_address": "499 S Capitol Street, SW Suite 422 Washington, DC 20003", "end_date": null, "start_time": "12:00:00", "lat": 38.8868872, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,500/$500", "venue": {"city": "Washington", "venue_name": "Acqua Al 2", "address1": "212 7th Street Southeast", "address2": "", "zipcode": "20003", "state": "DC", "id": 3185, "resource_uri": "/api/v1/venue/3185/"}, "make_checks_payable_to": "Bonamici for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37716/"}, {"canceled": false, "beneficiaries": [{"bioguide": "W000799", "name": "Tim Walz", "district": "1", "title": "Rep.", "image_available": true, "state": "MN", "affiliate": "", "crp_id": "N00027467", "party": "D", "id": 1172, "resource_uri": "/api/v1/lawmaker/1172/"}], "id": 37719, "entertainment": "Summer BBQ", "lon": -77.021916, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Molly Allen Associates", "checks_payable_to_address": "PO Box 938 Mankato, MN 56001", "end_date": null, "start_time": "12:00:00", "lat": 38.909645, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $500", "venue": {"city": "Washington", "venue_name": "Hill Country BBQ", "address1": "410 7th Street NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 3468, "resource_uri": "/api/v1/venue/3468/"}, "make_checks_payable_to": "Walz for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37719/"}, {"canceled": false, "beneficiaries": [{"bioguide": "T000461", "name": "Pat Toomey", "district": "", "title": "Sen.", "image_available": true, "state": "PA", "affiliate": "", "crp_id": "N00001489", "party": "R", "id": 17787, "resource_uri": "/api/v1/lawmaker/17787/"}], "id": 37733, "entertainment": "Lunch", "lon": -77.0089927, "party": "R", "start_date": "2014-07-24", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37733/"}, {"canceled": false, "beneficiaries": [{"bioguide": "A000368", "name": "Kelly A. Ayotte", "district": "", "title": "Sen.", "image_available": true, "state": "NH", "affiliate": "", "crp_id": "N00030980", "party": "R", "id": 17726, "resource_uri": "/api/v1/lawmaker/17726/"}], "id": 37557, "entertainment": "Lunch", "lon": -77.0089927, "party": "R", "start_date": "2014-07-24", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37557/"}, {"canceled": false, "beneficiaries": [{"bioguide": "I000024", "name": "Jim Inhofe", "district": "", "title": "Sen.", "image_available": true, "state": "OK", "affiliate": "", "crp_id": "N00005582", "party": "R", "id": 59, "resource_uri": "/api/v1/lawmaker/59/"}], "id": 37316, "entertainment": "Fundraiser", "lon": -77.0158755, "party": "R", "start_date": "2014-07-24", "rsvp_info": "Amy Bradley", "checks_payable_to_address": "", "end_date": null, "start_time": "13:00:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "$500/$1,000/$2,500", "venue": {"city": "Washington", "venue_name": "Charlie Palmer Steak", "address1": "101 Constitution Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 22, "resource_uri": "/api/v1/venue/22/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [{"resource_uri": "/api/v1/host/7641/", "crp_id": "", "name": "National Marine Manufacturers Association's Boat PAC", "id": 7641}], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37316/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B000575", "name": "Roy Blunt", "district": "", "title": "Sen.", "image_available": true, "state": "MO", "affiliate": "", "crp_id": "N00005195", "party": "R", "id": 18017, "resource_uri": "/api/v1/lawmaker/18017/"}], "id": 37574, "entertainment": "Ag Breakfast", "lon": -77.0282154, "party": "R", "start_date": "2014-07-24", "rsvp_info": "Keri Ann Hayes", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.8973427, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,000", "venue": {"city": "Washington", "venue_name": "The Farm Credit Council", "address1": "50 F Street NW", "address2": "Suite 900", "zipcode": "20001", "state": "DC", "id": 579, "resource_uri": "/api/v1/venue/579/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37574/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001035", "name": "Susan Collins", "district": "", "title": "Sen.", "image_available": true, "state": "ME", "affiliate": "", "crp_id": "N00000491", "party": "R", "id": 446, "resource_uri": "/api/v1/lawmaker/446/"}], "id": 37587, "entertainment": "Breakfast", "lon": -77.0057709, "party": "R", "start_date": "2014-07-24", "rsvp_info": "Magda Patrick or Heather Moore", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.8809437, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "", "address1": "419 New Jersey Ave SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 561, "resource_uri": "/api/v1/venue/561/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37587/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000287", "name": "John Lewis", "district": "5", "title": "Rep.", "image_available": true, "state": "GA", "affiliate": "", "crp_id": "N00002577", "party": "D", "id": 81, "resource_uri": "/api/v1/lawmaker/81/"}], "id": 37340, "entertainment": "Breakfast", "lon": -77.0434687, "party": "D", "start_date": "2014-07-24", "rsvp_info": "Caroline Pratt or Pattie Fiorello", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,500/$5,000", "venue": {"city": "Washington", "venue_name": "Hotel George", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 255, "resource_uri": "/api/v1/venue/255/"}, "make_checks_payable_to": "John Lewis for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37340/"}, {"canceled": false, "beneficiaries": [{"bioguide": null, "name": "Daniel Davis", "district": "07", "title": "Rep.", "image_available": false, "state": "IL", "affiliate": "", "crp_id": "", "party": "D", "id": 1265, "resource_uri": "/api/v1/lawmaker/1265/"}], "id": 37646, "entertainment": "Breakfast", "lon": -77.0026388, "party": "D", "start_date": "2014-07-23", "rsvp_info": "Jeremiah Pope - davisevent@jpopeconsulting.com, 202-701-5757", "checks_payable_to_address": "5956 West Race Avenue, Chicago, IL 60644", "end_date": null, "start_time": "09:00:00", "lat": 38.8870056, "is_presidential": false, "more_details": "", "contributions_info": "$2,500; $1,000; $250", "venue": {"city": "Washington", "venue_name": "Sonoma Restaurant and Wine Bar", "address1": "223 Pennsylvania Ave SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 82, "resource_uri": "/api/v1/venue/82/"}, "make_checks_payable_to": "Davis for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "10:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37646/"}, {"canceled": false, "beneficiaries": [{"bioguide": "E000293", "name": "Elizabeth Esty", "district": "5", "title": "Rep.", "image_available": true, "state": "CT", "affiliate": "", "crp_id": "N00033217", "party": "D", "id": 18480, "resource_uri": "/api/v1/lawmaker/18480/"}], "id": 37647, "entertainment": "Labor Breakfast", "lon": -77.5708067, "party": "D", "start_date": "2014-07-23", "rsvp_info": "Greg Kalik - 202-741-7224, greg@kalikassociates.com", "checks_payable_to_address": "PO Box 61, Cheshire, CT 06410", "end_date": null, "start_time": "08:00:00", "lat": 39.6566765, "is_presidential": false, "more_details": "", "contributions_info": "$5,000; $2,500; $1,000", "venue": {"city": "Washington", "venue_name": "SMART Transportation Division", "address1": "304 Pennsylvania Avenue, SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 6312, "resource_uri": "/api/v1/venue/6312/"}, "make_checks_payable_to": "Friends of Elizabeth Esty", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37647/"}, {"canceled": false, "beneficiaries": [{"bioguide": "P000608", "name": "Scott Peters ", "district": "52", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00033591", "party": "D", "id": 18262, "resource_uri": "/api/v1/lawmaker/18262/"}], "id": 37649, "entertainment": "Labor Community Lunch", "lon": -77.0158755, "party": "D", "start_date": "2014-07-23", "rsvp_info": "Molly Allen or Stephanie Mathias, 202-827-8200 or stephanie@mollyallenassociates.com", "checks_payable_to_address": "4715 Viewridge Avenue/Ste 150, San Diego, CA 92123", "end_date": null, "start_time": "12:00:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "$5,000; $2,500; $1,000", "venue": {"city": "Washington", "venue_name": "Charlie Palmer Steak", "address1": "101 Constitution Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 22, "resource_uri": "/api/v1/venue/22/"}, "make_checks_payable_to": "Scott Peters for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37649/"}, {"canceled": false, "beneficiaries": [{"bioguide": "R000595", "name": "Marco Rubio", "district": "", "title": "Sen.", "image_available": true, "state": "FL", "affiliate": "", "crp_id": "N00030612", "party": "R", "id": 17659, "resource_uri": "/api/v1/lawmaker/17659/"}], "id": 37674, "entertainment": "Mojitos with Marco Reception", "lon": -77.0084519285714, "party": "R", "start_date": "2014-07-23", "rsvp_info": "Miller Spence", "checks_payable_to_address": "", "end_date": null, "start_time": "19:00:00", "lat": 38.8849840714286, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$1,000/$250", "venue": {"city": "Washington", "venue_name": "The Townhouse 11 D Street SE", "address1": "11 D Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 3569, "resource_uri": "/api/v1/venue/3569/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "RSCC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37674/"}, {"canceled": false, "beneficiaries": [{"bioguide": "T000461", "name": "Pat Toomey", "district": "", "title": "Sen.", "image_available": true, "state": "PA", "affiliate": "", "crp_id": "N00001489", "party": "R", "id": 17787, "resource_uri": "/api/v1/lawmaker/17787/"}], "id": 37731, "entertainment": "Breakfast", "lon": -77.0491931, "party": "R", "start_date": "2014-07-23", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.9024869, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "1425 K Street NW", "address1": "1425 K Street NW", "address2": "Suite 400", "zipcode": "", "state": "DC", "id": 3024, "resource_uri": "/api/v1/venue/3024/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37731/"}, {"canceled": false, "beneficiaries": [{"bioguide": "T000461", "name": "Pat Toomey", "district": "", "title": "Sen.", "image_available": true, "state": "PA", "affiliate": "", "crp_id": "N00001489", "party": "R", "id": 17787, "resource_uri": "/api/v1/lawmaker/17787/"}], "id": 37732, "entertainment": "Dinner", "lon": -76.9958987, "party": "R", "start_date": "2014-07-23", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 38.8868872, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Acqua Al 2", "address1": "212 7th Street Southeast", "address2": "", "zipcode": "20003", "state": "DC", "id": 3185, "resource_uri": "/api/v1/venue/3185/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37732/"}, {"canceled": false, "beneficiaries": [{"bioguide": "P000602", "name": "Michael Richard Pompeo", "district": "04", "title": "", "image_available": true, "state": "KS", "affiliate": "", "crp_id": "N00030744", "party": "R", "id": 17247, "resource_uri": "/api/v1/lawmaker/17247/"}], "id": 37486, "entertainment": "Reception", "lon": -77.0057709, "party": "R", "start_date": "2014-07-23", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 38.8809437, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,500/$2,500", "venue": {"city": "Washington", "venue_name": "419 New Jersey Avenue SE", "address1": "419 New Jersey Avenue SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 5116, "resource_uri": "/api/v1/venue/5116/"}, "make_checks_payable_to": "Pompeo for Congress", "distribution_paid_for_by": "Pompeo for Congress", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37486/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Alma Adams", "district": "", "title": "Candidate", "image_available": false, "state": "NC", "affiliate": "", "crp_id": "", "party": "D", "id": 19417, "resource_uri": "/api/v1/lawmaker/19417/"}], "id": 37635, "entertainment": "Labor Breakfast", "lon": -77.021916, "party": "D", "start_date": "2014-07-22", "rsvp_info": "Nicole - 615-337-5391, nicole@kalikassociates.com", "checks_payable_to_address": "PO Box 20622 Greensboro, NC 27420", "end_date": null, "start_time": "08:30:00", "lat": 38.909645, "is_presidential": false, "more_details": "", "contributions_info": "Host = $2,500; Sponsor = $1,000", "venue": {"city": "Washington", "venue_name": "International Brotherhood of Electrical Workers", "address1": "900 7th Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 2526, "resource_uri": "/api/v1/venue/2526/"}, "make_checks_payable_to": "Alma Adams for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37635/"}, {"canceled": false, "beneficiaries": [{"bioguide": "W000808", "name": "Frederica S Wilson", "district": "17", "title": "", "image_available": true, "state": "FL", "affiliate": "", "crp_id": "N00030650", "party": "D", "id": 17128, "resource_uri": "/api/v1/lawmaker/17128/"}], "id": 37642, "entertainment": "Pre-Primary Soul Food Lunch", "lon": -77.017216, "party": "D", "start_date": "2014-07-22", "rsvp_info": "Brittany Grimm or Randy Broz, 202-403-0606, Brittany@ABConsultingDC.com", "checks_payable_to_address": "499 South Capitol Street, SW, Suite 422, Washington, DC 20003", "end_date": null, "start_time": "12:00:00", "lat": 38.912194, "is_presidential": false, "more_details": "", "contributions_info": "$5,000; $2,500; $1,500; $500", "venue": {"city": "Washington", "venue_name": "Art and Soul", "address1": "415 New Jersey Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 2638, "resource_uri": "/api/v1/venue/2638/"}, "make_checks_payable_to": "Frederica Wilson for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37642/"}, {"canceled": false, "beneficiaries": [{"bioguide": "T000250", "name": "John Thune", "district": "", "title": "Sen.", "image_available": true, "state": "SD", "affiliate": "", "crp_id": "N00004572", "party": "R", "id": 291, "resource_uri": "/api/v1/lawmaker/291/"}], "id": 37684, "entertainment": "Dinner", "lon": -76.9958987, "party": "R", "start_date": "2014-07-22", "rsvp_info": "Rizzo Dukes", "checks_payable_to_address": "", "end_date": null, "start_time": "18:30:00", "lat": 38.8868872, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $1,000 Individual: $500", "venue": {"city": "Washington", "venue_name": "Acqua Al 2", "address1": "212 7th Street Southeast", "address2": "", "zipcode": "20003", "state": "DC", "id": 3185, "resource_uri": "/api/v1/venue/3185/"}, "make_checks_payable_to": "Friends of John Thune", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37684/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Terri Lynn Land", "district": "", "title": "Cand. for Senat", "image_available": null, "state": "MI", "affiliate": "", "crp_id": "", "party": "R", "id": 18900, "resource_uri": "/api/v1/lawmaker/18900/"}], "id": 37721, "entertainment": "Pre-primry reception with special guest Senator Roy Blunt", "lon": -77.0366456, "party": "R", "start_date": "2014-07-22", "rsvp_info": "Aristela Group", "checks_payable_to_address": "", "end_date": null, "start_time": "17:30:00", "lat": 38.8949549, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$5,000/$2,500/$1,000 Individual:$2,600/$1,000/$500", "venue": {"city": "Washington", "venue_name": "TBA", "address1": "", "address2": "", "zipcode": "20002", "state": "DC", "id": 2574, "resource_uri": "/api/v1/venue/2574/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": "18:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37721/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000575", "name": "James Lankford", "district": "05", "title": "", "image_available": true, "state": "OK", "affiliate": "", "crp_id": "N00031129", "party": "R", "id": 17378, "resource_uri": "/api/v1/lawmaker/17378/"}], "id": 37723, "entertainment": "Reception & Luncheon with special guests", "lon": -77.0158755, "party": "R", "start_date": "2014-07-22", "rsvp_info": "Pearson Associates", "checks_payable_to_address": "", "end_date": null, "start_time": "11:15:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "Reception - PAC:$1,000 Individual:$500 Luncheon - $5,000 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "Charlie Palmer Steak", "address1": "101 Constitution Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 22, "resource_uri": "/api/v1/venue/22/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": "12:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37723/"}, {"canceled": false, "beneficiaries": [{"bioguide": "K000384", "name": "Tim Kaine", "district": "", "title": "Sen.", "image_available": false, "state": "VA", "affiliate": "", "crp_id": "N00033177", "party": "D", "id": 18036, "resource_uri": "/api/v1/lawmaker/18036/"}], "id": 37306, "entertainment": "Smoked 'n' Oaked: A Celebration of Virginia's Best Barbecue, Beer and Bourbon", "lon": -77.017216, "party": "D", "start_date": "2014-07-22", "rsvp_info": "Mary Tabaie", "checks_payable_to_address": "", "end_date": null, "start_time": "18:30:00", "lat": 38.912194, "is_presidential": false, "more_details": "", "contributions_info": "$100/$250/$500/$1,000", "venue": {"city": "Washington", "venue_name": "Jones Day Rooftop", "address1": "300 New Jersey Avenue NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 4425, "resource_uri": "/api/v1/venue/4425/"}, "make_checks_payable_to": "Kaine for Virginia", "distribution_paid_for_by": "Kaine for Virginia", "hosts": [], "end_time": "20:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37306/"}, {"canceled": false, "beneficiaries": [{"bioguide": null, "name": "Dan Coats", "district": "", "title": "Sen.", "image_available": false, "state": "IN", "affiliate": "", "crp_id": "", "party": "R", "id": 17858, "resource_uri": "/api/v1/lawmaker/17858/"}], "id": 37582, "entertainment": "Dinner", "lon": -77.5708067, "party": "R", "start_date": "2014-07-22", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 39.6566765, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $1,000 PAC: $2,000", "venue": {"city": "Washington", "venue_name": "The Capital Grille - Downtown", "address1": "601 Pennsylvania Avenue, NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 4881, "resource_uri": "/api/v1/venue/4881/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37582/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001036", "name": "Lois Capps", "district": "23", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00007232", "party": "D", "id": 471, "resource_uri": "/api/v1/lawmaker/471/"}], "id": 37637, "entertainment": "Health Care Luncheon", "lon": -76.9948694870005, "party": "D", "start_date": "2014-07-21", "rsvp_info": "Shauna Jackson at 202-544-2994, lois.capps@ericksoncompany.com", "checks_payable_to_address": "38 Ivy Street, SE, Washington, DC 20003", "end_date": null, "start_time": "12:00:00", "lat": 38.8824535751705, "is_presidential": false, "more_details": "", "contributions_info": "$2,500 PAC; $1,000; $500", "venue": {"city": "Washington", "venue_name": "Nooshi", "address1": "524 8th Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 6304, "resource_uri": "/api/v1/venue/6304/"}, "make_checks_payable_to": "Friends of Lois Capps", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37637/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Norma Torres", "district": "", "title": "Candidate", "image_available": null, "state": "CA", "affiliate": "", "crp_id": "", "party": "D", "id": 19420, "resource_uri": "/api/v1/lawmaker/19420/"}], "id": 37641, "entertainment": "Labor Event", "lon": -77.036446693908, "party": "D", "start_date": "2014-07-21", "rsvp_info": "Nicole Dorris - 615-337-5391, nicole@kalikassociates.com", "checks_payable_to_address": "728 West Eden Place, Covina, CA 91722", "end_date": null, "start_time": "11:00:00", "lat": 38.9004519970178, "is_presidential": false, "more_details": "", "contributions_info": "$2,500; $1,000", "venue": {"city": "Washington", "venue_name": "AFL-CIO", "address1": "815 16th Street NW", "address2": "George Meany Room", "zipcode": "20006", "state": "DC", "id": 2661, "resource_uri": "/api/v1/venue/2661/"}, "make_checks_payable_to": "Norma Torres for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37641/"}, {"canceled": false, "beneficiaries": [{"bioguide": "G000386", "name": "Chuck Grassley", "district": "", "title": "Sen.", "image_available": true, "state": "IA", "affiliate": "", "crp_id": "N00001758", "party": "R", "id": 334, "resource_uri": "/api/v1/lawmaker/334/"}], "id": 37654, "entertainment": "Dinner", "lon": -76.99951, "party": "R", "start_date": "2014-07-21", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": "18:30:00", "lat": 38.894786, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "The Monocle Restaurant", "address1": "107 D Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 65, "resource_uri": "/api/v1/venue/65/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37654/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000577", "name": "Mike Lee", "district": "", "title": "Sen.", "image_available": true, "state": "UT", "affiliate": "", "crp_id": "N00031696", "party": "R", "id": 17946, "resource_uri": "/api/v1/lawmaker/17946/"}], "id": 37666, "entertainment": "Breakfast", "lon": -77.0089927, "party": "R", "start_date": "2014-07-17", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,000/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "RSCC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37666/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B001236", "name": "John Boozman", "district": "", "title": "Sen.", "image_available": true, "state": "AR", "affiliate": "", "crp_id": "N00013873", "party": "R", "id": 18479, "resource_uri": "/api/v1/lawmaker/18479/"}], "id": 37578, "entertainment": "Breakfast", "lon": -77.0342499, "party": "R", "start_date": "2014-07-17", "rsvp_info": "Laura Rizzo", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.9029968, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $250/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "1015 15th St NW", "address1": "1015 15th St NW", "address2": "", "zipcode": "", "state": "DC", "id": 3562, "resource_uri": "/api/v1/venue/3562/"}, "make_checks_payable_to": "Boozman for Arkansas", "distribution_paid_for_by": "", "hosts": [{"resource_uri": "/api/v1/host/3848/", "crp_id": "C00010868", "name": "ACEC PAC", "id": 3848}], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37578/"}, {"canceled": false, "beneficiaries": [{"bioguide": "G000556", "name": "Alan Grayson", "district": "09", "title": "Rep.", "image_available": null, "state": "FL", "affiliate": "", "crp_id": "N00028418", "party": "D", "id": 19421, "resource_uri": "/api/v1/lawmaker/19421/"}], "id": 37603, "entertainment": "Breakfast", "lon": -77.0034118571429, "party": "D", "start_date": "2014-07-17", "rsvp_info": "Jeff Bogacki, 547-1334 or Jeff@Kieloch.com", "checks_payable_to_address": "8419 Oak Park Road, Orlando, FL 32819", "end_date": "2014-07-17", "start_time": "08:30:00", "lat": 38.8871115714286, "is_presidential": false, "more_details": "", "contributions_info": "Chair, $5,000; co-host, $2,500; individual $500", "venue": {"city": "Washington", "venue_name": "Kieloch Consulting Townhouse", "address1": "228 2nd Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 3455, "resource_uri": "/api/v1/venue/3455/"}, "make_checks_payable_to": "Committee to Elect Alan Grayson", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37603/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Donald S. Beyer Jr.", "district": "", "title": "Candidate", "image_available": null, "state": "VA", "affiliate": "", "crp_id": "", "party": "D", "id": 19251, "resource_uri": "/api/v1/lawmaker/19251/"}], "id": 37611, "entertainment": "Breakfast", "lon": -77.0490328967742, "party": "D", "start_date": "2014-07-17", "rsvp_info": "AB Consulting", "checks_payable_to_address": "5834D N. Kings Highway Alexandria, VA 22303", "end_date": null, "start_time": "08:30:00", "lat": 38.8046155, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$5,000/$2,500/$1,000 Individual:$5,200/$2,600/$1,000/$250", "venue": {"city": "Alexandria", "venue_name": "The Morrison House", "address1": "116 S. Alfred Street", "address2": "", "zipcode": "22314", "state": "VA", "id": 6310, "resource_uri": "/api/v1/venue/6310/"}, "make_checks_payable_to": "Don Beyer for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37611/"}, {"canceled": false, "beneficiaries": [{"bioguide": "M001166", "name": "Jerry McNerney", "district": "11", "title": "Rep.", "image_available": true, "state": "CA", "affiliate": "", "crp_id": "N00026926", "party": "D", "id": 711, "resource_uri": "/api/v1/lawmaker/711/"}], "id": 37616, "entertainment": "Lunch", "lon": -77.0081974632043, "party": "D", "start_date": "2014-07-17", "rsvp_info": "Kalik Associates", "checks_payable_to_address": "PO Box 690371 Stockton, CA 95269", "end_date": null, "start_time": "12:00:00", "lat": 38.8842570536741, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,000/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "National Democratic Club Townhouse", "address1": "40 Ivy Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 1674, "resource_uri": "/api/v1/venue/1674/"}, "make_checks_payable_to": "McNerney for Congress Committee", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37616/"}, {"canceled": false, "beneficiaries": [{"bioguide": "M000355", "name": "Mitch McConnell", "district": "", "title": "Sen.", "image_available": true, "state": "KY", "affiliate": "", "crp_id": "N00003389", "party": "R", "id": 7, "resource_uri": "/api/v1/lawmaker/7/"}], "id": 37669, "entertainment": "Breakfast with Sen. Mitch McConnell", "lon": -77.0031162827036, "party": "R", "start_date": "2014-07-16", "rsvp_info": "Laura.Sequeira@teammitch.com", "checks_payable_to_address": "", "end_date": "2014-07-16", "start_time": "08:30:00", "lat": 38.8962053816757, "is_presidential": false, "more_details": "", "contributions_info": "Host: $5,000; Co-Host: $2,600; Attend: $1,000", "venue": {"city": "Washington", "venue_name": "", "address1": "220 E Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 2128, "resource_uri": "/api/v1/venue/2128/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37669/"}, {"canceled": false, "beneficiaries": [{"bioguide": "R000584", "name": "Jim Risch", "district": "", "title": "Sen.", "image_available": true, "state": "ID", "affiliate": "", "crp_id": "N00029441", "party": "R", "id": 847, "resource_uri": "/api/v1/lawmaker/847/"}], "id": 37673, "entertainment": "Dinner", "lon": -77.0283357, "party": "R", "start_date": "2014-07-16", "rsvp_info": "Oorbeek Morehouse Strategies", "checks_payable_to_address": "", "end_date": null, "start_time": "18:30:00", "lat": 38.8955933, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$1,000 Individual:$500", "venue": {"city": "Washington", "venue_name": "Del Frisco's", "address1": "1201 Pennsylvania Avenue NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 5205, "resource_uri": "/api/v1/venue/5205/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "RSCC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37673/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000575", "name": "James Lankford", "district": "05", "title": "", "image_available": true, "state": "OK", "affiliate": "", "crp_id": "N00031129", "party": "R", "id": 17378, "resource_uri": "/api/v1/lawmaker/17378/"}], "id": 37722, "entertainment": "Luncheon", "lon": -77.0034034096495, "party": "R", "start_date": "2014-07-16", "rsvp_info": "Pearson Associates", "checks_payable_to_address": "", "end_date": null, "start_time": "12:30:00", "lat": 38.8954928220203, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "National Republican Senatorial Committee", "address1": "425 2nd Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 27, "resource_uri": "/api/v1/venue/27/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37722/"}, {"canceled": false, "beneficiaries": [{"bioguide": "E000288", "name": "Keith Ellison", "district": "5", "title": "Rep.", "image_available": true, "state": "MN", "affiliate": "", "crp_id": "N00028257", "party": "D", "id": 1, "resource_uri": "/api/v1/lawmaker/1/"}], "id": 37620, "entertainment": "Breakfast", "lon": -77.0079626, "party": "D", "start_date": "2014-07-16", "rsvp_info": "Mynett Group", "checks_payable_to_address": "PO Box 6072 Minneapolis, MN 55406", "end_date": null, "start_time": "08:30:00", "lat": 38.8843778, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $500", "venue": {"city": "Washington", "venue_name": "National Democratic Club", "address1": "30 Ivy Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 340, "resource_uri": "/api/v1/venue/340/"}, "make_checks_payable_to": "Ellison for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37620/"}, {"canceled": false, "beneficiaries": [{"bioguide": "M001191", "name": "Patrick Murphy", "district": "18", "title": "Rep.", "image_available": true, "state": "FL", "affiliate": "", "crp_id": "N00033091", "party": "D", "id": 18603, "resource_uri": "/api/v1/lawmaker/18603/"}], "id": 37622, "entertainment": "Reception", "lon": -76.9958987, "party": "D", "start_date": "2014-07-16", "rsvp_info": "Campaign Finance Group", "checks_payable_to_address": "33 R St. NW, Washington, DC 20001", "end_date": null, "start_time": "17:30:00", "lat": 38.8868872, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$250", "venue": {"city": "Washington", "venue_name": "Acqua Al 2", "address1": "212 7th Street Southeast", "address2": "", "zipcode": "20003", "state": "DC", "id": 3185, "resource_uri": "/api/v1/venue/3185/"}, "make_checks_payable_to": "Friends of Patrick Murphy", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "19:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37622/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Pete Gallego", "district": "23", "title": "Representative", "image_available": null, "state": "TX", "affiliate": "", "crp_id": "N00033541", "party": "D", "id": 18672, "resource_uri": "/api/v1/lawmaker/18672/"}], "id": 37624, "entertainment": "Twelve at 12:00 ", "lon": -77.0067735555556, "party": "D", "start_date": "2014-07-16", "rsvp_info": "Davey Consulting", "checks_payable_to_address": "PO Box 1781", "end_date": null, "start_time": "12:00:00", "lat": 38.8840292222222, "is_presidential": false, "more_details": "", "contributions_info": "$5000/$2500/$1000", "venue": {"city": "Washington", "venue_name": "21st Century Townhouse", "address1": "434 New Jersey Ave SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 2629, "resource_uri": "/api/v1/venue/2629/"}, "make_checks_payable_to": "Friends of Pete Gallego", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37624/"}, {"canceled": false, "beneficiaries": [{"bioguide": null, "name": "Richard Neal", "district": "1", "title": "Rep.", "image_available": false, "state": "MA", "affiliate": "", "crp_id": "n00000153", "party": "D", "id": 18602, "resource_uri": "/api/v1/lawmaker/18602/"}], "id": 37626, "entertainment": "Reception Celebrating the Dean of MA Delegation", "lon": -77.4956521, "party": "D", "start_date": "2014-07-16", "rsvp_info": "Allison Griner", "checks_payable_to_address": "410 First Street SE Suite 310 Washington DC 20003", "end_date": null, "start_time": "18:00:00", "lat": 39.7049398, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "Legal Sea Foods", "address1": "704 7th Street, NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 3130, "resource_uri": "/api/v1/venue/3130/"}, "make_checks_payable_to": "Richard E Neal for Congress Committee", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "20:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37626/"}, {"canceled": false, "beneficiaries": [{"bioguide": "H001066", "name": "Steven Horsford", "district": "4", "title": "Rep.", "image_available": true, "state": "NV", "affiliate": "", "crp_id": "N00033638", "party": "D", "id": 18162, "resource_uri": "/api/v1/lawmaker/18162/"}], "id": 37631, "entertainment": "Evening Reception", "lon": -77.5708067, "party": "D", "start_date": "2014-07-16", "rsvp_info": "Anna Valero", "checks_payable_to_address": "499 S Capitol Street, SW Suite 422 Washington, DC 20003", "end_date": null, "start_time": "18:00:00", "lat": 39.6566765, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$500", "venue": {"city": "Washington", "venue_name": "Hawk & Dove", "address1": "329 Pennsylvania Ave, SE", "address2": "", "zipcode": "", "state": "DC", "id": 3353, "resource_uri": "/api/v1/venue/3353/"}, "make_checks_payable_to": "Horsford for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "20:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37631/"}, {"canceled": false, "beneficiaries": [{"bioguide": "J000293", "name": "Ron Johnson", "district": "", "title": "Sen.", "image_available": true, "state": "WI", "affiliate": "", "crp_id": "N00032546", "party": "R", "id": 18093, "resource_uri": "/api/v1/lawmaker/18093/"}], "id": 37660, "entertainment": "Dinner", "lon": -77.5708067, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 39.6566765, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500 Individual:$1,500", "venue": {"city": "Washington", "venue_name": "The Capital Grille - Downtown", "address1": "601 Pennsylvania Avenue, NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 4881, "resource_uri": "/api/v1/venue/4881/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37660/"}, {"canceled": false, "beneficiaries": [{"bioguide": "K000360", "name": "Mark Kirk", "district": "", "title": "Sen.", "image_available": true, "state": "IL", "affiliate": "", "crp_id": "N00012539", "party": "R", "id": 18090, "resource_uri": "/api/v1/lawmaker/18090/"}], "id": 37664, "entertainment": "Lunch", "lon": -77.0031162827036, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Endicott Group", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 38.8962053816757, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$500", "venue": {"city": "Washington", "venue_name": "", "address1": "220 E Street NE", "address2": "", "zipcode": "20002", "state": "DC", "id": 2128, "resource_uri": "/api/v1/venue/2128/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37664/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Ben Sasse", "district": "", "title": "Candidate", "image_available": null, "state": "NE", "affiliate": "", "crp_id": "", "party": "R", "id": 19428, "resource_uri": "/api/v1/lawmaker/19428/"}], "id": 37729, "entertainment": "Agriculture Industry Breakfast", "lon": -77.0158755, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "Charlie Palmer Steak", "address1": "101 Constitution Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 22, "resource_uri": "/api/v1/venue/22/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37729/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Ben Sasse", "district": "", "title": "Candidate", "image_available": null, "state": "NE", "affiliate": "", "crp_id": "", "party": "R", "id": 19428, "resource_uri": "/api/v1/lawmaker/19428/"}], "id": 37730, "entertainment": "Restaurant Industry Lunch", "lon": -77.5708067, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "12:00:00", "lat": 39.6566765, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "The Capital Grille - Downtown", "address1": "601 Pennsylvania Avenue, NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 4881, "resource_uri": "/api/v1/venue/4881/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37730/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Dan Bongino", "district": "6", "title": "Rep. Candidate", "image_available": null, "state": "MD", "affiliate": "", "crp_id": "", "party": "R", "id": 19000, "resource_uri": "/api/v1/lawmaker/19000/"}], "id": 37479, "entertainment": "Fundraiser", "lon": -76.9382069, "party": "R", "start_date": "2014-07-15", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": null, "lat": 39.5162234, "is_presidential": false, "more_details": "", "contributions_info": "$40/$2,000", "venue": {"city": "Silver Spring", "venue_name": "TBD", "address1": "", "address2": "", "zipcode": "", "state": "MD", "id": 6243, "resource_uri": "/api/v1/venue/6243/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37479/"}, {"canceled": false, "beneficiaries": [{"bioguide": "V000127", "name": "David Vitter", "district": "", "title": "Sen.", "image_available": true, "state": "LA", "affiliate": "", "crp_id": "N00009659", "party": "R", "id": 948, "resource_uri": "/api/v1/lawmaker/948/"}], "id": 37736, "entertainment": "Dinner", "lon": -77.0364315268441, "party": "R", "start_date": "2014-07-15", "rsvp_info": "L5 Group", "checks_payable_to_address": "", "end_date": null, "start_time": "18:30:00", "lat": 38.9046987625693, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500 Individual:$1,000", "venue": {"city": "Washington", "venue_name": "University Club of Washington DC", "address1": "1135 16th Street NW", "address2": "", "zipcode": "20036", "state": "DC", "id": 839, "resource_uri": "/api/v1/venue/839/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37736/"}, {"canceled": false, "beneficiaries": [{"bioguide": null, "name": "Dan Coats", "district": "", "title": "Sen.", "image_available": false, "state": "IN", "affiliate": "", "crp_id": "", "party": "R", "id": 17858, "resource_uri": "/api/v1/lawmaker/17858/"}], "id": 37581, "entertainment": "Breakfast", "lon": -77.0089927, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Jon Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.9140788, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "Johnny's Half Shell", "address1": "400 North Capitol Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 990, "resource_uri": "/api/v1/venue/990/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37581/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001056", "name": "John Cornyn", "district": "", "title": "Sen.", "image_available": true, "state": "TX", "affiliate": "", "crp_id": "N00024852", "party": "R", "id": 52, "resource_uri": "/api/v1/lawmaker/52/"}], "id": 37591, "entertainment": "Breakfast", "lon": -77.0434687, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Magda Patrick or Heather Moore", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $500/$1,000 PAC: $1,000/$2,500", "venue": {"city": "Washington", "venue_name": "Bistro Bis", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 15, "resource_uri": "/api/v1/venue/15/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37591/"}, {"canceled": false, "beneficiaries": [{"bioguide": "E000285", "name": "Mike Enzi", "district": "", "title": "Sen.", "image_available": true, "state": "WY", "affiliate": "", "crp_id": "N00006249", "party": "R", "id": 330, "resource_uri": "/api/v1/lawmaker/330/"}], "id": 37597, "entertainment": "Capitol View Happy Hour", "lon": -77.0158755, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Amy Bradley", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "Individual: $250 PAC: $1,000", "venue": {"city": "Washington", "venue_name": "", "address1": "101 Constitution Ave NW", "address2": "Suite 900", "zipcode": "20001", "state": "DC", "id": 2389, "resource_uri": "/api/v1/venue/2389/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "", "hosts": [{"resource_uri": "/api/v1/host/824/", "crp_id": "Y00000101480", "name": "Aaron Cohen", "id": 824}, {"resource_uri": "/api/v1/host/1615/", "crp_id": "Y00000396380", "name": "Steve Carey", "id": 1615}, {"resource_uri": "/api/v1/host/3832/", "crp_id": "", "name": "Rob Wallace", "id": 3832}, {"resource_uri": "/api/v1/host/4915/", "crp_id": "Y00000240330", "name": "Bill Spencer", "id": 4915}], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37597/"}, {"canceled": false, "beneficiaries": [{"bioguide": "K000368", "name": "Ann Kirkpatrick", "district": "1", "title": "Rep.", "image_available": true, "state": "AZ", "affiliate": "", "crp_id": "N00029260", "party": "D", "id": 683, "resource_uri": "/api/v1/lawmaker/683/"}], "id": 37604, "entertainment": "Luncheon", "lon": -77.0080910714286, "party": "D", "start_date": "2014-07-15", "rsvp_info": "Jasmine Zamani, 202-236-1205 or jzamani@gmail.com", "checks_payable_to_address": "PO Box 12011, Casa Grande, AZ 85130", "end_date": "2014-07-15", "start_time": "12:00:00", "lat": 38.8849849285714, "is_presidential": false, "more_details": "", "contributions_info": "Host, $2,500; PAC, $1,000; Individual, $500", "venue": {"city": "Washington", "venue_name": "", "address1": "19 D Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 3926, "resource_uri": "/api/v1/venue/3926/"}, "make_checks_payable_to": "Kirkpatrick for Arizona", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37604/"}, {"canceled": false, "beneficiaries": [{"bioguide": "H001038", "name": "Brian Higgins", "district": "26", "title": "Rep", "image_available": null, "state": "NY", "affiliate": "", "crp_id": "N00027060", "party": "D", "id": 19422, "resource_uri": "/api/v1/lawmaker/19422/"}], "id": 37605, "entertainment": "Dinner", "lon": -77.0282816, "party": "D", "start_date": "2014-07-15", "rsvp_info": "Renee Schaeffer, 202-465-4647 or Higgins@SchaefferStrategies.com", "checks_payable_to_address": "P.O. Box 28, Buffalo, NY 14220", "end_date": "2014-07-15", "start_time": "06:30:00", "lat": 38.9009286, "is_presidential": false, "more_details": "", "contributions_info": "$1,500 per seat", "venue": {"city": "Washington", "venue_name": "Bobby Van's Grill ", "address1": "1201 New York Ave NW", "address2": "", "zipcode": "20005", "state": "DC", "id": 103, "resource_uri": "/api/v1/venue/103/"}, "make_checks_payable_to": "Brian Higgins for Congress", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37605/"}, {"canceled": false, "beneficiaries": [{"bioguide": "R000588", "name": "Cedric Richmond", "district": "02", "title": "Rep.", "image_available": true, "state": "LA", "affiliate": "", "crp_id": "N00030184", "party": "D", "id": 17973, "resource_uri": "/api/v1/lawmaker/17973/"}], "id": 37607, "entertainment": "Cocktail Reception", "lon": -77.0077302142857, "party": "D", "start_date": "2014-07-15", "rsvp_info": "Kelsey Rooney or Lindsay Angerholzer, 202-403-0606 or Kelsey@ABConsultingDC.com", "checks_payable_to_address": "499 S. Capitol St. SW, Suite 422, Washington, DC 20003", "end_date": "2014-07-15", "start_time": "19:00:00", "lat": 38.8849857857143, "is_presidential": false, "more_details": "", "contributions_info": "Host: $2,500; PAC, $1,500; Guest: $500", "venue": {"city": "Washington", "venue_name": "Oracle Townhouse", "address1": "27 D Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 5209, "resource_uri": "/api/v1/venue/5209/"}, "make_checks_payable_to": "Richmond for Congress", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37607/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001078", "name": "Gerry Connolly", "district": "11", "title": "Rep.", "image_available": true, "state": "VA", "affiliate": "", "crp_id": "N00029891", "party": "D", "id": 939, "resource_uri": "/api/v1/lawmaker/939/"}], "id": 37614, "entertainment": "Luncheon", "lon": -77.0028597, "party": "D", "start_date": "2014-07-15", "rsvp_info": "Pandit Strategic Consulting", "checks_payable_to_address": "PO Box 563 Merrifield, VA 22116", "end_date": null, "start_time": "12:00:00", "lat": 38.887089, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $5,000/$2,500/$1,000 Individual: $500", "venue": {"city": "Washington", "venue_name": "Hunan Dynasty", "address1": "215 Pennsylvania Ave SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 56, "resource_uri": "/api/v1/venue/56/"}, "make_checks_payable_to": "Gerry Connolly for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37614/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Maryland Republican Party", "district": "", "title": "", "image_available": null, "state": "MD", "affiliate": "", "crp_id": "", "party": "R", "id": 19249, "resource_uri": "/api/v1/lawmaker/19249/"}], "id": 37361, "entertainment": "United We Win: A 2014 Unity Event", "lon": -77.0266488007309, "party": "R", "start_date": "2014-07-15", "rsvp_info": "Online", "checks_payable_to_address": "", "end_date": null, "start_time": "19:00:00", "lat": 38.9980184262367, "is_presidential": false, "more_details": "", "contributions_info": "$40/$125/$500/$1,000/$2,000", "venue": {"city": "Silver Spring", "venue_name": "DoubleTree by Hilton", "address1": "8727 Colesville Rd.", "address2": "", "zipcode": "20910", "state": "MD", "id": 6171, "resource_uri": "/api/v1/venue/6171/"}, "make_checks_payable_to": "Maryland Republican Party", "distribution_paid_for_by": "", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37361/"}, {"canceled": false, "beneficiaries": [{"bioguide": "K000379", "name": "Joseph P. Kennedy III", "district": "04", "title": "Rep.", "image_available": true, "state": "MA", "affiliate": "", "crp_id": "N00034044", "party": "D", "id": 18229, "resource_uri": "/api/v1/lawmaker/18229/"}], "id": 37618, "entertainment": "Breakfast", "lon": -77.0237569, "party": "D", "start_date": "2014-07-15", "rsvp_info": "Joe Kennedy for Congress", "checks_payable_to_address": "PO Box #590-464 Newton Center, MA 02459", "end_date": null, "start_time": "08:30:00", "lat": 38.8949845, "is_presidential": false, "more_details": "", "contributions_info": "$2,600/$1,000/$500", "venue": {"city": "Washington ", "venue_name": "Avenue Solutions", "address1": "401 9th Street NW", "address2": "Suite 720", "zipcode": "20004", "state": "DC", "id": 6308, "resource_uri": "/api/v1/venue/6308/"}, "make_checks_payable_to": "Joe Kennedy for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37618/"}, {"canceled": false, "beneficiaries": [{"bioguide": "B001281", "name": "Joyce Beatty", "district": "03", "title": "Rep.", "image_available": true, "state": "OH", "affiliate": "", "crp_id": "N00033904", "party": "D", "id": 18241, "resource_uri": "/api/v1/lawmaker/18241/"}], "id": 37619, "entertainment": "Retail Luncheon: Offices of the International Council of Shopping Centers", "lon": -77.0277937, "party": "D", "start_date": "2014-07-15", "rsvp_info": "Firsthand Fundraising", "checks_payable_to_address": "PO Box 172 Columbus, OH 43216", "end_date": null, "start_time": "12:00:00", "lat": 38.8968588, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$500", "venue": {"city": "Washington ", "venue_name": "Offices of the International Council of Shopping Centers", "address1": "555 12th Street NW", "address2": "Suite 660", "zipcode": "20004", "state": "DC", "id": 6306, "resource_uri": "/api/v1/venue/6306/"}, "make_checks_payable_to": "Joyce Beatty for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37619/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Pete Aguilar", "district": "", "title": "", "image_available": null, "state": "CA", "affiliate": "", "crp_id": "", "party": "D", "id": 19085, "resource_uri": "/api/v1/lawmaker/19085/"}], "id": 37623, "entertainment": "Evening Reception", "lon": -77.0089567913922, "party": "D", "start_date": "2014-07-15", "rsvp_info": "AB Consulting DC", "checks_payable_to_address": "PO Box 10954 San Bernadino, CA 92423", "end_date": null, "start_time": "18:30:00", "lat": 38.884367240655, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $5,000/$2,500/$1,000 Individual: $500", "venue": {"city": "Washington", "venue_name": "Democratic National Headquarters", "address1": "430 South Capitol Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 2288, "resource_uri": "/api/v1/venue/2288/"}, "make_checks_payable_to": "Pete Aguilar for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "19:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37623/"}, {"canceled": false, "beneficiaries": [{"bioguide": "L000263", "name": "Sander Levin", "district": "12", "title": "Rep.", "image_available": true, "state": "MI", "affiliate": "", "crp_id": "N00003950", "party": "D", "id": 12, "resource_uri": "/api/v1/lawmaker/12/"}], "id": 37627, "entertainment": "Breakfast", "lon": -77.0158755, "party": "D", "start_date": "2014-07-15", "rsvp_info": "", "checks_payable_to_address": "PO Box 37, Roseville, MI 48066", "end_date": null, "start_time": "08:00:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$500", "venue": {"city": "Washington", "venue_name": "Charlie Palmer Steak", "address1": "101 Constitution Ave NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 22, "resource_uri": "/api/v1/venue/22/"}, "make_checks_payable_to": "Levin for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "09:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37627/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001068", "name": "Steve Cohen", "district": "9", "title": "Rep.", "image_available": true, "state": "TN", "affiliate": "", "crp_id": "N00003225", "party": "D", "id": 338, "resource_uri": "/api/v1/lawmaker/338/"}], "id": 37629, "entertainment": "Luncheon", "lon": -77.002217, "party": "D", "start_date": "2014-07-15", "rsvp_info": "Kieloch Consulting", "checks_payable_to_address": "349 Kenilworth, Memphis, TN 38112", "end_date": null, "start_time": "12:00:00", "lat": 38.8934047, "is_presidential": false, "more_details": "", "contributions_info": "$2,500/$1,000/$500", "venue": {"city": "Washington", "venue_name": "116 Club", "address1": "234 3rd St Ne", "address2": "", "zipcode": "20002", "state": "DC", "id": 233, "resource_uri": "/api/v1/venue/233/"}, "make_checks_payable_to": "Cohen for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37629/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001184", "name": "Tim Scott", "district": "", "title": "Sen.", "image_available": true, "state": "SC", "affiliate": "", "crp_id": "N00031782", "party": "R", "id": 18588, "resource_uri": "/api/v1/lawmaker/18588/"}], "id": 37675, "entertainment": "Dinner", "lon": -77.0366456, "party": "R", "start_date": "2014-07-14", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "18:00:00", "lat": 38.8949549, "is_presidential": false, "more_details": "", "contributions_info": "PAC: $2,500/$1,000 Individual: $1,000/$500", "venue": {"city": "Washington", "venue_name": "TBD", "address1": "", "address2": "", "zipcode": "", "state": "DC", "id": 2421, "resource_uri": "/api/v1/venue/2421/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NRSC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37675/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Ben Sasse", "district": "", "title": "Candidate", "image_available": null, "state": "NE", "affiliate": "", "crp_id": "", "party": "R", "id": 19428, "resource_uri": "/api/v1/lawmaker/19428/"}], "id": 37727, "entertainment": "Reception", "lon": -79.286676, "party": "R", "start_date": "2014-07-14", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "19:30:00", "lat": 36.579823, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Alexandria", "venue_name": "", "address1": "576 La Vista Dr", "address2": "", "zipcode": "22310", "state": "VA", "id": 6326, "resource_uri": "/api/v1/venue/6326/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37727/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Ben Sasse", "district": "", "title": "Candidate", "image_available": null, "state": "NE", "affiliate": "", "crp_id": "", "party": "R", "id": 19428, "resource_uri": "/api/v1/lawmaker/19428/"}], "id": 37728, "entertainment": "Reception", "lon": -77.0283357, "party": "R", "start_date": "2014-07-14", "rsvp_info": "Gula Graham", "checks_payable_to_address": "", "end_date": null, "start_time": "17:30:00", "lat": 38.8955933, "is_presidential": false, "more_details": "", "contributions_info": "PAC:$2,500/$1,000 Individual:$1,000/$500", "venue": {"city": "Washington", "venue_name": "1201 Pennsylvania Avenue NW", "address1": "1201 Pennsylvania Avenue NW", "address2": "", "zipcode": "20004", "state": "DC", "id": 5233, "resource_uri": "/api/v1/venue/5233/"}, "make_checks_payable_to": "", "distribution_paid_for_by": "NSRC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37728/"}, {"canceled": false, "beneficiaries": [{"bioguide": "S001145", "name": "Jan Schakowsky", "district": "9", "title": "Rep.", "image_available": true, "state": "IL", "affiliate": "", "crp_id": "N00004724", "party": "D", "id": 258, "resource_uri": "/api/v1/lawmaker/258/"}], "id": 37615, "entertainment": "Lunch", "lon": -77.0434687, "party": "D", "start_date": "2014-07-14", "rsvp_info": "Jan Schakowsky for Congress", "checks_payable_to_address": "PO Box 58 Evanston, IL 60204", "end_date": null, "start_time": "12:00:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000", "venue": {"city": "Washington", "venue_name": "Bistro Bis", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 15, "resource_uri": "/api/v1/venue/15/"}, "make_checks_payable_to": "Progressive Choices PAC", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "14:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37615/"}, {"canceled": false, "beneficiaries": [{"bioguide": "C001069", "name": "Joe Courtney", "district": "2", "title": "Rep.", "image_available": true, "state": "CT", "affiliate": "", "crp_id": "N00024842", "party": "D", "id": 44, "resource_uri": "/api/v1/lawmaker/44/"}], "id": 37617, "entertainment": "Luncheon", "lon": -77.0158755, "party": "D", "start_date": "2014-07-14", "rsvp_info": "Kieloch Consulting", "checks_payable_to_address": "PO Box 1372 Vernon, CT 06066", "end_date": null, "start_time": "12:00:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "$5,000/$2,500/$1,000", "venue": {"city": "Washington ", "venue_name": "Honeywell International", "address1": "101 Constitution Avenue NW", "address2": "Suite 500 West", "zipcode": "20001", "state": "DC", "id": 4101, "resource_uri": "/api/v1/venue/4101/"}, "make_checks_payable_to": "Courtney for Congress", "distribution_paid_for_by": "DCCC", "hosts": [], "end_time": "13:00:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37617/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "More Conservatives PAC", "district": "", "title": "", "image_available": null, "state": "", "affiliate": "Patrick McHenry", "crp_id": "C00540187", "party": "R", "id": 19088, "resource_uri": "/api/v1/lawmaker/19088/"}], "id": 36781, "entertainment": "North Carolina Brew Tasting Series", "lon": -77.0068813793103, "party": "R", "start_date": "2014-07-09", "rsvp_info": "Bill Oorbeek", "checks_payable_to_address": "", "end_date": null, "start_time": "16:00:00", "lat": 38.8849845862069, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,000", "venue": {"city": "Washington", "venue_name": "Associated General Contractors (AGC) of America Townhouse", "address1": "53 D Street SE", "address2": "", "zipcode": "20003", "state": "DC", "id": 594, "resource_uri": "/api/v1/venue/594/"}, "make_checks_payable_to": "McPAC", "distribution_paid_for_by": "McPAC", "hosts": [], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/36781/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Ted Lieu", "district": "28", "title": "State Senator", "image_available": null, "state": "CA", "affiliate": "", "crp_id": "", "party": "D", "id": 19286, "resource_uri": "/api/v1/lawmaker/19286/"}], "id": 37293, "entertainment": "Fundraiser", "lon": -77.0434687, "party": "D", "start_date": "2014-07-09", "rsvp_info": "Pattie", "checks_payable_to_address": "PO Box 636, Annandale, VA 22003", "end_date": null, "start_time": "08:30:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,500/$5,000", "venue": {"city": "Washington", "venue_name": "Hotel George", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 255, "resource_uri": "/api/v1/venue/255/"}, "make_checks_payable_to": "Ted Lieu for Congress", "distribution_paid_for_by": "Democratic Congressional Campaign Committee", "hosts": [{"resource_uri": "/api/v1/host/9992/", "crp_id": "", "name": "Tony Coehlo", "id": 9992}, {"resource_uri": "/api/v1/host/14405/", "crp_id": "", "name": "David A. Herbst", "id": 14405}, {"resource_uri": "/api/v1/host/14406/", "crp_id": "", "name": "Peter D. Kelly ", "id": 14406}], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37293/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Greg Abbott", "district": "", "title": "Attorney Genera", "image_available": null, "state": "TX", "affiliate": "", "crp_id": "", "party": "R", "id": 19299, "resource_uri": "/api/v1/lawmaker/19299/"}], "id": 37326, "entertainment": "Lunch", "lon": -77.0158755, "party": "R", "start_date": "2014-07-09", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": "11:30:00", "lat": 38.8920838, "is_presidential": false, "more_details": "", "contributions_info": "$500/$1,000/$2,500/$5,000, $10,000", "venue": {"city": "Washington", "venue_name": "Altria", "address1": "101 Constitution Ave NW", "address2": "Suite 400 West", "zipcode": "20001", "state": "DC", "id": 111, "resource_uri": "/api/v1/venue/111/"}, "make_checks_payable_to": "Texans for Greg Abbott", "distribution_paid_for_by": "Texans for Greg Abbott", "hosts": [{"resource_uri": "/api/v1/host/1263/", "crp_id": "C00097568", "name": "Raytheon PAC", "id": 1263}, {"resource_uri": "/api/v1/host/1623/", "crp_id": "C00109546", "name": "Valero PAC", "id": 1623}, {"resource_uri": "/api/v1/host/3331/", "crp_id": "C00164145", "name": "USAA Employee PAC", "id": 3331}, {"resource_uri": "/api/v1/host/3534/", "crp_id": "Y00000406160", "name": "Loren Monroe", "id": 3534}, {"resource_uri": "/api/v1/host/3798/", "crp_id": "C00142711", "name": "Boeing PAC", "id": 3798}, {"resource_uri": "/api/v1/host/3960/", "crp_id": "C00008474", "name": "CitiPAC", "id": 3960}, {"resource_uri": "/api/v1/host/4946/", "crp_id": "C00089136", "name": "Altria PAC", "id": 4946}, {"resource_uri": "/api/v1/host/5923/", "crp_id": "Y0000040562L", "name": "Kerry Cammack", "id": 5923}, {"resource_uri": "/api/v1/host/6324/", "crp_id": "", "name": "McGuire Woods Consulting", "id": 6324}, {"resource_uri": "/api/v1/host/14472/", "crp_id": "C00266585", "name": "Greenberg Traurig", "id": 14472}, {"resource_uri": "/api/v1/host/14473/", "crp_id": "C00440453", "name": "HMS PAC", "id": 14473}, {"resource_uri": "/api/v1/host/14474/", "crp_id": "", "name": "Luminant PowerPAC", "id": 14474}, {"resource_uri": "/api/v1/host/14475/", "crp_id": "Y0000031975L", "name": "Demetrius McDaniel", "id": 14475}, {"resource_uri": "/api/v1/host/14476/", "crp_id": "", "name": "Luis Saenz", "id": 14476}], "end_time": null, "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37326/"}, {"canceled": false, "beneficiaries": [{"bioguide": "", "name": "Ted Lieu", "district": "28", "title": "State Senator", "image_available": null, "state": "CA", "affiliate": "", "crp_id": "", "party": "D", "id": 19286, "resource_uri": "/api/v1/lawmaker/19286/"}], "id": 37341, "entertainment": "Breakfast", "lon": -77.0434687, "party": "D", "start_date": "2014-07-09", "rsvp_info": "", "checks_payable_to_address": "", "end_date": null, "start_time": "08:30:00", "lat": 38.8959623, "is_presidential": false, "more_details": "", "contributions_info": "$1,000/$2,500/$5,000", "venue": {"city": "Washington", "venue_name": "Hotel George", "address1": "15 E Street NW", "address2": "", "zipcode": "20001", "state": "DC", "id": 255, "resource_uri": "/api/v1/venue/255/"}, "make_checks_payable_to": "Ted Lieu for Congress", "distribution_paid_for_by": "DCCC", "hosts": [{"resource_uri": "/api/v1/host/14405/", "crp_id": "", "name": "David A. Herbst", "id": 14405}, {"resource_uri": "/api/v1/host/14406/", "crp_id": "", "name": "Peter D. Kelly ", "id": 14406}], "end_time": "09:30:00", "postponed": false, "notes": "", "resource_uri": "/api/v1/event/37341/"}]
},{}],7:[function(require,module,exports){
module.exports={
    "G03": 92,
    "F06": 85,
    "F02": 81,
    "C06": 42,
    "K04": 99,
    "G01": 90,
    "A09": 12,
    "C12": 47,
    "F11": 89,
    "B05": 27,
    "G02": 91,
    "D05": 59,
    "D11": 66,
    "K02": 97,
    "A05": 8,
    "E09": 79,
    "E04": 75,
    "F07": 86,
    "K01": 96,
    "C09": 45,
    "D10": 65,
    "K07": 102,
    "A03": 6,
    "K05": 100,
    "F03": 82,
    "D06": 60,
    "C14": 49,
    "A02": 4,
    "C03": 38,
    "D04": 58,
    "D01": 53,
    "C04": 40,
    "B35": 108,
    "B09": 32,
    "E06": 28,
    "B06": 28,
    "J03": 95,
    "A08": 11,
    "B01": 21,
    "F01": 21,
    "E05": 76,
    "B11": 34,
    "E10": 80,
    "N03": 113,
    "A11": 14,
    "C15": 50,
    "B02": 23,
    "C13": 48,
    "D03": 82,
    "D12": 67,
    "G05": 109,
    "N01": 111,
    "C02": 36,
    "A10": 13,
    "A01": 1,
    "C01": 1,
    "D09": 64,
    "G04": 110,
    "E01": 70,
    "F05": 84,
    "F09": 87,
    "D13": 68,
    "C08": 44,
    "C07": 43,
    "D07": 61,
    "E08": 78,
    "B04": 26,
    "A14": 17,
    "C10": 93,
    "C05": 41,
    "A15": 18,
    "E02": 72,
    "B08": 31,
    "D02": 54,
    "F08": 107,
    "N04": 114,
    "D08": 63,
    "F10": 88,
    "B07": 29,
    "A07": 10,
    "A13": 16,
    "N02": 112,
    "E03": 73,
    "B03": 25,
    "J02": 94,
    "A06": 9,
    "K08": 103,
    "K03": 98,
    "F04": 83,
    "K06": 101,    
    "E07": 77,
    "B10": 33,
    "A12": 15,
    "N06": 115,
    "A04": 7
}

},{}],8:[function(require,module,exports){
module.exports={
    "F05": {
        "Code": "F05", 
        "Name": "Navy Yard", 
        "Lon": -77.0050856513, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8764810849, 
        "StationTogether1": ""
    }, 
    "F04": {
        "Code": "F04", 
        "Name": "Waterfront", 
        "Lon": -77.0175052088, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8764618668, 
        "StationTogether1": ""
    }, 
    "F07": {
        "Code": "F07", 
        "Name": "Congress Height", 
        "Lon": -76.9885119326, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8456577028, 
        "StationTogether1": ""
    }, 
    "F06": {
        "Code": "F06", 
        "Name": "Anacostia", 
        "Lon": -76.9953707387, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8629631168, 
        "StationTogether1": ""
    }, 
    "F01": {
        "Code": "F01", 
        "Name": "Gallery Place", 
        "Lon": -77.0219153904, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8983168097, 
        "StationTogether1": "B01"
    }, 
    "F03": {
        "Code": "F03", 
        "Name": "L'Enfant Plaza", 
        "Lon": -77.021908484, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8848377279, 
        "StationTogether1": "D03"
    }, 
    "F02": {
        "Code": "F02", 
        "Name": "Archives", 
        "Lon": -77.0219143879, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8936652235, 
        "StationTogether1": ""
    }, 
    "F09": {
        "Code": "F09", 
        "Name": "Naylor Road", 
        "Lon": -76.9562627094, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8513013835, 
        "StationTogether1": ""
    }, 
    "F08": {
        "Code": "F08", 
        "Name": "Southern Ave", 
        "Lon": -76.9750541388, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8410857803, 
        "StationTogether1": ""
    }, 
    "B35": {
        "Code": "B35", 
        "Name": "New York Avenue", 
        "Lon": -77.0030204472, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9070162121, 
        "StationTogether1": ""
    }, 
    "N04": {
        "Code": "N04", 
        "Name": "Spring Hill", 
        "Lon": -77.241472, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "SV", 
        "StationTogether2": "", 
        "Lat": 38.928872, 
        "StationTogether1": ""
    }, 
    "N06": {
        "Code": "N06", 
        "Name": "Wiehle-Reston East", 
        "Lon": -77.34027, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "SV", 
        "StationTogether2": "", 
        "Lat": 38.94778, 
        "StationTogether1": ""
    }, 
    "N01": {
        "Code": "N01", 
        "Name": "McLean", 
        "Lon": -77.210295, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "SV", 
        "StationTogether2": "", 
        "Lat": 38.924432, 
        "StationTogether1": ""
    }, 
    "N03": {
        "Code": "N03", 
        "Name": "Greensboro", 
        "Lon": -77.234607, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "SV", 
        "StationTogether2": "", 
        "Lat": 38.921732, 
        "StationTogether1": ""
    }, 
    "N02": {
        "Code": "N02", 
        "Name": "Tysons Corner", 
        "Lon": -77.222262, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "SV", 
        "StationTogether2": "", 
        "Lat": 38.920496, 
        "StationTogether1": ""
    }, 
    "D07": {
        "Code": "D07", 
        "Name": "Potomac Avenue", 
        "Lon": -76.9854953196, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8812632736, 
        "StationTogether1": ""
    }, 
    "D06": {
        "Code": "D06", 
        "Name": "Eastern Market", 
        "Lon": -76.9960011267, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8846222608, 
        "StationTogether1": ""
    }, 
    "D05": {
        "Code": "D05", 
        "Name": "Capitol South", 
        "Lon": -77.0051394199, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8850625009, 
        "StationTogether1": ""
    }, 
    "D04": {
        "Code": "D04", 
        "Name": "Federal Center SW", 
        "Lon": -77.0158682169, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8850723551, 
        "StationTogether1": ""
    }, 
    "D03": {
        "Code": "D03", 
        "Name": "L'Enfant Plaza", 
        "Lon": -77.021908484, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8848377279, 
        "StationTogether1": "F03"
    }, 
    "D02": {
        "Code": "D02", 
        "Name": "Smithsonian", 
        "Lon": -77.0280662342, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.888018702, 
        "StationTogether1": ""
    }, 
    "D01": {
        "Code": "D01", 
        "Name": "Federal Triangle", 
        "Lon": -77.0281319984, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8931808718, 
        "StationTogether1": ""
    }, 
    "D09": {
        "Code": "D09", 
        "Name": "Minnesota Avenue", 
        "Lon": -76.9467477336, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.899191223, 
        "StationTogether1": ""
    }, 
    "D08": {
        "Code": "D08", 
        "Name": "Stadium Armory", 
        "Lon": -76.9770889014, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8867090898, 
        "StationTogether1": ""
    }, 
    "B01": {
        "Code": "B01", 
        "Name": "Gallery Place", 
        "Lon": -77.0219153904, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.8983168097, 
        "StationTogether1": "F01"
    }, 
    "B03": {
        "Code": "B03", 
        "Name": "Union Station", 
        "Lon": -77.0074142921, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.8977660392, 
        "StationTogether1": ""
    }, 
    "B02": {
        "Code": "B02", 
        "Name": "Judiciary Square", 
        "Lon": -77.0166389566, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.8960903176, 
        "StationTogether1": ""
    }, 
    "B05": {
        "Code": "B05", 
        "Name": "Brookland", 
        "Lon": -76.9945342851, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9332109913, 
        "StationTogether1": ""
    }, 
    "B04": {
        "Code": "B04", 
        "Name": "Rhode Island Avenue", 
        "Lon": -76.9959369166, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9210596891, 
        "StationTogether1": ""
    }, 
    "B07": {
        "Code": "B07", 
        "Name": "Takoma", 
        "Lon": -77.0181766987, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.976078531, 
        "StationTogether1": ""
    }, 
    "B06": {
        "Code": "B06", 
        "Name": "Fort Totten", 
        "Lon": -77.0022030768, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9518467675, 
        "StationTogether1": "E06"
    }, 
    "B09": {
        "Code": "B09", 
        "Name": "Forest Glen", 
        "Lon": -77.0429165548, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.0149542752, 
        "StationTogether1": ""
    }, 
    "B08": {
        "Code": "B08", 
        "Name": "Silver Spring", 
        "Lon": -77.0310178268, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9939493747, 
        "StationTogether1": ""
    }, 
    "F10": {
        "Code": "F10", 
        "Name": "Suitland", 
        "Lon": -76.9318701589, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8439645544, 
        "StationTogether1": ""
    }, 
    "F11": {
        "Code": "F11", 
        "Name": "Branch Avenue", 
        "Lon": -76.9114642177, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.8264463483, 
        "StationTogether1": ""
    }, 
    "J03": {
        "Code": "J03", 
        "Name": "Franconia-Springf'ld", 
        "Lon": -77.1679701804, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.7665218926, 
        "StationTogether1": ""
    }, 
    "J02": {
        "Code": "J02", 
        "Name": "Van Dorn St", 
        "Lon": -77.1291115237, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.799307672, 
        "StationTogether1": ""
    }, 
    "D10": {
        "Code": "D10", 
        "Name": "Deanwood", 
        "Lon": -76.935256783, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.9081784965, 
        "StationTogether1": ""
    }, 
    "D11": {
        "Code": "D11", 
        "Name": "Cheverly", 
        "Lon": -76.916628044, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.9166318546, 
        "StationTogether1": ""
    }, 
    "D12": {
        "Code": "D12", 
        "Name": "Landover", 
        "Lon": -76.8911979676, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.9335062344, 
        "StationTogether1": ""
    }, 
    "D13": {
        "Code": "D13", 
        "Name": "New Carrollton", 
        "Lon": -76.8718412865, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.9477848558, 
        "StationTogether1": ""
    }, 
    "B10": {
        "Code": "B10", 
        "Name": "Wheaton", 
        "Lon": -77.0501070535, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.0375271436, 
        "StationTogether1": ""
    }, 
    "B11": {
        "Code": "B11", 
        "Name": "Glenmont", 
        "Lon": -77.0535573593, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.0617837655, 
        "StationTogether1": ""
    }, 
    "K01": {
        "Code": "K01", 
        "Name": "Court House", 
        "Lon": -77.087131231, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.8901755312, 
        "StationTogether1": ""
    }, 
    "K02": {
        "Code": "K02", 
        "Name": "Clarendon", 
        "Lon": -77.0953940983, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.886704839, 
        "StationTogether1": ""
    }, 
    "K03": {
        "Code": "K03", 
        "Name": "Virginia Square", 
        "Lon": -77.1029772942, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.8833661518, 
        "StationTogether1": ""
    }, 
    "K04": {
        "Code": "K04", 
        "Name": "Ballston", 
        "Lon": -77.113168835, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.8821828738, 
        "StationTogether1": ""
    }, 
    "K05": {
        "Code": "K05", 
        "Name": "E Falls Church", 
        "Lon": -77.1568830199, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.8859531663, 
        "StationTogether1": ""
    }, 
    "K06": {
        "Code": "K06", 
        "Name": "W Falls Church", 
        "Lon": -77.1890948225, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.900780551, 
        "StationTogether1": ""
    }, 
    "K07": {
        "Code": "K07", 
        "Name": "Dunn Loring", 
        "Lon": -77.2271606721, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.8836251359, 
        "StationTogether1": ""
    }, 
    "K08": {
        "Code": "K08", 
        "Name": "Vienna", 
        "Lon": -77.2726222569, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "OR", 
        "StationTogether2": "", 
        "Lat": 38.8776011238, 
        "StationTogether1": ""
    }, 
    "E10": {
        "Code": "E10", 
        "Name": "Greenbelt", 
        "Lon": -76.9110575731, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 39.0111458605, 
        "StationTogether1": ""
    }, 
    "C13": {
        "Code": "C13", 
        "Name": "King Street", 
        "Lon": -77.0608112085, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8065861172, 
        "StationTogether1": ""
    }, 
    "C12": {
        "Code": "C12", 
        "Name": "Braddock Road", 
        "Lon": -77.053667574, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8141436672, 
        "StationTogether1": ""
    }, 
    "G04": {
        "Code": "G04", 
        "Name": "Morgan Blvd", 
        "Lon": -76.8680747681, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8938349282, 
        "StationTogether1": ""
    }, 
    "G05": {
        "Code": "G05", 
        "Name": "Largo Town Center", 
        "Lon": -76.8420375202, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.9050688072, 
        "StationTogether1": ""
    }, 
    "C10": {
        "Code": "C10", 
        "Name": "National Arpt", 
        "Lon": -77.0440422943, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8534163859, 
        "StationTogether1": ""
    }, 
    "G01": {
        "Code": "G01", 
        "Name": "Benning Road", 
        "Lon": -76.9383648681, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.890975676, 
        "StationTogether1": ""
    }, 
    "C15": {
        "Code": "C15", 
        "Name": "Huntington", 
        "Lon": -77.0752057891, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "YL", 
        "StationTogether2": "", 
        "Lat": 38.7939158529, 
        "StationTogether1": ""
    }, 
    "C14": {
        "Code": "C14", 
        "Name": "Eisenhower Avenue", 
        "Lon": -77.0708743893, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "YL", 
        "StationTogether2": "", 
        "Lat": 38.8004254497, 
        "StationTogether1": ""
    }, 
    "A15": {
        "Code": "A15", 
        "Name": "Shady Grove", 
        "Lon": -77.1646273343, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.1199273249, 
        "StationTogether1": ""
    }, 
    "A14": {
        "Code": "A14", 
        "Name": "Rockville", 
        "Lon": -77.1461253392, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.0843216075, 
        "StationTogether1": ""
    }, 
    "A11": {
        "Code": "A11", 
        "Name": "Grosvenor", 
        "Lon": -77.10384972, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.02926895, 
        "StationTogether1": ""
    }, 
    "A10": {
        "Code": "A10", 
        "Name": "Medical Center", 
        "Lon": -77.0969522905, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.0000564843, 
        "StationTogether1": ""
    }, 
    "A13": {
        "Code": "A13", 
        "Name": "Twinbrook", 
        "Lon": -77.1208179517, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.0624676517, 
        "StationTogether1": ""
    }, 
    "A12": {
        "Code": "A12", 
        "Name": "White Flint", 
        "Lon": -77.112829859, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 39.0481513573, 
        "StationTogether1": ""
    }, 
    "G02": {
        "Code": "G02", 
        "Name": "Capitol Heights", 
        "Lon": -76.9118081145, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8894658568, 
        "StationTogether1": ""
    }, 
    "G03": {
        "Code": "G03", 
        "Name": "Addison Road", 
        "Lon": -76.89410791, 
        "LineCode4": null, 
        "LineCode2": "SV", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8867478168, 
        "StationTogether1": ""
    }, 
    "E08": {
        "Code": "E08", 
        "Name": "Prince Georges Plaza", 
        "Lon": -76.9558815078, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9653854458, 
        "StationTogether1": ""
    }, 
    "E09": {
        "Code": "E09", 
        "Name": "College Park", 
        "Lon": -76.9281249818, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9786336339, 
        "StationTogether1": ""
    }, 
    "E06": {
        "Code": "E06", 
        "Name": "Fort Totten", 
        "Lon": -77.0022030768, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9518467675, 
        "StationTogether1": "B06"
    }, 
    "E07": {
        "Code": "E07", 
        "Name": "West Hyattsville", 
        "Lon": -76.9695766751, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9550401707, 
        "StationTogether1": ""
    }, 
    "E04": {
        "Code": "E04", 
        "Name": "Columbia Heights", 
        "Lon": -77.0325521177, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9278379675, 
        "StationTogether1": ""
    }, 
    "E05": {
        "Code": "E05", 
        "Name": "Georgia Avenue", 
        "Lon": -77.023460904, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9374346301, 
        "StationTogether1": ""
    }, 
    "E02": {
        "Code": "E02", 
        "Name": "Shaw", 
        "Lon": -77.0219117007, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9134768711, 
        "StationTogether1": ""
    }, 
    "E03": {
        "Code": "E03", 
        "Name": "U Street", 
        "Lon": -77.0274958929, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9170023992, 
        "StationTogether1": ""
    }, 
    "E01": {
        "Code": "E01", 
        "Name": "Mt Vernon Sq", 
        "Lon": -77.0219143803, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "GR", 
        "StationTogether2": "", 
        "Lat": 38.9064368149, 
        "StationTogether1": ""
    }, 
    "C08": {
        "Code": "C08", 
        "Name": "Pentagon City", 
        "Lon": -77.0595389215, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8618823867, 
        "StationTogether1": ""
    }, 
    "C09": {
        "Code": "C09", 
        "Name": "Crystal City", 
        "Lon": -77.0502898097, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8579043204, 
        "StationTogether1": ""
    }, 
    "C01": {
        "Code": "C01", 
        "Name": "Metro Center", 
        "Lon": -77.0280779971, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8983144732, 
        "StationTogether1": "A01"
    }, 
    "C02": {
        "Code": "C02", 
        "Name": "McPherson Square", 
        "Lon": -77.0336341721, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.9013327968, 
        "StationTogether1": ""
    }, 
    "C03": {
        "Code": "C03", 
        "Name": "Farragut West", 
        "Lon": -77.0406954151, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.9013128941, 
        "StationTogether1": ""
    }, 
    "C04": {
        "Code": "C04", 
        "Name": "Foggy Bottom", 
        "Lon": -77.050277739, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.9006980092, 
        "StationTogether1": ""
    }, 
    "C05": {
        "Code": "C05", 
        "Name": "Rosslyn", 
        "Lon": -77.0709086853, 
        "LineCode4": null, 
        "LineCode2": "OR", 
        "LineCode3": "SV", 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8959790962, 
        "StationTogether1": ""
    }, 
    "C06": {
        "Code": "C06", 
        "Name": "Arlington Cemetery", 
        "Lon": -77.0628101291, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8846868585, 
        "StationTogether1": ""
    }, 
    "C07": {
        "Code": "C07", 
        "Name": "Pentagon", 
        "Lon": -77.0537156734, 
        "LineCode4": null, 
        "LineCode2": "YL", 
        "LineCode3": null, 
        "LineCode1": "BL", 
        "StationTogether2": "", 
        "Lat": 38.8694627012, 
        "StationTogether1": ""
    }, 
    "A08": {
        "Code": "A08", 
        "Name": "Friendship Heights", 
        "Lon": -77.084995805, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9594838736, 
        "StationTogether1": ""
    }, 
    "A09": {
        "Code": "A09", 
        "Name": "Bethesda", 
        "Lon": -77.0941291922, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9843936603, 
        "StationTogether1": ""
    }, 
    "A02": {
        "Code": "A02", 
        "Name": "Farragut North", 
        "Lon": -77.0397008272, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9032019462, 
        "StationTogether1": ""
    }, 
    "A03": {
        "Code": "A03", 
        "Name": "Dupont Circle", 
        "Lon": -77.0434143597, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9095980575, 
        "StationTogether1": ""
    }, 
    "A01": {
        "Code": "A01", 
        "Name": "Metro Center", 
        "Lon": -77.0280779971, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.8983144732, 
        "StationTogether1": "C01"
    }, 
    "A06": {
        "Code": "A06", 
        "Name": "Van Ness UDC", 
        "Lon": -77.0629861805, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9432652883, 
        "StationTogether1": ""
    }, 
    "A07": {
        "Code": "A07", 
        "Name": "Tenleytown", 
        "Lon": -77.0795873255, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9488514351, 
        "StationTogether1": ""
    }, 
    "A04": {
        "Code": "A04", 
        "Name": "Woodley Park Zoo", 
        "Lon": -77.0524180207, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9250851371, 
        "StationTogether1": ""
    }, 
    "A05": {
        "Code": "A05", 
        "Name": "Cleveland Park", 
        "Lon": -77.0580425191, 
        "LineCode4": null, 
        "LineCode2": null, 
        "LineCode3": null, 
        "LineCode1": "RD", 
        "StationTogether2": "", 
        "Lat": 38.9347628908, 
        "StationTogether1": ""
    }
}
},{}],9:[function(require,module,exports){
module.exports={
    "GR": [
        [
            38.8264463483, 
            -76.9114642177
        ], 
        [
            38.8439645544, 
            -76.9318701589
        ], 
        [
            38.8513013835, 
            -76.9562627094
        ], 
        [
            38.8410857803, 
            -76.9750541388
        ], 
        [
            38.8456577028, 
            -76.9885119326
        ], 
        [
            38.8629631168, 
            -76.9953707387
        ], 
        [
            38.8764810849, 
            -77.0050856513
        ], 
        [
            38.8764618668, 
            -77.0175052088
        ], 
        [
            38.8848377279, 
            -77.021908484
        ], 
        [
            38.8936652235, 
            -77.0219143879
        ], 
        [
            38.8983168097, 
            -77.0219153904
        ], 
        [
            38.9064368149, 
            -77.0219143803
        ], 
        [
            38.9134768711, 
            -77.0219117007
        ], 
        [
            38.9170023992, 
            -77.0274958929
        ], 
        [
            38.9278379675, 
            -77.0325521177
        ], 
        [
            38.9374346301, 
            -77.023460904
        ], 
        [
            38.9518467675, 
            -77.0022030768
        ], 
        [
            38.9550401707, 
            -76.9695766751
        ], 
        [
            38.9653854458, 
            -76.9558815078
        ], 
        [
            38.9786336339, 
            -76.9281249818
        ], 
        [
            39.0111458605, 
            -76.9110575731
        ]
    ], 
    "BL": [
        [
            38.7665218926, 
            -77.1679701804
        ], 
        [
            38.799307672, 
            -77.1291115237
        ], 
        [
            38.8065861172, 
            -77.0608112085
        ], 
        [
            38.8141436672, 
            -77.053667574
        ], 
        [
            38.8534163859, 
            -77.0440422943
        ], 
        [
            38.8579043204, 
            -77.0502898097
        ], 
        [
            38.8618823867, 
            -77.0595389215
        ], 
        [
            38.8694627012, 
            -77.0537156734
        ], 
        [
            38.8846868585, 
            -77.0628101291
        ], 
        [
            38.8959790962, 
            -77.0709086853
        ], 
        [
            38.9006980092, 
            -77.050277739
        ], 
        [
            38.9013128941, 
            -77.0406954151
        ], 
        [
            38.9013327968, 
            -77.0336341721
        ], 
        [
            38.8983144732, 
            -77.0280779971
        ], 
        [
            38.8931808718, 
            -77.0281319984
        ], 
        [
            38.888018702, 
            -77.0280662342
        ], 
        [
            38.8848377279, 
            -77.021908484
        ], 
        [
            38.8850723551, 
            -77.0158682169
        ], 
        [
            38.8850625009, 
            -77.0051394199
        ], 
        [
            38.8846222608, 
            -76.9960011267
        ], 
        [
            38.8812632736, 
            -76.9854953196
        ], 
        [
            38.8867090898, 
            -76.9770889014
        ], 
        [
            38.890975676, 
            -76.9383648681
        ], 
        [
            38.8894658568, 
            -76.9118081145
        ], 
        [
            38.8867478168, 
            -76.89410791
        ], 
        [
            38.8938349282, 
            -76.8680747681
        ], 
        [
            38.9050688072, 
            -76.8420375202
        ]
    ], 
    "SV": [
        [
            38.94778, 
            -77.34027
        ], 
        [
            38.928872, 
            -77.241472
        ], 
        [
            38.921732, 
            -77.234607
        ], 
        [
            38.920496, 
            -77.222262
        ], 
        [
            38.924432, 
            -77.210295
        ], 
        [
            38.8859531663, 
            -77.1568830199
        ], 
        [
            38.8821828738, 
            -77.113168835
        ], 
        [
            38.8833661518, 
            -77.1029772942
        ], 
        [
            38.886704839, 
            -77.0953940983
        ], 
        [
            38.8901755312, 
            -77.087131231
        ], 
        [
            38.8959790962, 
            -77.0709086853
        ], 
        [
            38.9006980092, 
            -77.050277739
        ], 
        [
            38.9013128941, 
            -77.0406954151
        ], 
        [
            38.9013327968, 
            -77.0336341721
        ], 
        [
            38.8983144732, 
            -77.0280779971
        ], 
        [
            38.8931808718, 
            -77.0281319984
        ], 
        [
            38.888018702, 
            -77.0280662342
        ], 
        [
            38.8848377279, 
            -77.021908484
        ], 
        [
            38.8850723551, 
            -77.0158682169
        ], 
        [
            38.8850625009, 
            -77.0051394199
        ], 
        [
            38.8846222608, 
            -76.9960011267
        ], 
        [
            38.8812632736, 
            -76.9854953196
        ], 
        [
            38.8867090898, 
            -76.9770889014
        ], 
        [
            38.890975676, 
            -76.9383648681
        ], 
        [
            38.8894658568, 
            -76.9118081145
        ], 
        [
            38.8867478168, 
            -76.89410791
        ], 
        [
            38.8938349282, 
            -76.8680747681
        ], 
        [
            38.9050688072, 
            -76.8420375202
        ]
    ], 
    "RD": [
        [
            39.1199273249, 
            -77.1646273343
        ], 
        [
            39.0843216075, 
            -77.1461253392
        ], 
        [
            39.0624676517, 
            -77.1208179517
        ], 
        [
            39.0481513573, 
            -77.112829859
        ], 
        [
            39.02926895, 
            -77.10384972
        ], 
        [
            39.0000564843, 
            -77.0969522905
        ], 
        [
            38.9843936603, 
            -77.0941291922
        ], 
        [
            38.9594838736, 
            -77.084995805
        ], 
        [
            38.9488514351, 
            -77.0795873255
        ], 
        [
            38.9432652883, 
            -77.0629861805
        ], 
        [
            38.9347628908, 
            -77.0580425191
        ], 
        [
            38.9250851371, 
            -77.0524180207
        ], 
        [
            38.9095980575, 
            -77.0434143597
        ], 
        [
            38.9032019462, 
            -77.0397008272
        ], 
        [
            38.8983144732, 
            -77.0280779971
        ], 
        [
            38.8983168097, 
            -77.0219153904
        ], 
        [
            38.8960903176, 
            -77.0166389566
        ], 
        [
            38.8977660392, 
            -77.0074142921
        ], 
        [
            38.9070162121, 
            -77.0030204472
        ], 
        [
            38.9210596891, 
            -76.9959369166
        ], 
        [
            38.9332109913, 
            -76.9945342851
        ], 
        [
            38.9518467675, 
            -77.0022030768
        ], 
        [
            38.976078531, 
            -77.0181766987
        ], 
        [
            38.9939493747, 
            -77.0310178268
        ], 
        [
            39.0149542752, 
            -77.0429165548
        ], 
        [
            39.0375271436, 
            -77.0501070535
        ], 
        [
            39.0617837655, 
            -77.0535573593
        ]
    ], 
    "OR": [
        [
            38.8776011238, 
            -77.2726222569
        ], 
        [
            38.8836251359, 
            -77.2271606721
        ], 
        [
            38.900780551, 
            -77.1890948225
        ], 
        [
            38.8859531663, 
            -77.1568830199
        ], 
        [
            38.8821828738, 
            -77.113168835
        ], 
        [
            38.8833661518, 
            -77.1029772942
        ], 
        [
            38.886704839, 
            -77.0953940983
        ], 
        [
            38.8901755312, 
            -77.087131231
        ], 
        [
            38.8959790962, 
            -77.0709086853
        ], 
        [
            38.9006980092, 
            -77.050277739
        ], 
        [
            38.9013128941, 
            -77.0406954151
        ], 
        [
            38.9013327968, 
            -77.0336341721
        ], 
        [
            38.8983144732, 
            -77.0280779971
        ], 
        [
            38.8931808718, 
            -77.0281319984
        ], 
        [
            38.888018702, 
            -77.0280662342
        ], 
        [
            38.8848377279, 
            -77.021908484
        ], 
        [
            38.8850723551, 
            -77.0158682169
        ], 
        [
            38.8850625009, 
            -77.0051394199
        ], 
        [
            38.8846222608, 
            -76.9960011267
        ], 
        [
            38.8812632736, 
            -76.9854953196
        ], 
        [
            38.8867090898, 
            -76.9770889014
        ], 
        [
            38.899191223, 
            -76.9467477336
        ], 
        [
            38.9081784965, 
            -76.935256783
        ], 
        [
            38.9166318546, 
            -76.916628044
        ], 
        [
            38.9335062344, 
            -76.8911979676
        ], 
        [
            38.9477848558, 
            -76.8718412865
        ]
    ], 
    "YL": [
        [
            38.7939158529, 
            -77.0752057891
        ], 
        [
            38.8004254497, 
            -77.0708743893
        ], 
        [
            38.8065861172, 
            -77.0608112085
        ], 
        [
            38.8141436672, 
            -77.053667574
        ], 
        [
            38.8534163859, 
            -77.0440422943
        ], 
        [
            38.8579043204, 
            -77.0502898097
        ], 
        [
            38.8618823867, 
            -77.0595389215
        ], 
        [
            38.8694627012, 
            -77.0537156734
        ], 
        [
            38.8848377279, 
            -77.021908484
        ], 
        [
            38.8936652235, 
            -77.0219143879
        ], 
        [
            38.8983168097, 
            -77.0219153904
        ], 
        [
            38.9064368149, 
            -77.0219143803
        ], 
        [
            38.9134768711, 
            -77.0219117007
        ], 
        [
            38.9170023992, 
            -77.0274958929
        ], 
        [
            38.9278379675, 
            -77.0325521177
        ], 
        [
            38.9374346301, 
            -77.023460904
        ], 
        [
            38.9518467675, 
            -77.0022030768
        ]
    ]
}
},{}],10:[function(require,module,exports){
module.exports={
"type": "FeatureCollection",
"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
                                                                                
"features": [
{ "type": "Feature", "properties": { "OBJECTID": 1393, "NAME": "FEMS-Engine Company 30", "ADDRESS": "50 49TH STREET NE", "X": 405778.21, "Y": 135874.49, "ADDR_ID": 156317.0, "LABEL": 117.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.933396362747118, 38.89069508531999 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1394, "NAME": "FEMS-Engine Company 31", "ADDRESS": "4930 CONNECTICUT AVENUE NW", "X": 393940.33, "Y": 142928.75, "ADDR_ID": 294604.0, "LABEL": 118.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.069910208508844, 38.95424021068721 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1395, "NAME": "FEMS-Engine Company 32", "ADDRESS": "2425 IRVING STREET SE", "X": 402485.48, "Y": 131648.37, "ADDR_ID": 47304.0, "LABEL": 119.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.971365917269836, 38.852639970705326 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1396, "NAME": "FEMS-Engine Company 33", "ADDRESS": "101 ATLANTIC STREET SE", "X": 399553.06, "Y": 129234.15, "ADDR_ID": 294471.0, "LABEL": 120.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.005147424003354, 38.83089499410552 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1397, "NAME": "FEMS-Engine Company 4", "ADDRESS": "2531 SHERMAN AVENUE NW", "X": 397829.93, "Y": 139502.81, "ADDR_ID": 232303.0, "LABEL": 121.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.025025193603042, 38.923396559570307 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1398, "NAME": "FEMS-Engine Company 5", "ADDRESS": "3412 DENT PLACE NW", "X": 394064.56, "Y": 138177.23, "ADDR_ID": 294568.0, "LABEL": 122.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.068435876457784, 38.911437935335549 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1399, "NAME": "FEMS-Engine Company 6", "ADDRESS": "1300 NEW JERSEY AVENUE NW", "X": 398605.52, "Y": 137759.14, "ADDR_ID": 294514.0, "LABEL": 123.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.016077567751623, 38.90769057280427 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1400, "NAME": "FEMS-Engine Company 7", "ADDRESS": "1101 HALF STREET SW", "X": 399025.57, "Y": 134344.26, "ADDR_ID": 277735.0, "LABEL": 124.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.011229784995891, 38.876928634217109 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1401, "NAME": "FEMS-Engine Company 8", "ADDRESS": "1520 C STREET SE", "X": 401479.84, "Y": 135300.25, "ADDR_ID": 289723.0, "LABEL": 125.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.9829435764902, 38.885539857825499 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1402, "NAME": "FEMS-Engine Company 9", "ADDRESS": "1617 U STREET NW", "X": 396745.68, "Y": 138826.02, "ADDR_ID": 241846.0, "LABEL": 126.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.037525528378907, 38.917296469333508 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1403, "NAME": "FEMS-Special Operations", "ADDRESS": "1338 PARK ROAD NW", "X": 397308.63, "Y": 140300.67, "ADDR_ID": 307124.0, "LABEL": 127.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.031039940392688, 38.930582490531371 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1404, "NAME": "Ferebee-Hope Elementary School \/ Ferebee-Hope Recreation Center", "ADDRESS": "3999 8TH STREET SE", "X": 400419.94, "Y": 129394.95, "ADDR_ID": 294588.0, "LABEL": 128.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.995163437846315, 38.832343568153426 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1405, "NAME": "Financial Operations and Systems \/ OSSE", "ADDRESS": "810 1ST STREET NE", "X": 399390.57, "Y": 136972.5, "ADDR_ID": 79999.0, "LABEL": 129.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.007025686167481, 38.900605137928082 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1406, "NAME": "Fort Lincoln Recreation Center \/  Marshall Elementary School", "ADDRESS": "3100 FORT LINCOLN DRIVE NE", "X": 403673.61, "Y": 139937.34, "ADDR_ID": 294553.0, "LABEL": 131.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.957633696697528, 38.927305943770008 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1407, "NAME": "Fort Stanton Community Center", "ADDRESS": "1812 ERIE STREET SE", "X": 401830.5, "Y": 132204.92, "ADDR_ID": 296165.0, "LABEL": 132.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.978910161863197, 38.857655218090734 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1408, "NAME": "Francis A. Gregory Neighborhood Library", "ADDRESS": "3660 ALABAMA AVENUE SE", "X": 403974.72, "Y": 133006.74, "ADDR_ID": 290019.0, "LABEL": 133.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.95420121297407, 38.864871271520201 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1601, "NAME": "Francis Middle School", "ADDRESS": "2425 N STREET NW", "X": 395461.95, "Y": 137735.74, "ADDR_ID": 294544.0, "LABEL": 134.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.052320996699365, 38.907469168645243 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1602, "NAME": "Friendship Recreation Center", "ADDRESS": "4500 VAN NESS STREET NW", "X": 392346.4, "Y": 141642.93, "ADDR_ID": 295150.0, "LABEL": 135.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.088284968530473, 38.942644751075385 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1603, "NAME": "Garfield Elementary School", "ADDRESS": "2435 ALABAMA AVENUE SE", "X": 402534.22, "Y": 131547.71, "ADDR_ID": 278160.0, "LABEL": 136.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.97080477684635, 38.851733042867536 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1604, "NAME": "Garrison Elementary School", "ADDRESS": "1200 S STREET NW", "X": 397518.52, "Y": 138448.81, "ADDR_ID": 294509.0, "LABEL": 137.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.028612556157256, 38.913900958243993 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1605, "NAME": "Guy Mason Recreation Center", "ADDRESS": "3600 CALVERT STREET NW", "X": 393825.91, "Y": 139366.57, "ADDR_ID": 295826.0, "LABEL": 139.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.071198215270513, 38.92215025636979 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1606, "NAME": "Hamilton Center", "ADDRESS": "1401 BRENTWOOD PARKWAY NE", "X": 400520.69, "Y": 137952.79, "ADDR_ID": 294521.0, "LABEL": 140.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.993996591148615, 38.90943599068779 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1607, "NAME": "Hardy Middle School", "ADDRESS": "1819 35TH STREET NW", "X": 394049.46, "Y": 138629.13, "ADDR_ID": 274432.0, "LABEL": 141.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.068613896275508, 38.915508699334929 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1608, "NAME": "Hardy Recreation Center", "ADDRESS": "4500 Q STREET NW", "X": 392629.43, "Y": 138009.47, "ADDR_ID": 284929.0, "LABEL": 142.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.084981177328061, 38.90991583321798 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1609, "NAME": "Harry Thomas Recreation Center", "ADDRESS": "1743 LINCOLN ROAD NE", "X": 399317.62, "Y": 138457.86, "ADDR_ID": 296786.0, "LABEL": 143.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.00786815085354, 38.913985721980666 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1610, "NAME": "Hart Middle School", "ADDRESS": "601 MISSISSIPPI AVENUE SE", "X": 400244.94, "Y": 129993.71, "ADDR_ID": 5534.0, "LABEL": 144.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.997178746885027, 38.837737538268946 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1611, "NAME": "HD Cooke Elementary School", "ADDRESS": "2525 17TH STREET NW", "X": 396634.55, "Y": 139563.86, "ADDR_ID": 235863.0, "LABEL": 145.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.03881058416269, 38.923942752419322 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1612, "NAME": "Hearst Elementary School", "ADDRESS": "3950 37TH STREET NW", "X": 393761.89, "Y": 141428.28, "ADDR_ID": 294586.0, "LABEL": 146.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.071955219198728, 38.940722313758485 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1613, "NAME": "Hearst Recreation Center", "ADDRESS": "3600 TILDEN STREET NW", "X": 393822.7, "Y": 141393.64, "ADDR_ID": 221412.0, "LABEL": 147.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.071253477711551, 38.94041069633834 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1614, "NAME": "Hendley Elementary School", "ADDRESS": "425 CHESAPEAKE STREET SE", "X": 400070.78, "Y": 129022.18, "ADDR_ID": 24445.0, "LABEL": 148.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.999184846000688, 38.828985580495747 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1615, "NAME": "Hillcrest Recreation Center", "ADDRESS": "3100 DENVER STREET SE", "X": 403243.37, "Y": 132310.93, "ADDR_ID": 296174.0, "LABEL": 149.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.962631488172065, 38.858606125808478 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1616, "NAME": "Houston Elementary School", "ADDRESS": "1100 50TH PLACE NE", "X": 406076.15, "Y": 137508.74, "ADDR_ID": 156316.0, "LABEL": 150.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.929947646563434, 38.905414987202448 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1617, "NAME": "Hyde Elementary School", "ADDRESS": "3219 O STREET NW", "X": 394402.37, "Y": 137797.48, "ADDR_ID": 294558.0, "LABEL": 151.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.06453781860931, 38.908019234469243 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1618, "NAME": "Janney Elementary School", "ADDRESS": "4130 ALBEMARLE STREET NW", "X": 392978.88, "Y": 142186.88, "ADDR_ID": 285713.0, "LABEL": 152.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.080994825499914, 38.947550087061941 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1619, "NAME": "Jefferson Middle School", "ADDRESS": "801 7TH STREET SW", "X": 398012.08, "Y": 134671.03, "ADDR_ID": 276812.0, "LABEL": 153.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.022910660366634, 38.879870599423633 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1620, "NAME": "Jellef Recreation Center", "ADDRESS": "3265 S STREET NW", "X": 394201.67, "Y": 138652.15, "ADDR_ID": 273636.0, "LABEL": 154.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.066859003348, 38.915717088507236 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1621, "NAME": "Johnson Middle School", "ADDRESS": "1400 BRUCE PLACE SE", "X": 401414.57, "Y": 131503.42, "ADDR_ID": 294520.0, "LABEL": 155.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.983703681228732, 38.85133657249898 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1622, "NAME": "Juanita E. Thornton \/ Shepherd Park Library", "ADDRESS": "7420 GEORGIA AVENUE NW", "X": 397657.48, "Y": 145817.5, "ADDR_ID": 253522.0, "LABEL": 157.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.027035448808974, 38.98028055162731 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1623, "NAME": "Kelly Miller Middle School", "ADDRESS": "301 49TH STREET NE", "X": 405859.65, "Y": 136165.39, "ADDR_ID": 294476.0, "LABEL": 158.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.932455148441278, 38.893315080772943 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1624, "NAME": "Kenilworth Elementary School \/ Kenilworth-Parkside Recreation Center", "ADDRESS": "1300 44TH STREET NE", "X": 405161.97, "Y": 137820.44, "ADDR_ID": 294516.0, "LABEL": 159.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.940484944901058, 38.908228732601593 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1625, "NAME": "Ketcham Elementary School", "ADDRESS": "1919 15TH STREET SE", "X": 401421.44, "Y": 133135.87, "ADDR_ID": 286537.0, "LABEL": 160.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.983621162327566, 38.866042360901112 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1626, "NAME": "Key Elementary School", "ADDRESS": "5001 DANA PLACE NW", "X": 391283.15, "Y": 139885.29, "ADDR_ID": 294605.0, "LABEL": 161.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.100527317771608, 38.926801504583679 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1627, "NAME": "Kimball Elementary School", "ADDRESS": "3375 MINNESOTA AVENUE SE", "X": 403681.18, "Y": 135028.21, "ADDR_ID": 294565.0, "LABEL": 162.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.957572707317752, 38.883082756506035 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1628, "NAME": "King Greenleaf Recreation Center", "ADDRESS": "201 N STREET SW", "X": 398889.94, "Y": 134131.94, "ADDR_ID": 52917.0, "LABEL": 163.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.012792505356273, 38.875015810744451 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1629, "NAME": "Kramer Middle School", "ADDRESS": "1700 Q STREET SE", "X": 401720.71, "Y": 133718.02, "ADDR_ID": 289467.0, "LABEL": 164.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.980171304658199, 38.871286070680689 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1630, "NAME": "Lafayette Elementary School", "ADDRESS": "5701 BROAD BRANCH ROAD NW", "X": 394103.71, "Y": 144303.7, "ADDR_ID": 294611.0, "LABEL": 165.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.068037122136474, 38.966627220644931 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1631, "NAME": "Lafayette Recreation Center", "ADDRESS": "5900 33RD STREET NW", "X": 394187.44, "Y": 144427.06, "ADDR_ID": 308530.0, "LABEL": 166.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.067072010248168, 38.967739035466167 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1632, "NAME": "Lamond-Riggs Neighborhood Library", "ADDRESS": "5401 SOUTH DAKOTA AVENUE NE", "X": 400036.03, "Y": 143024.96, "ADDR_ID": 288645.0, "LABEL": 167.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.999584317969109, 38.955127797082618 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1633, "NAME": "Langdon Elementary School", "ADDRESS": "1900 EVARTS STREET NE", "X": 401987.32, "Y": 139647.88, "ADDR_ID": 294532.0, "LABEL": 168.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.977081854791805, 38.924703828641448 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1634, "NAME": "Langdon Park Community Center", "ADDRESS": "2901 20TH STREET NE", "X": 402099.41, "Y": 139883.09, "ADDR_ID": 287283.0, "LABEL": 169.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.975788492642735, 38.926822413923333 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1648, "NAME": "Martin Luther King Elementary School", "ADDRESS": "3200 6TH STREET SE", "X": 400152.88, "Y": 130516.03, "ADDR_ID": 294557.0, "LABEL": 183.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.998238990761521, 38.842442852786803 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1649, "NAME": "Martin Luther King Jr. Memorial Central Library", "ADDRESS": "901 G STREET NW", "X": 397851.64, "Y": 136760.32, "ADDR_ID": 239815.0, "LABEL": 184.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.024766254319246, 38.898691330338679 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1650, "NAME": "Maury Elementary School", "ADDRESS": "1250 CONSTITUTION AVENUE NE", "X": 400984.0, "Y": 136037.82, "ADDR_ID": 294511.0, "LABEL": 186.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.988657500856704, 38.892184860599286 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1651, "NAME": "MC Terrell \/ McGogney Elementary School", "ADDRESS": "3301 WHEELER ROAD SE", "X": 400512.16, "Y": 130413.48, "ADDR_ID": 294563.0, "LABEL": 187.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.994100557170114, 38.841518900703811 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1652, "NAME": "Mckinley Tech", "ADDRESS": "151 T STREET NE", "X": 399642.48, "Y": 138594.83, "ADDR_ID": 296345.0, "LABEL": 188.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.0041224390595, 38.915219785761813 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1653, "NAME": "Meyer Elementary School", "ADDRESS": "2501 11TH STREET NW", "X": 397694.0, "Y": 139439.5, "ADDR_ID": 242979.0, "LABEL": 189.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.026592522240747, 38.92282589663801 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1654, "NAME": "Miner Elementary School", "ADDRESS": "601 15TH STREET NE", "X": 401483.0, "Y": 136614.12, "ADDR_ID": 289548.0, "LABEL": 190.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.982904318851737, 38.897375682183309 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1655, "NAME": "Montgomery Elementary School", "ADDRESS": "421 P STREET NW", "X": 398428.65, "Y": 138002.89, "ADDR_ID": 294487.0, "LABEL": 191.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.018117336764902, 38.90988605824851 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1656, "NAME": "Moten Elementary School @ Wilkinson", "ADDRESS": "2330 POMEROY ROAD SE", "X": 401254.17, "Y": 132114.8, "ADDR_ID": 294542.0, "LABEL": 192.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.985550427911875, 38.856844389462509 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1657, "NAME": "MPD and Internal Affairs", "ADDRESS": "51 N STREET NE", "X": 399397.51, "Y": 137677.55, "ADDR_ID": 13663.0, "LABEL": 195.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.006946298305792, 38.90695648151064 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1658, "NAME": "MPD Evidence Warehouse", "ADDRESS": "17 DC VILLAGE LANE SW", "X": 398877.24, "Y": 127307.6, "ADDR_ID": 307895.0, "LABEL": 197.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.01292772494881, 38.813539112742127 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1659, "NAME": "Mt. Pleasant Neighborhood Library", "ADDRESS": "3160 16TH STREET NW", "X": 396779.31, "Y": 140288.09, "ADDR_ID": 295138.0, "LABEL": 199.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.037144601104487, 38.930467385281872 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1660, "NAME": "Murch Elementary School", "ADDRESS": "4810 36TH STREET NW", "X": 393925.57, "Y": 142783.67, "ADDR_ID": 294602.0, "LABEL": 200.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.070079209155921, 38.952933189593139 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1661, "NAME": "Nalle Elementary School", "ADDRESS": "219 50TH STREET SE", "X": 406004.16, "Y": 135348.37, "ADDR_ID": 294474.0, "LABEL": 201.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.93079650533295, 38.885954085231965 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1662, "NAME": "Northeast Neighborhood Library", "ADDRESS": "330 7TH STREET NE", "X": 400315.86, "Y": 136284.39, "ADDR_ID": 37106.0, "LABEL": 208.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.996358990505968, 38.89440654813972 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1663, "NAME": "Northwest One Library", "ADDRESS": "155 L STREET NW", "X": 398818.89, "Y": 137349.69, "ADDR_ID": 307736.0, "LABEL": 209.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.013616827900989, 38.904002416974876 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1664, "NAME": "Noyes Elementary School", "ADDRESS": "2725 10TH STREET NE", "X": 400707.33, "Y": 139700.26, "ADDR_ID": 289594.0, "LABEL": 210.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.991842884279151, 38.92517764684203 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1665, "NAME": "OCTO OAG", "ADDRESS": "1100 15TH STREET NW", "X": 396964.47, "Y": 137356.58, "ADDR_ID": 278811.0, "LABEL": 211.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.034996167881602, 38.904060036569355 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1666, "NAME": "Office of Aging", "ADDRESS": "1134 11TH STREET NW", "X": 397622.67, "Y": 137506.65, "ADDR_ID": 239118.0, "LABEL": 212.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.027408399253233, 38.905413946319882 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1667, "NAME": "One Judiciary Square (OJS)", "ADDRESS": "441 4TH STREET NW", "X": 398635.86, "Y": 136399.72, "ADDR_ID": 285552.0, "LABEL": 213.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.015725064833646, 38.895444481401228 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1668, "NAME": "OPEFM \/ RFK \/ RFK Trailer DDOT", "ADDRESS": "2400 EAST CAPITOL STREET SE", "X": 402438.25, "Y": 135772.32, "ADDR_ID": 293222.0, "LABEL": 214.0, "TYPE": "INDOOR", "NUMBER_OF_": 3 }, "geometry": { "type": "Point", "coordinates": [ -76.971895405805128, 38.889790307199547 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1669, "NAME": "Orr Elementary School", "ADDRESS": "2200 MINNESOTA AVENUE SE", "X": 402214.23, "Y": 133774.84, "ADDR_ID": 294539.0, "LABEL": 215.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.97448401732575, 38.87179682397673 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1670, "NAME": "OTR \/ DCRA", "ADDRESS": "941 NORTH CAPITOL STREET NE", "X": 399267.78, "Y": 137129.91, "ADDR_ID": 289094.0, "LABEL": 216.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.008441412769983, 38.902023049587804 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1671, "NAME": "Bread for the City SE", "ADDRESS": "1640 GOOD HOPE ROAD SE", "X": 401644.18, "Y": 133153.45, "ADDR_ID": 286380.0, "LABEL": 20.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.981054552437016, 38.86620034055688 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1672, "NAME": "Community of Hope", "ADDRESS": "1320 MISSISSIPPI AVENUE SE", "X": 401091.19, "Y": 130260.28, "ADDR_ID": 290141.0, "LABEL": 43.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.987431098577702, 38.84013827866967 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1673, "NAME": "Fleet", "ADDRESS": "2175 WEST VIRGINIA AVENUE NE", "X": 401894.38, "Y": 138696.42, "ADDR_ID": 50951.0, "LABEL": 130.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.978156281682715, 38.916132973313871 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1674, "NAME": "Matthews Baptist Church", "ADDRESS": "2616 MARTIN LUTHER KING JR AVENUE SE", "X": 400435.52, "Y": 132317.08, "ADDR_ID": 278192.0, "LABEL": 185.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.994982148877142, 38.858667399834211 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1675, "NAME": "MPD (Merritt)", "ADDRESS": "5002 HAYES STREET NE", "X": 406060.67, "Y": 136933.16, "ADDR_ID": 294606.0, "LABEL": 193.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.930131195353752, 38.900230067259287 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1676, "NAME": "National Air and Space Museum", "ADDRESS": "INDEPENDENCE AVENUE SW AND 6TH STREET SW", "X": 398278.05, "Y": 135596.11, "ADDR_ID": 301565.0, "LABEL": 203.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.019847689950936, 38.888204636055363 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1677, "NAME": "National Gallery of Art", "ADDRESS": "4TH STREET NW AND MADISON DRIVE NW", "X": 398271.65, "Y": 135939.53, "ADDR_ID": 293249.0, "LABEL": 204.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.019922322036649, 38.891298279515652 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1678, "NAME": "National Museum of American History", "ADDRESS": "CONSTITUTION AVENUE NW AND 14TH STREET NW", "X": 397398.34, "Y": 135928.76, "ADDR_ID": 293200.0, "LABEL": 205.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.029988738868269, 38.891199108718581 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1679, "NAME": "National Museum of Natural History", "ADDRESS": "CONSTITUTION AVENUE NW AND 10TH STREET NW", "X": 397748.34, "Y": 135930.56, "ADDR_ID": 293188.0, "LABEL": 206.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.025954375174592, 38.891216289872496 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1680, "NAME": "National Museum of the American Indian", "ADDRESS": "INDEPENDENCE AVENUE SW AND 4TH STREET SW", "X": 398557.25, "Y": 135603.87, "ADDR_ID": 294429.0, "LABEL": 207.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.016629566983838, 38.888275043563766 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1681, "NAME": "SOD EOD", "ADDRESS": "4669 BLUE PLAINS DRIVE SW", "X": 398758.81, "Y": 128035.66, "ADDR_ID": 299768.0, "LABEL": 251.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.014292668538971, 38.820097669865326 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1682, "NAME": "SOD K-9", "ADDRESS": "4667 BLUE PLAINS DRIVE SW", "X": 398798.77, "Y": 128050.55, "ADDR_ID": 299767.0, "LABEL": 252.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.013832543353786, 38.820231861562178 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1683, "NAME": "US Department of Agriculture", "ADDRESS": "1400 INDEPENDENCE AVENUE SW", "X": 397394.16, "Y": 135431.16, "ADDR_ID": 291739.0, "LABEL": 278.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.030035033645007, 38.886716528629385 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1635, "NAME": "Langley", "ADDRESS": "101 T STREET NE", "X": 399489.48, "Y": 138589.14, "ADDR_ID": 285757.0, "LABEL": 170.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.005886624733137, 38.915168452785061 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1636, "NAME": "LaSalle Elementary School \/ LaSalle Community Center", "ADDRESS": "501 RIGGS ROAD NE", "X": 400010.18, "Y": 143562.69, "ADDR_ID": 294489.0, "LABEL": 171.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.999882544250042, 38.959971809983664 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1637, "NAME": "Leckie Elementary School", "ADDRESS": "4201 MARTIN LUTHER KING JR AVENUE SW", "X": 398880.58, "Y": 128934.66, "ADDR_ID": 294592.0, "LABEL": 172.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.012891913093682, 38.828196450281176 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1638, "NAME": "Logan", "ADDRESS": "215 G STREET NE", "X": 399777.37, "Y": 136742.12, "ADDR_ID": 286687.0, "LABEL": 173.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.002566468683455, 38.89852997521065 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1639, "NAME": "Loughran Recreation Center", "ADDRESS": "2500 14TH STREET NW", "X": 397193.65, "Y": 139347.84, "ADDR_ID": 234200.0, "LABEL": 174.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.032362124753817, 38.921998738496796 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1640, "NAME": "Ludlow-Taylor Elementary School", "ADDRESS": "659 G STREET NE", "X": 400304.26, "Y": 136765.86, "ADDR_ID": 294494.0, "LABEL": 175.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.996492493812951, 38.898743809228868 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1641, "NAME": "Luke C. Moore Academy Senior High School", "ADDRESS": "1001 MONROE STREET NE", "X": 400666.21, "Y": 140488.24, "ADDR_ID": 294504.0, "LABEL": 176.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.992316326077997, 38.932276047837512 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1642, "NAME": "MacFarland Middle School", "ADDRESS": "4400 IOWA AVENUE NW", "X": 397592.04, "Y": 141746.55, "ADDR_ID": 294595.0, "LABEL": 177.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.027776407969256, 38.943608228348296 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1643, "NAME": "Macomb Recreation Center", "ADDRESS": "3409 MACOMB STREET NW", "X": 394191.58, "Y": 140648.83, "ADDR_ID": 221115.0, "LABEL": 178.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.066992244023965, 38.933703744863294 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1644, "NAME": "Malcolm X Elementary School \/ Malcolm X Recreation Center", "ADDRESS": "1351 ALABAMA AVENUE SE", "X": 401202.63, "Y": 130797.63, "ADDR_ID": 289201.0, "LABEL": 179.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.986146534669984, 38.844978822120702 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1645, "NAME": "Mamie D Lee Elementary School", "ADDRESS": "100 GALLATIN STREET NE", "X": 399373.74, "Y": 142734.73, "ADDR_ID": 294470.0, "LABEL": 180.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.007224964748303, 38.952513105054059 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1646, "NAME": "Mann Elementary School", "ADDRESS": "4430 NEWARK STREET NW", "X": 392385.28, "Y": 140715.66, "ADDR_ID": 294597.0, "LABEL": 181.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.08782619402335, 38.934291971689944 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1647, "NAME": "Marie Reed Recreation Center \/ Reed L C Elementary School", "ADDRESS": "2200 CHAMPLAIN STREET NW", "X": 396485.22, "Y": 139033.81, "ADDR_ID": 235577.0, "LABEL": 182.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.040529953192816, 38.919167306664555 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1684, "NAME": "Oyster Elementary School", "ADDRESS": "2801 CALVERT STREET NW", "X": 395039.6, "Y": 139526.15, "ADDR_ID": 275944.0, "LABEL": 217.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.057203372800387, 38.923595492965461 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1685, "NAME": "Palisades Community Center", "ADDRESS": "5200 SHERIER PLACE NW", "X": 390931.96, "Y": 139636.31, "ADDR_ID": 268352.0, "LABEL": 218.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.104574133597708, 38.924555061523129 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1686, "NAME": "Palisades Neighborhood Library", "ADDRESS": "4901 V STREET NW", "X": 391572.87, "Y": 138950.28, "ADDR_ID": 224474.0, "LABEL": 219.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.097174637994158, 38.918381465113953 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1687, "NAME": "Parklands-Turner Community Library", "ADDRESS": "1547 ALABAMA AVENUE SE", "X": 401627.56, "Y": 130931.77, "ADDR_ID": 304504.0, "LABEL": 220.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.981251317908303, 38.846186530992917 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1688, "NAME": "Parkview Community Center", "ADDRESS": "693 OTIS PLACE NW", "X": 398148.9, "Y": 140791.13, "ADDR_ID": 295160.0, "LABEL": 221.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.021350314279189, 38.935002875205896 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1689, "NAME": "Patterson Elementary School", "ADDRESS": "4399 SOUTH CAPITOL TERRACE SW", "X": 399263.25, "Y": 128798.03, "ADDR_ID": 301073.0, "LABEL": 222.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.00848470930849, 38.826966026907797 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1690, "NAME": "Payne Elementary School", "ADDRESS": "305 15TH STREET SE", "X": 401371.28, "Y": 135254.99, "ADDR_ID": 294478.0, "LABEL": 223.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.98419491376464, 38.885132314488978 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1691, "NAME": "Peabody Elementary School", "ADDRESS": "425 C STREET NE", "X": 400012.32, "Y": 136116.7, "ADDR_ID": 288145.0, "LABEL": 224.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.999857986806902, 38.892895991457841 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1692, "NAME": "Petworth Neighborhood Library", "ADDRESS": "4200 KANSAS AVENUE NW", "X": 397734.08, "Y": 141590.17, "ADDR_ID": 295146.0, "LABEL": 225.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.026137425414618, 38.942199890372414 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1693, "NAME": "Petworth Recreation Center", "ADDRESS": "801 TAYLOR STREET NW", "X": 397919.04, "Y": 141457.96, "ADDR_ID": 296169.0, "LABEL": 226.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.024003507800956, 38.941009362112986 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1694, "NAME": "Phelps Architecture, Construction, and Engineering High School", "ADDRESS": "704 26TH STREET NE", "X": 402437.64, "Y": 137126.77, "ADDR_ID": 294495.0, "LABEL": 227.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.971897630939239, 38.901991688358827 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1695, "NAME": "Plummer Elementary School", "ADDRESS": "4601 TEXAS AVENUE SE", "X": 405211.23, "Y": 135490.54, "ADDR_ID": 19536.0, "LABEL": 228.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.939934675604363, 38.88723986369677 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1696, "NAME": "Powell Elementary School", "ADDRESS": "1350 UPSHUR STREET NW", "X": 397292.79, "Y": 141516.39, "ADDR_ID": 255302.0, "LABEL": 229.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.031227421518949, 38.941534009868171 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1697, "NAME": "Prospect  LC", "ADDRESS": "920 F STREET NE", "X": 400591.35, "Y": 136634.98, "ADDR_ID": 289072.0, "LABEL": 230.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.993183035888919, 38.897564648639204 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1698, "NAME": "Randle Highlands Elementary School", "ADDRESS": "1650 30TH STREET SE", "X": 403093.17, "Y": 133585.82, "ADDR_ID": 156337.0, "LABEL": 231.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.964356283216134, 38.870091403188283 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1699, "NAME": "Raymond Education Campus", "ADDRESS": "915 SPRING ROAD NW", "X": 397708.28, "Y": 140880.94, "ADDR_ID": 226682.0, "LABEL": 232.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.026432660023815, 38.935810871761859 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1700, "NAME": "Reeves Center \/ Ward One Senior Wellness Center", "ADDRESS": "2000 14TH STREET NW", "X": 397189.88, "Y": 138842.23, "ADDR_ID": 239976.0, "LABEL": 233.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.032403529842, 38.917444026972369 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1701, "NAME": "River Terrace Elementary School", "ADDRESS": "420 34TH STREET NE", "X": 403660.17, "Y": 136398.67, "ADDR_ID": 294485.0, "LABEL": 234.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.957807556855016, 38.895428461355834 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1702, "NAME": "Ron H. Brown Middle School", "ADDRESS": "4800 MEADE STREET NE", "X": 405836.91, "Y": 137635.93, "ADDR_ID": 294601.0, "LABEL": 235.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.932704779070008, 38.906562380020617 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1703, "NAME": "Roosevelt Senior High School", "ADDRESS": "4301 13TH STREET NW", "X": 397468.88, "Y": 141682.3, "ADDR_ID": 252605.0, "LABEL": 236.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.029196851580139, 38.943029099793371 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1704, "NAME": "Ross Elementary School", "ADDRESS": "1730 R STREET NW", "X": 396560.15, "Y": 138281.53, "ADDR_ID": 241714.0, "LABEL": 238.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.039662144695399, 38.912390815299133 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1705, "NAME": "Savoy Elementary School", "ADDRESS": "2400 SHANNON PLACE SE", "X": 400555.08, "Y": 132781.57, "ADDR_ID": 278153.0, "LABEL": 239.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.993604261358954, 38.862851653343149 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1706, "NAME": "School Without Walls", "ADDRESS": "2130 G STREET NW", "X": 395820.01, "Y": 136698.13, "ADDR_ID": 242528.0, "LABEL": 240.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.048186465638153, 38.898123787570832 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1707, "NAME": "Seaton Elementary School", "ADDRESS": "1503 10TH STREET NW", "X": 397841.92, "Y": 138084.32, "ADDR_ID": 279203.0, "LABEL": 241.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.0248824665358, 38.910618362688325 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1708, "NAME": "Septima and Excel Charter School", "ADDRESS": "3845 SOUTH CAPITOL STREET SW", "X": 399247.99, "Y": 129580.0, "ADDR_ID": 301907.0, "LABEL": 242.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.00866130403007, 38.83401036254331 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1709, "NAME": "Shadd Elementary School (Transition Academy)", "ADDRESS": "5601 EAST CAPITOL STREET SE", "X": 406789.33, "Y": 135740.32, "ADDR_ID": 294610.0, "LABEL": 243.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.921742826688799, 38.889479205184088 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1710, "NAME": "Shaed Elementary School", "ADDRESS": "301 DOUGLAS STREET NE", "X": 399779.89, "Y": 139531.17, "ADDR_ID": 294477.0, "LABEL": 244.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.002538312236197, 38.923654687421894 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1711, "NAME": "Sharpe Health School", "ADDRESS": "4300 13TH STREET NW", "X": 397358.67, "Y": 141731.76, "ADDR_ID": 255254.0, "LABEL": 245.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.03046833090616, 38.943474325157986 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1712, "NAME": "Shaw Middle School @ Garnet-Patterson", "ADDRESS": "2001 10TH STREET NW", "X": 397767.0, "Y": 138853.23, "ADDR_ID": 294533.0, "LABEL": 246.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.025748787878896, 38.917544774484917 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1713, "NAME": "Sherwood Recreation Center", "ADDRESS": "640 10TH STREET NE", "X": 400605.76, "Y": 136743.84, "ADDR_ID": 301075.0, "LABEL": 247.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.993016824306153, 38.898545289068032 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1714, "NAME": "Simon Elementary School", "ADDRESS": "401 MISSISSIPPI AVENUE SE", "X": 399983.07, "Y": 129798.63, "ADDR_ID": 294481.0, "LABEL": 248.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.00019499730395, 38.835980202827393 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1715, "NAME": "Smothers Elementary School", "ADDRESS": "4400 BROOKS STREET NE", "X": 405337.95, "Y": 136191.51, "ADDR_ID": 294596.0, "LABEL": 249.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.938468638784286, 38.893553701828701 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1716, "NAME": "Sousa Middle School", "ADDRESS": "3650 ELY PLACE SE", "X": 404064.1, "Y": 135118.46, "ADDR_ID": 294584.0, "LABEL": 253.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.953158845205095, 38.883894076551201 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1717, "NAME": "Southeast Neighborhood Library", "ADDRESS": "403 7TH STREET SE", "X": 400302.33, "Y": 135138.52, "ADDR_ID": 280068.0, "LABEL": 254.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.996515458913066, 38.884084125504963 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1718, "NAME": "Southeast Tennis & Learning Center", "ADDRESS": "701 MISSISSIPPI AVENUE SE", "X": 400473.4, "Y": 130079.58, "ADDR_ID": 295830.0, "LABEL": 255.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.994547253637833, 38.838511000863335 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1719, "NAME": "Southwest Neighborhood Library", "ADDRESS": "900 WESLEY PLACE SW", "X": 398626.28, "Y": 134540.69, "ADDR_ID": 295165.0, "LABEL": 256.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.01583178137156, 38.878697619808236 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1720, "NAME": "Spingarn Senior High School", "ADDRESS": "2500 BENNING ROAD NE", "X": 402516.7, "Y": 136805.15, "ADDR_ID": 294545.0, "LABEL": 257.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.970987364997413, 38.899094197738094 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1721, "NAME": "Stanton Elementary School", "ADDRESS": "2701 NAYLOR ROAD SE", "X": 402734.84, "Y": 132384.63, "ADDR_ID": 294547.0, "LABEL": 258.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.968490226786457, 38.859271774722352 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1722, "NAME": "Stead Recreation Center", "ADDRESS": "1625 P STREET NW", "X": 396737.09, "Y": 138018.79, "ADDR_ID": 295822.0, "LABEL": 259.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.037620743594516, 38.910024638900659 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1723, "NAME": "Stoddert Elementary School \/ Stoddert Recreation Center", "ADDRESS": "4001 CALVERT STREET NW", "X": 393143.05, "Y": 139466.38, "ADDR_ID": 224730.0, "LABEL": 260.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.079073796225515, 38.923044313620181 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1724, "NAME": "Stuart-Hobson Middle School", "ADDRESS": "410 E STREET NE", "X": 399999.62, "Y": 136494.28, "ADDR_ID": 294483.0, "LABEL": 261.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.000004380485947, 38.896297370808789 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1725, "NAME": "Takoma Community Center", "ADDRESS": "300 VAN BUREN STREET NW", "X": 398435.64, "Y": 144552.48, "ADDR_ID": 296168.0, "LABEL": 262.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.018051676182949, 38.968886691314118 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1726, "NAME": "Takoma Educational Campus", "ADDRESS": "7010 PINEY BRANCH ROAD NW", "X": 398024.76, "Y": 145235.93, "ADDR_ID": 250934.0, "LABEL": 263.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.02279492780832, 38.975042541471559 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1727, "NAME": "Takoma Park Neighborhood Library", "ADDRESS": "416 CEDAR STREET NW", "X": 398253.34, "Y": 145168.59, "ADDR_ID": 251267.0, "LABEL": 264.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.020156866937455, 38.974436411675882 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1728, "NAME": "Tenley-Friendship Neighborhood Library", "ADDRESS": "4450 WISCONSIN AVENUE NW", "X": 393074.94, "Y": 142193.23, "ADDR_ID": 284921.0, "LABEL": 265.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.079886753161375, 38.947608052117097 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1729, "NAME": "Theodore Hagan Cultural Center - Senior Service", "ADDRESS": "3201 FORT LINCOLN DRIVE NE", "X": 403611.81, "Y": 139592.92, "ADDR_ID": 295140.0, "LABEL": 266.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.958348224072523, 38.924203556090092 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1730, "NAME": "Thomas Elementary School", "ADDRESS": "650 ANACOSTIA AVENUE NE", "X": 404154.01, "Y": 137048.33, "ADDR_ID": 294493.0, "LABEL": 267.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.952110911086194, 38.901278637591247 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1731, "NAME": "Thomson Elementary School", "ADDRESS": "1200 L STREET NW", "X": 397533.99, "Y": 137293.77, "ADDR_ID": 240922.0, "LABEL": 268.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.02843003259288, 38.903496004276342 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1732, "NAME": "Trinidad Recreation Center", "ADDRESS": "1310 CHILDRESS STREET NE", "X": 401496.88, "Y": 137620.38, "ADDR_ID": 68509.0, "LABEL": 269.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.982742120484048, 38.906440406171505 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1733, "NAME": "Truesdell Elementary School", "ADDRESS": "800 INGRAHAM STREET NW", "X": 397826.84, "Y": 142896.55, "ADDR_ID": 294497.0, "LABEL": 270.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.025071575903652, 38.953968358094251 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1776, "NAME": "Bunker Hill Elementary School", "ADDRESS": "1401 MICHIGAN AVENUE NE", "X": 401300.77, "Y": 141569.11, "ADDR_ID": 286131.0, "LABEL": 28.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.984995635765713, 38.942012135008888 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1777, "NAME": "Burroughs Elementary School", "ADDRESS": "1820 MONROE STREET NE", "X": 401867.9, "Y": 140624.56, "ADDR_ID": 294530.0, "LABEL": 29.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.978456370398874, 38.933502326896445 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1778, "NAME": "Burrville Elementary School", "ADDRESS": "801 DIVISION AVENUE NE", "X": 406552.65, "Y": 136970.78, "ADDR_ID": 289787.0, "LABEL": 30.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.924459179809446, 38.900565431854403 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1779, "NAME": "C. W. Harris Elementary School \/ Harris Recreation Center", "ADDRESS": "301 53RD STREET SE", "X": 406410.5, "Y": 135087.2, "ADDR_ID": 289801.0, "LABEL": 31.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.926115499494827, 38.883598497887021 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1780, "NAME": "Capitol View Neighborhood Library", "ADDRESS": "5001 CENTRAL AVENUE SE", "X": 406109.69, "Y": 135681.52, "ADDR_ID": 15509.0, "LABEL": 32.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.929577212813882, 38.888954498632195 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1781, "NAME": "Cardozo High School", "ADDRESS": "1200 CLIFTON STREET NW", "X": 397531.11, "Y": 139367.02, "ADDR_ID": 294513.0, "LABEL": 33.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.028470689872307, 38.922172530986394 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1734, "NAME": "Tubman Elementary School", "ADDRESS": "3101 13TH STREET NW", "X": 397447.02, "Y": 140146.96, "ADDR_ID": 294555.0, "LABEL": 271.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.029443297833467, 38.929198236416632 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1735, "NAME": "Turkey Thicket Recreation Center", "ADDRESS": "1100 MICHIGAN AVENUE NE", "X": 400641.56, "Y": 141130.75, "ADDR_ID": 74603.0, "LABEL": 272.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.992600023972429, 38.93806398900756 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1736, "NAME": "Turner Elementary School @ Green", "ADDRESS": "1500 MISSISSIPPI AVENUE SE", "X": 401441.25, "Y": 130427.6, "ADDR_ID": 294523.0, "LABEL": 273.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.983398572622932, 38.841645068508846 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1737, "NAME": "Tyler Elementary School", "ADDRESS": "1001 G STREET SE", "X": 400690.52, "Y": 134805.51, "ADDR_ID": 294505.0, "LABEL": 274.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.992041662599206, 38.881084023670084 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1738, "NAME": "UCC (St. Elizabeth's Campus)", "ADDRESS": "2720 MARTIN LUTHER KING JR AVENUE SE", "X": 400430.11, "Y": 131768.69, "ADDR_ID": 301360.0, "LABEL": 275.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.99504482324356, 38.853727271496069 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1739, "NAME": "UDC Campus", "ADDRESS": "4200 CONNECTICUT AVENUE NW", "X": 394423.74, "Y": 141839.77, "ADDR_ID": 297694.0, "LABEL": 276.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.064324272973408, 38.944433583129253 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1740, "NAME": "Upshur Recreation Center", "ADDRESS": "4300 ARKANSAS AVENUE NW", "X": 397198.6, "Y": 141713.95, "ADDR_ID": 295147.0, "LABEL": 277.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.032314701199155, 38.943313391748468 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1741, "NAME": "Van Ness Elementary School", "ADDRESS": "1150 5TH STREET SE", "X": 400065.6, "Y": 134329.49, "ADDR_ID": 294508.0, "LABEL": 279.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.999243996463733, 38.876796117687654 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1742, "NAME": "Volta Park Recreation Center (formerly Georgetown)", "ADDRESS": "1555 34TH STREET NW", "X": 394206.11, "Y": 138028.79, "ADDR_ID": 279236.0, "LABEL": 280.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.066802547062636, 38.91010168208954 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1743, "NAME": "Walker Johns Elementary School", "ADDRESS": "1125 NEW JERSEY AVENUE NW", "X": 398792.97, "Y": 137370.7, "ADDR_ID": 307735.0, "LABEL": 281.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.013915692345691, 38.90419164723351 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1744, "NAME": "Warn Tower Site \/ Fletcher Johnson Education Center", "ADDRESS": "4650 BENNING ROAD SE", "X": 405742.68, "Y": 135126.89, "ADDR_ID": 288259.0, "LABEL": 282.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.933812153838019, 38.883960655988616 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1745, "NAME": "Waterfront East Tower", "ADDRESS": "1100 4TH STREET SW", "X": 398511.05, "Y": 134420.39, "ADDR_ID": 307170.0, "LABEL": 283.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.017159517828091, 38.877613722570487 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1746, "NAME": "Waterfront West Tower", "ADDRESS": "1101 4TH STREET SW", "X": 398425.11, "Y": 134419.16, "ADDR_ID": 307156.0, "LABEL": 284.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.018149937068486, 38.877602492523486 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1747, "NAME": "Watha T. Daniel \/ Shaw Neighborhood Library", "ADDRESS": "1630 7TH STREET NW", "X": 398073.03, "Y": 138286.68, "ADDR_ID": 308201.0, "LABEL": 285.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.022218357189274, 38.912441827333687 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1748, "NAME": "Watkins Elementary School \/ Watkins Recreation Center", "ADDRESS": "420 12TH STREET SE", "X": 400867.92, "Y": 135070.02, "ADDR_ID": 294486.0, "LABEL": 286.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.989996769310935, 38.883466674789091 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1749, "NAME": "Marvin Gaye Recreation Center", "ADDRESS": "6201 BANKS PLACE NE", "X": 407607.38, "Y": 135995.36, "ADDR_ID": 288795.0, "LABEL": 287.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.912310759732065, 38.89177000176398 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1750, "NAME": "Wellness Center", "ADDRESS": "500 K STREET NE", "X": 400071.4, "Y": 137220.4, "ADDR_ID": 300865.0, "LABEL": 288.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.999176854277124, 38.902838517658978 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1751, "NAME": "West Elementary School", "ADDRESS": "1338 FARRAGUT STREET NW", "X": 397204.26, "Y": 142607.98, "ADDR_ID": 294517.0, "LABEL": 289.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.032253055598915, 38.951367080950824 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1752, "NAME": "West End Neighborhood Library", "ADDRESS": "1101 24TH STREET NW", "X": 395567.82, "Y": 137352.7, "ADDR_ID": 218248.0, "LABEL": 290.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.05109790736914, 38.90401915136222 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1753, "NAME": "Wheatley Elementary School \/ Joseph H. Cole Recreation Center", "ADDRESS": "1299 NEAL STREET NE", "X": 400997.43, "Y": 137362.43, "ADDR_ID": 294512.0, "LABEL": 291.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.988500770855779, 38.904117410997998 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1754, "NAME": "Whittier Elementary School", "ADDRESS": "6201 5TH STREET NW", "X": 398332.71, "Y": 144216.17, "ADDR_ID": 294614.0, "LABEL": 292.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.019238602179172, 38.965856939616032 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1755, "NAME": "William O. Lockridge \/ Bellevue Neighborhood Library", "ADDRESS": "115 ATLANTIC STREET SW", "X": 399186.87, "Y": 129281.97, "ADDR_ID": 302935.0, "LABEL": 294.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.009364903837451, 38.831325516600245 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1756, "NAME": "Wilson Building", "ADDRESS": "1350 PENNSYLVANIA AVENUE NW", "X": 397280.14, "Y": 136350.99, "ADDR_ID": 293203.0, "LABEL": 295.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.031352874632702, 38.895002354625383 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1757, "NAME": "J.O. Wilson Elementary School", "ADDRESS": "660 K STREET NE", "X": 400295.87, "Y": 137211.43, "ADDR_ID": 288841.0, "LABEL": 296.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.996589021722201, 38.902757665829746 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1758, "NAME": "Winston Educational Campus", "ADDRESS": "3100 ERIE STREET SE", "X": 403226.53, "Y": 132196.58, "ADDR_ID": 294554.0, "LABEL": 297.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.96282604683509, 38.857576074584586 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1759, "NAME": "Woodridge Neighborhood Library", "ADDRESS": "1801 HAMLIN STREET NE", "X": 401853.38, "Y": 139951.63, "ADDR_ID": 286483.0, "LABEL": 298.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.978625655644066, 38.927440397093633 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1760, "NAME": "Woodrow Wilson Senior High School", "ADDRESS": "3950 CHESAPEAKE STREET NW", "X": 393258.18, "Y": 142475.96, "ADDR_ID": 294587.0, "LABEL": 299.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.077775695871097, 38.950156386554475 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1761, "NAME": "Woodson Senior High School", "ADDRESS": "5500 EADS STREET NE", "X": 406704.96, "Y": 136485.52, "ADDR_ID": 294609.0, "LABEL": 300.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.922708043967461, 38.896192887555607 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1762, "NAME": "Community of Hope", "ADDRESS": "801 17TH STREET NE", "X": 401888.91, "Y": 136995.37, "ADDR_ID": 288960.0, "LABEL": 44.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.978224033997193, 38.900809340821397 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1763, "NAME": "Community of Hope", "ADDRESS": "1413 GIRARD STREET NW", "X": 397125.26, "Y": 139760.79, "ADDR_ID": 234321.0, "LABEL": 45.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.033152510412705, 38.925718502596204 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1764, "NAME": "Early Childhood Academy-Admin", "ADDRESS": "4025 9TH STREET SE", "X": 400822.11, "Y": 129329.27, "ADDR_ID": 278471.0, "LABEL": 83.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.99053161605562, 38.831751608529011 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1765, "NAME": "Early Childhood Academy-School", "ADDRESS": "4301 9TH STREET SE", "X": 400902.69, "Y": 129245.01, "ADDR_ID": 298086.0, "LABEL": 84.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.989603672697257, 38.830992476484887 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1766, "NAME": "MPD Air Support Branch", "ADDRESS": "1724 SOUTH CAPITOL STREET SE", "X": 399245.82, "Y": 133436.49, "ADDR_ID": 277757.0, "LABEL": 194.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.008690525544424, 38.868751294327993 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1767, "NAME": "MPD Automated Traffic Enforcement", "ADDRESS": "3165 V STREET NE", "X": 403305.46, "Y": 138941.4, "ADDR_ID": 149333.0, "LABEL": 196.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.961884221405413, 38.918335659415689 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1768, "NAME": "Narcotics & Special Invest (NSID)", "ADDRESS": "1215 3RD STREET NE", "X": 399860.15, "Y": 137608.99, "ADDR_ID": 71435.0, "LABEL": 202.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.001612361048984, 38.906339064559837 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1769, "NAME": "Rosedale Library \/ Rosedale Community Center", "ADDRESS": "1701 GALES STREET NE", "X": 401793.32, "Y": 136667.15, "ADDR_ID": 307101.0, "LABEL": 237.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.979326883307237, 38.897852817340166 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1770, "NAME": "So Others May Eat (SOME)", "ADDRESS": "60 O STREET NW", "X": 399037.2, "Y": 137820.26, "ADDR_ID": 236940.0, "LABEL": 250.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.01110062661779, 38.908241741747403 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1771, "NAME": "William Doar Charter School on Edgewood", "ADDRESS": "705 EDGEWOOD STREET NE", "X": 400359.57, "Y": 139530.04, "ADDR_ID": 289576.0, "LABEL": 293.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.995853433282932, 38.923644462022587 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1772, "NAME": "Georgetown Neighborhood Library", "ADDRESS": "3260 R STREET NW", "X": 394275.35, "Y": 138398.68, "ADDR_ID": 295142.0, "LABEL": 138.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.066007305842078, 38.913434229544386 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1773, "NAME": "Kelly Miller Pool", "ADDRESS": "4900 BROOKS STREET NE", "X": 405965.86, "Y": 136182.91, "ADDR_ID": 295154.0, "LABEL": 301.0, "TYPE": "OUTDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.931230702022091, 38.893472193012563 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1774, "NAME": "Bruce- Monroe Elementary School @ Parkview", "ADDRESS": "3560 WARDER STREET NW", "X": 398163.16, "Y": 140725.73, "ADDR_ID": 294583.0, "LABEL": 26.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.021185666492656, 38.934413762276513 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1775, "NAME": "Bundy School", "ADDRESS": "429 O STREET NW", "X": 398516.53, "Y": 137890.65, "ADDR_ID": 237434.0, "LABEL": 27.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.017103856310399, 38.9088751145446 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1782, "NAME": "CFSA at Saratoga", "ADDRESS": "1345 SARATOGA AVENUE NE", "X": 401190.75, "Y": 139326.74, "ADDR_ID": 149277.0, "LABEL": 37.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.986268605604081, 38.921812337172049 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1783, "NAME": "CFSA at MLK", "ADDRESS": "2041 MARTIN LUTHER KING JR AVENUE SE", "X": 400882.92, "Y": 133122.47, "ADDR_ID": 278056.0, "LABEL": 35.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.989826388033507, 38.865922353703503 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1784, "NAME": "CFSA at Paul Robenson School", "ADDRESS": "1800 M STREET NW", "X": 396336.44, "Y": 137497.81, "ADDR_ID": 241302.0, "LABEL": 36.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.042237383500549, 38.905329892611839 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1785, "NAME": "Chevy Chase Community Center", "ADDRESS": "5601 CONNECTICUT AVENUE NW", "X": 393490.74, "Y": 144141.13, "ADDR_ID": 263959.0, "LABEL": 38.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.075108619032321, 38.96515842126967 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1786, "NAME": "Chevy Chase Neighborhood Library", "ADDRESS": "5625 CONNECTICUT AVENUE NW", "X": 393460.61, "Y": 144186.75, "ADDR_ID": 263960.0, "LABEL": 39.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.075456716032903, 38.965569153534418 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1787, "NAME": "Cleveland Elementary School", "ADDRESS": "1825 8TH STREET NW", "X": 398030.71, "Y": 138586.76, "ADDR_ID": 294531.0, "LABEL": 40.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.022707176041493, 38.915144954895446 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1788, "NAME": "Cleveland Park Neighborhood Library", "ADDRESS": "3310 CONNECTICUT AVENUE NW", "X": 394984.89, "Y": 140660.69, "ADDR_ID": 221190.0, "LABEL": 41.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.057842578826666, 38.933815469553579 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1789, "NAME": "Columbia Heights Community Center", "ADDRESS": "1480 GIRARD STREET NW", "X": 396956.78, "Y": 139707.59, "ADDR_ID": 284045.0, "LABEL": 42.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.035095244841344, 38.925238692865634 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1790, "NAME": "Congress Heights Recreation Center", "ADDRESS": "611 ALABAMA AVENUE SE", "X": 400270.18, "Y": 130495.24, "ADDR_ID": 307835.0, "LABEL": 46.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.996887832105088, 38.842255538971223 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1791, "NAME": "Consolidated Forensic Lab", "ADDRESS": "415 4TH STREET SW", "X": 398451.08, "Y": 135079.34, "ADDR_ID": 294484.0, "LABEL": 47.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.017852131734756, 38.883549696974669 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1792, "NAME": "Coolidge Senior High School", "ADDRESS": "6315 5TH STREET NW", "X": 398303.3, "Y": 144374.62, "ADDR_ID": 294615.0, "LABEL": 48.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.019578351739341, 38.967284239673525 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1793, "NAME": "Davis Elementary School", "ADDRESS": "4430 H STREET SE", "X": 405412.99, "Y": 134583.53, "ADDR_ID": 294598.0, "LABEL": 49.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.937616308091023, 38.879067951066915 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1794, "NAME": "DC General Hospital", "ADDRESS": "1900 MASSACHUSETTS AVENUE SE", "X": 402119.23, "Y": 135264.83, "ADDR_ID": 301068.0, "LABEL": 50.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.97557416862314, 38.885219472285328 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1795, "NAME": "DC Net Central Office", "ADDRESS": "655 15TH STREET NW", "X": 397122.2, "Y": 136673.07, "ADDR_ID": 279876.0, "LABEL": 51.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.033174858972117, 38.89790326552577 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1796, "NAME": "DC Public Records", "ADDRESS": "1300 NAYLOR COURT NW", "X": 397850.45, "Y": 137783.36, "ADDR_ID": 303382.0, "LABEL": 52.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.024783174361417, 38.907907232661643 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1797, "NAME": "Therapeutic Recreation Center", "ADDRESS": "3030 G STREET SE", "X": 403192.75, "Y": 134782.54, "ADDR_ID": 288770.0, "LABEL": 53.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.963203228378831, 38.880871575495092 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1798, "NAME": "DCLB", "ADDRESS": "2101 MARTIN LUTHER KING JR AVENUE SE", "X": 400852.49, "Y": 133066.21, "ADDR_ID": 278064.0, "LABEL": 54.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.990177093191505, 38.865415570457486 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1799, "NAME": "DCOA", "ADDRESS": "3551 GEORGIA AVENUE NW", "X": 397943.36, "Y": 140698.43, "ADDR_ID": 228610.0, "LABEL": 55.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.023720704390016, 38.934167348648351 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1800, "NAME": "DCPS HQ \/ DDOE", "ADDRESS": "1200 1ST STREET NE", "X": 399448.73, "Y": 137581.05, "ADDR_ID": 302635.0, "LABEL": 56.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.006355689222019, 38.906087209558983 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1801, "NAME": "Adams Elementary School (Oyster)", "ADDRESS": "2020 19TH STREET NW", "X": 396151.48, "Y": 138827.7, "ADDR_ID": 294534.0, "LABEL": 1.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.044377250510621, 38.917309202120244 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1802, "NAME": "DCPS Warehouse \/ Adams Place Bus Lot (OCD)", "ADDRESS": "2000 ADAMS PLACE NE", "X": 402039.88, "Y": 139009.0, "ADDR_ID": 286574.0, "LABEL": 57.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.976477621523628, 38.918948471256058 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1803, "NAME": "Aiton Elementary School", "ADDRESS": "533 48TH PLACE NE", "X": 405751.28, "Y": 136574.53, "ADDR_ID": 294490.0, "LABEL": 2.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.933700916121367, 38.897001478408271 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1804, "NAME": "Amidon Elementary School", "ADDRESS": "401 I STREET SW", "X": 398427.29, "Y": 134631.47, "ADDR_ID": 294482.0, "LABEL": 3.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.0181252993046, 38.87951506818338 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1805, "NAME": "Anacostia Fitness Center", "ADDRESS": "1800 ANACOSTIA DRIVE SE", "X": 401466.4, "Y": 133862.52, "ADDR_ID": 295129.0, "LABEL": 4.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.983101551475158, 38.87258824568103 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1806, "NAME": "Anacostia Neighborhood Library", "ADDRESS": "1800 GOOD HOPE ROAD SE", "X": 401854.99, "Y": 133121.03, "ADDR_ID": 53560.0, "LABEL": 5.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.978625532590982, 38.865907868473236 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1807, "NAME": "Anacostia Senior High School", "ADDRESS": "1601 16TH STREET SE", "X": 401468.56, "Y": 133584.5, "ADDR_ID": 155922.0, "LABEL": 6.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.983077254060177, 38.870083725755734 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1808, "NAME": "Arboretum Community Center", "ADDRESS": "2412 RAND PLACE NE", "X": 402500.41, "Y": 138428.3, "ADDR_ID": 296167.0, "LABEL": 7.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.971169247316837, 38.913716143631035 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1809, "NAME": "Bald Eagle Community Center", "ADDRESS": "100 JOLIET STREET SW", "X": 399117.53, "Y": 127901.54, "ADDR_ID": 301277.0, "LABEL": 8.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.010161730173635, 38.818889885441543 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1810, "NAME": "Ballou Senior High School", "ADDRESS": "3401 4TH STREET SE", "X": 399915.33, "Y": 130176.29, "ADDR_ID": 294567.0, "LABEL": 9.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.000975263347513, 38.839382331531873 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1811, "NAME": "Bancroft Elementary School", "ADDRESS": "1755 NEWTON STREET NW", "X": 396483.93, "Y": 140715.67, "ADDR_ID": 294528.0, "LABEL": 10.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.040553444036135, 38.934318023513057 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1812, "NAME": "Banneker Recreation Center", "ADDRESS": "2500 GEORGIA AVENUE NW", "X": 398041.68, "Y": 139425.87, "ADDR_ID": 232292.0, "LABEL": 11.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.022583078447667, 38.922703956808618 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1813, "NAME": "Benjamin Banneker Senior High \/ Early Care", "ADDRESS": "800 EUCLID STREET NW", "X": 397920.84, "Y": 139551.17, "ADDR_ID": 294496.0, "LABEL": 16.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.023976968255838, 38.923832421688878 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1814, "NAME": "Barnard Elementary School", "ADDRESS": "430 DECATUR STREET NW", "X": 398458.99, "Y": 142259.46, "ADDR_ID": 248305.0, "LABEL": 12.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.017777080008301, 38.948230614415095 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1815, "NAME": "Barry Farm Recreation Center", "ADDRESS": "1230 SUMNER ROAD SE", "X": 400290.79, "Y": 132532.6, "ADDR_ID": 285960.0, "LABEL": 13.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.996649566909326, 38.86060895455919 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1816, "NAME": "Beers Elementary School", "ADDRESS": "3600 ALABAMA AVENUE SE", "X": 403852.94, "Y": 132948.76, "ADDR_ID": 278406.0, "LABEL": 14.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.955604750019802, 38.864349505695401 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1817, "NAME": "Bell Multicultural Middle School \/ Columbia Heights Education Campus", "ADDRESS": "3101 16TH STREET NW", "X": 396890.8, "Y": 140185.59, "ADDR_ID": 234375.0, "LABEL": 15.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.035858309450546, 38.929544435283134 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1818, "NAME": "Benning Neighborhood Library", "ADDRESS": "3935 BENNING ROAD NE", "X": 404530.91, "Y": 136260.63, "ADDR_ID": 295144.0, "LABEL": 17.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.947771053504525, 38.894180889997116 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1819, "NAME": "Benning Park Community Center", "ADDRESS": "5100 SOUTHERN AVENUE SE", "X": 406339.46, "Y": 134665.37, "ADDR_ID": 296175.0, "LABEL": 18.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.926938164904811, 38.879799006071963 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1820, "NAME": "Benning Stoddert Community Center", "ADDRESS": "100 STODDERT PLACE SE", "X": 404490.19, "Y": 135667.78, "ADDR_ID": 295821.0, "LABEL": 19.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.948244317623434, 38.888840486407311 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1821, "NAME": "Brent Elementary School", "ADDRESS": "301 NORTH CAROLINA AVENUE SE", "X": 399873.34, "Y": 135218.08, "ADDR_ID": 294479.0, "LABEL": 21.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.00145984985808, 38.884800875330619 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1822, "NAME": "Brentwood Recreation Center", "ADDRESS": "2311 14TH STREET NE", "X": 401481.38, "Y": 139241.02, "ADDR_ID": 286825.0, "LABEL": 22.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.982917327158702, 38.921039701849985 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1823, "NAME": "Brightwood Elementary School", "ADDRESS": "1300 NICHOLSON STREET NW", "X": 397340.19, "Y": 143625.7, "ADDR_ID": 294515.0, "LABEL": 23.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.030688846219704, 38.960535392859974 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1824, "NAME": "Brookland Elementary School", "ADDRESS": "1150 MICHIGAN AVENUE NE", "X": 400775.13, "Y": 141176.41, "ADDR_ID": 294507.0, "LABEL": 24.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.991059329596197, 38.938475200052501 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1825, "NAME": "Browne Middle School", "ADDRESS": "850 26TH STREET NE", "X": 402544.36, "Y": 137194.17, "ADDR_ID": 294501.0, "LABEL": 25.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.970667058238348, 38.902598549009682 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1826, "NAME": "DDOT", "ADDRESS": "2217 14TH STREET NW", "X": 397254.89, "Y": 139103.17, "ADDR_ID": 284289.0, "LABEL": 58.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.031654942115622, 38.919794865395097 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1827, "NAME": "DDOT", "ADDRESS": "414 FARRAGUT STREET NE", "X": 400023.36, "Y": 142594.21, "ADDR_ID": 309422.0, "LABEL": 59.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.999730507808664, 38.951247485740616 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1828, "NAME": "DDOT HQ", "ADDRESS": "55 M STREET SE", "X": 399393.47, "Y": 134269.52, "ADDR_ID": 306664.0, "LABEL": 60.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.006989868178508, 38.876255677470482 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1829, "NAME": "DDS", "ADDRESS": "1125 15TH STREET NW", "X": 397041.86, "Y": 137401.91, "ADDR_ID": 240247.0, "LABEL": 61.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.034104145556526, 38.904468648970528 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1830, "NAME": "Deal Middle School", "ADDRESS": "3815 FORT DRIVE NW", "X": 393481.78, "Y": 142779.94, "ADDR_ID": 277548.0, "LABEL": 62.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.075199067861377, 38.952896407687987 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1831, "NAME": "Deanwood Recreation Center \/ Deanwood Neighborhood Library", "ADDRESS": "1350 49TH STREET NE", "X": 405884.39, "Y": 137844.91, "ADDR_ID": 307551.0, "LABEL": 63.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.932155579644615, 38.908444627123934 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1832, "NAME": "DHCD", "ADDRESS": "1800 MARTIN LUTHER KING JR AVENUE SE", "X": 401034.28, "Y": 133299.78, "ADDR_ID": 56153.0, "LABEL": 64.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.988082047218171, 38.867519469998534 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1833, "NAME": "DHS", "ADDRESS": "717 14TH STREET NW", "X": 397262.45, "Y": 136783.55, "ADDR_ID": 279904.0, "LABEL": 65.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.031558517828842, 38.898898957142244 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1834, "NAME": "DMH", "ADDRESS": "1125 SPRING ROAD NW", "X": 397520.31, "Y": 140926.42, "ADDR_ID": 283920.0, "LABEL": 66.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.02860086706049, 38.936220058760256 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1835, "NAME": "DMH\/DOES", "ADDRESS": "609 H STREET NE", "X": 400174.19, "Y": 136907.02, "ADDR_ID": 288773.0, "LABEL": 67.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.997991903654139, 38.900015464647517 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1836, "NAME": "DOES", "ADDRESS": "3720 MARTIN LUTHER KING JR AVENUE SE", "X": 399462.71, "Y": 129919.8, "ADDR_ID": 278424.0, "LABEL": 68.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.006188523510474, 38.837071593465261 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1837, "NAME": "DOES", "ADDRESS": "625 H STREET NE", "X": 400226.57, "Y": 136899.1, "ADDR_ID": 288803.0, "LABEL": 69.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.997388059394979, 38.899944106508087 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1838, "NAME": "DOES", "ADDRESS": "64 NEW YORK AVENUE NE", "X": 399396.03, "Y": 137923.7, "ADDR_ID": 289616.0, "LABEL": 70.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.006963578176112, 38.909173884699143 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1839, "NAME": "DOES", "ADDRESS": "77 P STREET NE", "X": 399399.75, "Y": 137953.63, "ADDR_ID": 301561.0, "LABEL": 71.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.006920713944297, 38.909443506962496 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1840, "NAME": "DOES", "ADDRESS": "801 NORTH CAPITOL STREET NE", "X": 399253.51, "Y": 136961.13, "ADDR_ID": 79625.0, "LABEL": 72.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.008605741318178, 38.900502607194625 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1841, "NAME": "DOES", "ADDRESS": "4058 MINNESOTA AVENUE NE", "X": 404523.47, "Y": 136570.1, "ADDR_ID": 305174.0, "LABEL": 73.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.947854778537263, 38.896968746750943 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1842, "NAME": "DOH", "ADDRESS": "825 NORTH CAPITOL STREET NE", "X": 399267.37, "Y": 137018.38, "ADDR_ID": 289003.0, "LABEL": 74.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.00844602050303, 38.901018347305026 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1843, "NAME": "DOH at DC Village \/ DOH Warehouse", "ADDRESS": "5 DC VILLAGE LANE SW", "X": 398523.0, "Y": 127466.17, "ADDR_ID": 309409.0, "LABEL": 75.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.017006868393693, 38.814967065251359 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1844, "NAME": "Douglass Community Center", "ADDRESS": "1898 STANTON TERRACE SE", "X": 401930.33, "Y": 131647.8, "ADDR_ID": 286513.0, "LABEL": 76.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.977761548811543, 38.852636229366837 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1845, "NAME": "DPR Headquarters", "ADDRESS": "3149 16TH STREET NW", "X": 396869.35, "Y": 140252.71, "ADDR_ID": 234376.0, "LABEL": 77.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.036105997790813, 38.930148996779437 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1846, "NAME": "DPR HQ \/ DRES", "ADDRESS": "1250 U STREET NW", "X": 397481.94, "Y": 138760.45, "ADDR_ID": 297746.0, "LABEL": 78.0, "TYPE": "INDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.02903548253289, 38.916708211093713 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1847, "NAME": "DPW", "ADDRESS": "1725 15TH STREET NE", "X": 401634.83, "Y": 138372.61, "ADDR_ID": 301201.0, "LABEL": 79.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.981149871913146, 38.913216505727014 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1848, "NAME": "DPW", "ADDRESS": "2800 NEW YORK AVENUE NE", "X": 402915.72, "Y": 138864.78, "ADDR_ID": 300368.0, "LABEL": 80.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.96637869954246, 38.917646820785912 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1849, "NAME": "Drew Elementary School", "ADDRESS": "5600 EADS STREET NE", "X": 406946.23, "Y": 136463.61, "ADDR_ID": 277686.0, "LABEL": 81.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.919927007925182, 38.89599364104081 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1850, "NAME": "Dunbar Senior High School", "ADDRESS": "1301 NEW JERSEY AVENUE NW", "X": 398725.55, "Y": 137851.55, "ADDR_ID": 279021.0, "LABEL": 82.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.014693861080744, 38.908523216217993 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1851, "NAME": "MPD Juvenile Processing Center \/ DYRS", "ADDRESS": "1000 MOUNT OLIVET ROAD NE", "X": 400989.94, "Y": 138252.92, "ADDR_ID": 290013.0, "LABEL": 198.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 3 }, "geometry": { "type": "Point", "coordinates": [ -76.98858583836352, 38.912139260765422 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1852, "NAME": "Eastern Market", "ADDRESS": "225 7TH STREET SE", "X": 400306.4, "Y": 135397.02, "ADDR_ID": 300829.0, "LABEL": 85.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.996468434375089, 38.886412790832118 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1853, "NAME": "Eastern Senior High School", "ADDRESS": "1700 EAST CAPITOL STREET NE", "X": 401762.5, "Y": 135840.08, "ADDR_ID": 289529.0, "LABEL": 86.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.979684293316438, 38.890402329031858 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1854, "NAME": "Eaton Elementary School", "ADDRESS": "3301 LOWELL STREET NW", "X": 394293.04, "Y": 140540.3, "ADDR_ID": 294562.0, "LABEL": 87.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.065821138452662, 38.932726738823582 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1855, "NAME": "Eliot Middle School", "ADDRESS": "1830 CONSTITUTION AVENUE NE", "X": 401823.73, "Y": 136065.31, "ADDR_ID": 286499.0, "LABEL": 88.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.978977919200759, 38.892431159767348 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1856, "NAME": "Ellington School of The Arts", "ADDRESS": "3500 R STREET NW", "X": 393902.4, "Y": 138400.27, "ADDR_ID": 294569.0, "LABEL": 89.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.070307568060286, 38.91344604442115 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1857, "NAME": "Emery Educational Campus", "ADDRESS": "1720 1ST STREET NE", "X": 399412.34, "Y": 138404.24, "ADDR_ID": 294527.0, "LABEL": 90.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.006775940412183, 38.913502763443148 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1858, "NAME": "Emery Recreation Center", "ADDRESS": "5801 GEORGIA AVENUE NW", "X": 397583.92, "Y": 143434.89, "ADDR_ID": 285269.0, "LABEL": 91.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.027876021198495, 38.958817231647117 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1859, "NAME": "FEMS-Engine Company 18 (Truck Company 7)", "ADDRESS": "414 8TH STREET SE", "X": 400465.33, "Y": 135046.96, "ADDR_ID": 280007.0, "LABEL": 105.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.994636844642628, 38.883259246669247 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1860, "NAME": "FEMS-Engine Company 2 (Rescue Squad 1)", "ADDRESS": "500 F STREET NW", "X": 398309.58, "Y": 136580.68, "ADDR_ID": 299998.0, "LABEL": 107.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.01948668859967, 38.897074068144626 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1861, "NAME": "FEMS", "ADDRESS": "3170 V STREET NE", "X": 403289.84, "Y": 139022.37, "ADDR_ID": 287707.0, "LABEL": 92.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.962063950057541, 38.919065122267689 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1862, "NAME": "FEMS HQ at Grimke Building", "ADDRESS": "1923 VERMONT AVENUE NW", "X": 397800.12, "Y": 138714.15, "ADDR_ID": 239514.0, "LABEL": 94.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.025366434584726, 38.916291979419199 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1863, "NAME": "CCDC - PR Harris \/ FEMS", "ADDRESS": "4600 LIVINGSTON ROAD SE", "X": 399731.95, "Y": 128458.05, "ADDR_ID": 294600.0, "LABEL": 34.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 3 }, "geometry": { "type": "Point", "coordinates": [ -77.003086839218952, 38.823903594499008 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1864, "NAME": "FEMS Fire Boat", "ADDRESS": "550 WATER STREET SW", "X": 398190.8, "Y": 134005.4, "ADDR_ID": 294491.0, "LABEL": 93.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.020849170976291, 38.873874727483781 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1865, "NAME": "FEMS Training Academy", "ADDRESS": "4600 SHEPHERD PARKWAY SW", "X": 398603.56, "Y": 128084.18, "ADDR_ID": 295479.0, "LABEL": 95.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.016080516414178, 38.820534528564032 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1866, "NAME": "FEMS-Engine Company 1", "ADDRESS": "2225 M STREET NW", "X": 395680.65, "Y": 137516.39, "ADDR_ID": 294540.0, "LABEL": 96.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.049798137723911, 38.905494289764228 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1867, "NAME": "FEMS-Engine Company 10", "ADDRESS": "1342 FLORIDA AVENUE NE", "X": 401154.17, "Y": 137081.59, "ADDR_ID": 294519.0, "LABEL": 97.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.986694209549697, 38.901587313095099 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1868, "NAME": "FEMS-Engine Company 11", "ADDRESS": "3420 14TH STREET NW", "X": 397133.32, "Y": 140485.45, "ADDR_ID": 234580.0, "LABEL": 98.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.033062586396895, 38.932246490818827 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1869, "NAME": "FEMS-Engine Company 12", "ADDRESS": "2225 5TH STREET NE", "X": 400070.72, "Y": 139115.87, "ADDR_ID": 294541.0, "LABEL": 99.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.999184498549297, 38.919913555740578 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1870, "NAME": "FEMS-Engine Company 13", "ADDRESS": "450 6TH STREET SW", "X": 398317.42, "Y": 135085.66, "ADDR_ID": 294488.0, "LABEL": 100.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.019392650177579, 38.883606384341853 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1871, "NAME": "FEMS-Engine Company 14", "ADDRESS": "4801 NORTH CAPITOL STREET NE", "X": 399281.07, "Y": 142329.91, "ADDR_ID": 288276.0, "LABEL": 101.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -77.008293645101617, 38.948866304974345 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1872, "NAME": "FEMS-Engine Company 15", "ADDRESS": "2101 14TH STREET SE", "X": 401208.69, "Y": 133005.19, "ADDR_ID": 156246.0, "LABEL": 102.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.986072848081108, 38.864865459690392 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1873, "NAME": "FEMS-Engine Company 16", "ADDRESS": "1018 13TH STREET NW", "X": 397396.45, "Y": 137273.24, "ADDR_ID": 240645.0, "LABEL": 103.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.030015620039194, 38.903310666174164 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1874, "NAME": "FEMS-Engine Company 17", "ADDRESS": "1227 MONROE STREET NE", "X": 400873.27, "Y": 140493.83, "ADDR_ID": 294510.0, "LABEL": 104.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.989928210844425, 38.932326222866799 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1875, "NAME": "FEMS-Engine Company 19", "ADDRESS": "2813 PENNSYLVANIA AVENUE SE", "X": 402864.79, "Y": 133752.76, "ADDR_ID": 44167.0, "LABEL": 106.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.966987292655915, 38.871596039745967 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1876, "NAME": "FEMS-Engine Company 20", "ADDRESS": "4300 WISCONSIN AVENUE NW", "X": 393201.59, "Y": 141900.67, "ADDR_ID": 222965.0, "LABEL": 108.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.078422833706341, 38.944973579721513 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1877, "NAME": "FEMS-Engine Company 21", "ADDRESS": "1763 LANIER PLACE NW", "X": 396339.34, "Y": 139655.95, "ADDR_ID": 236004.0, "LABEL": 109.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.042215455360946, 38.924771148181001 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1878, "NAME": "FEMS-Engine Company 22", "ADDRESS": "5760 GEORGIA AVENUE NW", "X": 397543.85, "Y": 143564.1, "ADDR_ID": 294612.0, "LABEL": 110.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.028338799843326, 38.95998107744164 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1879, "NAME": "FEMS-Engine Company 23", "ADDRESS": "2119 G STREET NW", "X": 395868.76, "Y": 136749.03, "ADDR_ID": 242505.0, "LABEL": 111.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.047624787209813, 38.898582543546055 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1880, "NAME": "FEMS-Engine Company 24", "ADDRESS": "5101 GEORGIA AVENUE NW", "X": 397656.83, "Y": 142694.1, "ADDR_ID": 251752.0, "LABEL": 112.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.027032276153662, 38.952144197051467 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1881, "NAME": "FEMS-Engine Company 25", "ADDRESS": "3203 MARTIN LUTHER KING JR AVENUE SE", "X": 399932.28, "Y": 130595.23, "ADDR_ID": 278344.0, "LABEL": 113.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.000780067617981, 38.843156332407759 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1882, "NAME": "FEMS-Engine Company 26", "ADDRESS": "1340 RHODE ISLAND AVENUE NE", "X": 401147.38, "Y": 139656.9, "ADDR_ID": 294518.0, "LABEL": 114.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -76.986768184398784, 38.924786581810125 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1883, "NAME": "FEMS-Engine Company 27", "ADDRESS": "4201 MINNESOTA AVENUE NE", "X": 404922.84, "Y": 137027.2, "ADDR_ID": 294591.0, "LABEL": 115.0, "TYPE": "INDOOR+OUTDOOR", "NUMBER_OF_": 2 }, "geometry": { "type": "Point", "coordinates": [ -76.943247684852395, 38.901084321570728 ] } },
{ "type": "Feature", "properties": { "OBJECTID": 1884, "NAME": "FEMS-Engine Company 3", "ADDRESS": "439 NEW JERSEY AVENUE NW", "X": 399054.4, "Y": 136442.95, "ADDR_ID": 237163.0, "LABEL": 116.0, "TYPE": "INDOOR", "NUMBER_OF_": 1 }, "geometry": { "type": "Point", "coordinates": [ -77.01090042265082, 38.895834462874255 ] } }
]
}

},{}],11:[function(require,module,exports){
var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');
var FadeMarker = require('./base_markers').FadeMarker;
_.str =require('underscore.string');
var metroLines = require('./data/straight_metro_lines.json');
var fundraisers = require('./data/fundraisers.json');

$(document).ready(function(){

    var map = L.mapbox.map('map', 'willhorning.ja8hjdhd', { zoomControl:false });
    map.setView(config.MAP_CENTER, config.MAP_ZOOM);
    
    var tweetMarkerQueue = [];
    var igMarkerQueue = [];
    var layers = {};
    layers.tweets = L.layerGroup().addTo(map);
    layers.instagrams = L.layerGroup().addTo(map);
    layers.crimes = L.layerGroup();
    layers.trains = L.layerGroup();
    // layers.cameras = L.layerGroup();
    layers.embassies = L.layerGroup();
    layers.metroLines = L.layerGroup().addTo(map);
    layers.metroStations = L.layerGroup().addTo(map);
    layers.wifi = L.layerGroup();

    layers.fundraisers = L.layerGroup().addTo(map);

    _.forEach(fundraisers, function(p){
        console.log(p);
        var popupContent = [
            'Address: ' + p.venue.address1,
            'Venue: ' + p.venue.venue_name,
            'Beneficiary: ' + p.beneficiaries[0].name,
            'Party: ' + p.party,
            'Avg. Contribution: ' + p.contributions_info,
            'Date :' + p.start_date
        ].join('<br><br>');
        var iconUrl = config.NO_PARTY_ICON;
        if(p.party == 'R') iconUrl = config.GOP_ICON;
        else if(p.party == 'D') iconUrl = config.DNC_ICON;
        var m = new FadeMarker([p.lat, p.lon], {icon: L.icon({
            iconUrl: iconUrl,
            iconsize: [16,16]
        })}).bindPopup(popupContent);
        layers.fundraisers.addLayer(m);
    })

    var control = require('./controls')(map, layers);

     $.getJSON('/tweet_queue', function(tweets){
        _.forEach(tweets, function(tweet){
            if(tweetMarkerQueue.length > config.MARKER_QUEUE_SIZE){
                layers.tweets.removeLayer(tweetMarkerQueue.shift());
            }
            var m = tweet_markers.addMarker(tweet, map);
            tweetMarkerQueue.push(m);
            layers.tweets.addLayer(m);            
        })
    });

    $.getJSON('/instagram_queue', function(instagrams){
        _.forEach(instagrams, function(ig_post){
            if(igMarkerQueue.length > config.MARKER_QUEUE_SIZE){
                layers.instagrams.removeLayer(igMarkerQueue.shift());
            }
            var marker = instagram_markers.addMarker(
                ig_post, 
                map, 
                igMarkerQueue
            );
            igMarkerQueue.push(marker);        
            layers.instagrams.addLayer(marker);
        });
    });

    $.getJSON('/crime_queue', function(crimes){
        _.forEach(crimes, function(crime){
            var crimeIcon = L.divIcon({
                className: 'markericon',
                iconAnchor: [12, 12],
                html: _.str.sprintf(
                    '<img style="width:24px;" src="%s">', 
                    config.CRIME_ICON_URLS[crime.offense])
            });
            var marker = new FadeMarker(
                [crime.lat, crime.lon], 
                {icon: crimeIcon}
            ).bindPopup(crime.popupContent);
            layers.crimes.addLayer(marker);
        });
    });

    var wifiGeojson = require('./data/wifi.json');
    layers.wifi = L.geoJson(wifiGeojson, {
        pointToLayer: function(feature, latlng){
            var ll = feature.geometry.coordinates;
            // if(ll[0].isNaN() || ll[1].isNaN()) console.log(ll);
            return L.circle([ll[1], ll[0]], 100, {stroke: false, fillColor: '#009999', fillOpacity: 0.6});
        }
    });

    _.forOwn(metroLines, function(latlngs, line){
        var color = config.metro.LINE_COLOR[line];
        layers.metroLines.addLayer(
            L.polyline(
                latlngs, 
                {color: color, opacity: 0.6, weight: 2}
            )
        );
    });


    // layers.cameras.addLayer(L.geoJson(trafficCameras, {
    //     pointToLayer: function(feature, latlng){
    //         return new FadeMarker(latlng, {icon: L.divIcon({
    //             className: 'foo',
    //             html: '<img style="width:24px;" src="' + config.CAMERA_ICON_URL + '">',
    //             iconSize: [16,16]
    //         })}).bindPopup('Traffic Camera');
    //     }
    // }));

    var stationUpdateCodes = require('./data/station-update-codes.json');
    var stations = require('./data/stations.json');
    _.forEach(_.values(stations), function(station){
        var updateCode = stationUpdateCodes[station.Code];
        var popup = L.popup({
            maxWidth: 500,
            maxHeight: 500,
            className: 'metroPopup'
        }).setContent('<div class="metroUpdates">' + 
            '<iframe style="width:350px;height:390px" frameBorder=0 src="' + 
            _.str.sprintf(config.metro.UPDATES_URL, updateCode) + '""></iframe></div>');
        var m = new FadeMarker([station.Lat, station.Lon], {icon: L.icon({
                    iconUrl: '/images/metro_icon.gif',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })}).bindPopup(popup);
        layers.metroStations.addLayer(m);    
    });

    map.on('popupopen', function(e){
        if($(e.popup._content).hasClass('tweetPopup')){
            var tweet_id_str = $(e.popup._content).attr('id');
            $('.leaflet-popup').css('opacity', '0');
            twttr.widgets.createTweetEmbed(tweet_id_str, $('#' + tweet_id_str)[0], function(){
                e.popup._updateLayout(); 
                e.popup._updatePosition();
                $('.leaflet-popup').css('opacity', '1');
                $('.leaflet-popup').css('align', 'center');
                $('iframe').attr(frameBorder, 0);            
            });  
        }
        if($(e.popup._content).hasClass('metroUpdates')){
            $('.leaflet-popup').css('opacity', '0');
            setTimeout(function(){
                e.popup._updateLayout(); 
                e.popup._updatePosition();
                $('.leaflet-popup-content').removeClass('leaflet-popup-scrolled');
                $('.leaflet-popup').css('opacity', '1');
                $('.leaflet-popup').css('align', 'center');
            }, 100);
        }
    });

    var socket = io();

    var trainMarkers = [];
    socket.on('train_updates', function(updates){
        layers.trains.clearLayers();
        trainMarkers = [];
        _.forEach(updates, function(update){
            var color = config.metro.LINE_COLOR[update.line];
            var m = L.circleMarker(update.latlon, {radius: 6, stroke: false, fillColor: color, fillOpacity: 0.6});
            layers.trains.addLayer(m);
        });
    });

    socket.on('tweet', function(tweet){
        if(tweetMarkerQueue.length > config.MARKER_QUEUE_SIZE){
            layers.tweets.removeLayer(markerQueue.shift());
        }
        var m = tweet_markers.addMarker(tweet, map);
        tweetMarkerQueue.push(m);
        layers.tweets.addLayer(m);
    });

    socket.on('instagram', function(instagrams){
        _.forEach(instagrams, function(ig_post){
            if(igMarkerQueue.length > config.MARKER_QUEUE_SIZE){
                layers.instagrams.removeLayer(igMarkerQueue.shift());
            }
            var marker = instagram_markers.addMarker(
                ig_post, 
                map, 
                igMarkerQueue
            );
            igMarkerQueue.push(marker);        
            layers.instagrams.addLayer(marker);
        });
    });
   
});


},{"./base_markers":3,"./client_config":4,"./controls":5,"./data/fundraisers.json":6,"./data/station-update-codes.json":7,"./data/stations.json":8,"./data/straight_metro_lines.json":9,"./data/wifi.json":10,"./instagram_markers":12,"./tweet_markers":13,"lodash":1,"underscore.string":2}],12:[function(require,module,exports){
var _ = require('lodash');
var config = require('./client_config');
_.str = require('underscore.string');
var base_markers = require('./base_markers');

var instagramIcon = L.divIcon({
    className: 'markericon',
    iconAnchor: [12, 12],
    html: _.str.sprintf('<img style="width:24px;" src="%s">', config.instagram.ICON_PATH)
});

var popupContent = '<div class="instagramPopup" style="width:px;">' + 
    '<iframe style="width:500px;height:630px;" frameBorder=0 src="%s"></iframe></div>';

var addMarker = function(ig_post, map, markerQueue){
        base_markers.addCircleMarker(map, ig_post.latlon);
        var popup = L.popup({
            maxWidth: 600,
            maxHeight: 800,
            className: 'myPopup'
        }).setContent(_.str.sprintf(popupContent, ig_post.embed_url));
        return new base_markers.FadeMarker(
            ig_post.latlon,
            {icon: instagramIcon
        }).bindPopup(popup);
};

module.exports = {
    addMarker: addMarker
}
},{"./base_markers":3,"./client_config":4,"lodash":1,"underscore.string":2}],13:[function(require,module,exports){
var _ = require('lodash');
var config = require('./client_config');
_.str = require('underscore.string');
var base_markers = require('./base_markers');

var tweetIcon = L.divIcon({
    className: 'markericon',
    iconAnchor: [12, 12],
    html: _.str.sprintf('<img style="width:24px;" src="%s">', config.twitter.ICON_PATH)
});

var tweetPopupContent = '<div class="tweetPopup" ' +
    'style="width:510px;align=center;" id="%s"></div>';

var addMarker = function(tweet, map){
    var latlon = [
        tweet.coordinates.coordinates[1],
        tweet.coordinates.coordinates[0]
    ];
    base_markers.addCircleMarker(map, latlon);
    var popup = L.popup({
        maxWidth: 600,
        maxHeight: 300,
        className: 'myPopup'
    }).setContent(_.str.sprintf(tweetPopupContent, tweet.id_str));
    return new base_markers.FadeMarker(latlon, {icon: tweetIcon}).bindPopup(popup);
};

module.exports = {
    addMarker: addMarker
};


},{"./base_markers":3,"./client_config":4,"lodash":1,"underscore.string":2}]},{},[11])