#target photoshop
// FramerPS version 1.0-11-g2ea9f52 (c) 2013 Koen Bok
// Copyright 2009-2012 by contributors, MIT License
// vim: ts=4 sts=4 sw=4 expandtab

// Module systems magic dance
(function (definition) {
    // RequireJS
    if (typeof define == "function") {
        define(definition);
    // YUI3
    } else if (typeof YUI == "function") {
        YUI.add("es5-sham", definition);
    // CommonJS and <script>
    } else {
        definition();
    }
})(function () {

// ES5 15.2.3.2
// http://es5.github.com/#x15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/kriskowal/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor
                ? object.constructor.prototype
                : prototypeOfObject
        );
    };
}

// ES5 15.2.3.3
// http://es5.github.com/#x15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a non-object: ";

    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null) {
            throw new TypeError(ERR_NON_OBJECT + object);
        }
        // If object does not owns property return undefined immediately.
        if (!owns(object, property)) {
            return;
        }

        // If object has a property then it's for sure both `enumerable` and
        // `configurable`.
        var descriptor =  { enumerable: true, configurable: true };

        // If JS engine supports accessor properties then property may be a
        // getter or setter.
        if (supportsAccessors) {
            // Unfortunately `__lookupGetter__` will return a getter even
            // if object has own non getter property along with a same named
            // inherited getter. To avoid misbehavior we temporary remove
            // `__proto__` so that `__lookupGetter__` will return getter only
            // if it's owned by an object.
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);

            // Once we have getter and setter we can put values back.
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) {
                    descriptor.get = getter;
                }
                if (setter) {
                    descriptor.set = setter;
                }
                // If it was accessor property we're done and return here
                // in order to avoid adding `value` to the descriptor.
                return descriptor;
            }
        }

        // If we got this far we know that object has an own property that is
        // not an accessor so we set it as a value and return descriptor.
        descriptor.value = object[property];
        return descriptor;
    };
}

// ES5 15.2.3.4
// http://es5.github.com/#x15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5
// http://es5.github.com/#x15.2.3.5
if (!Object.create) {

    // Contributed by Brandon Benvie, October, 2012
    var createEmpty;
    var supportsProto = Object.prototype.__proto__ === null;
    if (supportsProto || typeof document == 'undefined') {
        createEmpty = function () {
            return { "__proto__": null };
        };
    } else {
        // In old IE __proto__ can't be used to manually set `null`, nor does
        // any other method exist to make an object that inherits from nothing,
        // aside from Object.prototype itself. Instead, create a new global
        // object and *steal* its Object.prototype and strip it bare. This is
        // used as the prototype to create nullary objects.
        createEmpty = (function () {
            var iframe = document.createElement('iframe');
            var parent = document.body || document.documentElement;
            iframe.style.display = 'none';
            parent.appendChild(iframe);
            iframe.src = 'javascript:';
            var empty = iframe.contentWindow.Object.prototype;
            parent.removeChild(iframe);
            iframe = null;
            delete empty.constructor;
            delete empty.hasOwnProperty;
            delete empty.propertyIsEnumerable;
            delete empty.isPrototypeOf;
            delete empty.toLocaleString;
            delete empty.toString;
            delete empty.valueOf;
            empty.__proto__ = null;

            function Empty() {}
            Empty.prototype = empty;

            return function () {
                return new Empty();
            };
        })();
    }

    Object.create = function create(prototype, properties) {

        var object;
        function Type() {}  // An empty constructor.

        if (prototype === null) {
            object = createEmpty();
        } else {
            if (typeof prototype !== "object" && typeof prototype !== "function") {
                // In the native implementation `parent` can be `null`
                // OR *any* `instanceof Object`  (Object|Function|Array|RegExp|etc)
                // Use `typeof` tho, b/c in old IE, DOM elements are not `instanceof Object`
                // like they are in modern browsers. Using `Object.create` on DOM elements
                // is...err...probably inappropriate, but the native version allows for it.
                throw new TypeError("Object prototype may only be an Object or null"); // same msg as Chrome
            }
            Type.prototype = prototype;
            object = new Type();
            // IE has no built-in implementation of `Object.getPrototypeOf`
            // neither `__proto__`, but this manually setting `__proto__` will
            // guarantee that `Object.getPrototypeOf` will work as expected with
            // objects created using `Object.create`
            object.__proto__ = prototype;
        }

        if (properties !== void 0) {
            Object.defineProperties(object, properties);
        }

        return object;
    };
}

// ES5 15.2.3.6
// http://es5.github.com/#x15.2.3.6

// Patch for WebKit and IE8 standard mode
// Designed by hax <hax.github.com>
// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5
// IE8 Reference:
//     http://msdn.microsoft.com/en-us/library/dd282900.aspx
//     http://msdn.microsoft.com/en-us/library/dd229916.aspx
// WebKit Bugs:
//     https://bugs.webkit.org/show_bug.cgi?id=36423

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
        // returns falsy
    }
}

// check whether defineProperty works if it's given. Otherwise,
// shim partially.
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty,
            definePropertiesFallback = Object.defineProperties;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null) {
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        }
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null) {
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        }
        // make a valiant attempt to use the real defineProperty
        // for I8's DOM elements.
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        // If it's a data property.
        if (owns(descriptor, "value")) {
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(owns(descriptor, "writable") ? descriptor.writable : true) ||
                !(owns(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(owns(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                // As accessors are supported only on engines implementing
                // `__proto__` we can safely override `__proto__` while defining
                // a property to make sure that we don't hit an inherited
                // accessor.
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                // Deleting a property anyway since getter / setter may be
                // defined on object itself.
                delete object[property];
                object[property] = descriptor.value;
                // Setting original `__proto__` back now.
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors) {
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            }
            // If we got that far then getters and setters can be defined !!
            if (owns(descriptor, "get")) {
                defineGetter(object, property, descriptor.get);
            }
            if (owns(descriptor, "set")) {
                defineSetter(object, property, descriptor.set);
            }
        }
        return object;
    };
}

// ES5 15.2.3.7
// http://es5.github.com/#x15.2.3.7
if (!Object.defineProperties || definePropertiesFallback) {
    Object.defineProperties = function defineProperties(object, properties) {
        // make a valiant attempt to use the real defineProperties
        if (definePropertiesFallback) {
            try {
                return definePropertiesFallback.call(Object, object, properties);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }
        
        for (var property in properties) {
            if (owns(properties, property) && property != "__proto__") {
                Object.defineProperty(object, property, properties[property]);
            }
        }
        return object;
    };
}

// ES5 15.2.3.8
// http://es5.github.com/#x15.2.3.8
if (!Object.seal) {
    Object.seal = function seal(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
// http://es5.github.com/#x15.2.3.9
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
// http://es5.github.com/#x15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
// http://es5.github.com/#x15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}

// ES5 15.2.3.12
// http://es5.github.com/#x15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}

// ES5 15.2.3.13
// http://es5.github.com/#x15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        // 1. If Type(O) is not Object throw a TypeError exception.
        if (Object(object) !== object) {
            throw new TypeError(); // TODO message
        }
        // 2. Return the Boolean value of the [[Extensible]] internal property of O.
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}

});// Copyright 2009-2012 by contributors, MIT License
// vim: ts=4 sts=4 sw=4 expandtab

// Module systems magic dance
(function (definition) {
    // RequireJS
    if (typeof define == "function") {
        define(definition);
    // YUI3
    } else if (typeof YUI == "function") {
        YUI.add("es5", definition);
    // CommonJS and <script>
    } else {
        definition();
    }
})(function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
        }
        // XXX bound.length is never writable, so don't even try
        //
        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.
        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    };
}

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
// Having a toString local variable name breaks in Opera so use _toString.
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}

//
// Array
// =====
//

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.12
// Default value for second param
// [bugfix, ielt9, old browsers]
// IE < 9 bug: [1,2].splice(0).join("") == "" but should be "12"
if ([1,2].splice(0).length != 2) {
    var array_splice = Array.prototype.splice;
    Array.prototype.splice = function(start, deleteCount) {
        if (!arguments.length) {
            return [];
        } else {
            return array_splice.apply(this, [
                start === void 0 ? 0 : start,
                deleteCount === void 0 ? (this.length - start) : deleteCount
            ].concat(slice.call(arguments, 2)))
        }
    };
}

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.13
// Return len+argCount.
// [bugfix, ielt8]
// IE < 8 bug: [].unshift(0) == undefined but should be "1"
if ([].unshift(0) != 1) {
    var array_unshift = Array.prototype.unshift;
    Array.prototype.unshift = function() {
        array_unshift.apply(this, arguments);
        return this.length;
    };
}

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object
                // context
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value and an empty array
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    };
}

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value, empty array
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    };
}

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}

//
// Object
// ======
//

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14
if (!Object.keys) {
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
var negativeDate = -62198755200000,
    negativeYearString = "-000001";
if (
    !Date.prototype.toISOString ||
    (new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1)
) {
    Date.prototype.toISOString = function toISOString() {
        var result, length, value, year, month;
        if (!isFinite(this)) {
            throw new RangeError("Date.prototype.toISOString called on non-finite value.");
        }

        year = this.getUTCFullYear();

        month = this.getUTCMonth();
        // see https://github.com/kriskowal/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;

        // the date time string format is specified in 15.9.1.15.
        result = [month + 1, this.getUTCDate(),
            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = (
            (year < 0 ? "-" : (year > 9999 ? "+" : "")) +
            ("00000" + Math.abs(year))
            .slice(0 <= year && year <= 9999 ? -4 : -6)
        );

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two
            // digits.
            if (value < 10) {
                result[length] = "0" + value;
            }
        }
        // pad milliseconds to have three digits.
        return (
            year + "-" + result.slice(0, 2).join("-") +
            "T" + result.slice(2).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z"
        );
    };
}


// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
var dateToJSONIsSupported = false;
try {
    dateToJSONIsSupported = (
        Date.prototype.toJSON &&
        new Date(NaN).toJSON() === null &&
        new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
        Date.prototype.toJSON.call({ // generic
            toISOString: function () {
                return true;
            }
        })
    );
} catch (e) {
}
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be toPrimitive(O, hint Number).
        var o = Object(this),
            tv = toPrimitive(o),
            toISO;
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === "number" && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        toISO = o.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof toISO != "function") {
            throw new TypeError("toISOString property is not callable");
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(o);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (!Date.parse || "Date.parse is buggy") {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign +
                                      // 6-digit extended year
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:\\.(\\d{3}))?" + // milliseconds capture
                ")?" +
            "(" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");

        var months = [
            0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365
        ];

        function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return (
                months[month] +
                Math.floor((year - 1969 + t) / 4) -
                Math.floor((year - 1901 + t) / 100) +
                Math.floor((year - 1601 + t) / 400) +
                365 * (year - 1970)
            );
        }

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            Date[key] = NativeDate[key];
        }

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = Number(match[1]),
                    month = Number(match[2] || 1) - 1,
                    day = Number(match[3] || 1) - 1,
                    hour = Number(match[4] || 0),
                    minute = Number(match[5] || 0),
                    second = Number(match[6] || 0),
                    millisecond = Number(match[7] || 0),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    offset = !match[4] || match[8] ?
                        0 : Number(new NativeDate(1970, 0)),
                    signOffset = match[9] === "-" ? 1 : -1,
                    hourOffset = Number(match[10] || 0),
                    minuteOffset = Number(match[11] || 0),
                    result;
                if (
                    hour < (
                        minute > 0 || second > 0 || millisecond > 0 ?
                        24 : 25
                    ) &&
                    minute < 60 && second < 60 && millisecond < 1000 &&
                    month > -1 && month < 12 && hourOffset < 24 &&
                    minuteOffset < 60 && // detect invalid offsets
                    day > -1 &&
                    day < (
                        dayFromMonth(year, month + 1) -
                        dayFromMonth(year, month)
                    )
                ) {
                    result = (
                        (dayFromMonth(year, month) + day) * 24 +
                        hour +
                        hourOffset * signOffset
                    ) * 60;
                    result = (
                        (result + minute + minuteOffset * signOffset) * 60 +
                        second
                    ) * 1000 + millisecond + offset;
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}


//
// String
// ======
//


// ES5 15.5.4.14
// http://es5.github.com/#x15.5.4.14
// [bugfix, chrome]
// If separator is undefined, then the result array contains just one String,
// which is the this value (converted to a String). If limit is not undefined,
// then the output array is truncated so that it contains no more than limit
// elements.
// "0".split(undefined, 0) -> []
if("0".split(void 0, 0).length) {
    var string_split = String.prototype.split;
    String.prototype.split = function(separator, limit) {
        if(separator === void 0 && limit === 0)return [];
        return string_split.apply(this, arguments);
    }
}

// ECMA-262, 3rd B.2.3
// Note an ECMAScript standart, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
if("".substr && "0b".substr(-1) !== "b") {
    var string_substr = String.prototype.substr;
    /**
     *  Get the substring of a string
     *  @param  {integer}  start   where to start the substring
     *  @param  {integer}  length  how many characters to return
     *  @return {string}
     */
    String.prototype.substr = function(start, length) {
        return string_substr.call(
            this,
            start < 0 ? ((start = this.length + start) < 0 ? 0 : start) : start,
            length
        );
    }
}

// ES5 15.5.4.20
// http://es5.github.com/#x15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        if (this === undefined || this === null) {
            throw new TypeError("can't convert "+this+" to object");
        }
        return String(this)
            .replace(trimBeginRegexp, "")
            .replace(trimEndRegexp, "");
    };
}

//
// Util
// ======
//

// ES5 9.4
// http://es5.github.com/#x9.4
// http://jsperf.com/to-integer

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}

// ES5 9.9
// http://es5.github.com/#x9.9
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};

});


/*
    http://www.JSON.org/json2.js
    2008-09-01

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the object holding the key.

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be used to
            select the members to be serialized. It filters the results such
            that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*global JSON */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", call,
    charCodeAt, getUTCDate, getUTCFullYear, getUTCHours, getUTCMinutes,
    getUTCMonth, getUTCSeconds, hasOwnProperty, join, lastIndex, length,
    parse, propertyIsEnumerable, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    JSON = {};
}
(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapeable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapeable.lastIndex = 0;
        return escapeable.test(string) ?
            '"' + string.replace(escapeable, function (a) {
                var c = meta[a];
                if (typeof c === 'string') {
                    return c;
                }
                return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value;
          value = holder[key]

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// If the object has a dontEnum length property, we'll treat it as an array.

            if (typeof value.length === 'number' &&
                    !value.propertyIsEnumerable('length')) {

// The object is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
})();
//     Underscore.js 1.4.3
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // with specific `key:value` pairs.
  _.where = function(obj, attrs) {
    if (_.isEmpty(attrs)) return [];
    return _.filter(obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, context) {
    var args, bound;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + (0 | Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = '' + ++idCounter;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);
//
// stdlib.js
//   This file contains a collection of utility routines that I've
//   written, borrowed, rewritten, and occasionally tested and
//   documented.
//
//   Most of this stuff is photoshop specific. I'll break out the parts
//   that aren't sometime in the future.
//
// $Id$
// Copyright: (c)2010, xbytor
// License: http://www.opensource.org/licenses/bsd-license.php
// Contact: xbytor@gmail.com
//
//@show include
//
//@includepath "/c/Program Files/Adobe/xtools;/Developer/xtools"
//

//================================== misc ====================================
//
// Some shorthand functions for TypeID conversion
//

// these revs follow some discussions with SzopeN

cTID = function(s) { return cTID[s] || cTID[s] = app.charIDToTypeID(s); };
sTID = function(s) { return sTID[s] || sTID[s] = app.stringIDToTypeID(s); };

// older revs
// cTID = function(s) {
//   if (s.length != 4) {
//     Error.runtimeError(19, s);  // Bad Argument
//   }
//   return app.charIDToTypeID(s);
// };
// cTID = function(s) { return app.charIDToTypeID(s); };
// sTID = function(s) { return app.stringIDToTypeID(s); };

xTID = function(s) {
  if (s == undefined) {
    if (!isCS() && !isCS2()) {
      try {
        Stdlib.log("undefined id detected at: " + $.stack);
      } catch (e) {
        Stdlib.log("undefined id detected");
      }
    } else {
      Stdlib.log("undefined id detected");
    }
  }

  if (s.constructor == Number) {
    return s;
  }
  try {
    if (s instanceof XML) {
      var k = s.nodeKind();
      if (k == 'text' || k == 'attribute') {
        s = s.toString();
      }
    }
  } catch (e) {
  }

  if (s.constructor == String) {
    if (s.length > 0) {
      if (s.length != 4) return sTID(s);
      try { return cTID(s); } catch (e) { return sTID(s); }
    }
  }
  Error.runtimeError(19, s);  // Bad Argument

  return undefined;
};

//
// This reverses the mapping from a TypeID to something readable.
// If PSConstants.js has been included, the string returned is even
// more readable
// 'map' is optional. It can be either a string ("Class") or a
// table object from PSConstants (PSClass). Using 'map' will help
// id2char return the most appropriate result since collisions
// happen. For instance, cTID('Rds ') is the id for PSKey.Radius
// and PSEnum.Reds.
//
id2char = function(s, map) {
  if (isNaN(Number(s))){
    return '';
  }
  var v;

  // Use every mechanism available to map the typeID
  var lvl = $.level;
  $.level = 0;
  try {
    if (!v) {
      try { v = PSConstants.reverseNameLookup(s, map); } catch (e) {}
    }
    if (!v) {
      try { v = PSConstants.reverseSymLookup(s); } catch (e) {}
    }
    if (!v) {
      try { v = app.typeIDToCharID(s); } catch (e) {}
    }
    if (!v) {
      try { v = app.typeIDToStringID(s); } catch (e) {}
    }
  } catch (e) {
  }
  $.level = lvl;
  if (!v) {
    v = Stdlib.numberToAscii(s);
  }
  return v ? v : s;
};
id2charId = function(s, map) {
  if (isNaN(Number(s))){
    return '';
  }
  var v;

  // Use every mechanism available to map the typeID
  var lvl = $.level;
  $.level = 0;
  try {
    if (!v) {
      try { v = PSConstants.reverseSymLookup(s); } catch (e) {}
    }
    if (!v) {
      try { v = app.typeIDToCharID(s); } catch (e) {}
    }
    if (!v) {
      try { v = PSConstants.reverseNameLookup(s, map); } catch (e) {}
    }
    if (!v) {
      try { v = app.typeIDToStringID(s); } catch (e) {}
    }
  } catch (e) {
  }
  $.level = lvl;
  if (!v) {
    v = Stdlib.numberToAscii(s);
  }
  return v ? v : s;
};
// deprecated
id2name = function(s) {
  return id2char(s);
};

if (!$.evalFile) {
  // only CS3 defines global and evalFile
  global = this;
} else {
  global = $.global;
}

isPhotoshop = function() {
  return !!app.name.match(/photoshop/i);
};
isPhotoshopElements = function() {
  return !!BridgeTalk.appName.match(/pseeditor/i);
};
isPSE = isPhotoshopElements;
isBridge = function() {
  return !!app.name.match(/bridge/i);
};
isInDesign = function() {
  return !!app.name.match(/indesign/i);
};

//
// Simple checks for photoshop version
//
var psVersion;
var pseVersion;
try {
  var lvl = $.level;
  // $.level = 0;
  psVersion = app.version;
  if (isPSE()) {
    pseVersion = psVersion;
    var _tmp = psVersion.split(/\./);
    _tmp[0] = (toNumber(_tmp[0])+2).toString();
    psVersion = _tmp.join(".");
    delete _tmp;
  }

 } catch (e) {
  psVersion = version;

 } finally {
   $.level = lvl;
   delete lvl;
}

// see XBridgeTalk for more comprehensive isCSX handling
// if (!global["isCS3"]) {
//   isCS3 = function()  { return psVersion.match(/^10\./) != null; };
// }
// if (!global["isCS2"]) {
//   isCS2 = function()  { return psVersion.match(/^9\./) != null; };
// }
CSVersion = function() {
  return toNumber(psVersion.match(/^\d+/)[0]) - 7;
};
CSVersion._version = CSVersion();

isCS6 = function()  { return CSVersion._version == 6; };
isCS5 = function()  { return CSVersion._version == 5; };
isCS4 = function()  { return CSVersion._version == 4; };
isCS3 = function()  { return CSVersion._version == 3; };
isCS2 = function()  { return CSVersion._version == 2; };
isCS  = function()  { return CSVersion._version == 1; };
isPS7 = function()  { return psVersion.match(/^7\./) != null; };


if (isPS7()) {  // this does not work for eval-includes
  app = this;
}

isWindows = function() {
  return $.os.match(/windows/i);
};
isMac = function() {
  return !isWindows();
};
isVista = function() {
  return $.os.match(/vista/i);
};
isVista64 = function() {
  return $.os.match(/vista\/64/i);
};


// this makes PS7 compatibility a bit easier
function getUnitValue(u) { return (u.value != undefined) ? u.value : u; }

function newLocalString(scope, name, value, prefix, container) {
  if (!scope || !scope.beginsWith('$$$/')) {
    Error.runtimeError(19, 'scope');  // Bad Argument
  }

  if (!name) {
    Error.runtimeError(19, 'name');  // Bad Argument
  }

  if (prefix == undefined) {
    prefix = "str";
  }

  if (value == undefined) {
    value = name;
  }

  if (!scope.endsWith('/')) {
    scope += '/';
  }

  var str = localize(scope + name + '=' + value);

  if (container) {
    container[prefix + name] = str;
  }

  return str;
}

//
//=============================== Stdlib =====================================
// This is the name space for utility functions. This should probably be
// broken up into smaller classes

Stdlib = function Stdlib() {};

Stdlib.VERSION = "2.0";

Stdlib.RcsId = "$Id$";

Stdlib.ERROR_CODE = 9001;
Stdlib.IO_ERROR_CODE = 9002;

Stdlib.IOEXCEPTIONS_ENABLED = true;

//================================= language =================================
//
// throwError
//     throw an exception where you would normally have an
//     expression e.g.
//        var f = File("~/start.ini");
//        f.open("r") || Stdlib.throwError(f.error);
//
Stdlib.throwError = function(e) {
  throw e;
};
throwError = Stdlib.throwError;

Stdlib.quit = function(interactive) {
  // no interactive support yet...
  executeAction(cTID('quit'), new ActionDescriptor(), DialogModes.NO);
};

//
// createObject
//
Stdlib.createObject = function(cls, attrs) {
  var obj = new cls();
  for (var v in attrs) {
    obj[v] = attrs[v];
  }
  return obj;
};

//
// for when you really, really have to wipe-out an object
//
Stdlib.clearObject = function(obj) {
  for (var idx in obj) {
    try { delete obj[idx]; } catch (e) {}
  }
  return obj;
};

Stdlib.copyFromTo = function(from, to) {
  if (!from || !to) {
    return;
  }
  for (var idx in from) {
    var v = from[idx];
    if (typeof v == 'function') {
      continue;
    }
    if (v == 'typename'){
      continue;
    }

    try { to[idx] = v; } catch (e) {}
  }
};

Stdlib.randomElement = function(ary) {
  return ary[Math.floor(Math.random(ary.length) * ary.length)];
};

Stdlib.popRandomElement = function(ar) {
  if (ar.length == 0) {
    return undefined;
  }
  if (ar.length == 1) {
    var el = ar[0];
    ar.length = 0;
    return el;
  }
  var idx = Math.floor(Math.random(ar.length) * ar.length);
  var el = ar[idx];
  ar.splice(idx, 1);
  return el;
};


//
// This is one way of getting an environment variable. This is deprecated
// in CS2.
//
Stdlib.getenv = function(key) {
  key = key.toUpperCase();
  if (Stdlib.env != undefined) {
    return key ? Stdlib.env[key]: Stdlib.env;
  }
  Stdlib.env = new Object();

  var f = new File(Folder.temp + "/getenv.bat");
  f.open("w");
  f.writeln("set > env.txt");
  f.writeln("rename env.txt env.dat");
  f.close();
  f.execute();
  var o;

  var maxCount = 100;
  while (maxCount--) {
    // lets take a brief pause here....
    // 10000 seems about right on my box...
    // need to loop this and port to CS2
    Stdlib.pause(10000);
    o = new File("env.dat");
    if (o.exists) {
      break;
    }
    o = undefined;
  }
  if (!o) {
    Error.runtimeError(33); // internal error
  }
  o.open("r");
  var s = o.read();
  o.close();

  f.remove();
  o.remove();

  var envlist = s.split("\n");

  for (var i =0; i < envlist.length; i++) {
    var x = envlist[i].split("=");
    Stdlib.env[x[0].toUpperCase()] = x[1];
  }

  return key ? Stdlib.env[key]: Stdlib.env;
};

//
// runScript
//     load and execute an external script. use the standard
//     xscripts search path if the name is not absolute
//
Stdlib.IncludePathFile = "IncludePath.js";  // deprecated...

Stdlib.runScript = function(name) {
  Stdlib.runScriptByName(name,
                         (name.charAt(0) == '/') ?
                         null : Stdlib.IncludePathFile);
};

Stdlib.runScriptByName = function(name, path) {
  var str = "//@include \"" + name + "\";\r";
  if (path) {
    str = "//@include \"" + path + "\";\r" + str;
  }
  eval(str); // can't do this at top-level so some scoping problems
             // are inevitable
  return true;
};

//
// Thanks to Rags Gardner and Bob Stucky
// news://adobeforums.com:119/3bbff2b9.3@webcrossing.la2eafNXanI
//
Stdlib.getScriptFolder = function() {
  return Stdlib.getScriptFile().parent;
};
Stdlib.getScriptFileName = function() {
  var f = Stdlib.getScriptFile();
  return (f ? f.absoluteURI : '');
};

Stdlib.getScriptFile = function() {
  if (CSVersion() < 2) {
    return undefined;
  }

  if (isCS2()) {
    // this behaves oddly in the presence of @include files in CS3
    var dbLevel = $.level;
    $.level = 0;
    var path = undefined;

    try {
      some_undefined_variable;
    } catch (e) {
      path = e.fileName;
    }

    $.level = dbLevel;

    return new File(path);
  }

  return new File($.fileName);
};

// thanks to Andrew Hall
Stdlib.btRunScript = function(script, btapp) {
  if (!btapp) { btapp = BridgeTalk.appSpecifier; }

  BridgeTalk.bringToFront(btapp);

  var bt = new BridgeTalk();
  bt.target = btapp;
  bt.body = "//@include \"" + script + "\";\r\n";
  bt.send();
};
Stdlib.btExec = function(code, btapp) {
  if (!btapp) { btapp = BridgeTalk.appSpecifier; }

  BridgeTalk.bringToFront(btapp);

  var bt = new BridgeTalk();
  bt.target = btapp;
  bt.body = code;
  bt.send();
};

Stdlib.restartScript = function() {
  Stdlib.btRunScript(Stdlib.getScriptFileName());
};

try {
Stdlib.PRESETS_FOLDER =
  new Folder(app.path + '/' +
             localize("$$$/ApplicationPresetsFolder/Presets=Presets"));

Stdlib.ADOBE_PRESETS_FOLDER = Stdlib.PRESETS_FOLDER;

Stdlib.USER_PRESETS_FOLDER =
    new Folder(Folder.userData + '/' +
               localize("$$$/private/AdobeSystemFolder/Adobe=Adobe") + '/' +
               localize("$$$/private/FolderNames/AdobePhotoshopProductVersionFolder") + '/' +
               localize("$$$/private/FolderName/UserPresetsFolder/Presets=Presets"));

Stdlib.SCRIPTS_FOLDER =
  new Folder(app.path + '/' +
             localize("$$$/ScriptingSupport/InstalledScripts=Presets/Scripts"));

Stdlib.PLUGINS_FOLDER =
    new Folder(app.path + '/' +
               localize("$$$/private/Plugins/DefaultPluginFolder=Plug-Ins"));

Stdlib.FLASH_PANELS_FOLDER =
    new Folder(Stdlib.PLUGINS_FOLDER + '/' +
               localize("$$$/private/Plugins/FlashFolder=Panels"));

Stdlib.PS_SETTINGS_FOLDER =
    new Folder(app.preferencesFolder + '/' +
          localize("$$$/private/WorkSpace/WorkSpaceFolder/WorkSpace=WorkSpaces"));

} catch (e) {
}

Stdlib._getPreferencesFolder = function() {
  var userData = Folder.userData;

  if (!userData || !userData.exists) {
    userData = Folder("~");
  }

  var folder = new Folder(userData + "/xtools");

  if (!folder.exists) {
    folder.create();
  }

  return folder;
};

Stdlib.PREFERENCES_FOLDER = Stdlib._getPreferencesFolder();

Stdlib.selectWorkSpace = function(name) {
  var desc1 = new ActionDescriptor();
  var ref1 = new ActionReference();
  ref1.putName( sTID('workspace'), name );
  desc1.putReference( cTID('null'), ref1 );
  executeAction( cTID('slct'), desc1, DialogModes.NO );
};


//
// Format a Date object into a proper ISO 8601 date string
//
Stdlib.toISODateString = function(date, timeDesignator, dateOnly, precision) {
  if (!date) date = new Date();
  var str = '';
  if (timeDesignator == undefined) { timeDesignator = 'T'; };
  function _zeroPad(val) { return (val < 10) ? '0' + val : val; }
  if (date instanceof Date) {
    str = (date.getFullYear() + '-' +
           _zeroPad(date.getMonth()+1,2) + '-' +
           _zeroPad(date.getDate(),2));
    if (!dateOnly) {
      str += (timeDesignator +
              _zeroPad(date.getHours(),2) + ':' +
              _zeroPad(date.getMinutes(),2) + ':' +
              _zeroPad(date.getSeconds(),2));
      if (precision && typeof(precision) == "number") {
        var ms = date.getMilliseconds();
        if (ms) {
          var millis = _zeroPad(ms.toString(),precision);
          var s = millis.slice(0, Math.min(precision, millis.length));
          str += "." + s;
        }
      }
    }
  }
  return str;
};

//
// Make it a Date object method
//
Date.prototype.toISODateString = function(timeDesignator, dateOnly, precision) {
  return Stdlib.toISODateString(this, timeDesignator, dateOnly, precision);
};
Date.prototype.toISOString = Date.prototype.toISODateString;

// Add test sets from
// http://www.pelagodesign.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
Stdlib.testISODate = function() {
  var strs = ["2006-09-01",
              "1997-07-16T19:20",
              "1997-07-16T19:20Z",
              "1997-07-16T19:20+01:00",
              "2006-09-01T16:33:26",
              "2006-09-01 16:33:26",
              "2006:09:01 16:33:26",
              "1997-07-16T19:20:30",
              "1997-07-16T19:20:30Z",
              "1997-07-16T19:20:30-01:00",
              "1997-07-16T19:20:30.45",
              "1997-07-16T19:20:30.45Z",
              "1997-07-16T19:20:30.45+01:05"];

  for (var i = 0; i < strs.length; i++) {
    var s = strs[i];
    alert(s + " :: " + Stdlib.parseISODateString(s).toISODateString('T', false, 2));
  }
};


//
// xmp = new XMPData(doc); Stdlib.parseISODateString(xmp.get('createdate'))
//
//
// Here's a better RegExp to validate with
// ^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$
//
Stdlib.parseISODateString = function(str) {
  if (!str) {
    return undefined;
  }
  // \d{4}(:|-)\d{2}(:-)\d{2}( |T).\d{2}:\d{2}:\d{2}(Z|((\-\+)\d{2}:\d{2}))?

  // Date portion /^(\d{4}).?(\d{2}).?(\d{2})/
  // Divider ( |T)
  var date = undefined;
  //$.level = 1; debugger;
  if (str.length >= 10 && str.length <= 35) {

    // we are assuming that this date is formatted correctly
    var utc = str.endsWith('Z');

    // handle the data portion e.g. 2006-06-08 or 2006:06:08 or 20060680
    var m = str.match(/^(\d{4}).?(\d{2}).?(\d{2})/);

    if (m) {
      var date = new Date();
      if (utc) {
        date.setUTCFullYear(Number(m[1]),
                            Number(m[2])-1,
                            Number(m[3]));
        date.setUTCHours(0, 0, 0);
        date.setUTCMilliseconds(0);

      } else {
        date.setFullYear(Number(m[1]),
                         Number(m[2])-1,
                         Number(m[3]));
        date.setHours(0, 0, 0);
        date.setMilliseconds(0);
      }


      // handle the time portion e.g. 12:15:02
      // or 12:15:02-06:00 or 12:15:02Z or 12:15:02.25Z or 12:15:02.25+10:30
      if (str.length > 10) {
        m = str.match(/( |T)(\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?(?:(Z)|(\-|\+)(\d{2}):(\d{2}))?$/);

        if (m) {
          var hours = Number(m[2]);
          var mins = Number(m[3]);

          var nstr = str.slice(m.index);

          var secs = (m[4] ? Number(m[4]) : 0);
          var ms = 0;
          if (m[5]) {
            ms = Number("0" + m[5]) * 1000;
          }

          var z = (m[6] == 'Z');
          // assert(z == utc);

          if (utc) {
            date.setUTCHours(hours, mins, secs);
            date.setUTCMilliseconds(ms);

          } else {
            date.setHours(hours, mins, secs);
            date.setMilliseconds(ms);
          }

          if (m[6] || (m[7] && m[8] && m[9])) {
            var tzd = (z ? 'Z' : m[7] + m[8] + ':' + m[9]);
            date.tzd = tzd;
          }

        } else {
          date = undefined;
        }
      }
    }
  }

  return date;
};

Stdlib.binToHex = function(s, whitespace) {
  function hexDigit(d) {
    if (d < 10) return d.toString();
    d -= 10;
    return String.fromCharCode('A'.charCodeAt(0) + d);
  }
  var str = '';

  if (s.constructor != String) {
    s = s.toString();
  }

  for (var i = 0; i < s.length; i++) {
    if (i) {
      if (whitespace == true) {
        if (!(i & 0xf)) {
          str += '\r\n';
        } else if (!(i & 3)) {
          str += ' ';
        }
      }
    }
    var ch = s.charCodeAt(i) & 0xFF;  // check for unicode here...
    str += hexDigit(ch >> 4) + hexDigit(ch & 0xF);
  }
  return str;
};
Stdlib.hexToBin = function(h) {
  function binMap(n) {
    if (n.match(/[0-9]/)) return parseInt(n);
    return parseInt((n.charCodeAt(0) - 'A'.charCodeAt(0)) + 10);
  }

  h = h.toUpperCase().replace(/\s/g, '');
  var bytes = '';

  for (var i = 0; i < h.length/2; i++) {
    var hi = h.charAt(i * 2);
    var lo = h.charAt(i * 2 + 1);
    var b = (binMap(hi) << 4) + binMap(lo);
    bytes += String.fromCharCode(b);
  }
  return bytes;
};
Stdlib.hexToJS = function(h) {
  var str = '';
  var blockSize = 64;
  var blockCnt = (h.length/blockSize).toFixed();

  for (var i = 0; i < blockCnt; i++) {
    var ofs = i * blockSize;
    str += "  \"" + h.slice(ofs, ofs + blockSize) + "\" +\n";
  }

  str += "  \"" + h.slice(blockCnt * blockSize) + "\"\n";
  return str;
};
Stdlib.shortToHex = function(w) {
  function sfcc(c) { return String.fromCharCode(c); }
  var bytes = [sfcc((w >> 8) & 0xFF),
               sfcc(w & 0xFF)];
  return Stdlib.binToHex(bytes.join(""));
};
Stdlib.longToHex = function(w) {
  function sfcc(c) { return String.fromCharCode(c); }
  var bytes = [sfcc((w >> 24) & 0xFF),
               sfcc((w >> 16) & 0xFF),
               sfcc((w >> 8) & 0xFF),
               sfcc(w & 0xFF)];
  return Stdlib.binToHex(bytes.join(""));
};
Stdlib.hexToLong = function(h) {
  function cca(s, i) { return s.charCodeAt(i); }
  var bytes = Stdlib.hexToBin(h);

  return ((cca(bytes, 0) << 24) +
          (cca(bytes, 1) << 16) +
          (cca(bytes, 2) << 8) +
          cca(bytes, 3));
};

Stdlib.hexTest = function() {
  var f = new File("/c/work/xxx.asl");
  var s = Stdlib.readFromFile(f, 'BINARY');
  var h = Stdlib.binToHex(s);
  var js = Stdlib.hexToJS(h);

  //alert(h.slice(0, 132));
  //alert(js.slice(0, 132));
  eval(" xxx = " + js);
  alert(xxx == h);

  var f = new File("/c/work/xxx2.asl");
  Stdlib.writeToFile(f, Stdlib.hexToBin(xxx), 'BINARY');
};

Stdlib.numberToAscii = function(n) {
  if (isNaN(n)) {
    return n;
  }
  var str = (String.fromCharCode(n >> 24) +
             String.fromCharCode((n >> 16) & 0xFF) +
             String.fromCharCode((n >> 8) & 0xFF) +
             String.fromCharCode(n & 0xFF));

  return (Stdlib.isAscii(str[0]) && Stdlib.isAscii(str[1]) &&
          Stdlib.isAscii(str[2]) && Stdlib.isAscii(str[3])) ? str : n;
};

// Need to implement C-style isAscii functions

Stdlib.ASCII_SPECIAL = "\r\n !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~";
Stdlib.isSpecialChar = function(c) {
  return Stdlib.ASCII_SPECIAL.contains(c[0]);
};
Stdlib.isAscii = function(c) {
  return !!(c.match(/[\w\s]/) || Stdlib.isSpecialChar(c));
};

//
//==================================== Strings ===============================
//


String.prototype.contains = function(sub) {
  return this.indexOf(sub) != -1;
};

String.prototype.containsWord = function(str) {
  return this.match(new RegExp("\\b" + str + "\\b")) != null;
};

String.prototype.endsWith = function(sub) {
  return this.length >= sub.length &&
    this.slice(this.length - sub.length) == sub;
};

String.prototype.reverse = function() {
  var ar = this.split('');
  ar.reverse();
  return ar.join('');
};

String.prototype.startsWith = function(sub) {
  return this.indexOf(sub) == 0;
};

String.prototype.trim = function() {
  return this.replace(/^[\s]+|[\s]+$/g, '');
};
String.prototype.ltrim = function() {
  return this.replace(/^[\s]+/g, '');
};
String.prototype.rtrim = function() {
  return this.replace(/[\s]+$/g, '');
};


//
// Trim leading and trailing whitepace from a string
//
Stdlib.trim = function(value) {
   return value.replace(/^[\s]+|[\s]+$/g, '');
};

Array.contains = function(ar, el) {
  for (var i = 0; i < ar.length; i++) {
    if (ar[i] == el) {
      return true;
    }
  }
  return false;
};
if (!Array.prototype.contains) {
  Array.prototype.contains = function(el) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == el) {
        return true;
      }
    }
    return false;
  };
}

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(el) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == el) {
        return i;
      }
    }
    return -1;
  };
}
if (!Array.prototype.lastIndexOf) {
  Array.prototype.indexOf = function(el) {
    for (var i = this.length-1; i >= 0; i--) {
      if (this[i] == el) {
        return i;
      }
    }
  return -1;
  };
}



// Array.prototype.iterate = function(ftn) {
//   for (var i = 0; i < this.length; i++) {
//     ftn(this[i]);
//   }
// };

// Array.prototype.grep = function(re, ftn, prop) {
//   for (var i = 0; i < this.length; i++) {
//     if (prop) {
//       if (this[i][prop].match(re)) {
//         ftn(re);
//       }
//     } else {
//       if (this[i].match(re)) {
//         ftn(re);
//       }
//     }
//   }
// };

//
//============================= File Utilities ===============================
//

function throwFileError(f, msg) {
  if (msg == undefined) {
    msg = '';
  }
  Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(f, msg));
};

Stdlib.fileError = function(f, msg) {
  return ("IOError: " + (msg || '') + " \"" + f + "\": " +  f.error + '.');
};

//
// Return a File or Folder object given one of:
//    A File or Folder Object
//    A string literal or a String object that refers to either
//    a File or Folder
//
Stdlib.convertFptr = function(fptr) {
  var f;

  try { if (fptr instanceof XML) fptr = fptr.toString(); } catch (e) {}

  if (fptr.constructor == String) {
    f = File(fptr);

  } else if (fptr instanceof File || fptr instanceof Folder) {
    f = fptr;

  } else {
    Error.runtimeError(19, "fptr");
  }
  return f;
};

Stdlib.createFileSelect = function(str) {
  if (isWindows()) {
    return str;
  }

  if (!str.constructor == String) {
    return str;
  }

  var exts = [];
  var rex = /\*\.(\*|[\w]+)(.*)/;
  var m;
  while (m = rex.exec(str)) {
    exts.push(m[1].toLowerCase());
    str = m[2];
  }

  function macSelect(f) {
    var name = decodeURI(f.absoluteURI).toLowerCase();
    var _exts = macSelect.exts;

    // alert(name);

    while (f.alias) {
      try {
        f = f.resolve();
      } catch (e) {
        f = null;
      }

      if (f == null) {
        return false;
      }
    }

    if (f instanceof Folder) {
      return true;
    }

    for (var i = 0; i < _exts.length; i++) {
      var ext = _exts[i];
      if (ext == '*') {
        return true;
      }
      if (name.match(RegExp("\\." + ext + "$", "i")) != null) {
        return true;
      }
    }
    return false;
  }

  macSelect.exts = exts;
  return macSelect;
};

//
// Open a dialog to prompt the user to select a file.
// An initial file or folder can optionally be specified
// Change the current directory reference if we it
// seems appropriate.
//
//  var file = Stdlib.selectFileOpen("Choose a file to open",
//                                   "JPEG Files: *.jpg", "/c/tmp")
//  var file = Stdlib.selectFileSave("Choose a file to save",
//                                "JPEG Files: *.jpg", File("/c/tmp/tmp.jpg"))
//
Stdlib.selectFileOpen = function(prompt, select, start) {
  return Stdlib._selectFile(prompt, select, start, true);
};
Stdlib.selectFileSave = function(prompt, select, start) {
  return Stdlib._selectFile(prompt, select, start, false);
};
Stdlib.selectFile = Stdlib.selectFileOpen;

Stdlib._selectFile = function(prompt, select, start, open) {
  var file;

  if (!prompt) {
    prompt = 'Select a file';
  }

  if (start) {
    start = Stdlib.convertFptr(start);
  }

  var classFtn = (open ? File.openDialog : File.saveDialog);

  if (!start) {
    file = classFtn(prompt, select);

  } else {
    if (CSVersion() >= 6 && start instanceof File) {
      start = start.parent
    }

    if (start instanceof Folder) {
      var folder = start;
      while (start && !start.exists) {
        start = start.parent;
      }

      var files = start.getFiles(select);
      if (!files || files.length == 0) {
        files = start.getFiles();
      }
      for (var i = 0; i < files.length; i++) {
        if (files[i] instanceof File) {
          start = files[i];
          break;
        }
      }
      if (start instanceof Folder) {
        start = new File(start + "/file");
      }

      // openDlg and saveDlg are broke in CS6
      if (CSVersion() >= 6) {
        start = folder;
      }
    }

    if (start instanceof File) {
      var instanceFtn = (open ? "openDlg" : "saveDlg");

      if (instanceFtn in start) {
        file = start[instanceFtn](prompt, select);

      } else {
        try {
          if (start.exists) {
            Folder.current = start.parent;
          }
        } catch (e) {
        }
        file = classFtn(prompt, select);
      }
    } else {
      Folder.current = start;
      file = classFtn(prompt, select);
    }
  }

  if (file) {
    Folder.current = file.parent;
  }
  return file;
};

Stdlib.selectFolder = function(prompt, start) {
  var folder;

  if (!prompt) {
    prompt = 'Select a folder';
  }
  if (start) {
    start = Stdlib.convertFptr(start);
    while (start && !start.exists) {
      start = start.parent;
    }
  }

  if (!start) {
    folder = Folder.selectDialog(prompt);

  } else {
    if (start instanceof File) {
      start = start.parent;
    }

    if (start.selectDlg) {   // for CS2+
      folder = start.selectDlg(prompt);

    } else {               // for CS
      var preset = Folder.current;
      if (start.exists) {
        preset = start;
      }
      folder = Folder.selectDialog(prompt, preset);
    }
  }
  return folder;
};

Stdlib.ImageFileExtsComplete =
  "8bps,3ds,ai3,ai4,ai5,ai6,ai7,ai8,ai,arw,bmp,cin,cr2,crw,dae,dc2,dc3,dcr," +
  "dib,dic,dng,dpx,eps,epsf,epsp,erf,exr,fido,flm,gif,hdr,hrr," +
  "icb,jpeg?,jpg,kdc,kmz,m4v,mef,mfw,mos,mov,mp4,mpeg,mrw,nef,obj,orf,pam," +
  "pbm,pcd,pct,pcx,pdd,pdf,pdp,pef,pict?,png,pnm," +
  "ps(d|b)?,pxr,raf,raw,rgbe,rle,sct,sdpx,sr2,srf,tga,tiff?,u3d,vda,vst," +
  "wbmp?,x3f,xyze";

Stdlib.ImageFileExtsCompleteRE =
  new RegExp("\\.(" +
             Stdlib.ImageFileExtsComplete.replace(/,/g, '|') + ")$", 'i');

Stdlib.ImageFileExtsCommon =
  "psd,pdd,jpeg?,jpg,png,8bps,gif,bmp,rle,dib,tiff?,raw,dng,crw,cr2,nef,raf,orf";

Stdlib.ImageFileExtsCommonRE =
  new RegExp("\\.(" +
             Stdlib.ImageFileExtsCommon.replace(/,/g, '|')
             + ")$", 'i');

// 3rf,ciff,cs1,k25
Stdlib.RawImageFileExts =
  "arw,cr2,crw,dcr,dng,erf,kdc,mos,mef,mrw,nef,orf,pef,raf,raw," +
  "sr2,sraw,sraw1,srf,x3f";

Stdlib.RawImageFileExtsRE =
  new RegExp("\\.(" +
             Stdlib.RawImageFileExts.replace(/,/g, '|')
             + ")$", 'i');

Stdlib.isImageFile = function(fstr) {
  return fstr.toString().match(Stdlib.ImageFileExtsCommonRE) != null;
};
Stdlib.isRawImageFile = function(fstr) {
  return fstr.toString().match(Stdlib.RawImageFileExtsRE) != null;
};

// deprecated
Stdlib.isPSFileType = Stdlib.isImageFile;


Stdlib.isValidImageFile = function(f) {
  function _winCheck(f) {
    // skip mac system files
    if (f.name.startsWith("._")) {
      return false;
    }

    var ext = f.strf('%e').toUpperCase();
    return (ext.length > 0) && app.windowsFileTypes.contains(ext);
  }
  function _macCheck(f) {
    return app.macintoshFileTypes.contains(f.type) || _winCheck(f);
  }

  return (((File.fs == "Macintosh") && _macCheck(f)) ||
          ((File.fs == "Windows") && _winCheck(f)));
};

//
// Sort an array of files in XP's 'intuitive' sort order
// so that files like [x1.jpg,x2.jpg,x10.jpg,x20.jpg] are
// ordered in numerical sequence
//
Stdlib.XPFileSort = function(list) {
  var rex = /(\d+)\./;

  function xpCmp(a, b) {
    var ap = a.name.match(rex);
    var bp = b.name.match(rex);
    if (ap != null && bp != null) {
      return toNumber(ap[1]) - toNumber(bp[1]);
    }
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  return list.sort(xpCmp);
};

//
// Adds RegExp support and avoids PS7/CS bug in Folder.getFiles()
// usage:
//    getFiles(folder);
//    getFiles(folder, "*.jpg");
//    getFiles(folder, /\.jpg$/);
//    getFiles(folder, function(f) { return f instanceof Folder; });
//
Stdlib.getFiles = function(folder, mask) {
  var files = [];

  folder = Stdlib.convertFptr(folder);

  if (folder.alias) {
    folder = folder.resolve();
  }

  //Stdlib.fullStop();
  var getF;
  if (Folder.prototype._getFiles) {
    getF = function(f, m) { return f._getFiles(m); };
  } else {
    getF = function(f, m) { return f.getFiles(m); };
  }

  if (mask instanceof RegExp) {
    var allFiles = getF(folder);
    for (var i = 0; i < allFiles.length; i = i + 1) {
      var f = allFiles[i];
      if (decodeURI(f.absoluteURI).match(mask)) {
        files.push(f);
      }
    }
  } else if (typeof mask == "function") {
    var allFiles = getF(folder);
    for (var i = 0; i < allFiles.length; i = i + 1) {
      var f = allFiles[i];
      if (mask(f)) {
        files.push(f);
      }
    }
  } else {
    files = getF(folder, mask);
  }

  return files;
};

//
// Install an adaptor to that our getFiles code will be invoked when
// Folder.getFiles is called. The difficulty here is that we need to retain
// a handle to the original implementation so that we can invoke it from
// our version and that this code may be executed multiple times.
//
Stdlib.getFiles.install = function() {
  if (!Folder.prototype._getFiles) {
     // save the original getFiles
    Folder.prototype._getFiles = Folder.prototype.getFiles;
    // slide in an adaptor for our version
    Folder.prototype.getFiles = function(mask) {
      return Stdlib.getFiles(this, mask);
    };
  }
};
//
// Remove our adaptor and restore the original Folder.getFiles method
//
Stdlib.getFiles.uninstall = function() {
  if (Folder.prototype._getFiles) {
    // restore the original getFiles
    Folder.prototype.getFiles = Folder.prototype._getFiles;
    // delete our adaptor
    delete Folder.protoype._getFiles;
  }
};

Stdlib.getFolders = function(folder) {
  if (folder.alias) {
    folder = folder.resolve();
  }
  var folders = Stdlib.getFiles(folder,
                                function(f) { return f instanceof Folder; });
  return folders;
};

Stdlib.getFiles.install();   // install our version of Folder.getFiles

Stdlib.findFiles = function(folder, mask) {
  if (folder.alias) {
    folder = folder.resolve();
  }
  var files = Stdlib.getFiles(folder, mask);
  var folders = Stdlib.getFolders(folder);

  for (var i = 0; i < folders.length; i++) {
    var f = folders[i];
    var ffs = Stdlib.findFiles(f, mask);
    // files.concat(ffs); This occasionally fails for some unknown reason (aka
    // interpreter Bug) so we do it manually instead
    while (ffs.length > 0) {
      files.push(ffs.shift());
    }
  }
  return files;
};

Stdlib.findImageFiles = function(folder) {
  return Stdlib.findFiles(folder, Stdlib.ImageFileExtsCommonRE);
};

Folder.prototype.findFiles = function(mask) {
  return Stdlib.findFiles(this, mask);
};

Stdlib.getImageFiles = function(folder, recursive, complete) {
  if (folder.alias) {
    folder = folder.resolve();
  }

  if (recursive == undefined) recursive = false;
  if (complete == undefined) complete = false;
  var mask = (complete ?
              Stdlib.ImageFileExtsCompleteRE : Stdlib.ImageFileExtsCommonRE);
  if (recursive) {
    return Stdlib.findFiles(folder, mask);
  } else {
    return Stdlib.getFiles(folder, mask);
  }
};

Stdlib.grep = function(folder, rex, frex, recursive) {
  if (folder.alias) {
    folder = folder.resolve();
  }

  if (frex == undefined) {
    frex = /.*/;
  }
  var files = (!!recursive ?
               Stdlib.findFiles(folder, frex) :
               Stdlib.getFiles(folder, frex));

  var hits = [];
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (file instanceof File) {
      var str = Stdlib.readFromFile(file);
      if (str.match(rex)) {
        hits.push(file);
      }
    }
  }
  return hits;
};

//
// Returns null if the match or a string if they don't
// Useful for testing but not much else
//
Stdlib.compareFiles = function(f1, f2) {
  if (!(f1 instanceof File)) f1 = new File(f1);
  if (!(f2 instanceof File)) f2 = new File(f2);

  if (!f1.exists || !f2.exists) {
    return "File(s) do not exist.";
  }
  if (f1.length != f2.length) {
    return "Files are different sizes.";
  }

  try {
    f1.open("r") || throwFileError(f1, "Unable to open input file ");
    f1.encoding = 'BINARY';
    f2.open("r") || throwFileError(f2, "Unable to open input file ");
    f2.encoding = 'BINARY';

  } finally {
    try { f1.close(); } catch (e) {}
    try { f2.close(); } catch (e) {}
  }

  while (!f1.eof && !f2.eof && (f1.read(1) == f2.read(1))) {
    // do nothing
  }
  if (!(f1.eof && f2.eof)) {
    return "File contents do not match.";
  }
  return null;
};

Stdlib.writeToFile = function(fptr, str, encoding, lineFeed) {
  var xfile = Stdlib.convertFptr(fptr);
  var rc;

  if (encoding) {
    xfile.encoding = encoding;
  }

  rc = xfile.open("w");
  if (!rc) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE,
                       Stdlib.fileError(xfile, "Unable to open output file "));
  }

  if (lineFeed) {
    xfile.lineFeed = lineFeed;
  }

  if (isPS7() && encoding == 'BINARY') {
    xfile.lineFeed = 'unix';

    var pos = 0;
    var cr = '\r';
    var next;
    while ((next = str.indexOf(cr, pos)) != -1) {
      rc = xfile.write(str.substring(pos, next));
      if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
        Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(xfile));
      }

      xfile.lineFeed = 'mac';

      rc = xfile.write(cr);
      if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
        Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(xfile));
      }

      xfile.lineFeed = 'unix';
      pos = next + 1;
    }
    if (pos < str.length) {
      xfile.write(str.substring(pos));
    }
  } else {
    rc = xfile.write(str);
    if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
      Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(xfile));
    }
  }

  rc = xfile.close();
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(xfile));
  }
};

Stdlib.readFromFile = function(fptr, encoding, lineFeed) {
  var file = Stdlib.convertFptr(fptr);
  var rc;

  rc = file.open("r");
  if (!rc) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE,
                       Stdlib.fileError(file, "Unable to open input file "));
  }
  if (encoding) {
    file.encoding = encoding;
  }
  if (lineFeed) {
    file.lineFeed = lineFeed;
  }
  var str = file.read();

  // in some situations, read() will set the file.error to
  // 'Character conversion error' but read the file anyway
  // in other situations it won't read anything at all from the file
  // we ignore the error if we were able to read the file anyway
  if (str.length == 0 && file.length != 0) {
    if (!file.error) {
      file.error = 'Probable Character conversion error';
    }
    if (Stdlib.IOEXCEPTIONS_ENABLED) {
      Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
    }
  }
  rc = file.close();
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  return str;
};

Stdlib.INI_ENCODING = "LATIN1";

Stdlib.toIniString = function(obj) {
  var str = '';
  for (var idx in obj) {
    if (idx.charAt(0) == '_') {         // private stuff
      continue;
    }
    if (idx == 'typename') {
      continue;
    }
    var val = obj[idx];

    if (val == undefined) {
      val = '';
    }

    if (val.constructor == String ||
        val.constructor == Number ||
        val.constructor == Boolean ||
        typeof(val) == "object") {
      str += (idx + ": " + val.toString() + "\n");
    }
  }
  return str;
};
Stdlib.fromIniString = function(str, obj) {
  if (!obj) {
    obj = {};
  }
  var lines = str.split(/[\r\n]+/);

  var rexp = new RegExp(/([^:]+):(.*)$/);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.charAt(0) == '#') {
      continue;
    }
    var ar = rexp.exec(line);
    if (!ar) {
      // $.level = 1; debugger;
      alert("Bad line in config file: \"" + line + "\"");
      return undefined;
    }
    obj[ar[1].trim()] = ar[2].trim();
  }
  return obj;
};
Stdlib.readIniFile = function(fptr, obj) {
  if (!obj) {
    obj = {};
  }

  fptr = Stdlib.convertFptr(fptr);
  if (!fptr.exists) {
    return obj;
  }

  if (fptr.open("r", "TEXT", "????")) {
    fptr.lineFeed = "unix";
    fptr.encoding = Stdlib.INI_ENCODING;
    var str = fptr.read();
    var rc = fptr.close();
    if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
      Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(fptr));
    }

    return Stdlib.fromIniString(str, obj);

  } else if (Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(fptr));
  }

  return obj;
};

Stdlib.readIniValue = function(fptr, nm) {
  var obj = Stdlib.readIniFile(fptr);
  return obj[nm];
};

Stdlib.writeIniValue = function(fptr, nm, val) {
  var obj = {};
  obj[nm] = val;
  Stdlib.updateIniFile(fptr, obj);
};

Stdlib.writeIniFile = function(fptr, obj, header) {
  var rc;
  var str = (header != undefined) ? header : '';

  str += Stdlib.toIniString(obj);

  var file = Stdlib.convertFptr(fptr);
  file.encoding = Stdlib.INI_ENCODING;
  rc = file.open("w", "TEXT", "????");
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  file.lineFeed = "unix";

  rc = file.write(str);
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  rc = file.close();
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }
};

Stdlib.updateIniFile = function(fptr, ini) {
  if (!ini || !fptr) {
    return undefined;
  }
  var file = Stdlib.convertFptr(fptr);

  // we can only update the file if it exists
  var update = file.exists;
  var str = '';

  if (update) {
    file.open("r", "TEXT", "????");
    fptr.encoding = Stdlib.INI_ENCODING;
    file.lineFeed = "unix";
    str = file.read();
    file.close();

    for (var idx in ini) {
      if (idx.charAt(0) == '_') {         // private stuff
        continue;
      }
      if (idx == "noUI") {
        continue;
      }
      if (idx == "typename") {
        continue;
      }

      var val = ini[idx];

      if (typeof(val) == "undefined") {
        val = '';
      }

      if (typeof val == "string" ||
          typeof val == "number" ||
          typeof val == "boolean" ||
          typeof val == "object") {
        idx += ':';
        var re = RegExp('^' + idx, 'm');

        if (re.test(str)) {
          re = RegExp('^' + idx + '[^\n]*', 'm');
          str = str.replace(re, idx + ' ' + val);
        } else {
          str += '\n' + idx + ' ' + val;
        }
      }
    }
  } else {
    // write out a new ini file
    for (var idx in ini) {
      if (idx.charAt(0) == '_') {         // private stuff
        continue;
      }
      if (idx == "noUI") {
        continue;
      }
      if (idx == "typename") {
        continue;
      }
      var val = ini[idx];

      if (typeof val == "string" ||
          typeof val == "number" ||
          typeof val == "boolean" ||
          typeof val == "object") {
        str += (idx + ": " + val.toString() + "\n");
      }
    }
  }

  if (str) {
    file.open("w", "TEXT", "????");
    fptr.encoding = Stdlib.INI_ENCODING;
    file.lineFeed = "unix";
    file.write(str);
    file.close();
  }

  return ini;
};

Stdlib.xmlFromIni = function(ini, arg) {
  var xml;

  if (ini == undefined) {
    Error.runtimeError(2, "ini"); // isUndefined
  }

  if (arg) {
    if (arg.constructor.name == 'String') {
      xml = new XML('<' + arg + '></' + arg + '>');
    } else if (arg instanceof XML) {
      xml = arg;
    } else {
      Error.runtimeError(1243); // bad arg 2
    }
  } else {
    xml = new XML('Ini');
  }

  for (var idx in ini) {
    if (idx.charAt(0) == '_') {         // private stuff
      continue;
    }
    if (idx == "noUI") {
      continue;
    }
    if (idx == "typename") {
      continue;
    }
    var val = ini[idx];

    if (typeof val == "string" ||
        typeof val == "number" ||
        typeof val == "boolean" ||
        typeof val == "object") {
      xml[idx] = val;
    }
  }

  return xml;
};

Stdlib.iniFromXML = function(xml, ini) {
  if (!xml) {
    Error.runtimeError(2, "xml");
  }
  if (!ini) {
    ini = {};
  }

  var els = xml.elements();

  for (var i = 0; i < els.length(); i++) {
    var el = els[i];
    ini[el.name()] = el.toString();
  }

  return ini;
};

Stdlib.readXMLFile = function(fptr) {
  var rc;
  var file = Stdlib.convertFptr(fptr);
  if (!file.exists) {
    Error.runtimeError(48); // File/Folder does not exist
  }

  file.encoding = "UTF8";
  file.lineFeed = "unix";

  rc = file.open("r", "TEXT", "????");
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  var str = file.read();

  rc = file.close();
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  return new XML(str);
};

Stdlib.writeXMLFile = function(fptr, xml) {
  var rc;
  if (!(xml instanceof XML)) {
    Error.runtimeError(19, "xml"); // "Bad XML parameter";
  }

  var file = Stdlib.convertFptr(fptr);
  file.encoding = "UTF8";

  rc = file.open("w", "TEXT", "????");
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  // unicode signature, this is UTF16 but will convert to UTF8 "EF BB BF"
  // optional
  //file.write("\uFEFF");
  file.lineFeed = "unix";

  file.writeln('<?xml version="1.0" encoding="utf-8"?>');

  rc = file.write(xml.toXMLString());
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  rc = file.close();
  if (!rc && Stdlib.IOEXCEPTIONS_ENABLED) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE, Stdlib.fileError(file));
  }

  return file;
};

//
// If the CSV string has headers (default) an array of objects
//   is returned using the headers as property names.
// If the CSV string does not have headers, an array of rows (Arrays)
//   is returned
//
Stdlib.fromCSVString = function(str, ar, hasHeaders) {
  return Stdlib.fromCharSVString(str, ',', ar, hasHeaders);
};
Stdlib.readCSVFile = function(fptr, ar, hasHeaders) {
  return Stdlib.readCharSVFile(fptr, ',', ar, hasHeaders);
};
Stdlib.fromTSVString = function(str, ar, hasHeaders) {
  return Stdlib.fromCharSVString(str, '\t', ar, hasHeaders);
};
Stdlib.readTSVFile = function(fptr, ar, hasHeaders) {
  return Stdlib.readCharSVFile(fptr, '\t', ar, hasHeaders);
};
Stdlib.fromCharSVString = function(str, ch, ar, hasHeaders) {
  hasHeaders = !!hasHeaders;
  if (!ar) {
    ar = [];
  }
  var lines = str.split(/\r|\n/);
  if (lines.length == 0) {
    return ar;
  }

  // This doesn't work '([^",]+)|"((?:[^"]|"")*)"|,(?=(,|$))';
  var rexStr = '([^",]+)|"((?:[^"]|"")*)"|^,';

  if (ch != ',') {
    rexStr = rexStr.replace(/,/g, ch);
  }

  var rexp = new RegExp(rexStr);
  function parseCSVLine(line, ch) {
    var parts = [];
    line = line.trim();
    var res;

    while (line.length && (res = line.match(rexp)) != null) {
      if (res[1] || res[2]) {
        if (res[1]) {
          parts.push(res[1]);
        } else {
          parts.push(res[2].replace(/""/g, '"'));
        }
        line = line.slice(res[0].length + res.index);
        if (line[0] == ch) {
          line = line.slice(1);
        }
      } else {
        while (true) {
          if (line[0] == ch) {
            parts.push('');
            line = line.slice(1);
            continue;
          }
          if (line.startsWith('""')) {
            parts.push('');
            line = line.slice(2);
            if (line[0] == ch) {
              line = line.slice(1);
            }
            continue;
          }
          break;
        }
      }
    }
    return parts;
  }

  var headers = [];
  if (hasHeaders) {
    var line = lines[0].trim();
    headers = parseCSVLine(line, ch);
    lines.shift();
  }
  ar.headers = headers;

  if (lines.length == 0) {
    return ar;
  }

  for (var i = 0; i < lines.length; i++) {
    var row = parseCSVLine(lines[i], ch);
    if (row.length == 0) {
      continue;
    }

    if (hasHeaders) {
      var obj = new Object();
      for (var j = 0; j < row.length; j++) {
        if (headers[j]) {
          obj[headers[j]] = row[j] || '';
        } else {
          obj[j] = row[j] || '';
        }
      }
      ar.push(obj);

    } else {
      ar.push(row);
    }
  }
  return ar;
};
Stdlib.readCharSVFile = function(fptr, ch, ar, hasHeaders) {
  if (!ar) {
    ar = [];
  }
  fptr = Stdlib.convertFptr(fptr);
  if (!fptr.exists) {
    return ar;
  }
  var str = Stdlib.readFromFile(fptr);
  return Stdlib.fromCharSVString(str, ch, ar, hasHeaders);
};

Stdlib.writeCSVFile = function(fptr, content, headers) {

  function arrayAsCSV(ar) {
    var str = '';
    var numRe = /^(\+|\-)?(\d+|\.\d+|\d+\.\d+)$/;

    for (var i = 0; i < ar.length; i++) {
      var v = ar[i].toString();
      
      if (v == '-' || v == '+' || !v.match(numRE)) {
        v = '\"' + v.replace(/"/g, '\"\"') + '\"';
        //");// needed for emacs syntax hilighting
      }
      str += v;
      if (i+1 != ar.length) {
        str += ',';
      }
    }
    
    return str;
  };

  fptr = Stdlib.convertFptr(fptr);
  
  fptr.lineFeed = 'unix';

  if (!fptr.open("w", "TEXT", "????")) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE,
                       "IOError: unable to open file \"" + fptr + "\": " +
                       fptr.error + '.');
  }

  if (headers) {
    fptr.writeln(arrayAsCSV(headers));

    for (var i = 0; i < content.length; i++) {
      var obj = content[i];
      var ar = [];
      for (var j = 0; j < headers.length; j++) {
        var p = headers[j];
        var v = obj[p];
        if (v == undefined) {
          v = '';
        }
        ar.push(v);
      }

      fptr.writeln(arrayAsCSV(ar));
    }
  } else {
    for (var i = 0; i < content.length; i++) {
      var row = content[i];
      fptr.writeln(arrayAsCSV(row));
    }
  }

  fptr.close();
};


//
// The interactive parameter is not fully implemented
//
Stdlib.createFolder = function(fptr, interactive) {
  if (!fptr) {
    Error.runtimeError(19, "fptr");  // Bad Argument
  }

  if (fptr.constructor == String) {
    fptr = new Folder(fptr);
  }

  // XXX this needs testing
  if ((!fptr.exists || (fptr.parent && !fptr.parent.exists)) && interactive) {
    var f = (fptr instanceof File) ? fptr.parent : fptr;
    if (!confirm(f.toUIString() + " does not exist. Create?")) {
      return false;
    }
  }

  if (fptr instanceof File) {
    return Stdlib.createFolder(fptr.parent);
  }
  if (fptr.exists) {
    return true;
  }
  if (fptr.parent && !fptr.parent.exists) {
    if (!Stdlib.createFolder(fptr.parent)) {
      return false;
    }
  }
  return fptr.create();
};

//
// Write a message out to the default log file.
// Prefer UTF8 encoding.
// Prefer \n line endings on OS X.
//
Stdlib.log = function(msg) {
  var file;

  if (!Stdlib.log.enabled) {
    return;
  }

  if (!Stdlib.log.filename) {
    return;
  }

//   if (Stdlib.log.filename.endsWith(".ini")) {
//     debugger;
//     throw "Bad log file name";
//   }

  if (!Stdlib.log.fptr) {
    file = new File(Stdlib.log.filename);
    if (Stdlib.log.append && file.exists) {
      if (!file.open("e", "TEXT", "????"))  {
        Error.runtimeError(Stdlib.IO_ERROR_CODE,
                           "Unable to open log file(1) " +
                           file + ": " + file.error);
      }
      file.seek(0, 2); // jump to the end of the file

    } else {
      if (!file.open("w", "TEXT", "????")) {
        if (!file.open("e", "TEXT", "????")) {
          Error.runtimeError(Stdlib.IO_ERROR_CODE,
                             "Unable to open log file(2) " +
                             file + ": " +  file.error);
        }
        file.seek(0, 0); // jump to the beginning of the file
      }
    }
    Stdlib.log.fptr = file;

  } else {
    file = Stdlib.log.fptr;
    if (!file.open("e", "TEXT", "????"))  {
      Error.runtimeError(Stdlib.IO_ERROR_CODE,
                         "Unable to open log file(3) " +
                         file + ": " + file.error);
    }
    file.seek(0, 2); // jump to the end of the file
  }

  if (isMac()) {
    file.lineFeed = "Unix";
  }

  if (Stdlib.log.encoding) {
    file.encoding = Stdlib.log.encoding;
  }

  if (msg) {
    msg = msg.toString();
  }

  if (!file.writeln(new Date().toISODateString() + " - " + msg)) {
    Error.runtimeError(Stdlib.IO_ERROR_CODE,
                       "Unable to write to log file(4) " +
                       file + ": " + file.error);
  }

  file.close();
};
Stdlib.log.filename = Stdlib.PREFERENCES_FOLDER + "/stdout.log";
Stdlib.log.enabled = false;
Stdlib.log.encoding = "UTF8";
Stdlib.log.append = false;
Stdlib.log.setFile = function(filename, encoding) {
  Stdlib.log.filename = filename;
  Stdlib.log.enabled = filename != undefined;
  Stdlib.log.encoding = encoding || "UTF8";
  Stdlib.log.fptr = undefined;
};
Stdlib.log.setFilename = Stdlib.log.setFile;

//
// Thanks to Bob Stucky for this...
//
Stdlib._maxMsgLen = 5000;
Stdlib.exceptionMessage = function(e) {
  var str = '';
  var fname = (!e.fileName ? '???' : decodeURI(e.fileName));
  str += "   Message: " + e.message + '\n';
  str += "   File: " + fname + '\n';
  str += "   Line: " + (e.line || '???') + '\n';
  str += "   Error Name: " + e.name + '\n';
  str += "   Error Number: " + e.number + '\n';

  if (e.source) {
    var srcArray = e.source.split("\n");
    var a = e.line - 10;
    var b = e.line + 10;
    var c = e.line - 1;
    if (a < 0) {
      a = 0;
    }
    if (b > srcArray.length) {
      b = srcArray.length;
    }
    for ( var i = a; i < b; i++ ) {
      if ( i == c ) {
        str += "   Line: (" + (i + 1) + ") >> " + srcArray[i] + '\n';
      } else {
        str += "   Line: (" + (i + 1) + ")    " + srcArray[i] + '\n';
      }
    }
  }

  try {
    if ($.stack) {
      str += '\n' + $.stack + '\n';
    }
  } catch (e) {
  }

  if (str.length > Stdlib._maxMsgLen) {
    str = str.substring(0, Stdlib._maxMsgLen) + '...';
  }

  if (Stdlib.log.fptr) {
    str += "\nLog File:" + Stdlib.log.fptr.toUIString();
  }

  return str;
};

Stdlib.logException = function(e, msg, doAlert) {
  if (!Stdlib.log.enabled) {
    return;
  }

  if (doAlert == undefined) {
    doAlert = false;

    if (msg == undefined) {
      msg = '';
    } else if (isBoolean(msg)) {
      doAlert = msg;
      msg = '';
    }
  }

  doAlert = !!doAlert;

  var str = ((msg || '') + "\n" +
             "==============Exception==============\n" +
             Stdlib.exceptionMessage(e) +
             "\n==============End Exception==============\n");

  Stdlib.log(str);

  if (doAlert) {
    str += ("\r\rMore information can be found in the file:\r" +
            "    " + Stdlib.log.fptr.toUIString());

    alert(str);
  }
};


//
//========================= Photoshop - General ==============================
//

//
// Return an item called 'name' from the specified container.
// This works for the "magic" on PS containers like Documents.getByName(),
// for instance. However this returns null if an index is not found instead
// of throwing an exception.
//
// The 'name' argument can also be a regular expression.
// If 'all' is set to true, it will return all matches
//
Stdlib.getByName = function(container, name, all) {
  // check for a bad index
  if (!name) {
    Error.runtimeError(2, "name"); // "'undefined' is an invalid name/index");
  }

  var matchFtn;

  if (name instanceof RegExp) {
    matchFtn = function(s1, re) { return s1.match(re) != null; };
  } else {
    matchFtn = function(s1, s2) { return s1 == s2;  };
  }

  var obj = [];

  for (var i = 0; i < container.length; i++) {
    if (matchFtn(container[i].name, name)) {
      if (!all) {
        return container[i];     // there can be only one!
      }
      obj.push(container[i]);    // add it to the list
    }
  }

  return all ? obj : undefined;
};

//
// Returns all items in the container with the specified name.
//
Stdlib.getAllByName = function(container, name) {
  return Stdlib.getByName(container, name, true);
};

Stdlib.getByProperty = function(container, prop, value, all) {
  // check for a bad index
  if (prop == undefined) {
    Error.runtimeError(2, "prop");
  }
  if (value == undefined) {
    Error.runtimeError(2, "value");
  }
  var matchFtn;

  all = !!all;

  if (value instanceof RegExp) {
    matchFtn = function(s1, re) { return s1.match(re) != null; };
  } else {
    matchFtn = function(s1, s2) { return s1 == s2; };
  }

  var obj = [];

  for (var i = 0; i < container.length; i++) {
    if (matchFtn(container[i][prop], value)) {
      if (!all) {
        return container[i];     // there can be only one!
      }
      obj.push(container[i]);    // add it to the list
    }
  }

  return all ? obj : undefined;
};

//
// Stdlib.getByFunction
//   Return an element (or elements) of the container where the match function
//     returns 'true'
//
// Stdlib.getByFunction(doc.artLayers, function(layer) {
//   return layer.name.length > 10; }, true)
//
Stdlib.getByFunction = function(container, matchFtn, all) {
  // check for a match function
  if (!matchFtn) {
    Error.runtimeError(2, "matchFtn"); //"'undefined' is an invalid function"
  }

  if (typeof matchFtn != "function") {
    Error(19, "matchFtn"); // Bad arg "A match function must be specified"
  }

  var obj = [];

  for (var i = 0; i < container.length; i++) {
    if (matchFtn(container[i])) {
      if (!all) {
        return container[i];     // there can be only one!
      }
      obj.push(container[i]);    // add it to the list
    }
  }

  return all ? obj : undefined;
};

Stdlib.setPropertyValues = function(container, prop, value) {
  // check for a bad index
  if (prop == undefined) {
    Error.runtimeError(2, "prop");
  }
  if (value == undefined) {
    Error.runtimeError(2, "value");
  }
  var matchFtn;

  var obj = [];

  for (var i = 0; i < container.length; i++) {
    container[i][prop] = value;
  }

  return;
};


Stdlib.sortByName = function(ary) {
  function nameCmp(a, b) {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  return ary.sort(nameCmp);
};


// makeActive
// Make the object (regardless of class) the 'active' one. Currently, this
// works for documents and layers. The one that was active before this call
// is returned
//
Stdlib.makeActive = function(obj) {
  var prev = undefined;

  if (!obj) {
    return undefined;
  }

  if (obj.typename == "Document") {
    prev = app.activeDocument;
    if (obj != prev) {
      app.activeDocument = obj;
    }
  } else if (obj.typename.match(/Layer/)) {
    var doc = obj.parent;
    while (!(doc.typename == "Document") && doc) {
      doc = doc.parent;
    }
    if (!doc) {
      Error.runtimeError(19, "obj"); // "Bad Layer object specified"
    }

    prev = doc.activeLayer;
    if (obj != prev) { 
      var d = app.activeDocument;
      app.activeDocument = doc;

      try {
        doc.activeLayer = obj;

      } catch (e) {
        $.level = 1; debugger;
      }
      app.activeDocument = d;
    }
  }

  return prev;
};

//
// via SzopeN
// These two vars are used by wrapLC/Layer and control whether or not
// the existing doc/layer should be restored after the call is complete
// If these are set fo false, the specified doc/layer will remain
// the active doc/layer
//
Stdlib._restoreDoc = true;
Stdlib._restoreLayer = true;

//
// ScriptingListener code operates on the "active" document.
// There are times, however, when that is _not_ what I want.
// This wrapper will make the specified document the active
// document for the duration of the ScriptingListener code and
// swaps in the previous active document as needed
//
Stdlib.wrapLC = function(doc, ftn) {
  var ad = app.activeDocument;
  if (doc) {
    if (ad != doc) {
      app.activeDocument = doc;
    }
  } else {
    doc = ad;
  }

  var res = undefined;
  try {
    res = ftn(doc);

  } finally {
    if (Stdlib._restoreDoc) {
      if (ad && app.activeDocument != ad) {
        app.activeDocument = ad;
      }
    }
  }

  return res;
};

//
// The same as wrapLC except it permits specifying a layer
//
Stdlib.wrapLCLayer = function(doc, layer, ftn) {
  var ad = app.activeDocument;
  if (doc) {
    if (ad != doc) {
      app.activeDocument = doc;
    }
  } else {
    doc = ad;
  }

  var al = doc.activeLayer;
  var alvis = al.visible;

  if (layer && doc.activeLayer != layer) {
    doc.activeLayer = layer;

  } else {
    layer = doc.activeLayer;
  }

  var res = undefined;

  try {
    res = ftn(doc, layer);
  
  } finally {
    // if (Stdlib._restoreLayer) {
    //   if (doc.activeLayer != al) {
    //     doc.activeLayer = al;
    //   }
    //   if (!doc.activeLayer.isBackgroundLayer) {
    //     doc.activeLayer.visible = alvis;
    //   }
    // }
    //   
    // if (Stdlib._restoreDoc) {
    //   if (app.activeDocument != ad) {
    //     app.activeDocument = ad;
    //   }
    // }
  }

  return res;
};

//
// Invoke a Photoshop Event with no arguments
//
Stdlib.doEvent = function(doc, eid, interactive, noDesc) {
  var id;

  if (doc != undefined && eid == undefined) {
    if (doc.constructor == Number) {
      eid = doc.valueOf();
    } else if (doc.constructor == String) {
      eid = doc;
    }
    doc = undefined;
  }

  if (!eid) {
    Error.runtimeError(8600); // Event key is missing "No event id specified");
  }

  if (eid.constructor != Number) {
    if (eid.length < 4) {
      // "Event id must be at least 4 characters long"
      Error.runtimeError(19, "eventID");
    }

    if (eid.length == 4) {
      id = cTID(eid);
    } else {
      id = sTID(eid);
    }
  } else {
    id  = eid;
  }

  interactive = interactive == true;
  noDesc = noDesc == true;

  function _ftn() {
    var dmode = (interactive ? DialogModes.ALL : DialogModes.NO);
    var desc = (noDesc ? undefined : new ActionDescriptor());
    return app.executeAction(id, desc, dmode);
  }

  if (doc) {
    return Stdlib.wrapLC(doc, _ftn);
  } else {
    return _ftn(id);
  }
};

//
// Select/invoke a menu item
//
Stdlib.doMenuItem = function(item, interactive) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();

  if (item.constructor == String) {
    item = xTID(item);
  }

//  ref.putEnumerated(PSClass.MenuItem, PSType.MenuItem, item);
  ref.putEnumerated(cTID("Mn  "), cTID("MnIt"), item);
  desc.putReference(cTID("null"), ref);

  var lvl = $.level;
  $.level = 0;
  try {
    var mode = (interactive != true ? DialogModes.NO : DialogModes.ALL);
//     executeAction(PSString.select, desc, mode);
    executeAction(sTID("select"), desc, mode);
  } catch (e) {
    $.level = lvl;
    if (e.number != 8007) { // if not "User cancelled"
      throw e;
    } else {
      return false;
    }
  }
  $.level = lvl;

  return true;
};

Stdlib._print = function() {
  var dialogMode = DialogModes.NO;
  var desc1 = new ActionDescriptor();
  desc1.putBoolean(cTID('PstS'), true);
  desc1.putEnumerated(cTID('Inte'), cTID('Inte'), cTID('Clrm'));
  executeAction(cTID('Prnt'), desc1, dialogMode);
};

Stdlib.print = function(doc) {
  if (CSVersion() > 3) {
    function _ftn() {
      app.bringToFront();
      doc.printSettings.flip = false;
      doc.printSettings.setPagePosition(DocPositionStyle.SIZETOFIT);
      doc.printSettings.negative = false;

      doc.printOneCopy();
    }

    Stdlib.wrapLC(doc, _ftn);

  } else {
    function _ftn() {
      Stdlib._print();
    }

    Stdlib.wrapLC(doc, _ftn);
  }
};

//
// Select a tool from the tool palette
//   PSString.addKnotTool
//   PSString.artBrushTool
//   PSString.bucketTool
//   PSString.colorReplacementBrushTool
//   PSString.colorSamplerTool
//   PSString.convertKnotTool
//   PSString.cropTool
//   PSString.customShapeTool
//   PSString.deleteKnotTool
//   PSString.directSelectTool
//   PSString.ellipseTool
//   PSString.eyedropperTool
//   PSString.freeformPenTool
//   PSString.handTool
//   PSString.lassoTool
//   PSString.lineTool
//   PSString.magicStampTool
//   PSString.magicWandTool
//   PSString.magneticLassoTool
//   PSString.marqueeEllipTool
//   PSString.marqueeRectTool
//   PSString.marqueeSingleColumnTool
//   PSString.marqueeSingleRowTool
//   PSString.measureTool
//   PSString.moveTool
//   PSString.pathComponentSelectTool
//   PSString.penTool
//   PSString.polySelTool
//   PSString.polygonTool
//   PSString.rectangleTool
//   PSString.redEyeTool
//   PSString.roundedRectangleTool
//   PSString.sliceSelectTool
//   PSString.sliceTool
//   PSString.soundAnnotTool
//   PSString.spotHealingBrushTool
//   PSString.textAnnotTool
//   PSString.typeCreateMaskTool
//   PSString.typeCreateOrEditTool
//   PSString.typeVerticalCreateMaskTool
//   PSString.typeVerticalCreateOrEditTool
//   PSString.zoomTool
//
//   PSClass.ArtHistoryBrushTool
//   PSClass.BackgroundEraserTool
//   PSClass.BlurTool
//   PSClass.BurnInTool
//   PSClass.CloneStampTool
//   PSClass.DodgeTool
//   PSClass.EraserTool
//   PSClass.GradientTool
//   PSClass.HistoryBrushTool
//   PSClass.MagicEraserTool
//   PSClass.PaintbrushTool
//   PSClass.PatternStampTool
//   PSClass.PencilTool
//   PSClass.SaturationTool
//   PSClass.SharpenTool
//   PSClass.SmudgeTool
//
Stdlib.selectTool = function(tool) {

  if (!Stdlib.selectTool.map) {
    var map = {};
    map[ToolType.ARTHISTORYBRUSH] = cTID('ABTl'); // ArtHistoryBrushTool;
    map[ToolType.BACKGROUNDERASER] = cTID('SETl'); // BackgroundEraserTool;
    map[ToolType.BLUR] = cTID('BlTl'); // BlurTool;
    map[ToolType.BRUSH] = cTID('PbTl'); // PaintbrushTool;
    map[ToolType.BURN] = cTID('BrTl'); // BurnInTool;
    map[ToolType.CLONESTAMP] = cTID('ClTl'); // CloneStampTool;
    map[ToolType.COLORREPLACEMENTTOOL] = sTID('colorReplacementTool');
    map[ToolType.DODGE] = cTID('DdTl'); // DodgeTool;
    map[ToolType.ERASER] = cTID('ErTl'); // EraserTool;
    map[ToolType.HEALINGBRUSH] = sTID('magicStampTool');
    map[ToolType.HISTORYBRUSH] = cTID('HBTl'); // HistoryBrushTool;
    map[ToolType.PATTERNSTAMP] = cTID('PaTl'); // PatternStampTool;
    map[ToolType.PENCIL] = cTID('PcTl'); // PencilTool;
    map[ToolType.SHARPEN] = cTID('ShTl'); // SharpenTool;
    map[ToolType.SMUDGE] = cTID('SmTl'); // SmudgeTool;
    Stdlib.selectTool.map = map;
  }

  var toolID;

  if (tool.toString().startsWith('ToolType')) {
    var tid = Stdlib.selectTool.map[tool];

    if (tid == undefined) {
      var ttype = {};
      ttype._name = tool.substring(9);
      ttype.toString = function() {
        return "ToolType." + this._name.toUpperCase();
      };
      ToolType[ttype._name] = ttype;

      Stdlib.selectTool.map[ToolType[ttype._name]] = xTID(ttype._name);
      tid = Stdlib.selectTool.map[tool];
    }
    toolID = tid;

  } else if (isNumber(tool)) {
    toolID = tool;

  } else if (tool.constructor == String) {
    toolID = xTID(tool);

  } else {
    Error.runtimeError(9001, 'Bad ToolType specified');
  }

  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putClass(toolID);
  desc.putReference(cTID('null'), ref);
  executeAction(cTID('slct'), desc, DialogModes.NO);
};

Stdlib.getCurrentTool = function() {
  var ref = new ActionReference();
  ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt") );
  var desc = executeActionGet(ref);
  var tid = desc.getEnumerationType(sTID('tool'));
  return typeIDToStringID(tid);
};

Stdlib.getCurrentToolOptions = function() {
  var ref = new ActionReference();
  ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt") );
  var desc = executeActionGet(ref);
  return desc.hasKey(cTID('CrnT')) ? desc.getObjectValue(cTID('CrnT')) : undefined;
};

// Stdlib._toolOptionSetBoolean = function(toolid, pid, val) {
//   var desc = new ActionDerscritor();
//   var ref = new ActionReference();
//   ref.putEnumerated()
// };
Stdlib.zoomIn = function() {
  Stdlib.doMenuItem("ZmIn");
};
Stdlib.zoomOut = function() {
  Stdlib.doMenuItem("ZmOt");
};
Stdlib.zoomActualPixels = function() {
  Stdlib.doMenuItem("ActP");
};
Stdlib.zoomFitOnScreen = function() {
  Stdlib.doMenuItem("FtOn");
};
Stdlib.zoomPrintSize = function() {
  Stdlib.doMenuItem("PrnS");
};

// From Mike Hale
Stdlib.setZoom = function(doc, zoom ) {
  var docRes = doc.resolution;
  doc.resizeImage( undefined, undefined, 72/(zoom/100), ResampleMethod.NONE );

  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID( "Mn  " ), cTID( "MnIt" ), cTID( 'PrnS' ) );
    desc.putReference( cTID( "null" ), ref );
    executeAction( cTID( "slct" ), desc, DialogModes.NO );
  }

  return Stdlib.wrapLC(doc, _ftn);

  doc.resizeImage( undefined, undefined, docRes, ResampleMethod.NONE );
};

Stdlib.resetSwatches = function() {
  var desc26 = new ActionDescriptor();
  var ref16 = new ActionReference();
  ref16.putProperty( cTID('Clr '), cTID('Clrs') );
  desc26.putReference( cTID('null'), ref16 );
  executeAction( cTID('Rset'), desc26, DialogModes.NO );
};



//
//================================== Document =================================
//

//
// Create a new document with the name, mode, etc..., specified
//
Stdlib.newDocument = function(name, mode, width, height, resolution,
                              depth, colorProfile) {

// Stdlib.newDocument("bbb.psd", "RGBM", 250, 500, 72, 16)

  function _ftn(name, mode, width, height, resolution, depth) {
    var desc = new ActionDescriptor();
    desc.putString(cTID("Nm  "), name);
    desc.putClass(cTID("Md  "), cTID(mode));
    desc.putUnitDouble(cTID("Wdth"), cTID("#Rlt"), width);
    desc.putUnitDouble(cTID("Hght"), cTID("#Rlt"), height);
    desc.putUnitDouble(cTID("Rslt"), cTID("#Rsl"), resolution);
    desc.putDouble(sTID("pixelScaleFactor"), 1.000000 );
    desc.putEnumerated(cTID("Fl  "), cTID("Fl  "), cTID("Wht "));
    desc.putInteger(cTID("Dpth"), depth );
    desc.putString(sTID("profile"), colorProfile);

    var mkdesc = new ActionDescriptor();
    mkdesc.putObject(cTID("Nw  "), cTID("Dcmn"), desc);
    executeAction(cTID("Mk  "), mkdesc, DialogModes.NO );
  }

  if (!colorProfile) {
    colorProfile = ColorProfileNames.SRGB;
  }

  _ftn(name, mode, width, height, resolution, depth);
  return app.activeDocument;
};

Stdlib.newDocumentFromClipboard = function(name) {
  function _newDoc() {
    var desc2 = new ActionDescriptor();
    var desc3 = new ActionDescriptor();
    if (name) {
      desc3.putString( cTID('Nm  '), name);
    }
    desc3.putString( sTID('preset'), "Clipboard" );
    desc2.putObject( cTID('Nw  '), cTID('Dcmn'), desc3 );
    executeAction( cTID('Mk  '), desc2, DialogModes.NO );
  };

  function _paste() {
    var desc = new ActionDescriptor();   // AntiAlias
    desc.putEnumerated(cTID("AntA"), cTID("Annt"), cTID("Anno"));
    executeAction(cTID("past"), desc, DialogModes.NO);
  }

  var doc;
  if (isCS2() || isCS3()) {
    if (!name) {
      name = "Untitled";
    }
    doc = app.documents.add(UnitValue(100, "px"), UnitValue(100, "px"),
                            72, name, NewDocumentMode.RGB);
    _paste();
    var layer = doc.activeLayer;
    var bnds = Stdlib.getLayerBounds(doc, layer);
    doc.resizeCanvas(UnitValue(bnds[2], "px"), UnitValue(bnds[3], "px"));
    _paste();

  } else {
    _newDoc();
    _paste();
    doc = app.activeDocument;
  }
  doc.flatten();

  return doc;
};

//
// Stdlib.getObjectProperty
//   Return the value of a PS object's properties from the underlying
//     ActionDescriptor-based definition.
//   Returns 'undefined' if the property's value cannot be determined
//   This api currently only works on Application, Document, and
//   Layer-family objects.
//   Lower level apis make it possible to access other kinds of objects.
//
// Examples:
// var str = Stdlib.getObjectProperty(0, "Nm  ", "Lyr ")
// var bool = Stdlib.getObjectProperty(doc.activeLayer, "Vsbl", "Lyr ")
// var str = Stdlib.getObjectProperty(doc, 'Ttl ');
// var file = Stdlib.getObjectProperty(app, 'Path');
// var clrDesc = Stdlib.getObjectProperty(app, 'FrgC');
//
Stdlib.getObjectProperty = function(obj, prop, typ) {
  var val = Stdlib._getObjProperty(obj, prop, typ);

  return (val ? val.value : undefined);
};

// Stdlib.getObjectPropertyType
//   For UnitDouble, return the type
//   For Object, return the classId
//   For Enumerated, return the enumerationTypeId
//   All else, return undefined
//
Stdlib.getObjectPropertyType = function(obj, prop, typ) {
  var val = Stdlib._getObjProperty(obj, prop, typ);

  return (val ? val.type : undefined);
};
//
// Stdlib._getObjProperty
//   Returns an object with value and (optional) type of the property.
//   The 'typ' can be used when accessing an object type that this
//   function does not already understand
//
Stdlib._getObjProperty = function(obj, prop, typ) {
  var propId;
  var otyp;

  function _ftn(obj, propId, otyp) {
    var ref = new ActionReference();
    ref.putProperty(cTID("Prpr"), propId);

    if (typeof(obj) == "number") {
      ref.putIndex(cTID(otyp), obj);
    } else {
      ref.putEnumerated(cTID(otyp), cTID("Ordn"), cTID("Trgt") );
    }

    var desc;
    try {
      desc = executeActionGet(ref);
    } catch (e) {
      return undefined;
    }
    var val = {};

    if (desc.hasKey(propId)) {
      var typ = desc.getType(propId);
      switch (typ) {
        case DescValueType.ALIASTYPE:
          val.value = desc.getPath(propId); break;
        case DescValueType.BOOLEANTYPE:
          val.value = desc.getBoolean(propId); break;
        case DescValueType.CLASSTYPE:
          val.value = desc.getClass(propId); break;
        case DescValueType.DOUBLETYPE:
          val.value = desc.getDouble(propId); break;
        case DescValueType.ENUMERATEDTYPE:
          val.value = desc.getEnumeratedValue(propId);
          val.type = desc.getEnumeratedType(propId);
          break;
        case DescValueType.INTEGERTYPE:
          val.value = desc.getInteger(propId); break;
        case DescValueType.LISTTYPE:
          val.value = desc.getList(propId); break;
        case DescValueType.OBJECTTYPE:
          val.value = desc.getObjectValue(propId);
          val.type = desc.getObjectType(propId);
          break;
        case DescValueType.RAWTYPE:
          val.value = desc.getData(propId); break;
        case DescValueType.REFERENCETYPE:
          val.value = desc.getReference(propId); break;
        case DescValueType.STRINGTYPE:
          val.value = desc.getString(propId); break;
        case DescValueType.UNITDOUBLE:
          val.value = desc.getUnitDoubleValue(propId);
          val.type = desc.getUnitDoubleType(propId);
          break;
      }
    }
    return val;
  }

  if (obj == undefined) {
    Error.runtimeError(2, "object");
  }
  if (prop == undefined) {
    Error.runtimeError(2, "property");
  }

  if (prop.constructor == String) {
    propId = xTID(prop);
  } else if (prop.constructor == Number) {
    propId = prop;
  } else {
    Error.runtimeError(19, "property");
  }

  var val; // {value: undefind, type: undefined}

  //$.level = 1; debugger;

  if (app.documents.length > 0) {
    var o_doc = app.activeDocument;   // active doc before this function
    var o_layer = o_doc.activeLayer;  // active layer before this function
  }

  if (typeof(obj) == "object") {
    if (typ == "Dcmn" || obj.typename == "Document") {
      otyp = "Dcmn";
      if (app.activeDocument != obj) {
        o_doc = app.activeDocument;
        app.activeDocument = obj;
      }

    } else if (typ == "Lyr " || obj.typename == "ArtLayer"
               || obj.typename == "LayerSet") {
      otyp = "Lyr ";
      var layer = obj;
      while(layer.parent != undefined &&
            layer.parent.typename != "Document") {
        layer = layer.parent;
      }
      if (app.activeDocument != layer.parent) {
        app.activeDocument = layer.parent;
      }
      if (layer.parent.activeLayer != obj) {
        layer.parent.activeLayer = obj;
      }

    } else if (typ == "capp" || obj.typename == "Application") {
      otyp = "capp";

    } else {
      Error.runtimeError(55, prop);
//       throw ("Unable to get property from " +
//              (obj.typename ? obj.typename : "unknown") +
//              " type of object.");
    }
  } else if (typeof(obj) == "number") {
    if (!typ) {
      Error.runtimeError(55, prop);
//       throw ("Unable to get property from unknown type of object");
    }
    if (typ != "Lyr " && typ != "Dcmn") {
      Error.runtimeError(9001,
                         "Indexed app operations are not yet supported.");
    }
    otyp = typ;
  }

  var val = _ftn(obj, propId, otyp);

  if (app.documents.length > 0) {
    if (o_doc.activeLayer != o_layer) {
      o_doc.activeLayer = o_layer;
    }
    if (app.activeDocument != o_doc) {
      app.activeDocument = o_doc;
    }
  }

  return val;
};

Stdlib.getLayerProperty = function(index, propSym) {
  return Stdlib.getObjectProperty(index, propSym, 'Lyr ');
};
Stdlib.getDocumentProperty = function(index, propSym) {
  return Stdlib.getObjectProperty(index, propSym, 'Dcmn');
};
Stdlib.getApplicationProperty = function(propSym) {
  return Stdlib.getObjectProperty(app, propSym);
};

//
// Duplicate an existing document and use the name specified.
// Optionally merge the layers
//
Stdlib.duplicateDocument = function(doc, name, merged) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Dcmn"), cTID("Ordn"), cTID("Trgt"));
    desc.putReference(cTID("null"), ref );

    if (name) {
      desc.putString(cTID("Nm  "), name);
    }
    if (merged == true) {
      desc.putBoolean(cTID("Mrgd"), true);
    }
    executeAction(cTID("Dplc"), desc, DialogModes.NO );
    return app.activeDocument;
  }

  return Stdlib.wrapLC(doc, _ftn);
};

Stdlib.getDocumentDescriptor = function(doc) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated( cTID("Dcmn"),
                       cTID("Ordn"),
                       cTID("Trgt") );  //activeDoc
    return executeActionGet(ref);
  }

  return Stdlib.wrapLC(doc, _ftn);
};

Stdlib.getDocumentIndex = function(doc) {
  return Stdlib.getDocumentProperty(doc, cTID('ItmI'));
};


Stdlib.isDocumentNew = function(doc){
  var desc = Stdlib.getDocumentDescriptor(doc);
  var rc = true;
  if (desc.hasKey(cTID("FilR"))) {  //FileReference
    var path = desc.getPath(cTID("FilR"));
    if (path) {
      rc = (path.absoluteURI.length == 0);
    }
  }
  return rc;
};

Stdlib.hasBackground = function(doc) {
   return doc.layers[doc.layers.length-1].isBackgroundLayer;

//   // Mike Hale's version...
//   function _ftn() {
//     var ref = new ActionReference();
//     ref.putProperty(cTID("Prpr"), cTID("Bckg"));
//     //bottom Layer/background
//     ref.putEnumerated(cTID("Lyr "),cTID("Ordn"),cTID("Back"));
//     var desc =  executeActionGet(ref);
//     var res = desc.getBoolean(cTID("Bckg"));
//     return res;
//   };

//   return Stdlib.wrapLC(doc, _ftn);


//   // or
//   try {
//     doc.backgroundLayer;
//     return true;
//   } catch (e) {
//     return false;
//   }
};
Stdlib.hasBackgroundLayer = Stdlib.hasBackground;

//
// Returns true if the file is an open document
//
Stdlib.isDocumentOpen = function(file) {
  if (file && (app.documents.length > 0)) {
    var doc = Stdlib.getByName(app.documents, file.name);
    if (doc) {
      return file == doc.fullName;
    }
  }
  return false;
};

Stdlib.getDocumentName = function(doc) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putProperty(cTID('Prpr'), cTID('FilR'));
    ref.putEnumerated(cTID('Dcmn'), cTID('Ordn'), cTID('Trgt'));
    var desc = executeActionGet(ref);
    return desc.hasKey(cTID('FilR')) ? desc.getPath(cTID('FilR')) : undefined;
  }
  return Stdlib.wrapLC(doc, _ftn);
};
Stdlib.getDocumentFile = function(doc) {
  return Stdlib.getDocumentName(doc);
};

//
// Revert the document, or active document if one isn't specified
//
Stdlib.revertDocument = function(doc) {
  Stdlib.doEvent(doc, "Rvrt");
};

Stdlib.isLandscapeMode = function(obj) {
  var ru = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  var rc = obj.width.value > obj.height.value;
  app.preferences.rulerUnits = ru;
  return rc;
};
Stdlib.isPortraitMode = function(obj) {
  var ru = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  var rc = obj.width.value < obj.height.value;
  app.preferences.rulerUnits = ru;
  return rc;
};
Stdlib.isSquareMode = function(obj) {
  var ru = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  var rc = obj.width.value == obj.height.value;
  app.preferences.rulerUnits = ru;
  return rc;
};

Stdlib.validateUnitValue = function(str, bu, ru) {
  var self = this;

  if (str instanceof UnitValue) {
    return str;
  }

  if (bu && bu instanceof Document) {
    var doc = bu;
    ru = doc.width.type;
    bu = UnitValue(1/doc.resolution, ru);

  } else {
    if (!ru) {
      ru = Stdlib.getDefaultRulerUnitsString();
    }
    if (!bu) {
      UnitValue.baseUnit = UnitValue(1/72, ru);
    }
  }
  str = str.toString().toLowerCase();

  var zero = new UnitValue("0 " + ru);
  var un = zero;
  if (!str.match(/[a-z%]+/)) {
    str += ' ' + ru.units;
  }
  un = new UnitValue(str);

  if (isNaN(un.value) || un.type == '?') {
    return undefined;
  }

  if (un.value == 0) {
    un = zero;
  }

  return un;
};

//
// Pops open a standard File Open Dialog and returns a Document or
// null if none is selected
// This is primarily for PS7 which does not have File.openDialog
//
Stdlib.openDialogPS7 = function(folder) {
  return Stdlib.selectImageFile(folder);
}

//
// selectImageFile will open a dialog on the folder it chooses,
// totally ignoring the default.
//
Stdlib.selectImageFile = function(file) {
  var ad;
  var doc = undefined;

  if (documents.length) {
    ad = app.activeDocument;
  }

  if (!file) {
    file = Folder.current;
  } else {
    file = Stdlib.convertFptr(file);
    if (!file.exists) {
      file = file.parent;
    }
  }
  if (file instanceof Folder) {
    var files = Stdlib.getImageFiles(file, false, true);
    if (files.length > 0) {
      file = files[0];
    } else {
      file = new File(file + "/untitled.psd");
    }
  }

  try {
    var desc = new ActionDescriptor();
    Folder.current = file.parent;
    desc.putPath( cTID('null'), file);
    executeAction(cTID("Opn "), desc, DialogModes.ALL);

  } catch (e) {
    throw e;
  }

  if (ad != app.activeDocument) {
    doc = app.activeDocument;
  }

  return doc;
};

//
// Paste the contents of the clipboard into the doc with antialias off
//
Stdlib.pasteInto = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();   // AntiAlias
    desc.putEnumerated(cTID("AntA"), cTID("Annt"), cTID("Anno"));
    executeAction(cTID("PstI"), desc, DialogModes.NO);
  }
  Stdlib.wrapLC(doc, _ftn);
};


//
// Make it a Document object method
//
// Document.prototype.revert = function() {
//   Stdlib.revertDocument(this);
// };

//============================= History  ===============================
//
// Thanks to Andrew Hall for the idea
// Added named snapshot support
//
Stdlib.takeSnapshot = function(doc, sname) {
  function _ftn() {
    var desc = new ActionDescriptor();  // Make

    var sref = new ActionReference();   // Snapshot
    sref.putClass(cTID("SnpS"));
    desc.putReference(cTID("null"), sref);

    var fref = new ActionReference();    // Current History State
    fref.putProperty(cTID("HstS"), cTID("CrnH"));
    desc.putReference(cTID("From"), fref );

    if (sname) {                         // Named snapshot
      desc.putString(cTID("Nm  "), sname);
    }

    desc.putEnumerated(cTID("Usng"), cTID("HstS"), cTID("FllD"));
    executeAction(cTID("Mk  "), desc, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};

//
// Revert to named snapshot
//
Stdlib.revertToSnapshot = function(doc, sname) {
  function _ftn() {
    if (!sname) {
      return Stdlib.revertToLastSnapshot(doc);
    }
    var state = Stdlib.getByName(doc.historyStates, sname);
    if (state) {
      doc.activeHistoryState = state;
      return true;
    }
    return false;
  }
  return Stdlib.wrapLC(doc, _ftn);
};

//
// Revert to the last auto-named snapshot
//
Stdlib.revertToLastSnapshot = function(doc) {
  function _ftn() {
    var states = Stdlib.getByName(doc.historyStates, /^Snapshot /, true);
    if (states.length > 0) {
      doc.activeHistoryState = states.pop();
      return true;
    }
    return false;
  }
  return Stdlib.wrapLC(doc, _ftn);
};

Stdlib.deleteSnapshot = function(doc, name) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putName(cTID('SnpS'), name);
    desc.putReference(cTID('null'), ref);
    executeAction(cTID('Dlt '), desc, DialogModes.NO );
  }
  return Stdlib.wrapLC(doc, _ftn);

//   function _deleteCurrent() {
//     var ref = new ActionReference();
//     ref.putProperty(cTID("HstS"), cTID("CrnH"));

//     var desc = new ActionDescriptor();
//     desc.putReference(cTID("null"), ref );
//     executeAction(cTID("Dlt "), desc, DialogModes.NO );
//   };

//   var state = doc.activeHistoryState;
//   if (!Stdlib.revertToSnapshot(doc, name)) {
//     return false;
//   }
//   try {
//     _deleteCurrent(doc, name);
//   } finally {
//     var level = $.level;
//     try {
//       $.level = 0;
//       doc.activeHistoryState = state;
//     } catch (e) {
//     }
//     $.level = level;
//   }
//   return true;
};

Stdlib.hist = function(dir) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID("HstS"), cTID("Ordn"), cTID(dir));
    desc.putReference(cTID("null"), ref);
    executeAction(cTID("slct"), desc, DialogModes.NO);
  }

  _ftn();
};
Stdlib.undo = function () {
  Stdlib.hist("Prvs");
};
Stdlib.redo = function () {
  Stdlib.hist("Nxt ");
};
Stdlib.Undo = function () {
  Stdlib.doEvent("undo");
};
Stdlib.Redo = function () {
  Stdlib.doEvent(sTID('redo'));
};


// Makes separate suspendHistory entries undoable (^Z)
Stdlib.suspendHistory = function (doc, name, ftn ) {
   doc.suspendHistory(name, ftn);
   app.activeDocument = app.activeDocument; // NOP
};

Stdlib.NOP = function() {
  try { app.activeDocument = app.activeDocument; } catch (e) { }
};

//
//================================== Layers ===================================
//
Stdlib.convertTextLayerToShape = function(doc, layer) {
  function _ftn() {
    if (layer.kind != LayerKind.TEXT) {
      Error.runtimeError(8177);  // Layer is not a text layer
//       throw "Cannot convert non-text layers to shapes.";
    }

    var desc = new ActionDescriptor();
    var cref = new ActionReference();
    cref.putClass( sTID('contentLayer') );
    desc.putReference( cTID('null'), cref );
    var lref = new ActionReference();
    lref.putEnumerated( cTID('TxLr'), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('Usng'), lref );
    executeAction( cTID('Mk  '), desc, DialogModes.NO );
  }
  Stdlib.makeActive(doc);
  Stdlib.makeActive(layer);
  _ftn();
  return doc.activeLayer;
};
Stdlib.copyLayerToDocument = function(doc, layer, otherDoc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var fref = new ActionReference();
    fref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    desc.putReference(cTID('null'), fref);
    var tref = new ActionReference();
    tref.putIndex(cTID('Dcmn'), Stdlib.getDocumentIndex(otherDoc));
    // tref.putName(cTID('Dcmn'), otherDoc.name);
    desc.putReference(cTID('T   '), tref);
    desc.putInteger(cTID('Vrsn'), 2 );
    executeAction(cTID('Dplc'), desc, DialogModes.NO);
  };

  if (layer) {
    Stdlib.wrapLCLayer(doc, layer, _ftn);
  } else {
    Stdlib.wrapLC(doc, _ftn);
  }
};

Stdlib.convertToSmartLayer = function(doc, layer) {
  function _ftn() {
    Stdlib.doEvent(sTID('newPlacedLayer'));
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.getSmartObjectType = function(doc, layer) {

  function _ftn() {
    var type = undefined;
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), sTID('Trgt') );
    var desc = executeActionGet(ref);
    if (desc.hasKey(sTID('smartObject'))) {// is smart object?
      var desc = executeActionGet(ref);
      var smObj = desc.getObjectValue(sTID('smartObject'));
      var place = smObj.getEnumerationValue(sTID('placed'));
      type = id2char(place, "Enum");
    }

    return type;
  }

  var typ = Stdlib.wrapLCLayer(doc, layer, _ftn);

  return typ;
};

Stdlib.getSmartObjectFile = function(doc, layer) {

  function _ftn() {
    var file = undefined;
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), sTID('Trgt') );
    var desc = executeActionGet(ref);
    if (desc.hasKey(sTID('smartObject'))) {// is smart object?
      var smObj = desc.getObjectValue(sTID('smartObject'));
      file = smObj.getString(sTID('FilR'));
    }
    return file;
  }

  var file = Stdlib.wrapLCLayer(doc, layer, _ftn);

  return file;
};


Stdlib.editSmartObject = function(doc, layer) {
  function _ftn() {
    var id21 = sTID( "placedLayerEditContents" );
    var desc7 = new ActionDescriptor();
    executeAction( id21, desc7, DialogModes.NO );
  }
  Stdlib.makeActive(doc);
  Stdlib.makeActive(layer);
  _ftn();
  return app.activeDocument;
};

Stdlib.updateSmartLayer = function(doc, layer) {
  function _ftn() {
    executeAction(sTID('updatePlacedLayer'), undefined, DialogModes.NO);
  };

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.replaceSmartLayerContents = function(doc, layer, file) {
  function _ftn() {
    var fptr = Stdlib.convertFptr(file);
    var desc = new ActionDescriptor();
    desc.putPath(cTID('null'), fptr);
    executeAction(sTID('placedLayerReplaceContents'), desc, DialogModes.NO);
  };

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.exportSmartLayer = function(doc, layer, file) {

  file = Stdlib.convertFptr(file);
  file.remove();

  function _ftn() {
    var dialogMode = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;
    try {
      var desc22 = new ActionDescriptor();
      desc22.putPath( cTID('null'), file);
      executeAction( sTID('placedLayerExportContents'), desc22, DialogModes.NO );
    } finally {
      app.displayDialogs = dialogMode;
    }
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};



//
// Traverse the all layers, including nested layers, executing
// the specified function. Traversal can happen in both directions.
//
Stdlib.traverseLayers = function(doc, ftn, reverse, layerSets) {

  function _traverse(doc, layers, ftn, reverse, layerSets) {
    var ok = true;
    for (var i = 1; i <= layers.length && ok != false; i++) {
      var index = (reverse == true) ? layers.length-i : i - 1;
      var layer = layers[index];

      if (layer.typename == "LayerSet") {
        if (layerSets) {
          ok = ftn(doc, layer);
        }
        if (ok) {
          ok = _traverse(doc, layer.layers, ftn, reverse, layerSets);
        }
      } else {
        ok = ftn(doc, layer);
        try {
          if (app.activeDocument != doc) {
            app.activeDocument = doc;
          }
        } catch (e) {
        }
      }
    }
    return ok;
  };

  return _traverse(doc, doc.layers, ftn, reverse, layerSets);
};

Stdlib.getLayersList = function(doc, reverse, layerSets) {
  function _ftn(doc, layer) {
    _ftn.list.push(layer);
    return true;
  };

  _ftn.list = [];
  Stdlib.traverseLayers(doc, _ftn, reverse, layerSets);

  var lst = _ftn.list;
  _ftn.list = undefined;
  return lst;
};

Stdlib.getVisibleLayers = function(doc) {
  var layers = Stdlib.getLayersList(doc);
  return Stdlib.getByProperty(layers, "visible", true, true);
};

Stdlib._setSelLayerVis = function(doc, state) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var list = new ActionList();
    var ref = new ActionReference();

    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    list.putReference(ref);
    desc.putList(cTID('null'),  list);

    executeAction(cTID(state), desc, DialogModes.NO);
  }
  Stdlib.wrapLC(doc, _ftn);
};
Stdlib.hideSelectedLayers = function(doc) {
  Stdlib._setSelectLayerVis(doc, 'Hd  ');
};
Stdlib.showSelectedLayers = function(doc) {
  Stdlib._setSelectLayerVis(doc, 'Shw ');
};

Stdlib._setOtherLayerVis = function(doc, layer, state) {
  function _extendLayerSelectionToIndex(doc, index) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putIndex(cTID('Lyr '), index);
    desc.putReference(cTID('null'), ref);
    desc.putEnumerated(sTID('selectionModifier'),
                       sTID('selectionModifierType'),
                       sTID('addToSelectionContinuous'));
    desc.putBoolean(cTID('MkVs'), false);
    executeAction(cTID('slct'), desc, DialogModes.NO);
  };

  var top = doc.layers[0];
  var lvis = layer.visible;
  var lidx = Stdlib.getLayerIndex(doc, layer);
  var bottom = doc.layers[doc.layers.length-1];

  doc.activeLayer = top;
  var bidx = Stdlib.getLayerIndex(doc, bottom);
  _extendLayerSelectionToIndex(doc, bidx);
  Stdlib._setSelLayerVis(doc, state);
  Stdlib.selectLayerByIndex(doc, lidx);
  layer.visible = lvis;
};

Stdlib.showOtherLayers = function(doc, layer) {
  Stdlib._setOtherLayerVis(doc, layer, 'Shw ');
};

Stdlib.hideOtherLayers = function(doc, layer) {
  Stdlib._setOtherLayerVis(doc, layer, 'Hd  ');
};


Stdlib.findLayer = function(doc, layerName) {
  function _findLayer(doc, layer) {
    if (_findLayer.matchFtn(layer.name, _findLayer.layerName)) {
      _findLayer.layer = layer;
      return false;
    }
    return true;
  }

  var matchFtn;

  if (layerName instanceof RegExp) {
    matchFtn = function(s1, re) { return s1.match(re) != null; };
  } else {
    matchFtn = function(s1, s2) { return s1 == s2;  };
  }

  _findLayer.matchFtn = matchFtn;
  _findLayer.layerName = layerName;
  Stdlib.traverseLayers(doc, _findLayer, false, true);
  return _findLayer.layer;
};


// Ex: layers = Stdlib.findLayerByProperty(doc, "visible", true, true);
Stdlib.findLayerByProperty = function(doc, prop, val, all) {

  function _findLayer(doc, layer) {
    if (_findLayer.matchFtn(layer[_findLayer.property], _findLayer.value)) {

      if (_findLayer.all) {
        _findLayer.result.push(layer);
        return true;

      } else {
        _findLayer.result = layer;
        return false;
      }
    }
    return true;
  }

  var _matchFtn;

  if (val instanceof RegExp) {
    _matchFtn = function(s1, re) { return s1.match(re) != null; };
  } else {
    _matchFtn = function(s1, s2) { return s1 == s2;  };
  }

  _findLayer.matchFtn = _matchFtn;
  _findLayer.property = prop;
  _findLayer.value = val;
  _findLayer.all = all;
  if (all) {
    _findLayer.result = [];
  }

  Stdlib.traverseLayers(doc, _findLayer, false, true);
  return _findLayer.result;
};


Stdlib.isLayerEmpty = function(doc, layer) {
  if (!doc) {
    doc = app.activeDocument;
  }
  if (!layer) {
    layer = doc.activeLayer;
  }

  return layer.bounds.toString().replace(/\D|0/g,"") == '';
};

Stdlib.mergeVisible = function(doc) {
  Stdlib.doEvent(doc, "MrgV");  // "MergeVisible"
};

Stdlib.mergeLayers = function(doc, layers) {
  if (layers) {
    Stdlib.selectLayers(doc, layers);
  }
  Stdlib.doEvent(doc, "Mrg2");  // "MergeLayers"
}

Stdlib.previousLayer = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Bckw') );
    desc.putReference( cTID('null'), ref );
    desc.putBoolean( cTID('MkVs'), false );
    executeAction( cTID('slct'), desc, DialogModes.NO );
  }
  var layer = doc.activeLayer;
  try {
    var lvl = $.level;
    $.level = 0;
    var idx = Stdlib.getActiveLayerIndex(doc);
    Stdlib.wrapLC(doc, _ftn);
    var idx2 = Stdlib.getActiveLayerIndex(doc);

    if (idx2 > idx) {
      layer = doc.activeLayer;
    } else {
      doc.activeLayer = layer;
      layer = undefined;
    }

  } catch (e) {

  } finally {
   $.level = lvl;
   delete lvl;
  }
  return layer;
};

Stdlib.nextLayer = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Frwr') );
    desc.putReference( cTID('null'), ref );
    desc.putBoolean( cTID('MkVs'), false );
    executeAction( cTID('slct'), desc, DialogModes.NO );
  }
  var layer = doc.activeLayer;
  try {
    var lvl = $.level;
    $.level = 0;
    var idx = Stdlib.getActiveLayerIndex(doc);
    Stdlib.wrapLC(doc, _ftn);
    var idx2 = Stdlib.getActiveLayerIndex(doc);

    if (idx2 > idx) {
      layer = doc.activeLayer;
    } else {
      doc.activeLayer = layer;
      layer = undefined;
    }

  } catch (e) {
    //$.level = 1; debugger;

  } finally {
   $.level = lvl;
   delete lvl;
  }
  return layer;
};


//
// Copy the styles from the current layer into the styles clipboard
//
Stdlib.copyStyles = function(doc, ignoreError) {
  if (ignoreError == true) {
    var lvl = $.level;
    $.level = 0;
    var rc = false;
    try {
      Stdlib.doEvent(doc, "CpFX"); // "CopyEffects";
      rc = true;
    } catch (e) {}

    $.level = lvl;
    return rc;

  } else if (typeof ignoreError == "object") { // it's probably a layer
    Stdlib.copyEffects(doc, ignoreError);
    return true;
  } else {
    Stdlib.doEvent(doc, "CpFX"); // "CopyEffects";
    return true;
  }
};

//
// Paste the styles from the styles clipboard into the current layer
//
Stdlib.pasteStyles = function(doc, layer, ignoreError) {
  if (ignoreError == true) {
    var lvl = $.level;
    $.level = 0;
    var rc = false;
    try {
      Stdlib.pasteStyles(doc, layer, false);
      rc = true;
    }
    catch (e) {}
    $.level = lvl;
    return rc;

  } else {
    var prev;
    if (layer) {
      prev = Stdlib.makeActive(layer);
    }
    Stdlib.doEvent(doc, "PaFX"); // "PasteEffects";
    if (prev) {
      Stdlib.makeActive(prev);
    }
  }
};

Stdlib.hasEffects = function(doc, layer) {
  var hasEffects = true;
  var lvl = $.level;
  try {
    $.level = 0;
    Stdlib.copyEffects(doc, layer);
  } catch (e) {
    hasEffects = false;
  } finally {
    $.level = lvl;
  }
  return hasEffects;
};
Stdlib.hasLayerStyles = Stdlib.hasEffects;

Stdlib.clearEffects = function(doc, layer) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    executeAction( sTID('disableLayerStyle'), desc, DialogModes.NO );
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.clearLayerStyles = Stdlib.clearEffects;

Stdlib.copyEffects = function(doc, layer) {
  var prev;
  if (layer) {
    prev = Stdlib.makeActive(layer);
  }
  Stdlib.doEvent(doc, "CpFX"); // "CopyEffects";
  if (prev) {
    Stdlib.makeActive(prev);
  }
};
Stdlib.pasteEffects = function(doc, layer) {
  var prev;
  if (layer) {
    prev = Stdlib.makeActive(layer);
  }
  Stdlib.doEvent(doc, "PaFX"); // "PasteEffects";
  if (prev) {
    Stdlib.makeActive(prev);
  }
};
Stdlib._setEffectsViz = function(doc, layer, id) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var list = new ActionList();
    var ref = new ActionReference();
    ref.putClass(cTID('Lefx'));
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    list.putReference(ref);
    desc.putList(cTID('null'), list);
    executeAction(cTID(id), desc, DialogModes.NO);
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.hideLayerEffects = function(doc, layer) {
  Stdlib._setEffectsViz(doc, layer, 'Hd  ');
};
Stdlib.hideLayerStyles = Stdlib.hideEffects = Stdlib.hideLayerEffects;
Stdlib.showLayerEffects = function(doc, layer) {
  Stdlib._setEffectsViz(doc, layer, 'Shw ');
};
Stdlib.showLayerStyles = Stdlib.showEffects = Stdlib.showLayerEffects;

//
// Stdlib.layerEffectsVisible(doc, doc.activeLayer);
//
Stdlib.layerEffectsVisible = function(doc, layer) {
  var al = doc.activeLayer;
  if (al != layer) {
    doc.activeLayer = layer;
  }
  var desc = Stdlib.getLayerDescriptor(doc, layer);
  var id = cTID('lfxv');
  var visible = desc.hasKey(id) && desc.getBoolean(id);

  if (al != layer) {
    doc.activeLayer = al;
  }

  return visible;
};

Stdlib.applyLayerStyleInteractive = function(doc, layer, ldesc) {
  return Stdlib.applyLayerStyle(doc, layer, ldesc, true);
};

Stdlib.applyLayerStyle = function(doc, layer, ldesc, interactive) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putProperty(cTID('Prpr'), cTID('Lefx') );
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference(cTID('null'), ref);

    if (!ldesc) {
      ldesc = new ActionDescriptor();
    }
    desc.putObject(cTID('T   '), cTID('Lefx'), ldesc);

    var xdesc = undefined;
    var mode = (interactive ? DialogModes.ALL : DialogModes.NO);
    try {
      xdesc = executeAction(cTID('setd'), desc, mode);
    } catch (e) {
      if (e.number != 8007) { // if not "User cancelled"
        throw e;
      }
    }
    return xdesc;
  }

  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};



//
// Create a new document from the specified layer with the given name
//
Stdlib.makeDocFromLayer = function(doc, layer, docName) {
  function _ftn() {
    var desc = new ActionDescriptor();     // Make

    var dref = new ActionReference();      // Document
    dref.putClass(cTID("Dcmn"));
    desc.putReference(cTID("null"), dref);

    desc.putString(cTID("Nm  "), docName);  // Name

    var lref = new ActionReference();       // Layer
    lref.putName( cTID("Lyr "), layer.name);
    desc.putReference(cTID("Usng"), lref);

    executeAction(cTID("Mk  "), desc, DialogModes.NO);
  }

  // wrapLC is not used because we want to return the new
  // document from this function
  if (doc) {
    app.activeDocument = doc;
  } else {
    doc = app.activeDocument;
  }
  if (layer) {
    doc.activeLayer = layer;
  } else {
    layer = doc.activeLayer;
  }
  _ftn();
  return app.activeDocument;
};

Stdlib.getDocumentFromLayer = function(layer) {
  while(layer.parent != undefined && layer.parent.typename != "Document") {
    layer = layer.parent;
  }
  return layer.parent;
};

// from discussions with Mike Hale
Stdlib.hasLayerMask = function(doc, layer) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    var desc = executeActionGet(ref);
    return desc.hasKey(cTID("UsrM"));
  }
  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};


//
// Remove the mask from the layer. Apply the mask if 'apply' is true
//
Stdlib.removeLayerMask = function(doc, layer, apply) {
  function _ftn() {
    var desc = new ActionDescriptor();     // Delete

    var ref = new ActionReference();       // Mask Channel
    ref.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
    desc.putReference(cTID("null"), ref);

    apply = (apply == true);
    desc.putBoolean(cTID("Aply"), apply);  // Apply Mask

    executeAction(cTID("Dlt "), desc, DialogModes.NO);
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.removeMask = Stdlib.removeLayerMask;  // backwards compatibility

Stdlib.applyLayerMask = function(doc, layer) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Chnl'), cTID('Ordn'), cTID('Trgt') );

    var desc = new ActionDescriptor();
    desc.putReference( cTID('null'), ref );
    desc.putBoolean( cTID('Aply'), true );

    executeAction( cTID('Dlt '), desc, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.selectLayerMask = function(doc, layer) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();

    ref.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
    desc.putReference(cTID("null"), ref);
    desc.putBoolean(cTID("MkVs"), false );
    executeAction(cTID("slct"), desc, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.selectLayerMaskEdit = function(doc, layer) {
  function _ftn() {
    var desc11 = new ActionDescriptor();
        var ref8 = new ActionReference();
        ref8.putEnumerated( cTID('Chnl'), cTID('Ordn'), cTID('Trgt') );
    desc11.putReference( cTID('null'), ref8 );
    desc11.putBoolean( cTID('MkVs'), true );
    executeAction( cTID('slct'), desc11, DialogModes.NO );
  };
  Stdlib.selectLayerMask(doc, layer);
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.selectFilterMask = function(doc, layer) {
  function _ftn() {
    var desc273 = new ActionDescriptor();
        var ref215 = new ActionReference();
        ref215.putEnumerated( cTID('Chnl'), cTID('Chnl'), sTID('filterMask') );
    desc273.putReference( cTID('null'), ref215 );
    desc273.putBoolean( cTID('MkVs'), false );
    executeAction( cTID('slct'), desc273, DialogModes.NO );
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.selectFilterMaskEdit = function(doc, layer) {
  function _ftn() {
    var desc273 = new ActionDescriptor();
        var ref215 = new ActionReference();
        ref215.putEnumerated( cTID('Chnl'), cTID('Chnl'), sTID('filterMask') );
    desc273.putReference( cTID('null'), ref215 );
    desc273.putBoolean( cTID('MkVs'), true );
    executeAction( cTID('slct'), desc273, DialogModes.NO );
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};


Stdlib.createLayerMask = function(doc, layer, fromSelection) {
  function _ftn() {
    var desc = new ActionDescriptor();
    desc.putClass(cTID("Nw  "), cTID("Chnl"));
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
    desc.putReference(cTID("At  "), ref);
    if (fromSelection == true) {
      desc.putEnumerated(cTID("Usng"), cTID("UsrM"), cTID("RvlS"));
    } else {
      desc.putEnumerated(cTID("Usng"), cTID("UsrM"), cTID("RvlA"));
    }
    executeAction(cTID("Mk  "), desc, DialogModes.NO);
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.isLayerMaskEnabled = function(doc, layer) {
  var desc = Stdlib.getLayerDescriptor(doc, layer);
  return (desc.hasKey(cTID("UsrM")) && desc.getBoolean(cTID("UsrM")));
};

Stdlib.disableLayerMask = function(doc, layer) {
  Stdlib.setLayerMaskEnabledState(doc, layer, false);
};
Stdlib.enableLayerMask = function(doc, layer) {
  Stdlib.setLayerMaskEnabledState(doc, layer, true);
};
Stdlib.setLayerMaskEnabledState = function(doc, layer, state) {
  function _ftn() {
    var desc = new ActionDescriptor();

    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    desc.putReference(cTID('null'), ref );

    var tdesc = new ActionDescriptor();
    tdesc.putBoolean(cTID('UsrM'), state);
    desc.putObject(cTID('T   '), cTID('Lyr '), tdesc);

    executeAction(cTID('setd'), desc, DialogModes.NO );
  }
  if (state == undefined) {
    state = false;
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.createClippingMask = function(doc, layer) {

  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    executeAction( cTID('GrpL'), desc, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};


Stdlib.releaseClippingMask = function(doc, layer) {

  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    executeAction( cTID('Ungr'), desc, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.hasClippingMask = function(doc, layer) {
  return Stdlib.getLayerProperty(layer, 'Grup');
};

Stdlib.isClippingMask = function(doc, layer) {
  var rc = false;
  try {
    var idx = Stdlib.getLayerIndex(doc, layer);
    Stdlib.selectLayerByIndex(doc, idx+1);
    var rc = Stdlib.getLayerProperty(doc.activeLayer, 'Grup');
    doc.activeLayer = layer;
  } catch (e) {
  }

  return rc;
};

Stdlib.rotateLayer = function(doc, layer, angle) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    desc.putReference(cTID("null"), ref);
    desc.putUnitDouble(cTID("Angl"), cTID("#Ang"), angle);
    executeAction(cTID("Rtte"), desc, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.rotateLayerAround = function(doc, layer, angle, x, y) {
  angle = Number(angle);
  if (isNaN(angle)) {
    Error.runtimeError(19, "angle");  // BadArgument
  }
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    desc.putEnumerated( cTID('FTcs'), cTID('QCSt'), cTID('Qcsi') );
    var ldesc = new ActionDescriptor();
    ldesc.putUnitDouble( cTID('Hrzn'), cTID('#Pxl'), x );
    ldesc.putUnitDouble( cTID('Vrtc'), cTID('#Pxl'), y );
    desc.putObject( cTID('Pstn'), cTID('Pnt '), ldesc );
    desc.putUnitDouble( cTID('Angl'), cTID('#Ang'), angle );
    executeAction( cTID('Trnf'), desc, DialogModes.NO );
  };

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};


// Stdlib.moveLayerContent(doc, doc.activeLayer, -25, -25);
Stdlib.moveLayerContent = function(doc, layer, dx, dy) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var lref = new ActionReference();
    lref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    desc.putReference(cTID("null"), lref);

    var pdesc = new ActionDescriptor();
    pdesc.putUnitDouble(cTID('Hrzn'), cTID('#Pxl'), dx);
    pdesc.putUnitDouble(cTID('Vrtc'), cTID('#Pxl'), dy);
    desc.putObject(cTID('T   '), cTID('Ofst'), pdesc);
    executeAction(cTID('move'), desc, DialogModes.NO);
  }

  if (layer) {
    // var idx = Stdlib.getLayerIndex(doc, layer);
    // Stdlib.moveLayerContentByIndex(doc, idx, dx, dy);

    Stdlib.wrapLCLayer(doc, layer, _ftn);
  } else {
    Stdlib.wrapLC(doc, _ftn);
  }
};

Stdlib.moveLayerContentByIndex = function(doc, idx, dx, dy) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putIndex(cTID('Lyr '), idx);
    desc.putReference(cTID('null'), ref );
    var pdesc = new ActionDescriptor();
    pdesc.putUnitDouble(cTID('Hrzn'), cTID('#Pxl'), dx);
    pdesc.putUnitDouble(cTID('Vrtc'), cTID('#Pxl'), dy);
    desc.putObject(cTID('T   '), cTID('Ofst'), pdesc);
    executeAction(cTID('move'), desc, DialogModes.NO);
  }

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.freeTransform = function(doc, layer) {
//   Stdlib.doMenuItem(PSEnum.FreeTransform, true);
  Stdlib.doMenuItem(cTID("FrTr"), true);
};

Stdlib.transformScale = function(doc, layer, linked) {
  //   doc.activeLayer = layer;
  //   Stdlib.doMenuItem(cTID("Scl "), true);
  function _ftn() {
    var desc = new ActionDescriptor();
    var lref = new ActionReference();
    lref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    desc.putReference(cTID("null"), lref);
    desc.putEnumerated(cTID("FTcs"), cTID("QCSt"), cTID("Qcsa"));
    if (linked == true) {
      desc.putBoolean(cTID("Lnkd"), true );
    }

    var lvl = $.level;
    $.level = 0;
    try {
      executeAction(cTID("Trnf"), desc, DialogModes.ALL);
    } catch (e) {
      $.level = lvl;
      if (e.number != 8007) { // if not "User cancelled"
        throw e;
      }
    }
    $.level = lvl;
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

// Based on code from SzopeN
Stdlib.transformScaleEx = function(doc, layer, linked) {
  function _ftn() {
    var state = true;
    function _moveDesc(dx, dy) {
      var desc = new ActionDescriptor();
      var lref = new ActionReference();
      lref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));

      desc.putReference(cTID("null"), lref);
      desc.putEnumerated(cTID("FTcs"), cTID("QCSt"), cTID("Qcsa"));
      var desc75 = new ActionDescriptor();
        desc75.putUnitDouble( cTID('Hrzn'), cTID('#Pxl'), dx );
        desc75.putUnitDouble( cTID('Vrtc'), cTID('#Pxl'), dy );
      desc.putObject( cTID('Ofst'), cTID('Ofst'), desc75 );
      return desc;
    }

    executeAction(cTID("Trnf"), _moveDesc(1, 1), DialogModes.NO);

    var desc = _moveDesc(-1, -1);
    var lvl = $.level;
    $.level = 0;
    try {
      executeAction(cTID("Trnf"), desc, DialogModes.ALL);

    } catch (e) {
      state = false;
      if (e.number != 8007) { // if not "User cancelled"
        throw e;
      }
      executeAction(cTID("Trnf"), desc, DialogModes.NO);
    } finally {
      $.level = lvl;
    }
    return state;
  }

  // true = OK, false = Cancel
  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};


// Stdlib.transformLayer(doc, doc.activeLayer, Stdlib.getMaskBounds(doc, doc.activeLayer))

Stdlib.getLayerBounds = function(doc, layer) {
  var ru = app.preferences.rulerUnits;

  try {
    app.preferences.rulerUnits = Units.PIXELS;

    var reenable = false;
    var st;
    if (Stdlib.hasLayerMask(doc, layer) &&
        Stdlib.isLayerMaskEnabled(doc, layer)) {
      st = doc.activeHistoryState;
      Stdlib.disableLayerMask(doc, layer);
      reenable = true;
    }

    var lbnds = layer.bounds;

    // fix this to modify the history state
    if (reenable) {
      Stdlib.enableLayerMask(doc, layer);
    }
    for (var i = 0; i < 4; i++) {
      lbnds[i] = lbnds[i].value;
    }

  } finally {
    app.preferences.rulerUnits = ru;
  }

  return lbnds;
};


// function ftn1() {
//   function cTID(s) { return app.charIDToTypeID(s); };
//   function sTID(s) { return app.stringIDToTypeID(s); };

//     var desc74 = new ActionDescriptor();
//     desc74.putEnumerated( cTID('FTcs'), cTID('QCSt'), cTID('Qcsa') );
//         var desc75 = new ActionDescriptor();
//         desc75.putUnitDouble( cTID('Hrzn'), cTID('#Pxl'), -2700.000000 );
//         desc75.putUnitDouble( cTID('Vrtc'), cTID('#Pxl'), -1350.000000 );
//     desc74.putObject( cTID('Ofst'), cTID('Ofst'), desc75 );
//     desc74.putUnitDouble( cTID('Wdth'), cTID('#Prc'), 18.181818 );
//     desc74.putUnitDouble( cTID('Hght'), cTID('#Prc'), 35.601266 );
//     executeAction( cTID('Trnf'), desc74, DialogModes.NO );
// };

Stdlib.transformLayer = function(doc, layer, bnds, orient) {
  var lbnds = Stdlib.getLayerBounds(doc, layer);

  var newW = bnds[2]-bnds[0];
  var newH = bnds[3]-bnds[1];
  var oldW = lbnds[2]-lbnds[0];
  var oldH = lbnds[3]-lbnds[1];

  var hrzn = bnds[0] - (lbnds[0] - (newW-oldW)/2);
  var vrtc = bnds[1] - (lbnds[1] - (newH-oldH)/2);

  var prc;
  var hprc;
  var vprc;

  if (!orient) {
    orient = 'both';
  }

  if (orient.toLowerCase() == 'horz') {
    vprc = hprc = (newW/oldW) * 100;
  } else if (orient == 'both') {
    hprc = (newW/oldW) * 100;
    vprc = (newH/oldH) * 100;
  } else {
    vprc = hprc = (newH/oldH) * 100;
  }

  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    desc.putEnumerated( cTID('FTcs'), cTID('QCSt'), cTID('Qcsa') );
    var ldesc = new ActionDescriptor();
    ldesc.putUnitDouble( cTID('Hrzn'), cTID('#Pxl'), hrzn );
    ldesc.putUnitDouble( cTID('Vrtc'), cTID('#Pxl'), vrtc );
    desc.putObject( cTID('Ofst'), cTID('Ofst'), ldesc );
    desc.putUnitDouble( cTID('Wdth'), cTID('#Prc'), hprc );
    desc.putUnitDouble( cTID('Hght'), cTID('#Prc'), vprc );
//     desc.putUnitDouble( cTID('Angl'), cTID('#Ang'), angle );
    executeAction( cTID('Trnf'), desc, DialogModes.NO );
  };

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.rasterizeLayer = function(doc, layer) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    executeAction( sTID('rasterizeLayer'), desc, DialogModes.NO );
  };
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

// Stdlib.rotateLayer = function(doc, layer, angle) {
//   angle = Number(angle);
//   if (isNaN(angle)) {
//     Error.runtimeError(19, "angle");  // BadArgument
//   }
//   function _ftn() {
//     var desc = new ActionDescriptor();
//     var ref = new ActionReference();
//     ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
//     desc.putReference( cTID('null'), ref10 );
//     desc.putEnumerated( cTID('FTcs'), cTID('QCSt'), cTID('Qcsa') );
//     var ldesc = new ActionDescriptor();
//     ldesc.putUnitDouble( cTID('Hrzn'), cTID('#Pxl'), 0 );
//     ldesc.putUnitDouble( cTID('Vrtc'), cTID('#Pxl'), 0 );
//     desc.putObject( cTID('Ofst'), cTID('Ofst'), ldesc );
//     desc.putUnitDouble( cTID('Angl'), cTID('#Ang'), angle );
//     executeAction( cTID('Trnf'), desc, DialogModes.NO );
//   };

//   Stdlib.wrapLCLayer(doc, layer, _ftn);
// };


Stdlib.convertToLayer = function(doc, layer) {
  // layer.rasterize(RasterizeType.ENTIRELAYER);
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    desc.putReference(cTID('null'), ref);
    desc.putEnumerated(cTID('What'), sTID('rasterizeItem'), sTID('placed'));
    executeAction(sTID('rasterizeLayer'), desc, DialogModes.NO);
  };
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.placeImage = function(doc, layer, file) {
  Stdlib.makeActive(doc);
  Stdlib.makeActive(layer);

  function _ftn() {
    var desc = new ActionDescriptor();
    desc.putPath( cTID('null'), file);
    desc.putEnumerated( cTID('FTcs'), cTID('QCSt'), cTID('Qcsa') );
        var ldesc = new ActionDescriptor();
        ldesc.putUnitDouble( cTID('Hrzn'), cTID('#Pxl'), 0.000000 );
        ldesc.putUnitDouble( cTID('Vrtc'), cTID('#Pxl'), 0.000000 );
    desc.putObject( cTID('Ofst'), cTID('Ofst'), ldesc );
    executeAction( cTID('Plc '), desc, DialogModes.NO );
  }

  _ftn();

  return doc.activeLayer;
};



// Stdlib.transformInteractive = function() {
//   var desc = new ActionDescriptor();
//   var ref = new ActionReference();
//   ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
//   desc.putReference( cTID('null'), ref );
//   desc.putEnumerated( cTID('FTcs'), cTID('QCSt'), cTID('Qcsa') );
//   desc.putBoolean( cTID('Lnkd'), true );
//   executeAction( cTID('Trnf'), desc, DialogModes.ALL );
// };


Stdlib.deleteAllHiddenLayers = function(doc) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), sTID("hidden"));
    var dltDesc = new ActionDescriptor();
    dltDesc.putReference(cTID("null"), ref);
    executeAction(cTID("Dlt "), dltDesc, DialogModes.NO);
  }
  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.hideAllLayers = function(doc) {
  var als = Stdlib.getLayersList(doc, false, true);
  for (var i = 0; i < als.length; i++) {
    als[i].visible = false;
  }
};
Stdlib.showAllLayers = function(doc) {
  var als = Stdlib.getLayersList(doc, false, true);
  for (var i = 0; i < als.length; i++) {
    als[i].visible = true;
  }
};


Stdlib.hideSelectedLayers = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var list = new ActionList();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    list.putReference( ref );
    desc.putList( cTID('null'), list );
    executeAction( cTID('Hd  '), desc, DialogModes.NO );
  }
  Stdlib.wrapLC(doc, _ftn);
};
Stdlib.showSelectedLayers = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var list = new ActionList();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    list.putReference( ref );
    desc.putList( cTID('null'), list );
    executeAction( cTID('Shw '), desc, DialogModes.NO );
  }
  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.newGroupFromLayers = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass( sTID('layerSection') );
    desc.putReference( cTID('null'), ref );
    var lref = new ActionReference();
    lref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('From'), lref);
    executeAction( cTID('Mk  '), desc, DialogModes.NO );
  };
  Stdlib.wrapLC(doc, _ftn);
  return doc.activeLayer;
};


Stdlib.ungroupLayers = function(doc, grp) {
  function _ftn() {
    var desc229 = new ActionDescriptor();
    var ref226 = new ActionReference();
    ref226.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc229.putReference( cTID('null'), ref226 );
    executeAction( sTID('ungroupLayersEvent'), desc229, DialogModes.NO );
  }
  Stdlib.wrapLCLayer(doc, grp, _ftn);
};


Stdlib.deleteGroup = function(doc, grp, contents) {
  function _ftn() {
    var desc48 = new ActionDescriptor();
    var ref55 = new ActionReference();
    ref55.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc48.putReference( cTID('null'), ref55 );
    desc48.putBoolean( sTID('deleteContained'), !!contents );
    executeAction( cTID('Dlt '), desc48, DialogModes.NO );
  };
  Stdlib.wrapLCLayer(doc, grp, _ftn);
};


Stdlib.getLayerNameByIndex = function(doc, idx) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), cTID( "Nm  " ));
  ref.putIndex(cTID( "Lyr " ), idx);
  return executeActionGet(ref).getString(cTID( "Nm  " ));
};
Stdlib.setLayerName = function(doc, idx, nm) {
  if (idx == 0) {
    return;
  }

  var desc = new ActionDescriptor();

  var ref = new ActionReference();
  ref.putIndex(cTID('Lyr '), idx);
  desc.putReference(cTID('null'), ref);

  var nmdesc = new ActionDescriptor();
  nmdesc.putString(cTID('Nm  '), nm);
  desc.putObject(cTID('T   '), cTID('Lyr '), nmdesc);

  if (isCS6()) {
    Stdlib.wrapLC(doc,
                  function() {
                    executeAction(cTID('setd'), desc, DialogModes.NO);
                  });
  } else {
    executeAction(cTID('setd'), desc, DialogModes.NO);
  }
};

Stdlib.getActiveLayerIndex = function(doc) {
  return Stdlib.getLayerIndex(doc, doc.activeLayer);
};
Stdlib.getActiveLayerDescriptor = function(doc) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    return executeActionGet(ref);
  }
  return Stdlib.wrapLC(doc, _ftn);
};

Stdlib.getLayerIndex = function(doc, layer, dontWrap) {
  var idx = Stdlib.getLayerProperty(layer, 'ItmI');
  return Stdlib.hasBackground(doc) ? idx-1 : idx;
};


Stdlib.getLayerID = function(doc, layer) {
  var d = Stdlib.getLayerDescriptor(doc, layer);
  return d.getInteger(cTID('LyrI'));
};


//
// returns one of:
// sTID('layerSectionStart')     Start of a layer set
// sTID('layerSectionEnd')       End of a layer set
// sTID('layerSectionConent')  A content layer
//
Stdlib.getLayerType = function(doc, layer) {
  var idx = Stdlib.getLayerIndex(doc, layer);
  return Stdlib.getLayerTypeByIndex(doc, idx);
};
Stdlib.getLayerTypeByIndex = function(doc, idx) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr") , sTID("layerSection"));
  ref.putIndex(cTID( "Lyr " ), idx);
  return executeActionGet(ref).getEnumerationValue(sTID('layerSection'));
};

Stdlib.isLayerSelected = function(doc, layer) {
  var selLayers = Stdlib.getSelectedLayers(doc, true);
  return selLayers.contains(layer);
};

Stdlib.deleteSelectedLayers = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    executeAction( cTID('Dlt '), desc, DialogModes.NO );
  };

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.selectLayer = function(doc, layer, append) {
  if (isCS()) {
    doc.activeLayer = layer;

  } else {
    Stdlib.selectLayerByIndex(doc,
                              Stdlib.getLayerIndex(doc, layer, true),
                              append);
  }
};
Stdlib.selectLayers = function(doc, layers, append) {
  var idxs = [];
  var vis = [];
  var avis = doc.activeLayer.visible;
  for (var i = 0; i < layers.length; i++) {
    var l = layers[i];
    vis[i] = l.visible;
    idxs.push(Stdlib.getLayerIndex(doc, l));
  }
  Stdlib.selectLayersByIndex(doc, idxs, append);
  for (var i = 0; i < layers.length; i++) {
    layers[i].visible = vis[i];
  }
  doc.activeLayer.visible = avis;
};
Stdlib.selectLayerByName = Stdlib.selectLayer;

// 1-based indexing
Stdlib.selectLayerByIndex = function(doc, index, append) {
  if (append) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putIndex( cTID('Lyr '), index );
    desc.putReference( cTID('null'), ref );
    desc.putEnumerated( sTID('selectionModifier'),
                        sTID('selectionModifierType'),
                        sTID('addToSelection') );
    desc.putBoolean( cTID('MkVs'), false );
    executeAction( cTID('slct'), desc, DialogModes.NO );

  } else {
    var ref = new ActionReference();
    ref.putIndex(cTID("Lyr "), index);
    var desc = new ActionDescriptor();
    desc.putReference(cTID("null"), ref );
    executeAction(cTID("slct"), desc, DialogModes.NO );
  }
};
Stdlib.selectLayersByIndex = function(doc, idxs, append) {
  if (!idxs || idxs.length == 0) {
    return;
  }
  idxs = idxs.slice(0);
  if (append != true) {
    Stdlib.selectLayerByIndex(doc, idxs.pop());
  }

  while (idxs.length) {
    Stdlib.selectLayerByIndex(doc, idxs.pop(), true);
  }
};

Stdlib.deselectLayer = function(doc, layer) {
  if (isCS()) {
    return;
  }

  Stdlib.deselectLayerByIndex(doc, Stdlib.getLayerIndex(doc, layer, true));
};

Stdlib.deselectAllLayers = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    desc.putReference(cTID('null'), ref);
    executeAction(sTID('selectNoLayers'), desc, DialogModes.NO);
  }

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.selectAllLayers = function(doc) {
  function _ftn() {
    var desc18 = new ActionDescriptor();
    var ref11 = new ActionReference();
    ref11.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc18.putReference( cTID('null'), ref11 );
    executeAction( sTID('selectAllLayers'), desc18, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};


Stdlib.deselectLayers = function(doc, layers) {
  if (isCS()) {
    return;
  }

  var idxs = [];
  var vis = [];
  for (var i = 0; i < layers.length; i++) {
    var l = layers[i];
    vis[i] = l.visible;
    idxs.push(Stdlib.getLayerIndex(doc, l));
  }
  Stdlib.deselectLayersByIndex(doc, idxs);
};

Stdlib.deselectLayerByIndex = function(doc, index) {
  if (isCS()) {
    return;
  }
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIndex(cTID('Lyr '), index);
  desc.putReference(cTID('null'), ref);
  desc.putEnumerated(sTID('selectionModifier'),
                     sTID('selectionModifierType'),
                     sTID('removeFromSelection'));
  desc.putBoolean(cTID('MkVs'), false);
  executeAction(cTID('slct'), desc, DialogModes.NO);
};
Stdlib.deselectLayersByIndex = function(doc, idxs) {
  if (isCS()) {
    return;
  }

  if (!idxs || idxs.length == 0) {
    return;
  }
  idxs = idxs.slice(0);

  while (idxs.length) {
    Stdlib.deselectLayerByIndex(doc, idxs.pop());
  }
};
Stdlib.deselectLayerByName = function(doc, name) {
  var desc151 = new ActionDescriptor();
  var ref122 = new ActionReference();
  ref122.putName( cTID('Lyr '), name );
  desc151.putReference( cTID('null'), ref122 );
  desc151.putEnumerated( sTID('selectionModifier'),
                         sTID('selectionModifierType'),
                         sTID('removeFromSelection') );
  desc151.putBoolean( cTID('MkVs'), false );
  executeAction( cTID('slct'), desc151, DialogModes.NO );
};


Stdlib.getLayerBoundsByIndex = function(doc, idx) {
  var desc = Stdlib.getLayerDescriptorByIndex(doc, idx);
  var bdesc = desc.getObjectValue(sTID('bounds'));

  var bnds = [];
  bnds.push(bdesc.getUnitDoubleValue(cTID('Left')));
  bnds.push(bdesc.getUnitDoubleValue(cTID('Top ')));
  bnds.push(bdesc.getUnitDoubleValue(cTID('Rght')));
  bnds.push(bdesc.getUnitDoubleValue(cTID('Btom')));
  return bnds;
};

Stdlib.getLayerOpacityByIndex = function(doc, idx) {
  var desc = Stdlib.getLayerDescriptorByIndex(doc, idx);
  return desc.getInteger(cTID('Opct'));
};


Stdlib.selectLayerByIdentifier = function(doc, id) {
  var ref = new ActionReference();
  ref.putIdentifier(cTID("Lyr "), id);
  var desc = new ActionDescriptor();
  desc.putReference(cTID("null"), ref );
  executeAction(cTID("slct"), desc, DialogModes.NO );
};

Stdlib.hasBG = function(doc) {
  try {
    var bgref = new ActionReference();
    bgref.putIndex(cTID("Lyr "), 0);
    executeActionGet(bgref);
    return true;
  } catch (e) {
    return false;
  }
}

// 1-based indexing...
Stdlib.getLayerDescriptorByIndex = function(doc, index) {
  var ref = new ActionReference();
  // assume that the index has already been adjusted
//   var hasBG = Stdlib.hasBackground(doc); // need something better here
//   if (hasBG) {
//     index--;
//   }

  ref.putIndex(cTID( "Lyr " ), index);
  return executeActionGet(ref);
};

Stdlib.getLayerDescriptor = function(doc, layer, dontWrap) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    return executeActionGet(ref);
  };

  if (dontWrap) {
    Stdlib.makeActive(doc);
    Stdlib.makeActive(layer);
    return _ftn();
  } else {
    return Stdlib.wrapLCLayer(doc, layer, _ftn);
  }
};

// Stdlib.getVectorMaskDescriptor(doc, layer);
Stdlib.getVectorMaskDescriptor = function(doc, layer) {
  function _ftn() {
    var ref = new ActionReference();

    ref.putEnumerated( cTID('Path'), cTID('Ordn'), sTID('vectorMask'));
    try {
      return app.executeActionGet(ref);

    } catch (e) {
      return undefined;
    }
  };

  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.getPathDescriptor = function(doc, layer, name) {
  var totalPaths = doc.pathItems.length;
  var pathCount = 0;

  var pdesc;

  if (name == "WorkPath") {
    var ref = new ActionReference();
    ref.putProperty(cTID("Path"), cTID("WrPt"));
    pdesc = app.executeActionGet(ref);

  } else {
    for (var i = 1; i <= totalPaths; i++) {
      // try normal paths
      try {
        var ref = new ActionReference();
        ref.putIndex(cTID("Path"), i);
        var desc = app.executeActionGet(ref);

        var pname = desc.getString(cTID('PthN'));
        if (pname == name) {
          pdesc = desc;
          break;
        }

      } catch (e) {
        break;
      }
    }
  }

  return pdesc;
};

Stdlib.getLayerStyleDescriptor = function(doc, layer) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    var ldesc = executeActionGet(ref);
    return ldesc.getObjectValue(sTID('layerEffects'));
  }

  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

//
// Select either the Transparency or Mask Channel
//    kind - "Trsp" or "Msk "
//
Stdlib.loadSelection = function(doc, layer, kind, invert) {
  function _ftn() {
    var desc = new ActionDescriptor();   // Set

    var cref = new ActionReference();    // Channel Selection
    cref.putProperty(cTID("Chnl"), cTID("fsel"));
    desc.putReference(cTID("null"), cref);

    var tref = new ActionReference(); // Channel Kind ("Trsp" or "Msk ")
    tref.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID(kind));
    desc.putReference(cTID("T   "), tref);
    if (invert == true) {
      desc.putBoolean(cTID("Invr"), true);
    }
    executeAction(cTID("setd"), desc, DialogModes.NO);
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.selectTransparencyChannel = function(doc, layer, invert) {
  Stdlib.loadSelection(doc, layer, "Trsp", invert);
};
Stdlib.selectMaskChannel = function(doc, layer, invert) {
  Stdlib.loadSelection(doc, layer, "Msk ", invert);
};

Stdlib.saveNamedSelection = function(doc, layer, name) {
  function _ftn() {
    var desc47 = new ActionDescriptor();
    var ref33 = new ActionReference();
    ref33.putProperty( cTID('Chnl'), cTID('fsel') );
    desc47.putReference( cTID('null'), ref33 );
    desc47.putString( cTID('Nm  '), name);
    executeAction( cTID('Dplc'), desc47, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.selectNamedSelection = function(doc, layer, name) {
  function _ftn() {
    var desc49 = new ActionDescriptor();
    var ref35 = new ActionReference();
    ref35.putName( cTID('Chnl'), name );
    desc49.putReference( cTID('null'), ref35 );
    executeAction( cTID('slct'), desc49, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.loadNamedSelection = function(doc, layer, name, invert) {
  function _ftn() {
    var desc = new ActionDescriptor();   // Set

    var cref = new ActionReference();    // Channel Selection
    cref.putProperty(cTID("Chnl"), cTID("fsel"));
    desc.putReference(cTID("null"), cref);

    var tref = new ActionReference();
    tref.putName(cTID("Chnl"), name);
    desc.putReference(cTID("T   "), tref);
    if (invert == true) {
      desc.putBoolean(cTID("Invr"), true);
    }
    executeAction(cTID("setd"), desc, DialogModes.NO);
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.deleteNamedSelection = function(doc, layer, name) {
  function _ftn() {
    Stdlib.selectNamedSelection(doc, layer, name);
    var desc43 = new ActionDescriptor();
    var ref29 = new ActionReference();
    ref29.putEnumerated( cTID('Chnl'), cTID('Ordn'), cTID('Trgt') );
    desc43.putReference( cTID('null'), ref29 );
    executeAction( cTID('Dlt '), desc43, DialogModes.NO );
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};


//
// From Mike Hale:
// After you use Stdlib (or scriptlistner) to load the transparency channel
// as a selection you will need to apply a threshold to the selection to
// remove the semi-transparent pixels from the selection.

// activeDocument.quickMaskMode = true;
//     var desc = new ActionDescriptor();
//     desc.putInteger( charIDToTypeID( "Lvl " ), 1 );
// executeAction( charIDToTypeID( "Thrs" ), desc, DialogModes.NO );
// activeDocument.quickMaskMode = false;
//

Stdlib.getMaskBounds = function(doc, layer) {
  function _ftn() {
    var st = doc.activeHistoryState;
    Stdlib.selectMaskChannel(doc, layer);
    var bnds = Stdlib.getSelectionBounds(doc);
    doc.activeHistoryState = st;
    return bnds;
  }

//   Stdlib.undo(doc);
//   //executeAction(cTID("undo"), new ActionDescriptor(), DialogModes.NO);

  var bnds = Stdlib.wrapLCLayer(doc, layer, _ftn);

  return bnds;
};

Stdlib.appendMaskToSelection = function(doc, layer) {
  function _ftn() {
    var desc93 = new ActionDescriptor();
    var ref68 = new ActionReference();
    ref68.putEnumerated( cTID('Chnl'), cTID('Chnl'), cTID('Msk ') );
    desc93.putReference( cTID('null'), ref68 );
    var ref69 = new ActionReference();
    ref69.putProperty( cTID('Chnl'), cTID('fsel') );
    desc93.putReference( cTID('T   '), ref69 );
    executeAction( cTID('Add '), desc93, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.appendTransparencyToSelection = function(doc, layer) {
  function _ftn() {
    var desc90 = new ActionDescriptor();
    var ref64 = new ActionReference();
    ref64.putEnumerated( cTID('Chnl'), cTID('Chnl'), cTID('Trsp') );
    desc90.putReference( cTID('null'), ref64 );
    var ref65 = new ActionReference();
    ref65.putProperty( cTID('Chnl'), cTID('fsel') );
    desc90.putReference( cTID('T   '), ref65 );
    executeAction( cTID('Add '), desc90, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

//
// link/unlink the image and mask
//
Stdlib.isLayerMaskLinked = function(doc, layer) {
  var desc = Stdlib.getLayerDescriptor(doc, layer);
  return (desc.hasKey(cTID("Usrs")) && desc.getBoolean(cTID("Usrs")));
};

Stdlib._linkMask = function(doc, layer, linkOn) {
  function _ftn() {
    var desc = new ActionDescriptor();

    var lref = new ActionReference();
    lref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    desc.putReference(cTID("null"), lref);

    var ldesc = new ActionDescriptor();
    ldesc.putBoolean(cTID("Usrs"), linkOn);

    desc.putObject(cTID("T   "), cTID("Lyr "), ldesc);
    executeAction(cTID("setd"), desc, DialogModes.NO);
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.unlinkLayerMask = function(doc, layer) {
  Stdlib._linkMask(doc, layer, false);
};
Stdlib.unlinkMask = Stdlib.unlinkLayerMask;

Stdlib.linkLayerMask = function(doc, layer) {
  Stdlib._linkMask(doc, layer, true);
};
Stdlib.linkMask = Stdlib.linkLayerMask;

Stdlib.unlinkSelectedLayers = function(doc) {
  // Stdlib.doMenuItem(sTID("unlinkSelectedLayers"));
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
  desc.putReference( cTID('null'), ref );
  executeAction( sTID('unlinkSelectedLayers'), desc, DialogModes.NO );
};
Stdlib.unlinkLayers = function(doc, layers) {
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    var v = layer.visibile;
    layer.unlink();
    layer.visibile = v;
  }
};
Stdlib.linkSelectedLayers = function(doc) {
  // Stdlib.doMenuItem(sTID("linkSelectedLayers"));

  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
  desc.putReference( cTID('null'), ref );
  executeAction( sTID('linkSelectedLayers'), desc, DialogModes.NO );
};
Stdlib.linkLayers = function(doc, layers) {
  var base = layers[0];
  base.unlink();
  for (var i = 1; i < layers.length; i++) {
    var layer = layers[i];
    var v = layer.visible;
    layer.unlink();
    layer.link(base);
    layer.visible = v;
  }
};

Stdlib.selectLinkedLayers = function(doc) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    var desc = new ActionDescriptor();
    executeAction(sTID("selectLinkedLayers"), desc, DialogModes.NO);
  }

  Stdlib.wrapLC(doc, _ftn);
};
Stdlib.getLinkedLayers = function(doc, layer) {
  var selLayers;
  selLayers = layer.linkedLayers.slice(0);

  if (selLayers.length > 0) {
    selLayers.unshift(layer);

    var layers = [];
    var allLayers = Stdlib.getLayersList(doc);
    for (var i = 0; i < allLayers.length; i++) {
      var l = allLayers[i];
      if (selLayers.contains(l)) {
        layers.push(l);
      }
    }
    selLayers = layers;

  } else {
    selLayers = [layer];
  }
  return selLayers;
};

Stdlib.getSelectedLayers = function(doc, layerSets) {
  var layers = Stdlib.getLayersList(doc, undefined, layerSets);
  var visible = [];
  var selLayers = [];

  if (CSVersion() < 2) {
    return [ doc.activeLayer ];
  }

  if (doc.layers.length == 1 && Stdlib.hasBackgroundLayer(doc)) {
    return [ doc.backgroundLayer ];
  }

  // this split takes care of layer sets
  for (var i = 0; i < layers.length; i++) {
    var l = layers[i];
    visible[i] = l.visible;
  }
  for (var i = 0; i < layers.length; i++) {
    var l = layers[i];
    l.visible = false;
  }
  Stdlib.showSelectedLayers(doc);
  for (var i = 0; i < layers.length; i++) {
    var l = layers[i];
    if (l.visible) {
      selLayers.push(l);
    }
    l.visible = visible[i];
  }
  
  return selLayers;

  /*
  // from a PR post. Not yet tested
  var selLayers = [];
  Stdlib.newGroupFromLayers(doc);
  var group = doc.activeLayer;
  var layers = group.layers;
  for (var i = 0; i < layers; i++) {
    selLayers.push(layers[i]);
  }

  Stdlib.Undo();
  */  
  return selLayers;
};

// Stdlib.insertImageIntoMask(doc, doc.activeLayer, "/c/tmp/1.jpg");

Stdlib.insertImageIntoMask = function(doc, layer, im, fit) {
  if (!Stdlib.hasLayerMask(doc, layer)) {
    Error.runtimeError(9001, "A Layer mask is required for this operation.");
  }

  Stdlib.selectMaskChannel(doc, layer);
  var ilayer = Stdlib.insertImageIntoSelection(doc, layer, im, fit);
  Stdlib.linkLayerMask(doc, ilayer);
  doc.selection.deselect();
  return ilayer;
};

Stdlib.insertImageIntoSelection = function(doc, layer, im, fit) {
  var imageDoc;
  var imageFile;

  if (im instanceof Document) {
    imageDoc = im;
  } else {
    imageFile = Stdlib.convertFptr(im);
  }

  if (fit == undefined) fit = true;

  if (!Stdlib.hasSelection(doc)) {
    Error.runtimeError(8152); // "A selection is required for this operation.")
  }

  if (!imageDoc) {
    if (!imageFile.exists) {
      alert('Image ' + imageFile + ' does not exist.');
      return undefined;
    }
    imageDoc = app.open(imageFile);

  } else {
    app.activeDocument = imageDoc;
    imageDoc = imageDoc.duplicate();
  }

//   imageDoc.flatten();

  app.activeDocument = doc;

  var ru = app.preferences.rulerUnits;
  try {
    app.preferences.rulerUnits = Units.PIXELS;

    var lname = layer.name;

    // XXX app.activeDocument = doc;

    var bnds = Stdlib.getSelectionBounds(doc);

    // resize the image doc based on the selection bounds
    var width = bnds[2] - bnds[0];
    var height = bnds[3] - bnds[1];

    if (fit) {
      // change the res
      app.activeDocument = imageDoc;
      imageDoc.resizeImage(undefined, undefined, doc.resolution,
                           ResampleMethod.NONE);
      Stdlib.fitImage(imageDoc, width, height);

    } else {
      // fit to the shortest side (image will crop)
      var dwidth = imageDoc.width.value;
      var dheight = imageDoc.height.value;

      var ratio = height/width;
      var dratio = dheight/dwidth;

      if (dratio > ratio) {
        height = undefined;
      } else {
        width = undefined;
      }
      app.activeDocument = imageDoc;
      imageDoc.resizeImage(width, height, doc.resolution,
                           ResampleMethod.BICUBIC);
    }

    imageDoc.selection.selectAll();
    if (imageDoc.layers.length > 1) {
      imageDoc.selection.copy(true);
    } else {
      imageDoc.selection.copy();
    }

    app.activeDocument = doc;
    doc.activeLayer = layer;

    var hasStyles = Stdlib.hasLayerStyles(doc, layer);
    if (hasStyles) {
      Stdlib.copyStyles(doc);
    }

    if (!Stdlib.hasSelection(doc)) {
      Stdlib.selectBounds(doc, bnds);
    }

    Stdlib.pasteInto(doc);
    layer.remove();
    doc.activeLayer.name = lname;

    if (hasStyles) {
      Stdlib.pasteStyles(doc);
    }

  } catch (e) {
    layer = undefined;
    alert(Stdlib.exceptionMessage(e));

  } finally {
    app.preferences.rulerUnits = ru;
    try { imageDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
  }

  return doc.activeLayer;
};

Stdlib.insertImageIntoSelectionAsSmartObject = function(doc, layer, im, fit) {
  app.activeDocument = doc;
  doc.activeLayer = layer;
  var imageFile = Stdlib.convertFptr(im);

  if (fit == undefined) fit = true;

  if (!Stdlib.hasSelection(doc)) {
    Error.runtimeError(8152); // "A selection is required for this operation."
  }

  if (!imageFile.exists) {
    Error.runtimeError(48); // 'Image ' + imageFile + ' does not exist.'
  }

  var ru = app.preferences.rulerUnits;
  var rez = doc.resolution;

  try {
    if (rez != 72) {
      doc.resizeImage(undefined, undefined, 72, ResampleMethod.NONE);
    }

    app.preferences.rulerUnits = Units.PIXELS;

    var hasStyles = Stdlib.hasLayerStyles(doc, layer);
    if (hasStyles) {
      Stdlib.copyStyles(doc, layer);
    }

    var lname = layer.name;

    var bnds = Stdlib.getSelectionBounds(doc);

    var imageLayer; // = doc.artLayers.add();
    imageLayer = Stdlib.placeImage(doc, layer, imageFile);
    imageLayer.resize(100, 100, AnchorPosition.MIDDLECENTER);

    // resize the image doc based on the selection bounds
    var width = bnds[2] - bnds[0];
    var height = bnds[3] - bnds[1];

    var lbnds = Stdlib.getLayerBounds(doc, imageLayer);
    var lw = lbnds[2] - lbnds[0];
    var lh = lbnds[3] - lbnds[1];

    var ratio = height/width;
    var lratio = lh/lw;

    var orient;
    if (fit && (fit == true || fit.toString().toLowerCase() == 'fit')) {
      orient =  (lratio > ratio) ? 'vert' : 'horz';

    } else {
      orient =  (lratio > ratio) ? 'horz' : 'vert';
    }

    Stdlib.transformLayer(doc, imageLayer, bnds, orient);

    imageLayer.name = lname;

    layer.remove();

    if (hasStyles) {
      Stdlib.pasteStyles(doc);
    }
    // layer.remove();

  } catch (e) {
    alert(Stdlib.exceptionMessage(e));

  } finally {
    app.preferences.rulerUnits = ru;
    if (rez != 72) {
      doc.resizeImage(undefined, undefined, rez, ResampleMethod.NONE);
    }
  }

  return imageLayer;
};

Stdlib.resizeCanvas = function(doc, w, h, color, relative) {
  var hsb = color.hsb;
  var desc168 = new ActionDescriptor();
  if (toBoolean(relative)) {
    desc168.putBoolean(cTID('Rltv'), toBoolean(relative));
  }
  desc168.putUnitDouble( cTID('Wdth'), cTID('#Pxl'), w);
  desc168.putUnitDouble( cTID('Hght'), cTID('#Pxl'), h);
  desc168.putEnumerated( cTID('Hrzn'), cTID('HrzL'), cTID('Cntr') );
  desc168.putEnumerated( cTID('Vrtc'), cTID('VrtL'), cTID('Cntr') );
  if (color) {
    desc168.putEnumerated( sTID('canvasExtensionColorType'),
                           sTID('canvasExtensionColorType'),
                           cTID('Clr ') );
    var desc169 = new ActionDescriptor();
    desc169.putUnitDouble( cTID('H   '), cTID('#Ang'), hsb.hue );
    desc169.putDouble( cTID('Strt'), hsb.saturation );
    desc169.putDouble( cTID('Brgh'), hsb.brightness );
    desc168.putObject( sTID('canvasExtensionColor'), cTID('HSBC'), desc169 );
  }
  executeAction( cTID('CnvS'), desc168, DialogModes.NO );
};

_ResizeOptions = function() {
  var self = this;

  self.width = 1024;
  self.weight = 1024;
  self.constrain = true;
  self.scaleStyles = true;
  self.resample = true;
  self.resampleMethod = ResampleMethod.BICUBIC;
};

Stdlib._resizeImage = function(doc, opts) {

  //
  function _ftn() {
    // resample, constrain
    var desc71 = new ActionDescriptor();
    desc71.putUnitDouble( cTID('Wdth'), cTID('#Pxl'), opts.width);
    desc71.putBoolean( sTID('scaleStyles'), opts.scaleStyles );
    desc71.putBoolean( cTID('CnsP'), true );
    desc71.putEnumerated( cTID('Intr'), cTID('Intp'), cTID('Bcbc') );
    executeAction( cTID('ImgS'), desc71, DialogModes.NO );

    // no resample
    var id307 = charIDToTypeID( "ImgS" );
    var desc77 = new ActionDescriptor();
    var id308 = charIDToTypeID( "Wdth" );
    var id309 = charIDToTypeID( "#Rlt" );
    desc77.putUnitDouble( id308, id309, 477.217685 );
    executeAction( id307, desc77, DialogModes.NO );

    // resample, no constrain, no scale
    var desc84 = new ActionDescriptor();
    desc84.putUnitDouble( cTID('Wdth'), cTID('#Pxl'), 1024.000000 );
    desc84.putUnitDouble( cTID('Hght'), cTID('#Rlt'), 468.936026 );
    desc84.putEnumerated( cTID('Intr'), cTID('Intp'), cTID('Bcbc') );
    executeAction( cTID('ImgS'), desc84, DialogModes.NO );

  }

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.PSfitImage = function(width, height) {
  var desc = new ActionDescriptor();
  desc.putUnitDouble( cTID('Wdth'), cTID('#Pxl'), width );
  desc.putUnitDouble( cTID('Hght'), cTID('#Pxl'), height );

  var fitId = sTID('3caa3434-cb67-11d1-bc43-0060b0a13dc4');
  return executeAction(fitId , desc, DialogModes.NO );
};
Stdlib.fitImage = function(doc, width, height, resample) {
  Stdlib.resizeImage(doc, width, height, true, resample);
};

Stdlib.resizeImage = function(doc, width, height, constrained, resample) {
  function _ftn() {
    if (constrained == undefined) {
      constrained = true;
    }

    if (resample == undefined) {
      resample = ResampleMethod.BICUBIC;
    }

    var w = doc.width.value;
    var h = doc.height.value;
    var rez = doc.resolution;

    if (w == width && h == height) {
      return;
    }
    doc.resizeImage(undefined, undefined, 72, ResampleMethod.NONE);

    if (constrained) {
      var dratio = h/w;
      var ratio = height/width;

      if (dratio > ratio) {
        width = undefined;
      } else {
        height = undefined;
      }
    }

    doc.resizeImage(width, height, 72, resample);

    doc.resizeImage(undefined, undefined, rez, ResampleMethod.NONE);
  };

  var ru = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  Stdlib.wrapLC(doc, _ftn);

  app.preferences.rulerUnits = ru;
};


//
//================================ Selections ===============================
//

//
// Crop on the current selection
//
Stdlib.crop = function(doc) {
  Stdlib.doEvent(doc, "Crop"); // "Crop";
};


Stdlib.cropBounds = function(doc, bnds) {
  Stdlib.selectBounds(doc, bnds);
  Stdlib.crop(doc);
  doc.selection.deselect();
};

//
// Do an interactive crop. Use the bounds specified or the current selection
// if no bounds are specified
//
Stdlib.interactiveCrop = function(doc, bnds) {
  var cropDesc = new ActionDescriptor();
  var toDesc = new ActionDescriptor();
  toDesc.putUnitDouble( cTID('Top '), cTID('#Pxl'), bnds[0] );
  toDesc.putUnitDouble( cTID('Left'), cTID('#Pxl'), bnds[1] );
  toDesc.putUnitDouble( cTID('Btom'), cTID('#Pxl'), bnds[2] );
  toDesc.putUnitDouble( cTID('Rght'), cTID('#Pxl'), bnds[3] );
  cropDesc.putObject( cTID('T   '), cTID('Rctn'), toDesc );
  cropDesc.putUnitDouble( cTID('Angl'), cTID('Ang '), 0.000000 );
  cropDesc.putUnitDouble( cTID('Wdth'), cTID('#Pxl'), 0.000000 );
  cropDesc.putUnitDouble( cTID('Hght'), cTID('#Pxl'), 0.000000 );
  cropDesc.putUnitDouble( cTID('Rslt'), cTID('#Rsl'), 0.000000 );

  try {
    executeAction( cTID('Crop'), cropDesc, DialogModes.ALL );
  } catch (e) {
    if (e.number != 8007) { // if not "User cancelled"
      throw e;
    }
    return false;
  }
  return true;
};

//
// Transform the current selection
//
Stdlib.transformSelection = function(doc) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putProperty(cTID("Chnl"), cTID("fsel"));
  desc.putReference(cTID("null"), ref);
  executeAction(cTID("Trnf"), desc, DialogModes.ALL);
};

// ????
Stdlib.freeTransformSelection = function(doc, layer) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Mn  "), cTID("MnIt"), cTID("FrTr"));
    desc.putReference(cTID("null"), ref);
    app.executeAction(cTID("slct"), desc, DialogModes.NO );
//     app.executeAction(cTID("FrTr"),
//                              new ActionDescriptor(),
//                              DialogModes.NO);
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};


Stdlib.magicWand = function(doc, x, y, tol, aa, cntg) {
  function _ftn() {
    var desc = new ActionDescriptor();

    // Selection
    var ref = new ActionReference();
    ref.putProperty(cTID("Chnl"), cTID("fsel"));
    desc.putReference(cTID("null"), ref);

    // Point
    var pdesc = new ActionDescriptor();
    pdesc.putUnitDouble(cTID("Hrzn"), cTID("#Pxl"), x);
    pdesc.putUnitDouble(cTID("Vrtc"), cTID("#Pxl"), y);
    desc.putObject(cTID("T   "), cTID("Pnt "), pdesc);

    // Tolerance
    if (tol != undefined) {
      desc.putInteger(cTID("Tlrn"), tol);
    }

    // Anti-alias
    desc.putBoolean(cTID("AntA"), !!aa);

    // Contiguous
    desc.putBoolean(cTID("Cntg"), !!cntg);

    executeAction(cTID("setd"), desc, DialogModes.NO);
  }

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.selectSimilar = function(doc, tol, aa) {
  function _ftn() {
    var desc = new ActionDescriptor();

    // Selection
    var ref = new ActionReference();
    ref.putProperty(cTID("Chnl"), cTID("fsel"));
    desc.putReference(cTID("null"), ref);

    // Tolerance
    if (tol != undefined) {
      desc.putInteger(cTID("Tlrn"), tol);
    }

    // Anti-alias - defaults to true
    desc.putBoolean(cTID("AntA"), aa != false);

    executeAction(cTID("Smlr"), desc, DialogModes.NO);
  }

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.selectBounds = function(doc, b, type, feather, antialias) {
  function _ftn () {
    doc.selection.select([[ b[0], b[1] ],
                          [ b[2], b[1] ],
                          [ b[2], b[3] ],
                          [ b[0], b[3] ]],
                         type, feather, antialias);
  }
  if (feather == undefined) {
    feather = 0;
  }
  if (antialias == undefined) {
    antialias = false;
  }
  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.computeSelectionBoundsLS = function(doc) {
  var bnds = [];
  var ru = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  var oldLayer = doc.activeLayer;
  try {
    var layerSetRef = doc.layerSets.add();
    var layerRef = layerSetRef.artLayers.add();
    doc.activeLayer = layerRef;
    doc.selection.fill( app.foregroundColor);
    bnds = layerSetRef.bounds;
    layerSetRef.remove();
  } finally {
    doc.activeLayer = oldLayer;
    app.preferences.rulerUnits = ru;
  }

  return bnds;
};

Stdlib.computeSelectionBounds = function(doc) {
  var bnds = [];

  var dbgLevel = $.level;
  try {
    $.level = 0;
    doc.selection.makeWorkPath();
  } catch (e) {
    $.level = dbgLevel;
    return bnds;
  }
  $.level = dbgLevel;

  try {
    var pis = doc.pathItems; // should be doc.pathItems.getByName("WorkPath");
    if (pis.length > 0) {
      for (var i = 0; i < pis.length; i++) {
        var spis = pis[i].subPathItems;
        for (var j = 0; j < spis.length; j++) {
          var pps = spis[j].pathPoints;
          for (var k = 0; k < pps.length; k++) {
            var anchor = pps[k].anchor;
            if (bnds.length == 0) {
              bnds[0] = bnds[2] = anchor[0];
              bnds[1] = bnds[3] = anchor[1];
            } else {
              if (anchor[0] < bnds[0]) {
                bnds[0] = anchor[0];
              } else if (anchor[0] > bnds[2]) {
                bnds[2] = anchor[0];
              }
              if (anchor[1] < bnds[1]) {
                bnds[1] = anchor[1];
              } else if (anchor[1] > bnds[3]) {
                bnds[3] = anchor[1];
              }
            }
          }
        }
      }
    }
  } finally {
    Stdlib.undo();
  }

  return bnds;
};

Stdlib.computeSelectionBoundsPS7 = function(doc) {
  var bnds = [];

  Stdlib.makeWorkPath(doc);

  try {
    var pis = Stdlib.getPathItems(doc);

    for (var i = 0; i < pis.count; i++) {
      var spis = pis.getObjectValue(i).getList(sTID("subpathListKey"));
      var pps = spis.getObjectValue(0).getList(sTID('points'));

      for (var j = 0; j < pps.count; j++) {
        var anchorObj = pps.getObjectValue(j).getObjectValue(sTID("anchor"));
        var anchor = [anchorObj.getUnitDoubleValue(sTID('horizontal')),
                      anchorObj.getUnitDoubleValue(sTID('vertical'))];
        if (bnds.length == 0) {
          bnds[0] = bnds[2] = anchor[0];
          bnds[1] = bnds[3] = anchor[1];
        } else {
          if (anchor[0] < bnds[0]) {
            bnds[0] = anchor[0];
          } else if (anchor[0] > bnds[2]) {
            bnds[2] = anchor[0];
          }
          if (anchor[1] < bnds[1]) {
            bnds[1] = anchor[1];
          } else if (anchor[1] > bnds[3]) {
            bnds[3] = anchor[1];
          }
        }
      }
    }
  } finally {
    Stdlib.undo();
  }

  return bnds;
};

Stdlib.getSelectionBounds = function(doc) {
  function _ftn() {

    if (CSVersion() > 2) {
      var bnds = doc.selection.bounds;
      for (var i = 0; i < bnds.length; i++) {
        bnds[i] = bnds[i].value;
      }
      return bnds;
    }

    var l = doc.artLayers.add();

    doc.selection.fill(app.foregroundColor);

    var bnds = l.bounds;
    var hs = doc.historyStates;

    if (hs[hs.length-2].name == "Layer Order") {
      doc.activeHistoryState = hs[hs.length-4];
    } else {
      doc.activeHistoryState = hs[hs.length-3];
    }

    for (var i = 0; i < bnds.length; i++) {
      bnds[i] = bnds[i].value;
    }
    return bnds;
  }

  return Stdlib.wrapLCLayer(doc, doc.activeLayer, _ftn);
};

// assumes that 0,0 is a background pixel
Stdlib.selectBackground = function(doc, layer) {
  Stdlib.hideAllLayers(doc);
  layer.visible = true;
  Stdlib.magicWand(doc, 0, 0);
  Stdlib.selectSimilar(doc);
  doc.selection.invert();
};


Stdlib.hasSelection = function(doc) {
  var res = false;

  if (CSVersion() > 2) {
    // Thanks to SzopeN for this
    // http://ps-scripts.com/bb/viewtopic.php?p=12118#12118
    var debugLevel = $.level;
    $.level = 0;

    try {
      activeDocument.selection.bounds; // throws if there's no selection
      res = true;
    } catch(e) {
    }
    $.level = debugLevel;

  } else {
    var as = doc.activeHistoryState;
    doc.selection.deselect();
    if (as != doc.activeHistoryState) {
      res = true;
      doc.activeHistoryState = as;
    }
  }

  return res;
};

// This only returns one selected region. If the selection is disjoint,
// another function will have to be implemented
Stdlib.computeSelectionRegion = function(doc) {
  var bnds = [];

  var dbgLevel = $.level;
  try {
    $.level = 0;
    doc.selection.makeWorkPath();
  } catch (e) {
    $.level = dbgLevel;
    return bnds;
  }
  $.level = dbgLevel;

  try {
    var path = doc.pathItems["Work Path"];
    var subPathItems = path.subPathItems;

    for (var i = 0; i < subPathItems.length; i++) {
      var subPath = subPathItems[i];
      var points = subPath.pathPoints;
      for (var j = 0; j < points.length; j++) {
        var point = points[j];
        bnds.push(point.anchor);
      }
    }
  } finally {
    Stdlib.undo();
  }

  return bnds;
};

Stdlib.centerCanvasOnSelection = function(doc) {
  if (!Stdlib.hasSelection(doc)) {
    Error.runtimeError(8152); // "A selection is required for this operation."
  }

  var ru = app.preferences.rulerUnits;
  try {
    app.preferences.rulerUnits = Units.PIXELS;

    var bnds = Stdlib.getSelectionBounds(doc);
    var selX = (bnds[0]+bnds[2])/2;
    var selY = (bnds[1]+bnds[3])/2;

    var docX = doc.width.value/2;
    var docY = doc.height.value/2;

    doc.activeLayer.translate(docX-selX, docY-selY);
    doc.selection.translateBoundary(docX-selX, docY-selY);

  } finally {
    app.preferences.rulerUnits = ru;
  }
};

Stdlib.centerLayer = function(doc, layer) {
  var ru = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;
  try {
    var bnds = Stdlib.getLayerBounds(doc, layer);
    var layerW = bnds[2]-bnds[0];
    var layerH = bnds[3]-bnds[1];
    var docW = doc.width.value;
    var docH = doc.height.value;
    var x = (docW/2) - (layerW/2);
    var y = (docH/2) - (layerH/2);
    var deltaX = x - bnds[0];
    var deltaY = y - bnds[1];

    layer.translate(deltaX, deltaY);

  } finally {
    app.preferences.rulerUnits = ru;
  }
};


//============================== Vector Mask ==========================

Stdlib._doVectorMask = function(doc, layer, prop, state) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    var desc54 = new ActionDescriptor();
    desc54.putBoolean( xTID(prop), state );
    desc.putObject( cTID('T   '), cTID('Lyr '), desc54 );
    executeAction( cTID('setd'), desc, DialogModes.NO );
  };

  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.disableVectorMask = function(doc, layer) {
  Stdlib._doVectorMask(doc, layer, 'vectorMaskEnabled', false );
};
Stdlib.enableVectorMask = function(doc, layer) {
  Stdlib._doVectorMask(doc, layer, 'vectorMaskEnabled', true);
};
Stdlib.unlinkVectorMask = function(doc, layer) {
  Stdlib._doVectorMask(doc, layer, 'vectorMaskLinked', false );
};
Stdlib.linkVectorMask = function(doc, layer) {
  Stdlib._doVectorMask(doc, layer, 'vectorMaskLinked', true );
};


Stdlib.removeVectorMask = function(doc, layer) {
  function _ftn() {
    var desc317 = new ActionDescriptor();
    var ref302 = new ActionReference();
    ref302.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
    ref302.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc317.putReference( cTID('null'), ref302 );
    executeAction( cTID('Dlt '), desc317, DialogModes.NO );
  };

  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};




Stdlib.hasVectorMask = function(doc, layer) {
  // or check the layer 'hasVectorMask' property
  return Stdlib.getVectorMaskDescriptor(doc, layer) != undefined;
};

Stdlib.isVectorMaskEnabled = function(doc, layer) {
  var rc = false;

  if (Stdlib.hasVectorMask(doc, layer)) {
    try {
      var st = doc.activeHistoryState;
      Stdlib.enableVectorMask(doc, layer);
      if (doc.activeHistoryState == st) {
        rc = true;
      } else {
        doc.activeHistoryState = st;
      }
    } catch (e) {
    }
  }

  return rc;
};

Stdlib.rasterizeVectorMask = function(doc, layer) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref );
    desc.putEnumerated( cTID('What'),
                        sTID('rasterizeItem'),
                        sTID('vectorMask') );
    executeAction( sTID('rasterizeLayer'), desc, DialogModes.NO );
  };

  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.selectVectorMask = function(doc, layer) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Path'), cTID('Path'), sTID('vectorMask'));
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    desc.putReference(cTID('null'), ref);
    return executeAction(cTID('slct'), desc, DialogModes.NO);
  }
  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.deselectVectorMask = Stdlib.deselectActivePath;

Stdlib.loadVectorMaskSelection = function(doc, layer) {
  function _ftn() {
    var desc8 = new ActionDescriptor();
    var ref4 = new ActionReference();
    ref4.putProperty( cTID('Chnl'), cTID('fsel') );
    desc8.putReference( cTID('null'), ref4 );
    var ref5 = new ActionReference();
    ref5.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
    ref5.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc8.putReference( cTID('T   '), ref5 );
    desc8.putBoolean( cTID('AntA'), true );
    desc8.putUnitDouble( cTID('Fthr'), cTID('#Pxl'), 0.000000 );
    executeAction( cTID('setd'), desc8, DialogModes.NO );
  }
  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};


Stdlib.rotateVectorMask = function(doc, layer, angle) {
  function _ftn() {
    var desc89 = new ActionDescriptor();
        var ref67 = new ActionReference();
        ref67.putEnumerated( cTID('Path'), cTID('Ordn'), cTID('Trgt') );
    desc89.putReference( cTID('null'), ref67 );
    desc89.putEnumerated( cTID('FTcs'), cTID('QCSt'), cTID('Qcsa') );
        var desc90 = new ActionDescriptor();
        desc90.putUnitDouble( cTID('Hrzn'), cTID('#Pxl'), -0.000000 );
        desc90.putUnitDouble( cTID('Vrtc'), cTID('#Pxl'), 0.000000 );
    desc89.putObject( cTID('Ofst'), cTID('Ofst'), desc90 );
    desc89.putUnitDouble( cTID('Angl'), cTID('#Ang'), angle );
    executeAction( cTID('Trnf'), desc89, DialogModes.NO );
  }
  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.selectionFromVectorMask = function(doc, layer, aa, feather) {
  if (!feather) {
    feather = 0.0;
  }
  aa = !!aa;
  function _ftn() {
    var desc = new ActionDescriptor();
    var selref = new ActionReference();
    selref.putProperty(cTID('Chnl'), cTID('fsel'));
    desc.putReference(cTID('null'), selref);
    var vmref = new ActionReference();
    vmref.putEnumerated(cTID('Path'), cTID('Path'), sTID('vectorMask'));
    vmref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    desc.putReference(cTID('T   '), vmref);
    desc.putBoolean(cTID('AntA'), aa);
    desc.putUnitDouble(cTID('Fthr'), cTID('#Pxl'), feather);
    executeAction(cTID('setd'), desc, DialogModes.NO);
  }
  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.appendVectorMaskToSelection = function(doc, layer) {
  function _ftn() {
    var desc31 = new ActionDescriptor();
        var ref25 = new ActionReference();
        ref25.putProperty( cTID('Chnl'), cTID('fsel') );
    desc31.putReference( cTID('null'), ref25 );
        var ref26 = new ActionReference();
        ref26.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
        ref26.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc31.putReference( cTID('T   '), ref26 );
    desc31.putBoolean( cTID('AntA'), true );
    desc31.putUnitDouble( cTID('Fthr'), cTID('#Pxl'), 0.000000 );
    executeAction( cTID('AddT'), desc31, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.getVectorMaskBounds = function(doc, layer) {
  // function _ftn() {
  //   var st = doc.activeHistoryState;
  //   Stdlib.selectionFromVectorMask(doc, layer);
  //   var bnds = Stdlib.getSelectionBounds(doc);
  //   doc.activeHistoryState = st;
  //   return bnds;
  // }

//   Stdlib.undo(doc);
//   //executeAction(cTID("undo"), new ActionDescriptor(), DialogModes.NO);

  // var bnds = Stdlib.wrapLCLayer(doc, layer, _ftn);

  Stdlib.selectionFromVectorMask(doc, layer);
  var bnds = Stdlib.getSelectionBounds(doc);

  return bnds;
};

// by Damian SzopeN Sepczuk <damian[d0t]sepczuk[a7]o2{do7}pl>
// [in] round (bool) -- whether returned values should be rounded
//                      to the nearest pixel, def: false
// [in] doc -- document containing layer with vector mask
// [in] layer -- layer with vector mask
// returns array [left, top, right, bottom, width, height]
Stdlib.getVectorMaskBounds_cornerPointsOnly = function(round, doc, layer) {
  round = !!round;
  function _ftn() {
    var res = undefined;
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    var vMaskDescr = executeActionGet(ref);
    var pathContents = vMaskDescr.getObjectValue(sTID('pathContents'));
    var pathList = pathContents.getList(sTID('pathComponents'));

    // for each path in current layer
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    // using separate variables gives speed gain
    var subpathListKey = sTID("subpathListKey"),
        points_key = sTID("points"),
        anchor_key = sTID("anchor"),
        horizontal_key = sTID('horizontal'),
        vertical_key = sTID('vertical');

    // using separate variables gives speed gain
    var _id3 = sTID("anchor"),
        _id4 = sTID('horizontal'),
        _id5 = sTID('vertical');


    for (var cPath = 0; cPath < pathList.count; ++cPath) {
      var curPath = pathList.getObjectValue(cPath).getList(subpathListKey);
      var points = curPath.getObjectValue(0).getList(points_key);
      // for each point
      for (var cPoint = 0; cPoint < points.count; ++cPoint) {
        var point = points.getObjectValue(cPoint).getObjectValue(anchor_key);
        var x = point.getUnitDoubleValue(horizontal_key);
        var y = point.getUnitDoubleValue(_id5);
        // it is faster than if/else block (benchmarked on PSCS4)
        if ( x < minX ) minX = x;
        if ( x > maxX ) maxX = x;
        if ( y < minY ) minY = y;
        if ( y > maxY ) maxY = y;
      }
    }
    res = [minX, minY, maxX, maxY, maxX-minX, maxY-minY];
    if (round) {
      for (var i = 0; i < res.length; ++i)  {
        res[i] = Math.round(res[i]);
      }
    }
    return res;
  }
  var bnds = Stdlib.wrapLCLayer(doc, layer, _ftn);
  return bnds;
};

// by Damian SzopeN Sepczuk <damian[d0t]sepczuk[a7]o2{do7}pl>
Stdlib.getVectorMaskAngle_cornerPointsOnly = function(round, doc, layer) {
  round = !!round;
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    var vMaskDescr = executeActionGet(ref);
    var pathContents = vMaskDescr.getObjectValue(sTID('pathContents'));
    var pathList = pathContents.getList(sTID('pathComponents'));

    // using separate variables gives speed gain
    var _id3 = sTID("anchor"),
        _id4 = sTID('horizontal'),
        _id5 = sTID('vertical');

    var cPath=0;
    var curPath = pathList.getObjectValue(cPath).getList(sTID("subpathListKey"));
    var points = curPath.getObjectValue(0).getList(sTID("points"));

    var p1  = points.getObjectValue(0).getObjectValue(_id3),
         p1x = p1.getUnitDoubleValue(_id4),
         p1y = p1.getUnitDoubleValue(_id5),
         p2  = points.getObjectValue(1).getObjectValue(_id3),
         p2x = p2.getUnitDoubleValue(_id4),
         p2y = p2.getUnitDoubleValue(_id5);

     var v = [p2x-p1x, p2y-p1y];
     var v_len = Math.sqrt(v[0]*v[0]+v[1]*v[1]);
     var an = Math.acos(v[1]/v_len);
    var res = 90.0-an*180.0/Math.PI;
    if (p1x>p2x) res=-res;
    if (!round)
    {
        res = Math.round(res*100)/100;
    }
    return res;
  }
  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};


Stdlib.createSolidFillLayer = function(doc, color) {
  if (!color) {
    color = Stdlib.createRGBColor(0, 0, 0);
  }
  function _ftn() {
    var desc = new ActionDescriptor();
    var clref = new ActionReference();
    clref.putClass(sTID('contentLayer'));
    desc.putReference(cTID('null'), clref);
    var tdesc = new ActionDescriptor();
    var scldesc = new ActionDescriptor();
    var rgbdesc = new ActionDescriptor();
    rgbdesc.putDouble(cTID('Rd  '), color.rgb.red);
    rgbdesc.putDouble(cTID('Grn '), color.rgb.green);
    rgbdesc.putDouble(cTID('Bl  '), color.rgb.blue);
    scldesc.putObject(cTID('Clr '), cTID('RGBC'), rgbdesc);
    tdesc.putObject(cTID('Type'), sTID('solidColorLayer'), scldesc);
    desc.putObject(cTID('Usng'), sTID('contentLayer'), tdesc);
    executeAction(cTID('Mk  '), desc, DialogModes.NO);
  }
  Stdlib.wrapLC(doc, _ftn);
  return doc.activeLayer;
};

Stdlib.createVectorMaskFromCurrentPath = function(doc, layer) {
  function _ftn(doc) {
    var desc = new ActionDescriptor();
    var ref135 = new ActionReference();
    ref135.putClass( cTID('Path') );
    desc.putReference( cTID('null'), ref135 );
    var ref136 = new ActionReference();
    ref136.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
    desc.putReference( cTID('At  '), ref136 );
    var ref137 = new ActionReference();
    ref137.putEnumerated( cTID('Path'), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('Usng'), ref137 );
    executeAction( cTID('Mk  '), desc, DialogModes.NO );
  };

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.saveVectorMaskAsPath = function(doc, layer, name) {
  function _ftn() {
    function cTID(s) { return app.charIDToTypeID(s); };
    function sTID(s) { return app.stringIDToTypeID(s); };

    var desc107 = new ActionDescriptor();
    var ref65 = new ActionReference();
    ref65.putClass( cTID('Path') );
    desc107.putReference( cTID('null'), ref65 );
    var ref66 = new ActionReference();
    ref66.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
    ref66.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
    desc107.putReference( cTID('From'), ref66 );
    desc107.putString( cTID('Nm  '), name);
    executeAction( cTID('Mk  '), desc107, DialogModes.NO );
  };

  Stdlib.wrapLCLayer(doc, layer, _ftn);
  return doc.pathItems.getByName(name);
};



//
//================================ Paths ===============================
//
// PS7 doesn't have one of these so we provide one here...
//
Stdlib.makeWorkPath = function(doc, tolerance) {
  function _ftn(doc) {
    var desc = new ActionDescriptor();

    var pref = new ActionReference();
    pref.putClass(cTID("Path"));
    desc.putReference(cTID("null"), pref );

    var sref = new ActionReference();
    sref.putProperty( cTID("csel"), cTID("fsel"));
    desc.putReference(cTID("From"), sref );

    desc.putUnitDouble(cTID("Tlrn"), cTID("#Pxl"), Stdlib.makeWorkPath.tolerance);

    executeAction(cTID("Mk  "), desc, DialogModes.NO);
  }

  Stdlib.makeWorkPath.tolerance = (tolerance != undefined) ? tolerance : 2.0;

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.makePathActive = function(doc, pathName) {
  function _ftn() {
    var desc91 = new ActionDescriptor();
    var ref82 = new ActionReference();
    ref82.putName( cTID('Path'), pathName );
    desc91.putReference( cTID('null'), ref82 );
    executeAction( cTID('slct'), desc91, DialogModes.NO );
  };

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.makeSelectionFromPath = function(doc, pathName) {
  function _ftn() {
    var desc89 = new ActionDescriptor();
    var ref79 = new ActionReference();
    ref79.putProperty( cTID('Chnl'), cTID('fsel') );
    desc89.putReference( cTID('null'), ref79 );
    var ref80 = new ActionReference();
    ref80.putEnumerated( cTID('Path'), cTID('Ordn'), cTID('Trgt') );
    desc89.putReference( cTID('T   '), ref80 );
    desc89.putBoolean( cTID('AntA'), true );
    desc89.putUnitDouble( cTID('Fthr'), cTID('#Pxl'), 0.000000 );
    executeAction( cTID('setd'), desc89, DialogModes.NO );
  };

  Stdlib.makePathActive(doc, pathName);
  Stdlib.wrapLC(doc, _ftn);
};


// if (!Selection.prototype.makeWorkPath) {
// Selection.prototype.makeWorkPath = function(tol) {
//   Stdlib.makeWorkPath(this, tol);
// };
// }

Stdlib.getPathItems = function(doc) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putEnumerated(sTID('path'), sTID('ordinal'), sTID('targetEnum'));
    var pathObj = executeActionGet(ref);
    var pathContents = pathObj.getObjectValue(sTID('pathContents'));
    return pathContents.getList(sTID('pathComponents'));
  }
  return Stdlib.wrapLC(doc, _ftn);
};

//
// deselect the active path. just a piece of UI fluff
//
Stdlib.deselectActivePath = function(doc) {
  function _ftn() {
    var ref = new ActionReference();
    ref.putClass(cTID("Path"));

    var desc = new ActionDescriptor();
    desc.putReference(cTID("null"), ref);
    executeAction( cTID( "Dslc" ), desc, DialogModes.NO );
  };
  Stdlib.wrapLC(doc, _ftn);
};

// by SzopeN
Stdlib.decodePathMode = function( mode ) {
    var pathMode = null;
    switch ( mode ) {
        case ShapeOperation.SHAPEADD:
            pathMode = cTID("AddT");
            break;
        case ShapeOperation.SHAPEINTERSECT:
            pathMode = cTID();
            break;
        case ShapeOperation.SHAPESUBTRACT:
            pathMode = cTID("SbtF");
            break;
        case ShapeOperation.SHAPEXOR:
            pathMode = cTID();
            break;
        default:
            Error.runtimeError(1, "Shape mode not supported");
    }
    return pathMode;
}

// by SzopeN
Stdlib.decodePathUnit = function( unit ) {
    var pathUnit = null;
    switch ( unit ) {
        case Units.PERCENT:
            pathUnit = cTID("#Prc");
            break;
        case Units.PIXELS:
            pathUnit = cTID("#Pxl");
            break;
        case Units.CM:
        case Units.INCHES:
        case Units.MM:
        case Units.PICAS:
        case Units.POINTS:
        default:
            Error.runtimeError(1, "Unit not supported");
    }
    return pathUnit;
}


// by SzopeN
Stdlib.rectPath = function( mode, unit, top, left, bottom, right )
{
    var pathMode = Stdlib.decodePathMode(mode);
    var pathUnit = Stdlib.decodePathUnit(unit);

    var desc = new ActionDescriptor();

    var arStyle = new ActionReference();
        arStyle.putEnumerated( cTID( "Path" ), cTID( "Ordn" ), cTID( "Trgt" ) );

    var adBounds = new ActionDescriptor();
        adBounds.putUnitDouble( cTID( "Top " ), pathUnit, top );
        adBounds.putUnitDouble( cTID( "Left" ), pathUnit, left );
        adBounds.putUnitDouble( cTID( "Btom" ), pathUnit, bottom );
        adBounds.putUnitDouble( cTID( "Rght" ), pathUnit, right );

    desc.putReference( cTID( "null" ), arStyle );
    desc.putObject( cTID( "T   " ), cTID( "Rctn" ), adBounds );

    executeAction( pathMode, desc, DialogModes.NO );
}

// by SzopeN
Stdlib.linePath = function( mode, unit, width, x1, y1, x2, y2 ) {
    var pathMode = Stdlib.decodePathMode(mode);
    var pathUnit = Stdlib.decodePathUnit(unit);

    var idAddT = pathMode;
        var desc90 = new ActionDescriptor();
        var idnull = cTID( "null" );
            var ref47 = new ActionReference();
            var idPath = cTID( "Path" );
            var idOrdn = cTID( "Ordn" );
            var idTrgt = cTID( "Trgt" );
            ref47.putEnumerated( idPath, idOrdn, idTrgt );
        desc90.putReference( idnull, ref47 );
        var idT = cTID( "T   " );
            var desc91 = new ActionDescriptor();
            var idStrt = cTID( "Strt" );
                var desc92 = new ActionDescriptor();
                var idHrzn = cTID( "Hrzn" );
                var idPxl = pathUnit;
                desc92.putUnitDouble( idHrzn, idPxl, x1 );
                var idVrtc = cTID( "Vrtc" );
                var idPxl = pathUnit;
                desc92.putUnitDouble( idVrtc, idPxl, y1 );
            var idPnt = cTID( "Pnt " );
            desc91.putObject( idStrt, idPnt, desc92 );
            var idEnd = cTID( "End " );
                var desc93 = new ActionDescriptor();
                var idHrzn = cTID( "Hrzn" );
                var idPxl = pathUnit;
                desc93.putUnitDouble( idHrzn, idPxl, x2 );
                var idVrtc = cTID( "Vrtc" );
                var idPxl = pathUnit;
                desc93.putUnitDouble( idVrtc, idPxl, y2 );
            var idPnt = cTID( "Pnt " );
            desc91.putObject( idEnd, idPnt, desc93 );
            var idWdth = cTID( "Wdth" );
            var idPxl = pathUnit;
            desc91.putUnitDouble( idWdth, idPxl, width );
        var idLn = cTID( "Ln  " );
        desc90.putObject( idT, idLn, desc91 );
    executeAction( idAddT, desc90, DialogModes.NO );
};

// by SzopeN
Stdlib.flipPath = function(h, v) {
  var idTrnf = cTID( "Trnf" );
  var desc108 = new ActionDescriptor();
  var ref101 = new ActionReference();
  ref101.putEnumerated( cTID( "Path" ), cTID( "Ordn" ), cTID( "Trgt" ));
  desc108.putReference(  cTID( "null" ), ref101 );
  desc108.putEnumerated( cTID( "FTcs" ), cTID( "QCSt" ), cTID( "Qcsa" ) );
  if (h) desc108.putUnitDouble( cTID( "Wdth" ), cTID( "#Prc" ), -100.000000 );
  if (v) desc108.putUnitDouble( cTID( "Hght" ), cTID( "#Prc" ), -100.000000 );
  executeAction( idTrnf, desc108, DialogModes.NO );
};

// by SzopeN
Stdlib.createPathPoint = function(point, lHandle, rHandle) {
  var kind = (lHandle || rHandle)?PointKind.SMOOTHPOINT:PointKind.CORNERPOINT;
  if (!lHandle) lHandle = point;
  if (!rHandle) rHandle = point;

  var o = new PathPointInfo();
  /*o.anchor = [new UnitValue(point[0],'px'),new UnitValue(point[1],'px')];
   o.leftDirection = [new UnitValue(lHandle[0],'px'),new UnitValue(lHandle[1],'px')];
   o.rightDirection = [new UnitValue(rHandle[0],'px'),new UnitValue(rHandle[1],'px')];*/
  o.anchor = point;
  o.leftDirection = lHandle;
  o.rightDirection = rHandle;
  o.kind = kind;
  return o;
};



//
//================================= Actions ==================================
//
// attempt to execute an action. return true if OK, false if not available
// re-throws unknown exceptions.
//
Stdlib.runAction = function(atn, atnSet) {
  try {
    app.doAction(atn, atnSet);
  } catch (e) {
    if (e.toString().match(/action.+is not currently available/)) {
      return false;
    } else {
      throw e;
    }
  }
  return true;
};
runAction = Stdlib.runAction;

Stdlib.hasAction = function(atn, atnSet) {
  var asetDesc;
  var rc = false;
  var i = 1;

  var asMatches = [];

  while (true) {
    var ref = new ActionReference();
    ref.putIndex(cTID("ASet"), i);
    var desc;
    try {
      desc = executeActionGet(ref);
    } catch (e) {
      break;    // all done
    }
    if (desc.hasKey(cTID("Nm  ")) &&
        desc.getString(cTID("Nm  ")) == atnSet) {
      asetDesc = desc;
      asMatches.push({ index: i, desc: desc});
      //break;
    }
    i++;
  }

  if (asMatches.length == 0) {
    return false;
  }

  for (var i = 0; i < asMatches.length; i++) {
    var asmatch = asMatches[i];
    var asetIndex = asmatch.index;
    asetDesc = asmatch.desc;

    if (!asetDesc.hasKey(cTID("NmbC"))) {
      continue;
    }
    var max = asetDesc.getInteger(cTID("NmbC"));
    for (var j = 1; j <= max; j++) {
      var ref = new ActionReference();
      ref.putIndex(cTID("Actn"), j);           // Action index
      ref.putIndex(cTID("ASet"), asetIndex);   // ActionSet index

      var desc;
      try {
        desc = executeActionGet(ref);
      } catch (e) {
        break;   // all done
      }
      if (desc.hasKey(cTID("Nm  ")) &&
          desc.getString(cTID("Nm  ")) == atn) {
        return true;
      }
    }
  }
  return rc;
};

Stdlib.deleteActionStep = function(index, atn, atnSet) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putIndex(cTID("Cmnd"), index);
    ref.putName(cTID("Actn"), atn);
    ref.putName(cTID("ASet"), atnSet);
    desc.putReference(cTID("null"), ref);
    executeAction(cTID("Dlt "), desc, DialogModes.NO);
  }

  _ftn();
};
Stdlib.deleteAction = function(atn, atnSet) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putName(cTID("Actn"), atn);
    ref.putName(cTID("ASet"), atnSet);
    desc.putReference(cTID("null"), ref);
    executeAction(cTID("Dlt "), desc, DialogModes.NO);
  }

  _ftn();
};
Stdlib.deleteActionSet = function(atnSet) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putName(cTID("ASet"), atnSet);
    desc.putReference(cTID("null"), ref);
    executeAction(cTID("Dlt "), desc, DialogModes.NO);
  }

  try {
    _ftn();
  } catch (e) {
    // if this action is the currently executing action,
    // we can't delete it, so we return false. All other
    // exceptions are rethrown
    if (!e.toString().match(/action that is playing or recording/)) {
      throw e;
    }
    return false;
  }
  return true;
};


Stdlib.createDroplet = function(atn, atnSet, fptr) {
  fptr = Stdlib.convertFptr(fptr);

  function _ftn() {
    var desc = new ActionDescriptor();
    desc.putPath(cTID('In  '), fptr);
    var ref = new ActionReference();
    ref.putName(cTID('Actn'), atn);
    ref.putName(cTID('ASet'), atnSet);
    desc.putReference(cTID('Usng'), ref);
    executeAction(cTID('CrtD'), desc, DialogModes.NO);
  }

  _ftn();
};


//
//  f = File.openDialog(); Stdlib.loadActionFile(f);
//
Stdlib.loadActionFile = function(file) {
  Stdlib.btExec('app.load(new File("' + file.absoluteURI + '"));');
};

//
// Stdlib.loadActionFiles(folder.getFiles("*.atn"))'
//
Stdlib.loadActionFiles = function(files) {
  var str = '';

  for (var i = 0; i < files.length; i++) {
    var file = files[0];
    str += 'app.load(new File("' + file.absoluteURI + '"));\n';
  }
  Stdlib.btExec(str);
};

Stdlib.getActionSets = function() {
  var i = 1;
  var sets = [];

  while (true) {
    var ref = new ActionReference();
    ref.putIndex(cTID("ASet"), i);
    var desc;
    var lvl = $.level;
    $.level = 0;
    try {
      desc = executeActionGet(ref);
    } catch (e) {
      break;    // all done
    } finally {
      $.level = lvl;
    }
    if (desc.hasKey(cTID("Nm  "))) {
      var set = {};
      set.index = i;
      set.name = desc.getString(cTID("Nm  "));
      set.toString = function() { return this.name; };
      set.count = desc.getInteger(cTID("NmbC"));
      set.actions = [];
      for (var j = 1; j <= set.count; j++) {
        var ref = new ActionReference();
        ref.putIndex(cTID('Actn'), j);
        ref.putIndex(cTID('ASet'), set.index);
        var adesc = executeActionGet(ref);
        var actName = adesc.getString(cTID('Nm  '));
        set.actions.push(actName);
      }
      sets.push(set);
    }
    i++;
  }

  return sets;
};

Stdlib.getActions = function(aset) {
  var i = 1;
  var names = [];

  if (!aset) {
    throw Error.runtimeError(9001, "Action set must be specified");
  }

  while (true) {
    var ref = new ActionReference();
    ref.putIndex(cTID("ASet"), i);
    var desc;
    try {
      desc = executeActionGet(ref);
    } catch (e) {
      names = undefined;
      break;    // all done
    }
    if (desc.hasKey(cTID("Nm  "))) {
      var aname = desc.getString(cTID("Nm  "));
      if (aname == aset) {
        var count = desc.getInteger(cTID("NmbC"));
        for (var j = 1; j <= count; j++) {
          var ref = new ActionReference();
          ref.putIndex(cTID('Actn'), j);
          ref.putIndex(cTID('ASet'), i);
          var adesc = executeActionGet(ref);
          var actName = adesc.getString(cTID('Nm  '));
          names.push(actName);
        }
        break;
      }
    }
    i++;
  }

  return names;
};

Stdlib.getSelectedAction = function() {
  var obj = {};
  try {
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Actn"), cTID("Ordn"), cTID("Trgt"));
    var desc = executeActionGet(ref);
    obj.name = desc.getString(cTID("Nm  "));
    obj.set = desc.getString(cTID("PrNm"));
  } catch (e) {
  }

  return obj;
};

Stdlib.backupActionsPalette = function(file) {
  if (file) {
    file = Stdlib.convertFptr(file);
  } else {
    file = File.saveDialog("Save Backup ActionsPalette",
                           "PSP Files:*.PSP,All files:*");
  }

  if (file) {
    if (!app.preferencesFolder) {
      Error.runtimeError(9001, "\rNo preferencesFolder property found. " +
                         "\rUnable to complete request.");
    }
    var paletteFile = new File(app.preferencesFolder +
                               "/Actions Palette.psp");
    if (!paletteFile.exists) {
      Error.runtimeError(9001, "Unable to locate palette file.");
    }
    paletteFile.copy(file) || throwFileError(file, "Copy failed ");
  }
};

//
// Very dangerous unless you _want_ to empty your Actions Palette.
//
Stdlib.deleteAllActionSets = function(confirmDelete) {
  if (confirmDelete != false) {
    if (!confirm("Do you really want to empty your Actions Palette?")) {
      return;
    }
  }

  var sets = Stdlib.getActionSets();

  for (var i = sets.length-1; i >= 0; i--) {
    Stdlib.deleteActionSet(sets[i].name);
  }
};

Stdlib.setActionPlaybackOption = function(opt, arg) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putProperty(cTID("Prpr"), cTID("PbkO"));
    ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt"));
    desc.putReference(cTID("null"), ref );
    var pdesc = new ActionDescriptor();
    pdesc.putEnumerated(sTID("performance"), sTID("performance"), sTID(opt));
    if (opt == "pause" && arg != undefined) {
      pdesc.putInteger(sTID("pause"), parseInt(arg));
    }
    desc.putObject(cTID("T   "), cTID("PbkO"), pdesc );
    executeAction(cTID("setd"), desc, DialogModes.NO);
  }
  _ftn();
};
Stdlib.setPlaybackAccelerated = function() {
  Stdlib.setActionPlaybackOption("accelerated");
};
Stdlib.setPlaybackStepByStep = function() {
  Stdlib.setActionPlaybackOption("stepByStep");
};
Stdlib.setPlaybackPaused = function(delaySec) {
  Stdlib.setActionPlaybackOption("pause", delaySec);
};

Stdlib.getApplicationDescriptor = function() {
  var ref = new ActionReference();
  ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt"));
  return executeActionGet(ref);
};

Stdlib.getDescriptorKeys = function(desc) {
  var keys = [];

  for (var i = 0; i < desc.count; i++) {
    keys.push(desc.getKey(i));
  }
  return keys;
};
Stdlib.getDescriptorKeySyms = function(desc) {
  var keys = [];

  for (var i = 0; i < desc.count; i++) {
    keys.push(id2char(desc.getKey(i), "Key"));
  }
  return keys;
};

Stdlib.getDescriptorKeyNames = function(desc) {
  var keys = [];

  for (var i = 0; i < desc.count; i++) {
    keys.push(PSConstants.reverseNameLookup(desc.getKey(i), "Key"));
  }
  return keys;
};

//
//=============================== DataSets ===================================
//
// Thanks to mhale for these
//
Stdlib.fileImportDataSets = function(dsfile) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putClass(sTID("dataSetClass"));
  desc.putReference(cTID("null"), ref);
  desc.putPath(cTID("Usng"), new File(dsfile));
  desc.putEnumerated(cTID("Encd"),
                     sTID("dataSetEncoding"),
                     sTID("dataSetEncodingAuto"));
  desc.putBoolean(sTID("eraseAll"), true);
  desc.putBoolean(sTID("useFirstColumn"), false);
  executeAction(sTID("importDataSets"), desc, DialogModes.NO);
};

Stdlib.applyDataSet = function(setName) {
  var desc = new ActionDescriptor();
  var setRef = new ActionReference();
  setRef.putName(sTID("dataSetClass"), setName);
  desc.putReference(cTID("null"), setRef);
  executeAction(cTID("Aply"), desc, DialogModes.NO);
};

//
//================================= Batch =====================================
//
//
// This is an alternative interface to Batch (instead of app.batch)
// It has the ability to:
//    specify text fragments as file name components.
//    recurse into subfolders
//    use a file mask/regexp to specify files
//
//  src     - a File, Folder, or an Array of Files and Folders
//  act     - the Action name
//  actset  - the ActionSet name
//  opts    - BatchOptions with support for text file naming components
//  mask    - either a simple mask ("*.jpg"), a function mask
//            (see Folder.getFiles()) or a Regular Expression (/\.jpe?g$/i)
//  recurse - if true, recurse into subdirectories
//
Stdlib.batch = function(src, act, actset, opts, mask, recurse) {
  if (CSVersion() < 2) {
    Error.runtimeError(9001, "Batch is only available in CS2+.");
  }

  var desc = new ActionDescriptor();

  if (src instanceof Array) {
    for (var i = 0; i < src.length; i++) {
      Stdlib.batch(src[i], act, actset, opts, mask, recurse);
      opts.startingSerial++;
    }
    return;
  }

  var subdirs;
  if (src instanceof Folder) {
    if (mask) {
      var files;
      if (recurse == true) {
        files = Stdlib.findFiles(src, mask);
      } else {
        files = Stdlib.getFiles(src, mask);
      }
      if (files.length > 0) {
        Stdlib.batch(files, act, actset, opts, mask, recurse);
      }
      return;
    }
    if (recurse == true) {
      subdirs = Stdlib.getFolders(src);
    }
  }

//   $.level = 1; debugger;
  desc.putPath(cTID("null"), src); // source

  if (opts.suppressProfile == true) {
    desc.putBoolean(sTID("suppressWarnings"), true);
  }
  if (opts.suppressOpen == true) {
    desc.putBoolean(sTID("suppressOpenOptions"), true);
  }

  var actref = new ActionReference();
  actref.putName(cTID("Actn"), act);
  actref.putName(cTID("ASet"), actset);
  desc.putReference(cTID("Usng"), actref);

  if (opts.overrideOpen == true) {
    desc.putBoolean(cTID("OvrO"), true);
  }

  if (opts.destination != BatchDestinationType.NODESTINATION) {
    desc.putPath(cTID("T   "), opts.destinationFolder);
  }

  var fileNaming;

  if (opts.destination == BatchDestinationType.FOLDER) {
    fileNaming = opts.fileNaming;

  } else if (opts.destination == BatchDestinationType.SAVEANDCLOSE) {
    fileNaming = [ FileNamingType.DOCUMENTNAMEMIXED,
                   FileNamingType.EXTENSIONLOWER ];
  }

  if (fileNaming) {
    if (fileNaming.length > 6) {
      Error.runtimeError(9001, "Too many BatchOptions.fileNaming components.");
    }
    var fnrdesc = new ActionDescriptor();
    var fnclist = new ActionList();

    for (var i = 0; i < opts.fileNaming.length; i++) {
      var namingComponent = opts.fileNaming[i];
      var fncdesc = new ActionDescriptor();

      if (typeof namingComponent == "string" ||
          namingComponent instanceof String) {
        fncdesc.putString(cTID("Txt "), opts.fileNaming[i]);
      } else {
        var mappedId = Stdlib.batch.map[namingComponent];
        fncdesc.putEnumerated(sTID("component"),
                              sTID("fileNamingComponent"),
                              mappedId);
      }
      fnclist.putObject(sTID("fileNamingComponents"), fncdesc);
    }

    fnrdesc.putList(sTID("fileNamingComponents"), fnclist);

    fnrdesc.putInteger(cTID("Strt"), opts.startingSerial);

    fnrdesc.putBoolean(cTID("Mcnt"), opts.macintoshCompatible);
    fnrdesc.putBoolean(cTID("Win "), opts.windowsCompatible);
    fnrdesc.putBoolean(sTID("unix"), opts.unixCompatible);
    desc.putObject(sTID("fileNamingRules"), sTID("fileNamingRules"), fnrdesc);
  }

  if (opts.destination != BatchDestinationType.NODESTINATION) {
    if (opts.overrideSave == true) {
      desc.putBoolean(cTID("Ovrd"), true);
    }
  }

  if (opts.destination == BatchDestinationType.SAVEANDCLOSE) {
    desc.putBoolean(cTID("SvAn"), true);
  }

  if (opts.errorFile) {
    desc.putPath(cTID("Log "), opts.errorFile.parent);
    desc.putString(cTID("Nm  "), opts.errorFile.name);
  }
  executeAction(cTID("Btch"), desc, DialogModes.NO);

  if (subdirs) {
    for (var i = 0; i < subdirs.length; i++) {
      Stdlib.batch(subdirs[i], act, actset, opts, mask, recurse);
    }
  }
};

Stdlib.batch.init = function() {
  if (!isPhotoshop()) {
    return;
  }
  if (CSVersion() < 2) {
    return;
  }
  Stdlib.batch.map = {};
  Stdlib.batch.map[FileNamingType.DDMM] = sTID("ddmm");
  Stdlib.batch.map[FileNamingType.DDMMYY] = sTID("ddmmyy");
  Stdlib.batch.map[FileNamingType.DOCUMENTNAMELOWER] = sTID("lowerCase");
  Stdlib.batch.map[FileNamingType.DOCUMENTNAMEMIXED] = cTID("Nm  ");
  Stdlib.batch.map[FileNamingType.DOCUMENTNAMEUPPER] = sTID("upperCase");
  Stdlib.batch.map[FileNamingType.EXTENSIONLOWER] = sTID("lowerCaseExtension");
  Stdlib.batch.map[FileNamingType.EXTENSIONUPPER] = sTID("upperCaseExtension");
  Stdlib.batch.map[FileNamingType.MMDD] = sTID("mmdd");
  Stdlib.batch.map[FileNamingType.MMDDYY] = sTID("mmddyy");
  Stdlib.batch.map[FileNamingType.SERIALLETTERLOWER] = sTID("upperCaseSerial");
  Stdlib.batch.map[FileNamingType.SERIALLETTERUPPER] = sTID("lowerCaseSerial");
  Stdlib.batch.map[FileNamingType.SERIALNUMBER1] = sTID("oneDigit");
  Stdlib.batch.map[FileNamingType.SERIALNUMBER2] = sTID("twoDigit");
  Stdlib.batch.map[FileNamingType.SERIALNUMBER3] = sTID("threeDigit");
  Stdlib.batch.map[FileNamingType.SERIALNUMBER4] = sTID("fourDigit");
  Stdlib.batch.map[FileNamingType.YYDDMM] = sTID("yyddmm");
  Stdlib.batch.map[FileNamingType.YYMMDD] = sTID("yymmdd");
  Stdlib.batch.map[FileNamingType.YYYYMMDD] = sTID("yyyymmdd");
};

Stdlib.batch.init();

//
//================================= misc =====================================
//


//
// selectColorRange
//   Selects a range of colors around a specified color.
//   doc     - the document to operate on
//   color   - either a SolidColor or LabColor object
//   range   - the 'fuzziness' factor [default 40]
//   inverse - invert the selection [default 'false']
// Example:
//   Stdlib.selectColorRange(doc, Stdlib.getColorAt(doc, 125, 300), 50)
//
// Thanks to Andrew Hall for the original idea
//
Stdlib.selectColorRange = function(doc, color, range, inverse) {
  var clr = (color instanceof SolidColor) ? color.lab : color;
  if (inverse == undefined) {
    inverse = false;
  }
  if (range == undefined) {
    range = 40;
  }

  function _ftn() {
    var desc = new ActionDescriptor();
    desc.putInteger(cTID("Fzns"), range);

    var mnDesc = new ActionDescriptor();
    mnDesc.putDouble(cTID("Lmnc"), clr.l);
    mnDesc.putDouble(cTID("A   "), clr.a);
    mnDesc.putDouble(cTID("B   "), clr.b);
    desc.putObject(cTID("Mnm "), cTID("LbCl"), mnDesc);

    var mxDesc = new ActionDescriptor();
    mxDesc.putDouble(cTID("Lmnc"), clr.l);
    mxDesc.putDouble(cTID("A   "), clr.a);
    mxDesc.putDouble(cTID("B   "), clr.b);
    desc.putObject(cTID("Mxm "), cTID("LbCl"), mxDesc);

    if (inverse) {
      desc.putBoolean(cTID("Invr"), inverse);
    }

    executeAction(cTID("ClrR"), desc, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};

//
// selectColorRangeRGB
//   See 'selectColorRange' above
//   clr - either a RGBColor object or an Array with three(rgb) values
// Example:
//   Stdlib.selectColorRangeRGB(doc, [255, 144, 144], 50, true)
//
Stdlib.selectColorRangeRGB = function(doc, clr, range, inverse) {
  if (clr instanceof Array) {
    var c = new RGBColor();
    c.red = clr[0]; c.green = clr[1]; c.blue = clr[2];
    clr = new SolidColor();
    clr.rgb = c;
  } else if (clr instanceof RGBColor) {
    c = new SolidColor();
    c.rgb = clr;
    clr = c;
  } else {
    Error.runtimeError(19, "color"); // "Bad color argument");
  }

  Stdlib.selectColorRange(doc, clr, range, inverse);
};

Stdlib.selectOutOfGamutColor = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    desc.putEnumerated(cTID("Clrs"), cTID("Clrs"), cTID("OtOf"));
    executeAction(cTID("ClrR"), desc, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};


Stdlib.rgbToString = function(c) {
  return "[" + c.rgb.red + "," + c.rgb.green + "," + c.rgb.blue + "]";
};
Stdlib.rgbToArray = function(c) {
  return [c.rgb.red, c.rgb.green, c.rgb.blue];
};
Stdlib.rgbFromString = function(str) {
  var rex = /([\d\.]+),([\d\.]+),([\d\.]+)/;
  var m = str.match(rex);
  if (m) {
    return Stdlib.createRGBColor(Number(m[1]),
                                 Number(m[2]),
                                 Number(m[3]));
  }
  return undefined;
};
Stdlib.createRGBColor = function(r, g, b) {
  var c = new RGBColor();
  if (r instanceof Array) {
    b = r[2]; g = r[1]; r = r[0];
  }
  c.red = parseInt(r); c.green = parseInt(g); c.blue = parseInt(b);
  var sc = new SolidColor();
  sc.rgb = c;
  return sc;
};

try {
  if (isPhotoshop()) {
    Stdlib.COLOR_BLACK = Stdlib.createRGBColor(0, 0, 0);
    Stdlib.COLOR_RED = Stdlib.createRGBColor(255, 0, 0);
    Stdlib.COLOR_GREEN = Stdlib.createRGBColor(0, 255, 0);
    Stdlib.COLOR_BLUE = Stdlib.createRGBColor(0, 0, 255);
    Stdlib.COLOR_GRAY = Stdlib.createRGBColor(128, 128, 128);
    Stdlib.COLOR_WHITE = Stdlib.createRGBColor(255, 255, 255);
  }
} catch (e) {
}

Stdlib.colorFromString = function(str) {
  var c = Stdlib.rgbFromString(str);
  if (!c) {
    str = str.toLowerCase();
    if (str == "black") {
      c = Stdlib.COLOR_BLACK;
    } else if (str == "white") {
      c = Stdlib.COLOR_WHITE;
    } else if (str == "foreground") {
      c = app.foregroundColor;
    } else if (str == "background") {
      c = app.backgroundColor;
    } else if (str == "gray" || str == "grey") {
      c = Stdlib.COLOR_GRAY;
    } else if (str == "red") {
      c = Stdlib.COLOR_RED;
    } else if (str == "green") {
      c = Stdlib.COLOR_GREEN;
    } else if (str == "blue") {
      c = Stdlib.COLOR_BLUE;
    }
  }
  return c;
};


// the slow way to draw...
Stdlib.setColorAt = function(doc, x, y, color, mode, opacity) {
  Stdlib.selectBounds(doc, [x, y, x+1, y+1], SelectionType.REPLACE, 0, false);
  if (!Stdlib.hasSelection(doc)) {
    Error.runtimeError(20, "Unable to select pixel at " + x + ',' + y);
  }
  if (mode == undefined) {
    mode = ColorBlendMode.NORMAL;
  }
  if (opacity == undefined) {
    opacity = 100;
  }
  if (color) {
    doc.selection.fill(color, mode, opacity);
  } else {
    doc.selection.clear();
  }
};
Stdlib.putColorAt = Stdlib.setColorAt;

// getColorAt
// based on:
//     fazstp@adobeforums.com wrote:
//     news://adobeforums.com:119/3bb84060.0@webx.la2eafNXanI
//
// updated for ColorSampler APIs in CS3+
//
Stdlib.getColorAt = function(doc, x, y, undo) {
  if (CSVersion() >= 3) {
    if (x != Math.ceil(x)){
      x += 0.5;
    }
    if (y != Math.ceil(y)){
      y += 0.5;
    }
    var sample = doc.colorSamplers.add([UnitValue(x, "px"),
      UnitValue(y, "px")]);
    var clr = undefined;
    try { clr = sample.color; } catch (e) {}
    sample.remove();
    return clr;
  }

  if (!!undo) {
    undo = true;
    var st = doc.activeHistoryState;
  }
  // make new 1 pixel selection
  x = Math.floor(x);
  y = Math.floor(y);

  Stdlib.selectBounds(doc, [x, y, x+1, y+1]);

  try {
    function findPV(h) {
      for (var i = 0; i <= 255; i++ ) {
        if (h[i]) { return i; }
      }
      return 0;
    }

    var pColour = new SolidColor();

    if (doc.mode == DocumentMode.RGB) {
      pColour.mode = ColorModel.RGB;
      pColour.rgb.red   = findPV(doc.channels["Red"].histogram);
      pColour.rgb.green = findPV(doc.channels["Green"].histogram);
      pColour.rgb.blue  = findPV(doc.channels["Blue"].histogram);

    } else if (doc.mode == DocumentMode.GRAYSCALE) {
      var gr = findPV(doc.channels["Gray"].histogram);
      pColour.mode = ColorModel.GRAYSCALE;
      pColour.gray.gray = 100 * (gr/255);

    } else {
      Error.runtimeError(9001, "Color Mode not supported: " + doc.mode);
    }

  } finally {
    if (undo) {
      doc.activeHistoryState = st;
    }
  }

  return pColour;
};

Stdlib.convertProfile = function(doc, profile) {
  profile = profile.replace(/\.icc$/i, '');

  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Dcmn'), cTID('Ordn'), cTID('Trgt') );
    desc.putReference( cTID('null'), ref);
    desc.putString( cTID('T   '), profile );
    desc.putEnumerated( cTID('Inte'), cTID('Inte'), cTID('Clrm') );
    desc.putBoolean( cTID('MpBl'), true );
    desc.putBoolean( cTID('Dthr'), false );
    desc.putInteger( cTID('sdwM'), -1 );
    executeAction( sTID('convertToProfile'), desc, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};


// deprecated: Use Document.changeMode
Stdlib.convertMode = function(doc, cmode) {
  var mode;

  function _ftn() {
    var desc = new ActionDescriptor();
    desc.putClass(cTID("T   "), cTID(mode));
    executeAction(sTID("convertMode"), desc, DialogModes.NO);
  };

  switch (cmode) {
    case DocumentMode.BITMAP:       mode = "BtmM"; break;
    case DocumentMode.CMYK:         mode = "CMYM"; break;
    case DocumentMode.GRAYSCALE:    mode = "Grys"; break;
    case DocumentMode.INDEXEDCOLOR: mode = "IndC"; break;
    case DocumentMode.LAB:          mode = "LbCM"; break;
    case DocumentMode.MULTICHANNEL: mode = "MltC"; break;
    case DocumentMode.RGB:          mode = "RGBM"; break;
    default: Error.runtimeError(9001, "Bad color mode specified: " + cmode);
  }
  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.colorModeString = function(cmode) {
  var mode = "Unknown Mode";

  var cmodeN = toNumber(cmode);

  if (isNaN(cmodeN)) {
    switch (cmode) {
      case DocumentMode.BITMAP:       mode = "Bitmap"; break;
      case DocumentMode.CMYK:         mode = "CMYK"; break;
      case DocumentMode.DUOTONE:      mode = "Duotone"; break;
      case DocumentMode.GRAYSCALE:    mode = "Grayscale"; break;
      case DocumentMode.INDEXEDCOLOR: mode = "Indexed Color"; break;
      case DocumentMode.LAB:          mode = "Lab"; break;
      case DocumentMode.MULTICHANNEL: mode = "Multichannel"; break;
      case DocumentMode.RGB:          mode = "RGB"; break;
    }

  } else {
    switch (cmode) {
      case 0: mode = "Bitmap"; break;
      case 1: mode = "Grayscale"; break;
      case 2: mode = "Indexed Color"; break;
      case 3: mode = "RGB"; break;
      case 4: mode = "CMYK"; break;
      case 7: mode = "Multichannel"; break;
      case 8: mode = "Duotone"; break;
      case 9: mode = "Lab"; break;
    }
  }

  return mode;
};
Stdlib.copyrightedString = function(copy) {
  var str = '';
  switch (copy) {
    case CopyrightedType.COPYRIGHTEDWORK: str = "Copyrighted"; break;
    case CopyrightedType.PUBLICDOMAIN:    str = 'Public Domain'; break;
    case CopyrightedType.UNMARKED:        str = 'Unmarked'; break;
  }

  return str;
};
Stdlib.urgencyString = function(urgency) {
  var str = '';
  switch (urgency) {
    case Urgency.LOW:    str = "Urgency Low"; break;
    case Urgency.TWO:    str = "Urgency Two"; break;
    case Urgency.THREE:  str = "Urgency Three"; break;
    case Urgency.FOUR:   str = "Urgency Four"; break;
    case Urgency.NORMAL: str = "Urgency Normal"; break;
    case Urgency.SIX:    str = "Urgency Six"; break;
    case Urgency.SEVEN:  str = "Urgency Seven"; break;
    case Urgency.HIGH:   str = "Urgency High"; break;
  }

  return str;
};

Stdlib.getFillLayerColor = function(doc, layer) {
  var color = new SolidColor();
  var desc = Stdlib.getLayerDescriptor(doc, layer);
  var adjList = desc.getList(cTID('Adjs'));
  var adjDesc = adjList.getObjectValue(0);
  var clrDesc = adjDesc.getObjectValue(cTID('Clr '));
  color.rgb.red = clrDesc.getDouble(cTID('Rd  '));
  color.rgb.green = clrDesc.getDouble(cTID('Grn '));
  color.rgb.blue = clrDesc.getDouble(cTID('Bl  '));
  return color;
};

Stdlib.setFillLayerColor = function(doc, layer, color) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(sTID('contentLayer'), cTID('Ordn'), cTID('Trgt'));
    desc.putReference(cTID('null'), ref);
    var cdesc = new ActionDescriptor();
    var rgbdesc = new ActionDescriptor();
    rgbdesc.putDouble(cTID('Rd  '), color.rgb.red);
    rgbdesc.putDouble(cTID('Grn '),  color.rgb.green);
    rgbdesc.putDouble(cTID('Bl  '),  color.rgb.blue);
    cdesc.putObject(cTID('Clr '), cTID('RGBC'), rgbdesc);
    desc.putObject(cTID('T   '), sTID('solidColorLayer'), cdesc);
    return executeAction(cTID('setd'), desc, DialogModes.NO);
  }

  return Stdlib.wrapLCLayer(doc, layer, _ftn);
};

Stdlib.createSwatch = function(name, red, green, blue) {
  var clrDesc = new ActionDescriptor();
  clrDesc.putDouble(cTID("Rd  "), red);
  clrDesc.putDouble(cTID("Grn "), green);
  clrDesc.putDouble(cTID("Bl  "), blue);

  var clrsDesc = new ActionDescriptor();
  clrsDesc.putString(cTID("Nm  "), name);
  clrsDesc.putObject(cTID("Clr "), cTID("RGBC"), clrDesc);

  var ref = new ActionReference();
  ref.putClass(cTID("Clrs"));

  var desc = new ActionDescriptor();
  desc.putReference(cTID("null"), ref);
  desc.putObject(cTID("Usng"), cTID("Clrs"), clrsDesc);

  app.executeAction(cTID("Mk  "), desc, DialogModes.NO);
};

Stdlib.saveAllPatterns = function(file) {
  var desc = new ActionDescriptor();
  desc.putPath(cTID("null"), file);
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), cTID("Ptrn"));
  ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt"));
  desc.putReference(cTID("T   "), ref);
  executeAction(cTID("setd"), desc, DialogModes.NO);
};

Stdlib.savePatterns = function(file, indexArray) {
  var desc = new ActionDescriptor();
  desc.putPath(cTID("null"), file);

  var list = new ActionList();
  for (var i = 0; i < indexArray.length; i++) {
    var ref = new ActionReference();
    ref.putIndex(cTID("Ptrn"), indexArray[i]);
    list.putReference(ref);
  }
  desc.putList(cTID("T   "), list);
  executeAction(cTID("setd"), desc, DialogModes.NO);
};

Stdlib.savePattern = function(file, index) {
  Stdlib.savePatterns(file, [index]);
};

Stdlib.fillPattern = function(doc, name, id) {
  function _ftn() {
    var desc203 = new ActionDescriptor();
    desc203.putEnumerated( cTID('Usng'), cTID('FlCn'), cTID('Ptrn') );
    var desc204 = new ActionDescriptor();
    if (name) {
      desc204.putString( cTID('Nm  '), name);
    }
    if (id) {
      desc204.putString( cTID('Idnt'), id);
    }
    desc203.putObject( cTID('Ptrn'), cTID('Ptrn'), desc204 );
    desc203.putUnitDouble( cTID('Opct'), cTID('#Prc'), 100.000000 );
    desc203.putEnumerated( cTID('Md  '), cTID('BlnM'), cTID('Nrml') );
    executeAction( cTID('Fl  '), desc203, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.definePatternFromSelection = function(doc, name) {
  function _ftn() {
    var desc182 = new ActionDescriptor();
    var ref89 = new ActionReference();
    ref89.putClass( cTID('Ptrn') );
    desc182.putReference( cTID('null'), ref89 );
    var ref90 = new ActionReference();
    ref90.putProperty( cTID('Prpr'), cTID('fsel') );
    ref90.putEnumerated( cTID('Dcmn'), cTID('Ordn'), cTID('Trgt') );
    desc182.putReference( cTID('Usng'), ref90 );
    desc182.putString( cTID('Nm  '), name );
    executeAction( cTID('Mk  '), desc182, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};


Stdlib.createGuide = function(doc, orientation, position) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var gdesc = new ActionDescriptor();
    gdesc.putUnitDouble(cTID("Pstn"), cTID("#Pxl"), position);
    gdesc.putEnumerated(cTID("Ornt"), cTID("Ornt"), cTID(orientation));
    desc.putObject(cTID("Nw  "), cTID("Gd  "), gdesc);
    executeAction(cTID("Mk  "), desc, DialogModes.NO );
  }
  Stdlib.wrapLC(doc, _ftn);
};
Stdlib.createVerticalGuide = function(doc, position) {
  Stdlib.createGuide(doc, "Vrtc", position);
};
Stdlib.createHorizontalGuide = function(doc, position) {
  Stdlib.createGuide(doc, "Hrzn", position);
};

Stdlib.clearGuides = function(doc) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID("Gd  "), cTID("Ordn"), cTID("Al  "));
    desc.putReference(cTID("null"), ref );
    executeAction(cTID("Dlt "), desc, DialogModes.NO );
  }

  Stdlib.wrapLC(doc, _ftn);
};

Stdlib.renameChannel = function(doc, oldName, newName) {
  var channels = doc.activeChannels;
  for (var i = 0; i < channels.length; i++) {
    var ch = channels[i];
    if (ch.name == oldName) {
      ch.name = newName;
      return;
    }
  }
};
Stdlib.selectChannel = function(doc, layer, chnl) {
  function _ftn() {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Chnl'), cTID('Chnl'), cTID(chnl));
    desc.putReference(cTID('null'), ref);
    desc.putBoolean(cTID('MkVs'), false );
    executeAction(cTID('slct'), desc, DialogModes.NO );
  }
  Stdlib.wrapLCLayer(doc, layer, _ftn);
};
Stdlib.selectRGBChannel = function(doc, layer) {
  Stdlib.selectChannel(doc, layer, 'RGB ');
};

Stdlib.drawLine = function(doc, start, stop) {

  var startPoint = new PathPointInfo();
  startPoint.anchor = start;
  startPoint.leftDirection = start;
  startPoint.rightDirection = start;
  startPoint.kind = PointKind.CORNERPOINT;

  var stopPoint = new PathPointInfo();
  stopPoint.anchor = stop;
  stopPoint.leftDirection = stop;
  stopPoint.rightDirection = stop;
  stopPoint.kind = PointKind.CORNERPOINT;

  var spi = new SubPathInfo();
  spi.closed = false;
  spi.operation = ShapeOperation.SHAPEXOR;
  spi.entireSubPath = [startPoint, stopPoint];

  var line = doc.pathItems.add("Line", [spi]);
  line.strokePath(ToolType.PENCIL);
  line.remove();
};

Stdlib.selectEllipse = function(doc, bnds, antiAlias) {
  antiAlias = (antiAlias != false);  // defaults to true

  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putProperty(cTID('Chnl'), cTID('fsel'));
  desc.putReference(cTID('null'), ref);
  var bdesc = new ActionDescriptor();
  bdesc.putUnitDouble(cTID('Top '), cTID('#Pxl'), bnds[1]);
  bdesc.putUnitDouble(cTID('Left'), cTID('#Pxl'), bnds[0]);
  bdesc.putUnitDouble(cTID('Btom'), cTID('#Pxl'), bnds[3]);
  bdesc.putUnitDouble(cTID('Rght'), cTID('#Pxl'), bnds[2]);
  desc.putObject(cTID('T   '), cTID('Elps'), bdesc);
  desc.putBoolean(cTID('AntA'), true);
  executeAction(cTID('setd'), desc, DialogModes.NO);
};


Stdlib.stop = function(msg, cont) {
  if (msg == undefined) {
    msg = "Operation cancelled.";
  }
  var desc = new ActionDescriptor();
  desc.putString(cTID("Msge"), msg);
  if (cont != undefined) {
    desc.putBoolean(cTID("Cntn"), cont);
  }
  app.executeAction(cTID("Stop"), desc, DialogModes.ALL);
};

//
// Add a new Text layer with some string...
//
Stdlib.addTextLayer = function(doc, contents, name, size) {
  var layer = doc.artLayers.add();

  layer.kind = LayerKind.TEXT;
  if (name) { layer.name = name; }
  layer.blendMode = BlendMode.NORMAL;
  layer.opacity = 100.0;

  //$.level = 1; debugger;
  var text = layer.textItem;
  var ru = app.preferences.rulerUnits;
  var tu = app.preferences.typeUnits;

  try {
    var newColor = Stdlib.createRGBColor(255, 255, 255);

    app.preferences.typeUnits = TypeUnits.POINTS;
    app.preferences.rulerUnits = Units.PIXELS;

    text.size = (size ? size : 24);    //Math.max(doc.height/100, 3);
    text.font = "ArialMT";
    text.kind = TextType.PARAGRAPHTEXT;
    text.color = newColor;

    app.preferences.rulerUnits = Units.PERCENT;
    text.position = new Array(5, 5);
    app.preferences.rulerUnits = Units.PIXELS;
    text.width  = doc.width;
    text.height = doc.height;
    text.contents = contents;

  } finally {
    app.preferences.rulerUnits = ru;
    app.preferences.typeUnits = tu;
  }

  return layer;
};

// deprecated
Stdlib.addInfoTextLayer = Stdlib.addTextLayer;

Stdlib.convertTextLayerToShape = function(doc, layer) {
  function _ftn() {
    var desc96 = new ActionDescriptor();
    var ref61 = new ActionReference();
    ref61.putClass( sTID('contentLayer') );
    desc96.putReference( cTID('null'), ref61 );
    var ref62 = new ActionReference();
    ref62.putEnumerated( cTID('TxLr'), cTID('Ordn'), cTID('Trgt') );
    desc96.putReference( cTID('Usng'), ref62 );
    executeAction( cTID('Mk  '), desc96, DialogModes.NO );
  }

  Stdlib.wrapLCLayer(doc, layer, _ftn);
};



Stdlib.getPSFontList = function() {
  var flist = app.fonts;
  var fontList = [flist.length];
  for (var i = 0; i < flist.length; i++) {
    fontList[i] = flist[i].postScriptName;
  }
  return fontList;
};

Stdlib.findPSFont = function(f) {
  var tf = Stdlib.getByName(app.fonts, f);
  return (tf ? tf.postScriptName : undefined);
};

Stdlib.getFont = function(f) {
  // getByProperty
  var flist = app.fonts;
  for (var i = 0; i < flist.length; i++) {
    if (f == flist[i].postScriptName) {
      return flist[i];
    }
  }
  return undefined;
};

Stdlib.findFont = function(f) {
  // getByName
  var flist = app.fonts;
  for (var i = 0; i < flist.length; i++) {
    if (f == flist[i].name) {
      return flist[i];
    }
  }
  return undefined;
};

Stdlib.determineFont = function(str) {
  return (Stdlib.getByName(app.fonts, str) ||
          Stdlib.getByProperty(app.fonts, 'postScriptName', str));
};

//
// This doesn't really get the default Type Tool font (see below for that)
// but it does make a reasonable attempt at getting a font that is
// locale appropriate
//
Stdlib.getDefaultFont = function() {
  var str;

  if (isMac()) {
    str = localize("$$$/Project/Effects/Icon/Font/Name/Mac=Lucida Grande");
  } else {
    str = localize("$$$/Project/Effects/Icon/Font/Name/Win=Tahoma");
  }

  var font = Stdlib.determineFont(str);

  if (!font) {
    var f = Stdlib.getApplicationProperty(sTID('fontLargeName'));
    if (f != undefined) {
      font = Stdlib.determineFont(f);
    }
  }

  return font;
};

// 
// This attemps gets the default Type Tool font. Since there is no
// direct API for this, we have to save the current type tool settings,
// reset the settings, then restore the saved settings.
// This will fail if there already exists a tool preset called
// "__temp__". Working around this shortcoming would make things even
// more complex than they already are
//
Stdlib.getDefaultTypeToolFont = function() {
  var str = undefined;
  var typeTool = "typeCreateOrEditTool";

  // need to back-port to use Stdlib functions
  try {
    // get the current tool
    var ref = new ActionReference();
    ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt") );
    var desc = executeActionGet(ref);
    var tid = desc.getEnumerationType(sTID('tool'));
    var currentTool = typeIDToStringID(tid);

    // switch to the type tool
    if (currentTool != typeTool) {
      var desc = new ActionDescriptor();
      var ref = new ActionReference();
      ref.putClass(sTID(typeTool));
      desc.putReference(cTID('null'), ref);
      executeAction(cTID('slct'), desc, DialogModes.NO);
    }

    var ref = new ActionReference();
    ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt") );
    var desc = executeActionGet(ref);
    var tdesc = desc.hasKey(cTID('CrnT')) ?
      desc.getObjectValue(cTID('CrnT')) : undefined;

    if (tdesc) {
      // save the current type tool settings
      var desc4 = new ActionDescriptor();
      var ref4 = new ActionReference();
      ref4.putClass( sTID('toolPreset') );
      desc4.putReference( cTID('null'), ref4 );
      var ref5 = new ActionReference();
      ref5.putProperty( cTID('Prpr'), cTID('CrnT') );
      ref5.putEnumerated( cTID('capp'), cTID('Ordn'), cTID('Trgt') );
      desc4.putReference( cTID('Usng'), ref5 );
      desc4.putString( cTID('Nm  '), "__temp__" );

      // this will fail if there is already a preset called __temp__
      executeAction( cTID('Mk  '), desc4, DialogModes.NO );

      // reset the type tool
      var desc2 = new ActionDescriptor();
      var ref2 = new ActionReference();
      ref2.putProperty( cTID('Prpr'), cTID('CrnT') );
      ref2.putEnumerated( cTID('capp'), cTID('Ordn'), cTID('Trgt') );
      desc2.putReference( cTID('null'), ref2 );
      executeAction( cTID('Rset'), desc2, DialogModes.NO );

      // get the current type tool settings
      var ref = new ActionReference();
      ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt") );
      var desc = executeActionGet(ref);
      var tdesc = desc.getObjectValue(cTID('CrnT'));

      // get the default type tool font
      var charOpts = tdesc.getObjectValue(sTID("textToolCharacterOptions"));
      var styleOpts = charOpts.getObjectValue(cTID("TxtS"));
      str = styleOpts.getString(sTID("fontPostScriptName"));

      // restore the type tool settings
      var desc9 = new ActionDescriptor();
      var ref10 = new ActionReference();
      ref10.putName( sTID('toolPreset'), "__temp__" );
      desc9.putReference( cTID('null'), ref10 );
      executeAction( cTID('slct'), desc9, DialogModes.NO );

      // delete the temp setting
      var desc11 = new ActionDescriptor();
      var ref12 = new ActionReference();
      ref12.putEnumerated( sTID('toolPreset'), cTID('Ordn'), cTID('Trgt') );
      desc11.putReference( cTID('null'), ref12 );
      executeAction( cTID('Dlt '), desc11, DialogModes.NO );
    }

    // switch back to the original tool
    if (currentTool != typeTool) {
      var desc = new ActionDescriptor();
      var ref = new ActionReference();
      ref.putClass(tid);
      desc.putReference(cTID('null'), ref);
      executeAction(cTID('slct'), desc, DialogModes.NO);
    }
  } catch (e) {
    return undefined;
  }

  return str;
};


// XXX fix this later
Stdlib.setFontRealName = function( fontName ) {
  var ref = new ActionReference();
  ref.putProperty(sTID('property'), sTID('textStyle'));
  ref.putEnumerated(sTID('textLayer'),
                    sTID('ordinal'),
                    sTID('targetEnum'));

  var desc = new ActionDescriptor();
  desc.putReference(sTID('null'), ref);

  var edesc = new ActionDescriptor();
  edesc.putString(sTID('fontName'), fontName);
  edesc.putObject(sTID('to'), sTID('textStyle'), desc);

  executeAction(sTID('set'), edesc, DialogModes.NO);
};

// UnitValue functions

Stdlib.unitValueRex = /(-)?(\d+)?(\.\d+)? (in|ft|yd|mi|mm|cm|m|km|pt|pc|tpt|ptc|ci|px|%)/;


//
//=============================== Debugging ===================================
//

//
// fullStop
//     Drop into the debugger as long as 'stop' is not false
//
Stdlib.fullStop = function(stop) {
  if (stop != false) {
    $.level = 1;
    debugger;
  }
};
//fullStop = Stdlib.fullStop;

//
// a dumb little piece of code that does a busy-wait
// for some period of time. Crank units up 'til it waits
// long enough for your purposes.
// This is deprecated in CS2.
//
Stdlib.pause = function(units){
  for (var i = 0; i < units; i++) {
    var x = 11.400930;
    var y = 33.902312;
    Stdlib.pause_dummy = eval("Math.sqrt(x/y)");
  }
};
Stdlib.listGlobals = function() {
  var lst = [];
  for (var i in global) {
    lst.push(i);
  }
  lst.sort();
  var str = '';
  for (var j in lst) {
    i = lst[j];
    str += i + ":\t";
    try {
      var o = global[i];
      str += "[" + (typeof o) + "]";
      if (typeof o != "function") {
        str += ":\t" + global[i].toString();
      }
    } catch (e) {
      str += "[]";
    }
    str += "\r\n";
  }
  return str;
};
listGlobals = Stdlib.listGlobals;

Stdlib.listProps = function(obj) {
  var s = [];
  var sep = (isBridge() ? "\r" : "\r\n");

  for (var x in obj) {
    var str = x + ":\t";
    try {
      var o = obj[x];
      str += (typeof o == "function") ? "[function]" : o;
    } catch (e) {
    }
    s.push(str);
  }
  s.sort();

  return s.join(sep);
};
listProps = Stdlib.listProps;

Stdlib.dumpGlobals = function(fname) {
  var f = new File(fname || "/c/temp/globals.log");
  f.open("w", "TEXT", "????");
  f.writeln(listGlobals());
  f.close();
};

Stdlib.showtext = function showtext(msg) {
  confirm(msg);
};

// A helper function for debugging
// It also helps the user see what is going on
// if you turn it off for this example you
// get a flashing cursor for a number (long) time
Stdlib.waitForRedraw = function() {
  var desc = new ActionDescriptor();
  desc.putEnumerated(cTID("Stte"), cTID("Stte"), cTID("RdCm"));
  executeAction(cTID("Wait"), desc, DialogModes.NO);
};

// refresh = Stdlib.waitForRedraw;

Stdlib._dumpRI = function(ri) {
  var str = '';
  var props =
  [ "name",
    "arguments",
    "dataType",
    "defaultValue",
    "description",
    "help",
    "isCollection",
    "max",
    "min",
    "type"];

  str += '\t' + ri.name + '\r\n';

  for (var i = 0; i < props.length; i++) {
    var n = props[i];
    var v = ri[n];

    if (v != undefined) {
      str += "\t\t" + n + " : " + v + "\r\n";
    }
  }
  return str;
}
Stdlib.dumpRTI = function(o) {
  var r = o.reflect;
  var str = '';

  //debugger;
  str += "//\r\n// " + r.name + "\r\n//    " + r.help + "\r\n//\r\n";
  str += "class " + r.name + "\r\n";
  str += "  props:\r\n";
  for (var i = 0; i < r.properties.length; i++) {
    var ri = r.properties[i];
    str += Stdlib._dumpRI(ri);
  }
  str += "  methods:\r\n";
  for (var i = 0; i < r.methods.length; i++) {
    var ri = r.methods[i];
    str += Stdlib._dumpRI(ri);
  }
  return str;
};

Stdlib.getLastJSLogEntry = function(fptr) {
  if (fptr) {
    fptr = Stdlib.convertFptr(fptr);
  } else {
    fptr = new File("/c/ScriptingListenerJS.log");
    if (!fptr.exists) {
      Error.runtimeError(Stdlib.IO_ERROR_CODE, "Unable to find SLC log.");
    }
  }

  fptr.open("r", "TEXT", "????") || throwFileError(fptr, "Unable to open");
  //fptr.lineFeed = "unix";

  fptr.seek(1, 2);  // start of at the end of the file
  var prev = fptr.readch();

  for (var i = 2; i < fptr.length; i++) {
    fptr.seek(i, 2);  // start of at the end of the file
    var c = fptr.readch();
    if (c == '\n' && prev == '/') {
      break;
    }
    prev = c;
  }
  if (i == fptr.length && prev != '/') {
    return undefined;
  }

  fptr.readln();

  if (CSVersion() >= 4) {
    // XXX There is a bug in CS4 that causes the previous readln to
    // read one too many characters. This looks for the bug and works
    // around it.

    var loc = fptr.tell();
    var str = fptr.read();

    if (str[0] == 'a') {
      fptr.seek(loc-1);
      str = fptr.read();
    }

  } else {
    var str = fptr.read();
  }
  fptr.close();
  return str;
};


Stdlib.writeDescriptor = function(fptr, desc) {
  fptr = Stdlib.convertFptr(fptr);
  fptr.encoding = 'BINARY';
  if (!fptr.open("w")) {
    throwFileError(fptr);
  }
  var str = desc.toStream();
  if (!fptr.write(str)) {
    throwFileError(fptr);
  }
  fptr.close();
  delete str;
};

Stdlib.readDescriptor = function(fptr) {
  var fptr = Stdlib.convertFptr(fptr);
  fptr.encoding = 'BINARY';
  if (!fptr.open("r")) {
    throwFileError(fptr);
  }
  var str = fptr.read();
  fptr.close();

  var desc = new ActionDescriptor();
  desc.fromStream(str);
  return desc;
};

//=============================== UnitValue support code ======================
Stdlib._units = undefined;
Stdlib._unitsInit = function() {
  if (!isPhotoshop()) {
    return;
  }
  Stdlib._units = app.preferences.rulerUnits.toString();
  Stdlib._unitMap = {};
  Stdlib._unitMap[Units.INCHES.toString()] =  "in";
  Stdlib._unitMap[Units.CM.toString()] =      "cm";
  Stdlib._unitMap[Units.MM.toString()] =      "mm";
  Stdlib._unitMap[Units.PERCENT.toString()] = "%";
  Stdlib._unitMap[Units.PICAS.toString()] =   "pc";
  Stdlib._unitMap[Units.PIXELS.toString()] =  "px";
  Stdlib._unitMap[Units.POINTS.toString()] =  "pt";

  Stdlib._unitStrMap = {};
  Stdlib._unitStrMap["in"] = "in";
  Stdlib._unitStrMap["cm"] = "cm";
  Stdlib._unitStrMap["mm"] = "mm";
  Stdlib._unitStrMap["%"]  = "%";
  Stdlib._unitStrMap["pc"] = "picas";
  Stdlib._unitStrMap["px"] = "pixels";
  Stdlib._unitStrMap["pt"] = "points";
};
Stdlib._unitsInit();
Stdlib.getDefaultUnits = function() {
  return Stdlib._unitMap[Stdlib._units];
};
Stdlib.getDefaultUnitsString = function() {
  return Stdlib._unitStrMap[Stdlib._unitMap[Stdlib._units]];
};
Stdlib.getDefaultRulerUnitsString = Stdlib.getDefaultUnitsString;

Stdlib.validateUnitValue = function(str, bu, ru) {
  var self = this;

  if (str instanceof UnitValue) {
    return str;
  }

  if (bu && bu.typename == "Document") {
    var doc = bu;
    ru = doc.width.type;
    bu = UnitValue(1/doc.resolution, ru);

  } else {
    if (!ru) {
      ru = Stdlib.getDefaultRulerUnitsString();
    }
    if (!bu) {
      UnitValue.baseUnit = UnitValue(1/72, ru);
    }
  }
  str = str.toString();

  var zero = new UnitValue("0 " + ru);
  var un = zero;
  if (!str.match(/[a-z%]+/)) {
    str += ' ' + ru.units;
  }
  un = new UnitValue(str);

  if (isNaN(un.value) || un.type == '?') {
    return undefined;
  }

  if (un.value == 0) {
    un = zero;
  }

  return un;
};

//
// Stdlib.getPixelValue
// Useful for converting strings input by a user into a pixel value.
// 'val' may be any valid UnitValue string.
//    Stdlib.getPixelValue(doc, "20 in")
//    Stdlib.getPixelValue(300, "20", undefined, "in")
//    Stdlib.getPixelValue(doc, "20%", 1200)
//    Stdlib.getPixelValue(doc, "20", 1200, '%')
//
Stdlib.getPixelValue = function(docRes, val, base, defaultUnits) {
  var res;
  if (val == undefined) {
    return Number.NaN;
  }
  if (val.constructor == Number) {
    val = val.toString();
  }
  if (val.constructor != String) {
    return Number.NaN;
  }
  if (docRes.constructor == Number) {
    res = docRes;
  } else {
    res = docRes.resolution;
  }

  val = val.trim();

  // convert val to a unit value

  if (!defaultUnits) {
    defaultUnits = Stdlib.getDefaultUnits();
  }

  var u = new UnitValue(val);
  if (u.type == '?') {
    var n = parseFloat(val);
    if (isNaN(n)) {
      return Number.NaN;
    }
    u = new UnitValue(n, defaultUnits);
  }

  // handle '%' manually
  if (u.type == '%') {
    u = new UnitValue(base * u.value / 100, "px");
  }

  var pxVal;

  // handle 'in' manually
  if (u.type == 'in') {
    pxVal = res * u.value;

  } else if (u.type == 'px') {
    pxVal = u.value;

  } else {
    u.baseUnit = new UnitValue(1/res, "in");
    pxVal = u.as("px");
  }

  return pxVal;
};

/*

var regex = /\-*\d*\.{0,1}\d* *(?:in|inch|inches|ft|foot|feet|yd|yard|yards|mi|mile|miles|mm|millimeter|millimeters|cm|centimeter|centimeters|m|meter|meters|km|kilometer|kilometers|pt|point|points|pc|pica|picas|ci|cicero|ciceros)?/gi;
var myMatch = myString.match( regex );
try {
  var fieldIsValid = ( myEvent.target.text == myEvent.target.text.match( regex )[ 0 ] );
} catch( e ) {
  var fieldIsValid = false;
}

*/


//
//============================= File Browser =================================
//
// This FileBrowser code works _only_ in PSCS
//

// get all the files in the file browser that are selected or flagged
// this code was lifted from Dr. Brown's Image Processor2.0.js
// and is copyrighted by Adobe

FileBrowser = function FileBrowser() {};

FileBrowser.getSelectedFiles = function() {
  return FileBrowser.getFiles(true, false);
};
FileBrowser.getFlaggedFiles = function() {
  return FileBrowser.getFiles(false, true);
};
FileBrowser.getFiles = function(selected, flagged) {
  var fileArray = new Array();
  var ffIndex = 0;

  var ref = new ActionReference();
  var fileBrowserStrID = sTID( "fileBrowser" );
  ref.putProperty( cTID( 'Prpr' ), fileBrowserStrID );
  ref.putEnumerated( cTID( 'capp' ), cTID( 'Ordn' ),
                     cTID( 'Trgt' ) );
  var desc = executeActionGet( ref );

  if ( desc.count > 0 && desc.hasKey( fileBrowserStrID ) ) {
    var fbDesc = desc.getObjectValue( fileBrowserStrID );
    var keyFilesList = cTID( 'flst' );

    if ( fbDesc.count > 0 && fbDesc.hasKey( keyFilesList ) ) {
      var fileList = fbDesc.getList( keyFilesList );
      var flaggedID = sTID( "flagged" );
      var selectedID = cTID( 'fsel' );
      var keyPath = cTID( 'Path' );

      for ( var i = 0; i < fileList.count; i++ ) {
        var fileDesc = fileList.getObjectValue( i );
        if ( fileDesc.count > 0 && fileDesc.hasKey( keyPath )) {
          if ( flagged == true && fileDesc.hasKey( flaggedID )
               && fileDesc.getBoolean( flaggedID )) {
            var fileOrFolder = fileDesc.getPath( keyPath );
            if ( fileOrFolder instanceof File ) {
              fileArray[ffIndex++] = fileOrFolder;
            }
          }

          // fixed so that a file will not be added twice if its flagged
          // and selected and both options are 'true'
          if ( flagged == true && fileDesc.hasKey( flaggedID )
               && fileDesc.getBoolean( flaggedID )) {
            var fileOrFolder = fileDesc.getPath( keyPath );
            if ( fileOrFolder instanceof File ) {
              fileArray[ffIndex++] = fileOrFolder;
            }
          } else if ( selected == true && fileDesc.hasKey( selectedID )
               && fileDesc.getBoolean( selectedID )) {
            var fileOrFolder = fileDesc.getPath( keyPath );
            if ( fileOrFolder instanceof File ) {
              fileArray[ffIndex++] = fileOrFolder;
            }
          }

          // if neither option is set, add everything
          if (selected != true && flagged != true) {
            var fileOrFolder = fileDesc.getPath( keyPath );
            if ( fileOrFolder instanceof File ) {
              fileArray[ffIndex++] = fileOrFolder;
            }
          }
        }
      }
    }
  }

  return fileArray;
};

//
// Set
//     these are a collection of functions for operating
//     on arrays as proper Set: each entry in the array
//     is unique in the array. This is useful for things
//     like doc.info.keywords
//
Set = function Set() {};
Set.add = function(ar, str) { return Set.merge(ar, new Array(str)); };
Set.remove = function(ar, str) {
  var nar = Set.copy(ar);
  for (var idx in nar) {
    if (nar[idx] == str) {
      nar.splice(idx, 1);
    }
  }
  return nar;
};
Set.contains = function(ar, str) {
  for (var idx in ar) {
    if (ar[idx] == str) {
      return true;
    }
  }
  return false;
};
Set.merge = function(ar1, ar2) {
  var obj = new Object();
  var ar = [];

  if (ar1 != undefined) {
    if (ar1 instanceof Array) {
      for (var i = 0; i < ar1.length; i++) {
        obj[ar1[i]] = 1;
      }
    } else {
      Error.runtimeError(19, "ar1");  // Bad Argument
    }
  }
  if (ar2 != undefined) {
    if (ar2 instanceof Array) {
      for (var i = 0; i < ar2.length; i++) {
        obj[ar2[i]] = 1;
      }
    } else {
      Error.runtimeError(19, "ar2");  // Bad Argument
    }
  }
  for (var idx in obj) {
    if (typeof (obj[idx]) != "function") {
      ar.push(idx);
    }
  }
  ar.sort();
  return ar;
}
Set.copy = function(ar) {
  return ar.slice(0);
};


ColorProfileNames = {};
ColorProfileNames.ADOBE_RGB      = "Adobe RGB (1998)";
ColorProfileNames.APPLE_RGB      = "Apple RGB";
ColorProfileNames.PROPHOTO_RGB   = "ProPhoto RGB";
ColorProfileNames.SRGB           = "sRGB IEC61966-2.1";
ColorProfileNames.COLORMATCH_RGB = "ColorMatch RGB";
ColorProfileNames.WIDEGAMUT_RGB  = "Wide Gamut RGB";

Stdlib.getProfileNameFromFile = function(file) {
  file.encoding = 'BINARY';
  file.open('r');
  var str = file.read();
  file.close();
  var m = str.match(/\x00desc\x00/);
  if (m == null) {
    // if we couldn't find the magic marker, return the base filename
    return file.name.replace(/\.ic(c|m)/i, '');
  }

  var ofs = m.index+12;
  var len = str.charCodeAt(ofs);
  var s = str.substring(ofs+1, ofs+len);
  return s;
};

// ColorProfileNames.KODAK_DC     = "KODAK DC Series Digital Camera";
// ColorProfileNames.MONITOR_SRGB = "Monitor - sRGB IEC61966-2.1";

Stdlib.getColorSettings = function() {
  var desc = Stdlib.getApplicationProperty(sTID("colorSettings"));
  return desc;
};

Timer = function() {
  var self = this;
  self.startTime = 0;
  self.stopTime  = 0;
  self.elapsed = 0;
  self.cummulative = 0;
  self.count = 0;
};

Timer.prototype.start = function() {
  this.startTime = new Date().getTime();
};
Timer.prototype.stop = function() {
  var self = this;
  self.stopTime = new Date().getTime();
  self.elapsed = (self.stopTime - self.startTime)/1000.00;
  self.cummulative += self.elapsed;
  self.count++;
  self.per = self.cummulative/self.count;
};

Stdlib.decimalPoint = ($.decimalPoint || '.');

//========================= String formatting ================================
//
// String.sprintf
//
// Documentation:
//   http://www.opengroup.org/onlinepubs/007908799/xsh/fprintf.html
//
// From these sites:
//   http://forums.devshed.com/html-programming-1/sprintf-39065.html
//   http://jan.moesen.nu/code/javascript/sprintf-and-printf-in-javascript/
//
String.prototype.sprintf = function() {
  var args = [this];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  return String.sprintf.apply(null, args);
};
String.sprintf = function() {
  function _sprintf() {
    if (!arguments || arguments.length < 1 || !RegExp)  {
      return "Error";
    }
    var str = arguments[0];
    var re = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)/m;
            //') /* for xemacs auto-indent  */
    var a = b = [], numSubstitutions = 0, numMatches = 0;
    var result = '';

    while (a = re.exec(str)) {
      var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
      var pPrecision = a[5], pType = a[6], rightPart = a[7];

      rightPart = str.slice(a[0].length);

      numMatches++;

      if (pType == '%') {
        subst = '%';
      } else {
        numSubstitutions++;
        if (numSubstitutions >= arguments.length) {
          alert('Error! Not enough function arguments (' +
                (arguments.length - 1)
                + ', excluding the string)\n'
                + 'for the number of substitution parameters in string ('
                + numSubstitutions + ' so far).');
        }
        var param = arguments[numSubstitutions];
        var pad = '';
        if (pPad && pPad.slice(0,1) == "'") {
          pad = leftpart.slice(1,2);
        } else if (pPad) {
          pad = pPad;
        }
        var justifyRight = true;
        if (pJustify && pJustify === "-") {
          justifyRight = false;
        }
        var minLength = -1;
        if (pMinLength) {
          minLength = toNumber(pMinLength);
        }
        var precision = -1;
        if (pPrecision && pType == 'f') {
          precision = toNumber(pPrecision.substring(1));
        }
        var subst = param;
        switch (pType) {
        case 'b':
          subst = toNumber(param).toString(2);
          break;
        case 'c':
          subst = String.fromCharCode(toNumber(param));
          break;
        case 'd':
          subst = toNumber(param) ? Math.round(toNumber(param)) : 0;
            break;
        case 'u':
          subst = Math.abs(Math.round(toNumber(param)));
          break;
        case 'f':
          if (precision == -1) {
            precision = 6;
          }
          subst = parseFloat(param).toFixed(Math.min(precision, 20));
          subst = subst.replace('.', Stdlib.decimalPoint);
//             ? Math.round(parseFloat(param) * Math.pow(10, precision))
//             / Math.pow(10, precision)
//             : ;
            break;
        case 'o':
          subst = toNumber(param).toString(8);
          break;
        case 's':
          subst = param;
          break;
        case 'x':
          subst = ('' + toNumber(param).toString(16)).toLowerCase();
          break;
        case 'X':
          subst = ('' + toNumber(param).toString(16)).toUpperCase();
          break;
        }
        var padLeft = minLength - subst.toString().length;
        if (padLeft > 0) {
          var arrTmp = new Array(padLeft+1);
          var padding = arrTmp.join(pad?pad:" ");
        } else {
          var padding = "";
        }
      }
      result += leftpart + padding + subst;
      str = rightPart;
    }
    result += str;
    return result;
  };

  return _sprintf.apply(null, arguments);
};


//========================= Date formatting ================================
//
// Date.strftime
//    This is a third generation implementation. This is a JavaScript
//    implementation of C the library function 'strftime'. It supports all
//    format specifiers except U, W, z, Z, G, g, O, E, and V.
//    For a full description of this function, go here:
//       http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html
//    Donating implementations can be found here:
//       http://redhanded.hobix.com/inspect/showingPerfectTime.html
//    and here:
//       http://wiki.osafoundation.org/bin/view/Documentation/JavaScriptStrftime
//
// Object Method
Date.prototype.strftime = function (fmt) {
  return Date.strftime(this, fmt);
};

// Class Function
Date.strftime = function(date, fmt) {
  var t = date;
  var cnvts = Date.prototype.strftime._cnvt;
  var str = fmt;
  var m;
  var rex = /([^%]*)%([%aAbBcCdDehHIjmMprRStTuwxXyYZ]{1})(.*)/;

  var result = '';
  while (m = rex.exec(str)) {
    var pre = m[1];
    var typ = m[2];
    var post = m[3];
    result += pre + cnvts[typ](t);
    str = post;
  }
  result += str;
  return result;
};

// some ISO8601 formats
Date.strftime.iso8601_date = "%Y-%m-%d";
Date.strftime.iso8601_full = "%Y-%m-%dT%H:%M:%S";
Date.strftime.iso8601      = "%Y-%m-%d %H:%M:%S";
Date.strftime.iso8601_time = "%H:%M:%S";

Date.prototype.toISO = function() {
  return this.strftime(Date.strftime.iso8601);
};


// the specifier conversion function table
Date.prototype.strftime._cnvt = {
  zeropad: function( n ){ return n>9 ? n : '0'+n; },
  spacepad: function( n ){ return n>9 ? n : ' '+n; },
  ytd: function(t) {
    var first = new Date(t.getFullYear(), 0, 1).getTime();
    var diff = t.getTime() - first;
    return parseInt(((((diff/1000)/60)/60)/24))+1;
  },
  a: function(t) {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][t.getDay()];
  },
  A: function(t) {
    return ['Sunday','Monday','Tuesdsay','Wednesday','Thursday','Friday',
            'Saturday'][t.getDay()];
  },
  b: function(t) {
    return ['Jan','Feb','Mar','Apr','May','Jun', 'Jul','Aug','Sep','Oct',
            'Nov','Dec'][t.getMonth()]; },
  B: function(t) {
    return ['January','February','March','April','May','June', 'July','August',
            'September','October','November','December'][t.getMonth()]; },
  c: function(t) {
    return (this.a(t) + ' ' + this.b(t) + ' ' + this.e(t) + ' ' +
            this.H(t) + ':' + this.M(t) + ':' + this.S(t) + ' ' + this.Y(t));
  },
  C: function(t) { return this.Y(t).slice(0, 2); },
  d: function(t) { return this.zeropad(t.getDate()); },
  D: function(t) { return this.m(t) + '/' + this.d(t) + '/' + this.y(t); },
  e: function(t) { return this.spacepad(t.getDate()); },
  // E: function(t) { return '-' },
  F: function(t) { return this.Y(t) + '-' + this.m(t) + '-' + this.d(t); },
  g: function(t) { return '-'; },
  G: function(t) { return '-'; },
  h: function(t) { return this.b(t); },
  H: function(t) { return this.zeropad(t.getHours()); },
  I: function(t) {
    var s = this.zeropad((t.getHours() + 12) % 12);
    return (s == "00") ? "12" : s;
  },
  j: function(t) { return this.ytd(t); },
  k: function(t) { return this.spacepad(t.getHours()); },
  l: function(t) {
    var s = this.spacepad((t.getHours() + 12) % 12);
    return (s == " 0") ? "12" : s;
  },
  m: function(t) { return this.zeropad(t.getMonth()+1); }, // month-1
  M: function(t) { return this.zeropad(t.getMinutes()); },
  n: function(t) { return '\n'; },
  // O: function(t) { return '-' },
  p: function(t) { return this.H(t) < 12 ? 'AM' : 'PM'; },
  r: function(t) {
    return this.I(t) + ':' + this.M(t) + ':' + this.S(t) + ' ' + this.p(t);
  },
  R: function(t) { return this.H(t) + ':' + this.M(t); },
  S: function(t) { return this.zeropad(t.getSeconds()); },
  t: function(t) { return '\t'; },
  T: function(t) {
    return this.H(t) + ':' + this.M(t) + ':' + this.S(t) + ' ' + this.p(t);
  },
  u: function(t) {return t.getDay() ? t.getDay()+1 : 7; },
  U: function(t) { return '-'; },
  w: function(t) { return t.getDay(); }, // 0..6 == sun..sat
  W: function(t) { return '-'; },       // not available
  x: function(t) { return this.D(t); },
  X: function(t) { return this.T(t); },
  y: function(t) { return this.zeropad(this.Y(t) % 100); },
  Y: function(t) { return t.getFullYear().toString(); },
  z: function(t) { return ''; },
  Z: function(t) { return ''; },
  '%': function(t) { return '%'; }
};

// this needs to be worked on...
function _weekNumber(date) {
  var ytd = toNumber(date.strftime("%j"));
  var week = Math.floor(ytd/7);
  if (new Date(date.getFullYear(), 0, 1).getDay() < 4) {
    week++;
  }
  return week;
};

File.prototype.toUIString = function() {
  return decodeURI(this.fsName);
};
Folder.prototype.toUIString = function() {
  return decodeURI(this.fsName);
};

File.prototype.asString = File.prototype.toUIString; // deprecated

//========================= Filename formatting ===============================
//
// File.strf(fmt [, fs])
// Folder.strf(fmt [, fs])
//   This is based of the file name formatting facility in exiftool. Part of
//   the description is copied directly from there. You can find exiftool at:
//      http://www.sno.phy.queensu.ca/~phil/exiftool/
//
// Description:
//   Format a file string using a printf-like format string
//
// fmt is a string where the following substitutions occur
//   %d - the directory name (no trailing /)
//   %f - the file name without the extension
//   %e - the file extension without the leading '.'
//   %p - the name of the parent folder
//   %% - the '%' character
//
// if fs is true the folder is in local file system format
//   (e.g. C:\images instead of /c/images)
//
// Examples:
//
// Reformat the file name:
// var f = new File("/c/work/test.jpg");
// f.strf("%d/%f_%e.txt") == "/c/work/test_jpg.txt"
//
// Change the file extension
// f.strf("%d/%f.psd") == "/c/work/test.psd"
//
// Convert to a file name in a subdirectory named after the extension
// f.strf("%d/%e/%f.%e") == "/c/work/jpg/test.jpg"
//
// Change the file extension and convert to a file name in a subdirectory named
//   after the new extension
// f.strf("%d/psd/%f.psd") == "/c/work/psd/test.psd"
//
// var f = new File("~/.bashrc");
// f.strf("%f") == ".bashrc"
// f.strf("%e") == ""
//
// Advanced Substitution
//   A substring of the original file name, directory or extension may be
//   taken by specifying a string length immediately following the % character.
//   If the length is negative, the substring is taken from the end. The
//   substring position (characters to ignore at the start or end of the
//   string) may be given by a second optional value after a decimal point.
// For example:
//
// var f = new File("Picture-123.jpg");
//
// f.strf("%7f.psd") == "Picture.psd"
// f.strf("%-.4f.psd") == "Picture.psd"
// f.strf("%7f.%-3f") == "Picture.123"
// f.strf("Meta%-3.1f.xmp") == "Meta12.xmp"
//
File.prototype.strf = function(fmt, fs) {
  var self = this;
  var name = decodeURI(self.name);
  //var name = (self.name);

  // get the portions of the full path name

  // extension
  var m = name.match(/.+\.([^\.\/]+)$/);
  var e = m ? m[1] : '';

  // basename
  m = name.match(/(.+)\.[^\.\/]+$/);
  var f = m ? m[1] : name;

  fs |= !($.os.match(/windows/i)); // fs only matters on Windows
  // fs |= isMac();

  // full path...
  var d = decodeURI((fs ? self.parent.fsName : self.parent.absoluteURI));

  // parent directory...
  var p = decodeURI(self.parent.name);

  //var d = ((fs ? self.parent.fsName : self.parent.toString()));

  var str = fmt;

  // a regexp for the format specifiers

  var rex = /([^%]*)%(-)?(\d+)?(\.\d+)?(%|d|e|f|p)(.*)/;

  var result = '';

  while (m = rex.exec(str)) {
    var pre = m[1];
    var sig = m[2];
    var len = m[3];
    var ign = m[4];
    var typ = m[5];
    var post = m[6];

    var subst = '';

    if (typ == '%') {
      subst = '%';
    } else {
      var s = '';
      switch (typ) {
        case 'd': s = d; break;
        case 'e': s = e; break;
        case 'f': s = f; break;
        case 'p': s = p; break;
        // default: s = "%" + typ; break; // let others pass through
      }

      var strlen = s.length;

      if (strlen && (len || ign)) {
        ign = (ign ? Number(ign.slice(1)) : 0);
        if (len) {
          len = Number(len);
          if (sig) {
            var _idx = strlen - len - ign;
            subst = s.slice(_idx, _idx+len);
          } else {
            subst = s.slice(ign, ign+len);
          }
        } else {
          if (sig) {
            subst = s.slice(0, strlen-ign);
          } else {
            subst = s.slice(ign);
          }
        }

      } else {
        subst = s;
      }
    }

    result += pre + subst;
    str = post;
  }

  result += str;

  return result;
};
Folder.prototype.strf = File.prototype.strf;


/*
  From the exiftool documentation:
  Set the print format for GPS coordinates. FMT uses the same syntax as the
  printf format string. The specifiers correspond to degrees, minutes and
  seconds in that order, but minutes and seconds are optional. For example,
  the following table gives the output for the same coordinate using various
  formats:

                FMT                  Output
        -------------------    ------------------
        "%d deg %d' %.2f"\"    54 deg 59' 22.80"   (the default)
        "%d deg %.4f min"      54 deg 59.3800 min
        "%.6f degrees"         54.989667 degrees

The common degree marker is a Unicode literal of \u00B0
*/
//
// Test cases
//
/*
Stdlib.strfGPSstr(undefined, "54.00 59.00' 22.80\"");
Stdlib.strfGPSstr(undefined, "28.00 9.97' 0.00\"");
Stdlib.strfGPSstr("%d deg %.4f min", "28.00 9.97' 0.00\"");
Stdlib.strfGPSstr("%d deg %.4f min", "28.00 9.50' 0.00\"");
Stdlib.strfGPSstr(undefined, "28.00 9.50' 0.00\"");
Stdlib.strfGPSstr("%f", "28.00 9.97' 0.00\"");
Stdlib.strfGPSstr("%f", "28.50 0.00' 0.00\"");
Stdlib.strfGPSstr(undefined, "28.50 0.00' 0.00\"");
Stdlib.strfGPSstr(undefined, "54,59,22");
Stdlib.strfGPSstr(undefined, "54,59.22");
Stdlib.strfGPSstr("%d deg %.4f min", "54,59.22");
Stdlib.strfGPSstr(undefined, "54 59 22");
Stdlib.strfGPSstr(undefined, "54.00 deg 59.00 min 22.23 secs");
*/
//

Stdlib.DEFAULT_GPS_FORMAT = "%d deg %d' %.2f\"";

Stdlib.strfGPSstr = function(fmtStr, gpsStr) {

  // This is the most likely format
  var r = gpsStr.match(/(\d+\.\d+) (\d+\.\d+)\' (\d+\.\d+)\"/);

  // This is the format from the XMP Schema spec
  if (!r) {
    var r2 = r = gpsStr.match(/(\d+)\,(\d+)(\,|\.)(\d+)/);
  }

  // This format should pick up just about anything else
  if (!r) {
    var rex = /(\d+(?:\.\d+)?)[^\d\.]+(\d+(?:\.\d+)?)[^\d\.]+(\d+(?:\.\d+)?)/;
    var r3 = r = gpsStr.match(rex);
  }

  if (!r) {
    return fmtStr;
  }

  // if we matched either the first or third patterns
  if (!r2) {
    var d = Number(r[1]);
    var m = Number(r[2]);
    var s = Number(r[3]);

    var xm = (d - Math.floor(d)) * 60;
    var xs = (m - Math.floor(m)) * 60;

    m += s/60;
    d += m/60;
    if (s == 0) {
      s = xs;
    }
    if (m == 0) {
      m = xm;
    }

    return Stdlib.strfGPS(fmtStr, d, m, s);
  }

  if (r2) {
    var d = Number(r[1]);

    var sep = r[3];

    if (sep == '.') {
      var m = Number(r[2]);
      var s = Number("0." + r[4]) * 60;

    } else {
      var m = Number(r[2]);
      var s = Number(r[4]);
    }
    return Stdlib.strfGPS(fmtStr, d, m, s);
  }

  // if we can't figure out what's going on, just return the format spec
  return fmtStr;
};

Stdlib.strfGPS = function(fmtStr, deg, min, sec) {
  if (sec == undefined) {
    sec = 0;
  }
  if (min == undefined) {
    min = 0;
  }
  if (min == Math.floor(min)) {
    min += sec/60;
  }
  if (deg == Math.floor(deg)) {
    deg += min/60;
  }
  if (fmtStr == undefined) {
    fmtStr = Stdlib.DEFAULT_GPS_FORMAT;
  }

  return String.sprintf(fmtStr, deg, min, sec);
};


//
// Get the XMP value for (tag) from the object (obj).
// obj can be a String, XML, or Document. Support for
// Files will be added later.
//
// Based on getXMPTagFromXML from Adobe's StackSupport.jsx
//
Stdlib.getXMPValue = function(obj, tag) {
  var xmp;

  if (obj.constructor == String) {
    xmp = new XML(obj);

  } else if (obj.typename == "Document") {
    xmp = new XML(obj.xmpMetadata.rawData);

  } else if (obj instanceof XML) {
    xmp = obj;

  // } else if (obj instanceof File) {
  // add support for Files

  } else {
    Error.runtimeError(19, "obj");
  }

	var s;
	
	// Ugly special case
	if (tag == "ISOSpeedRatings") {
		s = String(eval("xmp.*::RDF.*::Description.*::ISOSpeedRatings.*::Seq.*::li"));

  }	else {
		s = String(eval("xmp.*::RDF.*::Description.*::" + tag));
  }

  return s;
};

// This only works in CS4+
Stdlib.loadXMPScript = function() {
  if (!ExternalObject.AdobeXMPScript) {
    ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
  }
};

// This only works in CS4+
Stdlib.unloadXMPScript = function(){
  if (ExternalObject.AdobeXMPScript) {
    ExternalObject.AdobeXMPScript.unload();
    ExternalObject.AdobeXMPScript = undefined;
  }
};

/*
d = Stdlib.toDescriptor({
  name: "test",
  num: 22,
  flag: true
});
o = Stdlib.fromDescriptor(d);
*/
Stdlib.toDescriptor = function(obj) {
  if (arguments.length != 1) {
    Error.runtimeError(1221, "obj"); // wrong number of arguments
  }
  if (obj == undefined) {
    Error.runtimeError(2, "obj");    // undefined
  }
  if (typeof(obj) != "object") {
    Error.runtimeError(21, "obj");   // is not an object
  }

  var nameID = cTID("nm  ");
  var valueID = cTID("Vl  ");
  var componentID = sTID("component");

  function addProperty(desc, nm, val) {
    var typ = typeof(val);

    var pdesc = new ActionDescriptor();
    pdesc.putString(nameID, nm);

    switch (typ) {
      case "number": {
        pdesc.putDouble(valueID, val);
        break;
      }
      case "string": {
        pdesc.putString(valueID, val);
        break;
      }
      case "boolean": {
        pdesc.putBoolean(valueID, val);
        break;
      }
      case "object": {
        pdesc.putString(valueID, val.toString());
        break;
      }
      case "undefined": pdesc = undefined; break;
      case "function":  pdesc = undefined; break;
      default:          pdesc = undefined; break;
    };
    desc.putObject(sTID(nm), componentID, pdesc);
  };

  var desc = new ActionDescriptor();

  for (var idx in obj) {
    if (idx.startsWith("_")) {
      continue;
    }
    var val = obj[idx];
    if (val || typeof(val) == "undefined" || typeof(val) == "function") {
      continue;
    }

    addProperty(desc, idx, val);
  }

  return desc;
};

Stdlib.fromDescriptor = function(desc, obj) {
  if (arguments.length < 1 || arguments.length > 2) {
    Error.runtimeError(1221);        // wrong number of arguments
  }
  if (desc == undefined) {
    Error.runtimeError(2, "desc");   // is undefined
  }
  if (typeof(desc) != "object") {
    Error.runtimeError(21, "desc");   // is not an object
  }
  if (!(desc instanceof ActionDescriptor)) {
    Error.runtimeError(1330);         // Invalid Type
  }

  var nameID = cTID("nm  ");
  var valueID = cTID("Vl  ");

  if (!obj) {
    obj = {};
  }

  function getPropertyValue(pdesc) {
    var typ = pdesc.getType(valueID);
    var val = undefined;

    switch (typ) {
      case DescValueType.DOUBLETYPE: {
        val = pdesc.getDouble(valueID);
        break;
      };
      case DescValueType.INTEGERTYPE: {
        val = pdesc.getInteger(valueID);
        break;
      };
      case DescValueType.STRINGTYPE: {
        val = pdesc.getString(valueID);
        break;
      };
      case DescValueType.BOOLEANTYPE: {
        val = pdesc.getBoolean(valueID);
        break;
      };
    };
    return val;
  };

  for (var i = 0; i < desc.count; i++) {
    var key = desc.getKey(i);
    var nm = pdesc.getString(nameID);
    var val = getPropertyValue(desc);
    if (val != undefined) {
      obj[nm] = val;
    }
  }

  return obj;
};

function toBoolean(s) {
  if (s == undefined) { return false; }
  if (s.constructor == Boolean) { return s.valueOf(); }
  try { if (s instanceof XML) s = s.toString(); } catch (e) {}
  if (s.constructor == String)  { return s.toLowerCase() == "true"; }

  return Boolean(s);
};

function isBoolean(s) {
  return (s != undefined && s.constructor == Boolean);
}

function toNumber(s, def) {
  if (s == undefined) { return def || NaN; }
  try { if (s instanceof XML) s = s.toString(); } catch (e) {}
  if (s.constructor == String && s.length == 0) { return def || NaN; }
  if (s.constructor == Number) { return s.valueOf(); }
  var n = Number(s.toString());
  return (isNaN(n) ? (def || NaN) : n);
};

function isNumber(s) {
  try { if (s instanceof XML) s = s.toString(); }
  catch (e) {}
  return !isNaN(s);
};

function isString(s) {
  return (s != undefined && s.constructor == String);
};

function toFont(fs) {
  if (fs.typename == "TextFont") { return fs.postScriptName; }

  var str = fs.toString();
  var f = Stdlib.determineFont(str);  // first, check by PS name

  return (f ? f.postScriptName : undefined);
};



Stdlib.objectToXML = function(obj, name, xml) {
  if (!xml) {
    if (name == undefined) {
      name = "Object";
    }
    xml = new XML('<' + name + "></" + name + '>');
    // do the eval because of non-CS/2 syntax
    eval('xml.@type = (obj instanceof Array) ? "array" : "object"');
  }

  function _addChild(xml, obj, idx) {
    var val = obj[idx];

    var isArray = (obj instanceof Array);

    // skip 'hidden' properties
    if (idx.toString()[0] == '_') {
      return undefined;
    }

    // just skip undefined values
    if (val == undefined) {
      return undefined;
    }
    var type = typeof val;

    var child;

    if (isNumber(idx)) {
      idx = xml.localName() + idx;
    }

    switch (type){
    case "number":
    case "boolean":
    case "string":
      child = new XML('<' + idx + "></" + idx + '>');
      child.appendChild(val);
      // do the eval because of non-CS/2 syntax
      eval('child.@type = type');
      break;

    case "object":
      child = Stdlib.objectToXML(val, idx);
      break;

    default:
      return undefined;
      break;
    }

    xml.appendChild(child);
  };

  if (obj instanceof Array) {
    for (var i = 0; i < obj.length; i++) {
      _addChild(xml, obj, i);
    }
  } else {
    for (var idx in obj) {
      _addChild(xml, obj, idx);
    }
    if (xml.children().length() == 0) {
      xml.appendChild(obj.toString());
      // do the eval because of non-CS/2 syntax
      eval('xml.@type = "string"');
    }
  }

  return xml;
};
Stdlib.xmlToObject = function(xml, obj, parent) {
  if (xml.constructor == String) {
    xml = new XML(xml);
  } else if (xml instanceof XML) {
    xml = xml.copy();
  } else {
    Error.runtimeError(2, "xml");
  }

  xml.normalize();

  if (xml.hasSimpleContent()) {
    var str = xml.toString();
    if (parent) {
      parent[xml.localName()] = str;
    }
    return str;
  }

  var type;
  // do the eval because of non-CS/2 syntax
  eval('type = xml.@type.toString()');

  if (type == 'array') {
    obj = [];
  } else {
    obj = {};
  }

  var els = xml.elements();
  var len = els.length();
  if (len > 0) {
    for (var i = 0; i < len; i++) {
      var child = els[i];
      var val = '';
      var idx = (type == 'array') ? i : child.localName();

      if (child.hasComplexContent()) {
        val = Stdlib.xmlToObject(child);
      }

      if (child.hasSimpleContent()) {
        var ctype;
        // do the eval because of non-CS/2 syntax
        eval('ctype = child.@type.toString()');
        val = child.text().toString();

        if (val) {
          if (ctype == 'number') {
            val = Number(val);
          }
          if (ctype == 'boolean') {
            val = val.toLowerCase() == 'true';
          }
        }
      }

      obj[idx] = val;
    }
  } else {
    obj = xml.toString();
  }

  if (parent) {
    parent[xml.localName()] = obj;
  }

  return obj;
};


/*
function _xmlTest() {
  var
  obj = {
    str: 'A String',
    num: 123,
    bool: true,
    inner: {
      inStr: 'string 2',
      n: 231231,
      opts: SaveOptions.DONOTSAVECHANGES
    },
    ary: ['black', 'blue', 'red', { test: 'green'}]
  };
  var xml = Stdlib.objectToXML(obj, 'Preferences');
  xml.toXMLString();
  var xobj = Stdlib.xmlToObject(xml);
  return xobj;
};
*/

Stdlib.openURL = function(url) {
  var fname = "shortcut.url";
  var shortcut = new File(Folder.temp + '/' + fname);
  shortcut.open('w');
  shortcut.writeln('[InternetShortcut]');
  shortcut.writeln('URL=' + url);
  shortcut.writeln();
  shortcut.close();
  shortcut.execute();
  shortcut.remove();
};

"stdlib.js";
// EOF
/*jshint asi:true evil:true*/

////////////////////////////////////////////////////////////////////////////////
// Copied from ~/local/photoshop-xtools/xlib/stdlib.js
Stdlib = Stdlib || {};

cTID = function(s) { return cTID[s] || cTID[s] = app.charIDToTypeID(s); };
sTID = function(s) { return sTID[s] || sTID[s] = app.stringIDToTypeID(s); };

// makeActive
// Make the object (regardless of class) the 'active' one. Currently, this
// works for documents and layers. The one that was active before this call
// is returned
//
Stdlib.makeActive = function(obj) {
  var prev = undefined;

  if (!obj) {
    return undefined;
  }

  if (obj.typename == "Document") {
    prev = app.activeDocument;
    if (obj != prev) {
      app.activeDocument = obj;
    }
  } else if (obj.typename.match(/Layer/)) {
    var doc = obj.parent;
    while (!(doc.typename == "Document") && doc) {
      doc = doc.parent;
    }
    if (!doc) {
      Error.runtimeError(19, "obj"); // "Bad Layer object specified"
    }

    prev = doc.activeLayer;
    if (obj != prev) { 
      var d = app.activeDocument;
      app.activeDocument = doc;

      try {
        doc.activeLayer = obj;

      } catch (e) {
        $.level = 1; debugger;
      }
      app.activeDocument = d;
    }
  }

  return prev;
};


// by Damian SzopeN Sepczuk <damian[d0t]sepczuk[a7]o2{do7}pl>
// [in] round (bool) -- whether returned values should be rounded
//                      to the nearest pixel, def: false
// [in] doc -- document containing layer with vector mask
// [in] layer -- layer with vector mask
// returns array [left, top, right, bottom, width, height]
Stdlib.getVectorMaskBounds_cornerPointsOnly = function(round) {
  round = !!round;
  // function _ftn() {
    var res = undefined;
    var ref = new ActionReference();
    ref.putEnumerated( cTID('Path'), cTID('Path'), sTID('vectorMask') );
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    var vMaskDescr = executeActionGet(ref);
    if (!vMaskDescr) return null
    
    var pathContents = vMaskDescr.getObjectValue(sTID('pathContents'));
    var pathList = pathContents.getList(sTID('pathComponents'));

    // for each path in current layer
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    // using separate variables gives speed gain
    var subpathListKey = sTID("subpathListKey"),
        points_key = sTID("points"),
        anchor_key = sTID("anchor"),
        horizontal_key = sTID('horizontal'),
        vertical_key = sTID('vertical');

    for (var cPath = 0; cPath < pathList.count; ++cPath) {
      var curPath = pathList.getObjectValue(cPath).getList(subpathListKey);
      var points = curPath.getObjectValue(0).getList(points_key);
      // for each point
      for (var cPoint = 0; cPoint < points.count; ++cPoint) {
        var point = points.getObjectValue(cPoint).getObjectValue(anchor_key);
        var x = point.getUnitDoubleValue(horizontal_key);
        var y = point.getUnitDoubleValue(_id5);
        // it is faster than if/else block (benchmarked on PSCS4)
        if ( x < minX ) minX = x;
        if ( x > maxX ) maxX = x;
        if ( y < minY ) minY = y;
        if ( y > maxY ) maxY = y;
      }
    }
    res = [minX, minY, maxX, maxY, maxX-minX, maxY-minY];
    if (round) {
      for (var i = 0; i < res.length; ++i)  {
        res[i] = Math.round(res[i]);
      }
    }
    return res;
  // }
  // var bnds = Stdlib.wrapLCLayer(doc, layer, _ftn);
  // return bnds;
};



////////////////////////////////////////////////////////////////////////////////

function getNumberLayers() {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), cTID("NmbL"))
  ref.putEnumerated(cTID("Dcmn"), cTID("Ordn"), cTID("Trgt"));
  return executeActionGet(ref).getInteger(cTID("NmbL"));
}

function hasBackground(){try{activeDocument.backgroundLayer;return true}catch(e){return false}}
/*
function hasBackground() {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), cTID("Bckg"));
  ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Back")) //bottom Layer/background
  var desc = executeActionGet(ref);
  var res = desc.getBoolean(cTID("Bckg"));
  return res
}
*/
function getLayerType(idx, prop) {
  var ref = new ActionReference();
  ref.putIndex(cTID("Lyr "), idx);
  var desc = executeActionGet(ref);
  var type = desc.getEnumerationValue(prop);
  var res = typeIDToStringID(type);
  return res
}

function getLayerVisibilityByIndex(idx) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), cTID("Vsbl"));
  ref.putIndex(cTID("Lyr "), idx);
  return executeActionGet(ref).getBoolean(cTID("Vsbl"));
}

function getLayerLayerSectionByIndex(index) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), sTID("layerSection"));
  ref.putIndex(cTID("Lyr "), index);
  return typeIDToStringID(executeActionGet(ref).getEnumerationValue(sTID("layerSection")));
}

function getLayerSetsIndex() {
  var cnt = getNumberLayers() + 1;
  var res = Array();
  if (hasBackground()) {
    var i = 0;
  } else {
    var i = 1;
  }
  var prop = sTID("layerSection")
  for (i; i < cnt; i++) {
    var temp = getLayerType(i, prop);
    if ((temp == "layerSectionStart" || temp == "layerSectionContent") && getLayerVisibilityByIndex(i)) res.push(i);
  }
  return res;
}

function makeActiveByIndex(idx, visible) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIndex(cTID("Lyr "), idx)
  desc.putReference(cTID("null"), ref);
  desc.putBoolean(cTID("MkVs"), visible);
  executeAction(cTID("slct"), desc, DialogModes.NO);
}

function getLayerBoundsByIndex(idx) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), sTID("bounds"));
  ref.putIndex(cTID("Lyr "), idx);
  var desc = executeActionGet(ref).getObjectValue(sTID("bounds"));
  var bounds = []; // array of Numbers as pixels regardless of ruler
  bounds.push(desc.getUnitDoubleValue(sTID('top')));
  bounds.push(desc.getUnitDoubleValue(sTID('left')));
  bounds.push(desc.getUnitDoubleValue(sTID('bottom')));
  bounds.push(desc.getUnitDoubleValue(sTID('right')));
  return bounds;
}

function getLayerNameByIndex(idx) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), cTID("Nm  "));
  ref.putIndex(cTID("Lyr "), idx);
  return executeActionGet(ref).getString(cTID("Nm  "));
}

function getLayerNameByIndex(idx) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), cTID("Nm  "));
  ref.putIndex(cTID("Lyr "), idx);
  return executeActionGet(ref).getString(cTID("Nm  "));
}

function getSelectedLayersIdx() {
  var selectedLayers = Array;
  var ref = new ActionReference();
  ref.putEnumerated(cTID("Dcmn"), cTID("Ordn"), cTID("Trgt"));
  var desc = executeActionGet(ref);
  if (desc.hasKey(sTID('targetLayers'))) {
    desc = desc.getList(sTID('targetLayers'));
    var c = desc.count
    var selectedLayers = Array();
    for (var i = 0; i < c; i++) {
      try {
        activeDocument.backgroundLayer;
        selectedLayers.push(desc.getReference(i).getIndex());
      } catch (e) {
        selectedLayers.push(desc.getReference(i).getIndex() + 1);
      }
    }
  } else {
    var ref = new ActionReference();
    ref.putProperty(cTID("Prpr"), cTID("ItmI"));
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    try {
      activeDocument.backgroundLayer;
      selectedLayers.push(executeActionGet(ref).getInteger(cTID("ItmI")) - 1);
    } catch (e) {
      selectedLayers.push(executeActionGet(ref).getInteger(cTID("ItmI")));
    }
  }
  return selectedLayers;
}

function ShowHideFX(FX) {
  var desc6 = new ActionDescriptor();
  var ref5 = new ActionReference();
  ref5.putProperty(cTID('Prpr'), cTID('lfxv'));
  ref5.putEnumerated(cTID('Dcmn'), cTID('Ordn'), cTID('Trgt'));
  desc6.putReference(cTID('null'), ref5);
  var desc7 = new ActionDescriptor();
  desc7.putBoolean(cTID('lfxv'), FX);
  desc6.putObject(cTID('T   '), cTID('lfxv'), desc7);
  try {
    executeAction(cTID('setd'), desc6, DialogModes.NO);
  } catch (e) {}
}

function applyLayerBoundsByIndex(idx, object) {
  var ref = new ActionReference();
  ref.putProperty(cTID("Prpr"), sTID("bounds"));
  ref.putIndex(cTID("Lyr "), idx);
  var desc = executeActionGet(ref).getObjectValue(sTID("bounds"));
  object.y = desc.getUnitDoubleValue(sTID('top'));
  object.x = desc.getUnitDoubleValue(sTID('left'));
  object.right = desc.getUnitDoubleValue(sTID('right'));
  object.bottom = desc.getUnitDoubleValue(sTID('bottom'));
  object.width = object.right - object.x;
  object.height = object.bottom - object.y;
  return object;
}

function writeFileSync(path, data){
  var jsonFile = new File(path);
  jsonFile.open('w');
  jsonFile.writeln(data);
  jsonFile.close();
}

/*
var _LayerCache = {}

function getPathForLayerObj(layerObj){
  if (!(layerObj && layerObj.name)) return ''
  return getPathForLayerObj(_LayerCache[layerObj.parentIndex]) + '/' + layerObj.name.toString().replace(/(?=\/)/g,'\\')
}
*/

////////////////////////////////////////////////////////////////////////////////

function Array$Math_max(){return Math.max.apply(Math, this)}
Array$Math_max.mixInto = function(array){
  array.valueOf = this
  array.toJSON = this
  return array
}

function Array$Math_min(){return Math.min.apply(Math, this)}
Array$Math_min.mixInto = function(array){
  array.valueOf = this
  array.toJSON = this
  return array
}

function throwMultipleCallError(){throw Error('this method cannot be called multiple times')}

////////////////////////////////////////////////////////////////////////////////

function SerializeFakeDocument(document){
  this._document = document
}

SerializeFakeDocument.prototype = {
  
  constructor:SerializeFakeDocument,
  
  toJSON: function(){
    var doc = this._document
    var json
    var layers = doc.getFakeLayers()
    json = {
      name: doc.getName(),
      path: doc.getFilePath(),
      jsonPath: this.path,
      width: doc.getWidth(),
      height: doc.getHeight(),
      layerCompNames: doc.getLayerCompNames(),
      activeLayerCompName: doc.getActiveLayerCompName(),
      childIndexes: doc.childIndexes,
      // children: doc.getChildren(),
      layers: layers,
    }
    
    return json
  },
  
  exportJSON: function(path){
    this.path = path || this.getDefaultPath()
    
    var json = JSON.stringify(this.toJSON(), null, 4)
    
    var file = new File(path)
    file.open('w')
    file.writeln(json)
    file.close()
    return json
  },
  
  getDefaultPath: function(){
    var path = this._document.getFilePath()
    var activeLayerCompName = this._document.getActiveLayerCompName()
    if (activeLayerCompName) path = path + '.' + activeLayerCompName
    path += '.json'
    return path
  },
  
}

////////////////////////////////////////////////////////////////////////////////
function savePNG(filePath){
  // =======================================================
  // Save
  var desc86 = new ActionDescriptor
  desc86.putEnumerated(charIDToTypeID("PGIT"), charIDToTypeID("PGIT"), charIDToTypeID("PGIN"))
  desc86.putEnumerated(charIDToTypeID("PNGf"), charIDToTypeID("PNGf"), charIDToTypeID("PGAd"))
  desc86.putInteger(charIDToTypeID("Cmpr"), 9)

  var desc85 = new ActionDescriptor
  desc85.putObject(charIDToTypeID("As  "), charIDToTypeID("PNGF"), desc86)
  desc85.putPath(charIDToTypeID("In  "), new File(filePath))
  desc85.putInteger(charIDToTypeID("DocI"), 35)
  desc85.putBoolean(charIDToTypeID("Cpy "), true)
  desc85.putBoolean(charIDToTypeID("LwCs"), true)
  desc85.putEnumerated(stringIDToTypeID("saveStage"), stringIDToTypeID("saveStageType"), stringIDToTypeID("saveBegin"))
  executeAction(charIDToTypeID("save"), desc85, DialogModes.NO)
}

////////////////////////////////////////////////////////////////////////////////

function exportPNGLayers(doc){
  var index = doc.getLayerCount()
  var layer
  var path
  
  while(index--){
    layer = doc.getFakeLayers()[index]
    if (!(layer && layer.getName())) continue;
    
    if (layer.getName().indexOf('.png') == -1) continue;
    
    path = doc.getFolderPath() + '/' + layer.getName()
    layer.saveCroppedPNG(path)
  }
}

////////////////////////////////////////////////////////////////////////////////

console = {
  log: function(){$.writeln.call($, JSON.stringify(arguments[0]))},
  assert: function(True, message){
    if (!True) throw Error(message)
  },
}

////////////////////////////////////////////////////////////////////////////////

ActionList.prototype.toJSON =
ActionList.prototype.toObject = function(){
  var object = [], index = this.count
  while (index-- > 0){
    object[index] = this.ao_getValue(index)
  }
  return object
}

ActionDescriptor.prototype.toJSON =
ActionDescriptor.prototype.toObject = function(object){
  if (!(object && typeof object == 'object')) object = {}
  var index = this.count, key
  // , keyO
  // var keys = []
  while (index-- > 0){
    key = this.getKey(index)
    // keyO = keys[index] = {
    //   typeID:key,
    //   charID:typeIDToCharID(key),
    //   stringID:typeIDToStringID(key),
    //   type:ActionDescriptor.ao_getTypeString(this.getType(key)),
    //   valueType:ActionDescriptor.ao_getTypeString(this.ao_getValueType(key)),
    //   value:this.ao_getValue(key),
    // }
    object[typeIDToStringID(key)] = this.ao_getValue(key)
  }
  return object
}
ActionDescriptor.keys = function(descriptor, keys){
  var index = descriptor.count
  if (keys == null) keys = Array(index)
  while (index-- > 0){
    keys[index] = typeIDToStringID(descriptor.getKey(index))
  }
  return keys
}

ActionList.prototype.ao_getValueType =
ActionDescriptor.prototype.ao_getValueType = function(key){
  var _DescValueType = this.getType(key)
  if (_DescValueType == DescValueType.ENUMERATEDTYPE) return this.getEnumerationType(key)
  if (_DescValueType == DescValueType.OBJECTTYPE) return this.getObjectType(key)
  if (_DescValueType == DescValueType.UNITDOUBLE) return this.getUnitDoubleType(key)
  return _DescValueType
}

ActionList.prototype.ao_getValue =
ActionDescriptor.prototype.ao_getValue = function(key){
  var _DescValueType = this.getType(key)
  if (_DescValueType == DescValueType.ALIASTYPE) return this.getPath(key)
  else if (_DescValueType == DescValueType.BOOLEANTYPE) return this.getBoolean(key)
  else if (_DescValueType == DescValueType.CLASSTYPE) return this.getClass(key)
  else if (_DescValueType == DescValueType.DOUBLETYPE) return this.getDouble(key)
  else if (_DescValueType == DescValueType.ENUMERATEDTYPE) return typeIDToStringID(this.getEnumerationValue(key))
  else if (_DescValueType == DescValueType.INTEGERTYPE) return this.getInteger(key)
  else if (_DescValueType == DescValueType.LARGEINTEGERTYPE) return this.getLargeInteger(key)
  else if (_DescValueType == DescValueType.LISTTYPE) return this.getList(key)
  else if (_DescValueType == DescValueType.OBJECTTYPE) return this.getObjectValue(key)
  else if (_DescValueType == DescValueType.RAWTYPE) return this.getData(key)
  else if (_DescValueType == DescValueType.REFERENCETYPE) return this.getReference(key)
  else if (_DescValueType == DescValueType.STRINGTYPE) return this.getString(key)
  else if (_DescValueType == DescValueType.UNITDOUBLE) return this.getUnitDoubleValue(key)
  return
}

ActionList.ao_getTypeString =
ActionDescriptor.ao_getTypeString = function(_DescValueType){
  if (_DescValueType == DescValueType.ALIASTYPE) return 'alias'
  else if (_DescValueType == DescValueType.BOOLEANTYPE) return 'boolean'
  else if (_DescValueType == DescValueType.CLASSTYPE) return 'class'
  else if (_DescValueType == DescValueType.DOUBLETYPE) return 'double'
  else if (_DescValueType == DescValueType.ENUMERATEDTYPE) return 'enumerated'
  else if (_DescValueType == DescValueType.INTEGERTYPE) return 'integer'
  else if (_DescValueType == DescValueType.LARGEINTEGERTYPE) return 'largeinteger'
  else if (_DescValueType == DescValueType.LISTTYPE) return 'list'
  else if (_DescValueType == DescValueType.OBJECTTYPE) return 'object'
  else if (_DescValueType == DescValueType.RAWTYPE) return 'raw'
  else if (_DescValueType == DescValueType.REFERENCETYPE) return 'reference'
  else if (_DescValueType == DescValueType.STRINGTYPE) return 'string'
  else if (_DescValueType == DescValueType.UNITDOUBLE) return 'unitdouble'
  return 'unknown'
}

////////////////////////////////////////////////////////////////////////////////

ActionReference.prototype.toJSON =
ActionReference.prototype.toObject = function(){
  var object = {}
  object.Class = typeIDToStringID(this.getDesiredClass())
  object[ActionReference.ao_getTypeString(this.getForm())] = this.ao_getValue()
  return object
}

ActionReference.prototype.ao_getValue = function(){
  var _ReferenceFormType = this.getForm()
  if (_ReferenceFormType == ReferenceFormType.CLASSTYPE) return this.getDesiredClass()
  if (_ReferenceFormType == ReferenceFormType.ENUMERATED) return typeIDToStringID(this.getEnumeratedValue())
  if (_ReferenceFormType == ReferenceFormType.IDENTIFIER) return this.getIdentifier()
  if (_ReferenceFormType == ReferenceFormType.INDEX) return this.getIndex()
  if (_ReferenceFormType == ReferenceFormType.NAME) return this.getName()
  if (_ReferenceFormType == ReferenceFormType.OFFSET) return this.getOffset()
  if (_ReferenceFormType == ReferenceFormType.PROPERTY) return typeIDToStringID(this.getProperty())
  return
}

ActionReference.prototype.ao_putValue =
ActionReference.from = function(Class, value, type){
  var ref
  if (this instanceof ActionReference && !(this instanceof Function)) ref = this
  else ref = new ActionReference
  
  if (type == null){
    switch(typeof value){
    case 'undefined':
      for (var property in Class) {
        if (property == 'Class' || typeof Class[type] == 'function') continue;
        type = property
        value = Class[type]
        break;
      }
      Class = Class.Class
      break;
    case 'number': type = ReferenceFormType.IDENTIFIER; break;
    case 'string': type = ReferenceFormType.NAME; break;
    default:
      throw Error('expected type')
    }
  }
  Class = stringIDToTypeID(Class)
    
  if (type == 'identifier' || type == ReferenceFormType.IDENTIFIER) ref.putIdentifier(Class, value)
  else if (type == 'index' || type == ReferenceFormType.INDEX) ref.putIndex(Class, value)
  else if (type == 'name' || type == ReferenceFormType.NAME) ref.putName(Class, value)
  else if (type == 'offset' || type == ReferenceFormType.OFFSET) ref.putOffset(Class, value)
  else if (type == 'property' || type == ReferenceFormType.PROPERTY) ref.putProperty(Class, value)
  else if (value == null)
    ref.putDesiredClass(Class)
  else
    ref.putEnumeratedValue(Class, stringIDToTypeID(type), value)
  return ref
}

ActionReference.ao_getTypeString = function(_ReferenceFormType){
  if (_ReferenceFormType == ReferenceFormType.CLASSTYPE) return 'class'
  if (_ReferenceFormType == ReferenceFormType.ENUMERATED) return 'enumerated'
  if (_ReferenceFormType == ReferenceFormType.IDENTIFIER) return 'identifier'
  if (_ReferenceFormType == ReferenceFormType.INDEX) return 'index'
  if (_ReferenceFormType == ReferenceFormType.NAME) return 'name'
  if (_ReferenceFormType == ReferenceFormType.OFFSET) return 'offset'
  if (_ReferenceFormType == ReferenceFormType.PROPERTY) return 'property'
  return
}/*jshint asi:true*/
////////////////////////////////////////////////////////////////////////////////

FakeDocument.getDocumentWithLayerCompAsJSON = function(psdPath, layerCompName, path){
  var doc = FakeDocument.getByPath(psdPath)
  // $.hiresTimer
  doc.doTransaction(function(){
    doc.layers = doc.getLayersForLayerCompNamed(layerCompName)
  })
  doc.layers.forEach(function(layer){
    layer.layerCompName = layerCompName
    layer.psdPath = psdPath
  })
  // $.writeln("calculateLayerStates " + Math.round($.hiresTimer / doc.layers.length)/1000 + 'ms each')
  return new SerializeFakeDocument(doc).exportJSON(path)
}
FakeDocument.getDocumentWithLayerCompAsJSONAndExportPNGs = function(psdPath, layerCompName, path){
  var doc = FakeDocument.getByPath(psdPath)
  // $.hiresTimer
  var imagePath = doc.getFilePath() + '.' + layerCompName + '.png'
  var backgroundImagePath = doc.getFilePath() + '.' + layerCompName + '.Background.png'
  
  doc.doTransaction(function(){
    doc.layers = doc.getLayersForLayerCompNamed(layerCompName)
    var pngLayers = doc.findByNameWithRegEx(FakeLayer.layerNamePattern.crop)
    
    // Save image
    savePNG(imagePath)
    doc.imagePath = imagePath
    
    // Save layer images
    pngLayers.forEach(function(layer){layer.saveCroppedPNG(layer)})
    
    // Save background image
    pngLayers.forEach(function(layer){layer.hide()})
    savePNG(backgroundImagePath)
    doc.backgroundImagePath = backgroundImagePath
  })
  // $.writeln("calculateLayerStates " + Math.round($.hiresTimer / doc.layers.length)/1000 + 'ms each')
  return new SerializeFakeDocument(doc).exportJSON(path)
}

FakeDocument.getByPath = function FakeDocument_getByPath(path){
  if (FakeDocument_getByPath[path]) return FakeDocument_getByPath[path]
  path = new File(path)
  if (!path.exists) throw Error("doesn't exist: '" + path + "'");
  
  var idOpn = charIDToTypeID("Opn ")
  var idnull = charIDToTypeID("null")
  var desc = new ActionDescriptor()
  desc.putPath(idnull, path)
  executeAction(idOpn, desc, DialogModes.NO)
  
  return FakeDocument_getByPath[path.fullName] = new FakeDocument(activeDocument)
}

function FakeDocument(document){
  if (!(this instanceof FakeDocument)) throw Error("must be called with `new`")
  if (!(document instanceof Document)) throw Error("must be called with a real document. e.g. `new FakeDocument(app.activeDocument)`")
  this.getRealDocument = function FakeDocument$getRealDocument_cached(){return document}
}

FakeDocument.prototype = {
  
  constructor: FakeDocument,
  
  getRealDocument: function FakeDocument$getRealDocument(){throw Error("Real document is missing")},
  
  activate: function FakeDocument$activate(){
    // Perf hack to keep from calling makeActive a million times
    if (this._shouldbeActiveUnlessSomethingWackyHappened) return;
    this._shouldbeActiveUnlessSomethingWackyHappened = Stdlib.makeActive(this.getRealDocument())
  },
  
  getLayerCount: function FakeDocument$getLayerCount(){
    Stdlib.makeActive(this.getRealDocument())
    return getNumberLayers() + Number(hasBackground())
  },
  getFakeLayers: function FakeDocument$getFakeLayers(){
    if (this.layers) return this.layers
    
    var layerCount = this.getLayerCount()
    var layers = this.layers = Array(layerCount)
    layers[-1] = this
    
    var index = layerCount + 1 - Number(hasBackground())
    while (index--) {
      layers[index] = FakeLayer.getLayerForDocumentByIndex(this, index)
    }
    return (this.layers = layers)
  },
  
  getChildren: function FakeDocument$getChildren(){
    var layers = this.getFakeLayers()
    return this.childIndexes.map(function(index){
      return layers[index]
    })
  },
  
  getFolderPath: function FakeDocument$getFolderPath() {
    try {
      return decodeURIComponent(this.getRealDocument().fullName.path)
    } catch(e){
      return "~/tmp"
    }
  },
  getFilePath: function FakeDocument$getFilePath(){ return this.getFolderPath() + "/" + this.getName() },
  getName: function FakeDocument$getName(){ return decodeURIComponent(this.getRealDocument().name) },
  
  getWidth: function FakeDocument$getWidth(){return this.getRealDocument().width.as('px')},
  getHeight: function FakeDocument$getHeight(){return this.getRealDocument().height.as('px')},
  
  trimTransparency: function FakeDocument$trimTransparency(){
    var idtrim = stringIDToTypeID("trim")
    var idtrimBasedOn = stringIDToTypeID("trimBasedOn")
    var idTrns = charIDToTypeID("Trns")
    var idTop = charIDToTypeID("Top ")
    var idBtom = charIDToTypeID("Btom")
    var idLeft = charIDToTypeID("Left")
    var idRght = charIDToTypeID("Rght")

    var desc4 = new ActionDescriptor
    desc4.putEnumerated(idtrimBasedOn, idtrimBasedOn, idTrns)
    desc4.putBoolean(idTop, true)
    desc4.putBoolean(idBtom, true)
    desc4.putBoolean(idLeft, true)
    desc4.putBoolean(idRght, true)
    executeAction(idtrim, desc4, DialogModes.NO)
  },
  cropToBounds: function FakeDocument$cropToBounds(top, left, bottom, right){
    if (!(typeof top == 'number' && typeof left == 'number' && typeof bottom == 'number' && typeof right == 'number')) throw Error("top, left, bottom, right must be numbers")
    
        var idCrop = charIDToTypeID( "Crop" );
                var idT = charIDToTypeID( "T   " );
                    var idTop = charIDToTypeID( "Top " );
                    var idPxl = charIDToTypeID( "#Pxl" );
                    var idLeft = charIDToTypeID( "Left" );
                    var idBtom = charIDToTypeID( "Btom" );
                    var idRght = charIDToTypeID( "Rght" );
                var idRctn = charIDToTypeID( "Rctn" );
                var idAngl = charIDToTypeID( "Angl" );
                var idAng = charIDToTypeID( "#Ang" );
                var idDlt = charIDToTypeID( "Dlt " );
                var idcropAspectRatioModeKey = stringIDToTypeID( "cropAspectRatioModeKey" );
                var idcropAspectRatioModeClass = stringIDToTypeID( "cropAspectRatioModeClass" );
                var idunconstrained = stringIDToTypeID( "unconstrained" );

        var desc18 = new ActionDescriptor();
            var desc19 = new ActionDescriptor();
            desc19.putUnitDouble( idTop, idPxl, Number(top) );
            desc19.putUnitDouble( idLeft, idPxl, Number(left) );
            desc19.putUnitDouble( idBtom, idPxl, Number(bottom) );
            desc19.putUnitDouble( idRght, idPxl, Number(right) );
        desc18.putObject( idT, idRctn, desc19 );
        desc18.putUnitDouble( idAngl, idAng, 0.000000 );
        desc18.putBoolean( idDlt, true );
        desc18.putEnumerated( idcropAspectRatioModeKey, idcropAspectRatioModeClass, idunconstrained );
    executeAction( idCrop, desc18, DialogModes.NO );
  },
  
  undoOne: function FakeDocument$undoOne(){
    var idslct = charIDToTypeID( "slct" );
        var desc5 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref2 = new ActionReference();
            var idHstS = charIDToTypeID( "HstS" );
            var idOrdn = charIDToTypeID( "Ordn" );
            var idPrvs = charIDToTypeID( "Prvs" );
            ref2.putEnumerated( idHstS, idOrdn, idPrvs );
        desc5.putReference( idnull, ref2 );
    executeAction( idslct, desc5, DialogModes.NO );
  },
  
  undo: function FakeDocument$undo(){
    executeAction(charIDToTypeID("undo"), undefined, DialogModes.NO)
  },
  
  _exitQuickMaskMode: function FakeDocument$_exitQuickMaskMode(){
    // Get out of Quick Mask mode
    var idCler = charIDToTypeID( "Cler" );
        var desc174 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref145 = new ActionReference();
            var idPrpr = charIDToTypeID( "Prpr" );
            var idQucM = charIDToTypeID( "QucM" );
            ref145.putProperty( idPrpr, idQucM );
            var idDcmn = charIDToTypeID( "Dcmn" );
            var idOrdn = charIDToTypeID( "Ordn" );
            var idTrgt = charIDToTypeID( "Trgt" );
            ref145.putEnumerated( idDcmn, idOrdn, idTrgt );
        desc174.putReference( idnull, ref145 );
    executeAction( idCler, desc174, DialogModes.NO );
  },
  
  toggleShowOnly: function FakeLayer$toggleShowOnly(layer){
    this._exitQuickMaskMode()
    var idToggleOthers = charIDToTypeID("TglO")
    var idShow = charIDToTypeID("Shw ")
    var idnull = charIDToTypeID("null")
    
    var refsList = new ActionList
    refsList.putReference(layer.getActionReference())
    
    var refsDesc = new ActionDescriptor
    refsDesc.putList(idnull, refsList)
    refsDesc.putBoolean(idToggleOthers, true)
    executeAction(idShow, refsDesc, DialogModes.NO)
  },


////////////////////////////////////////////////////////////////////////////////
// loop over the layers again

  findByNameWithRegEx: function FakeDocument$findByNameWithRegEx(regex){
    if (!(regex && typeof regex.test == 'function')) throw Error("Expected regex")
    return this.getFakeLayers().filter(function(layer){
      if (!layer) return false;
      if (layer.isGroupEnd) return false;
      return layer.name && regex.test(layer.name.toString())
    })
  },


////////////////////////////////////////////////////////////////////////////////
// States
  
  getLayersForLayerCompNamed: function(layerCompName){
    if (!layerCompName) layerCompName = this.getActiveLayerCompName()
    if (!this._layersForLayerComp) this._layersForLayerComp = {}
    var layers
    if (layers = this._layersForLayerComp[layerCompName]) return layers;
    delete this.layers
    
    var docWidth = this.getWidth()
    var docHeight = this.getHeight()
    
    this.applyLayerCompNamed(layerCompName)
    layers = this._layersForLayerComp[layerCompName] = this.getFakeLayers().slice().reverse()
    
    layers.forEach(function(layer){
      layer.getState(layer)
    })
    layers.forEach(function(layer){
      var state = layer
      state.width = state.right - state.left
      state.height = state.bottom - state.top
      state.x = state.left - docWidth/2 + state.width/2
      state.y = -(state.top - docHeight/2 + state.height/2)
    })
    layers.reverse()
    return layers
  },
  
  calculateLayerStates: function(){
    this.calculateLayerStates = function(){return layers}
    var doc = this
    var layers = doc.getFakeLayers().slice().reverse()
    doc.getLayerCompNames().forEach(function(layerCompName){
      doc.applyLayerCompNamed(layerCompName)
      layers.forEach(function(layer){
        layer.getStateForKey(layerCompName)
      })
      layers.forEach(function(layer){
        var state = layer.getStateForKey(layerCompName)
        state.width = state.right - state.left
        state.height = state.bottom - state.top
        state.x = state.left + state.width / 2
        state.y = state.top + state.height / 2
      })
    })
    layers.reverse()
    return layers
  },
  
  getActiveLayerCompName: function FakeDocument$getActiveLayerCompName(){
    if (this.activeLayerCompName) return this.activeLayerCompName
    return "Current State"
  },

  getLayerCompNames: function FakeDocument$getLayerCompNames(){
    var layerCompNames = [this.getActiveLayerCompName()]
    var layerComps = this.getRealDocument().layerComps
    for (var index = layerComps.length, layerComp; --index >= 0 && (layerComp = layerComps[index]);){
      layerCompNames.push(layerComp.name)
    }
    return layerCompNames
  },

  applyLayerCompNamed: function FakeDocument$applyLayerCompNamed(layerCompName) {
    if (!layerCompName) return;
    var idcompsClass = stringIDToTypeID("compsClass")
    var idnull = charIDToTypeID("null")
    var idapplyComp = stringIDToTypeID("applyComp")
  
    var ref = new ActionReference
    ref.putName(idcompsClass, layerCompName)
  
    var desc = new ActionDescriptor
    desc.putReference(idnull, ref)
    try{
        executeAction(idapplyComp, desc, DialogModes.NO)
    }catch(e){return false}
    
    var success = this.getRealDocument().layerComps.getByName(layerCompName).selected
    if (success) this.activeLayerCompName = layerCompName
    return success
  },

  setFrame: function FakeDocument$setFrame(frame){
    var idslct = charIDToTypeID("slct")
    var idnull = charIDToTypeID("null")
    var idanimationFrameClass = stringIDToTypeID("animationFrameClass")
    
    var ref = new ActionReference
    ref.putIndex(idanimationFrameClass, frame)
    
    var desc = new ActionDescriptor
    desc.putReference(idnull, ref)
    executeAction(idslct, desc, DialogModes.NO)
  },

  getFakeLayerStates: function FakeDocument$getFakeLayerStates(){
    return this.getFakeLayers().map(function(layer){
      if (!layer) return null
      return layer.getState({index:layer.getIndex()})
    })
  },

////////////////////////////////////////////////////////////////////////////////

  cropTo: function(state){
    if (!(state && typeof state == 'object')) throw Error('expected an object')
    if (state.getState) state = state.getState();
    if (!("top" in state && "left" in state && "bottom" in state && "right" in state)) throw Error('invalid rectangle')
    
    this.cropToBounds(+state.top, +state.left, +state.bottom, +state.right)
    return state
  },

  exportToIllustrator: function(path){
    path = new File(path || (this.getFilePath().replace(/\.ps[db]$/i,'') + '.ai'))
    if (!path.parent.exists) path.parent.create()
    
    var idExpr = charIDToTypeID( "Expr" );
        var desc459 = new ActionDescriptor();
        var idUsng = charIDToTypeID( "Usng" );
            var desc460 = new ActionDescriptor();
            var idIn = charIDToTypeID( "In  " );
            desc460.putPath( idIn, path);
            var idPthS = charIDToTypeID( "PthS" );
            var idPtSl = charIDToTypeID( "PtSl" );
            var idAllP = charIDToTypeID( "AllP" );
            desc460.putEnumerated( idPthS, idPtSl, idAllP );
        desc459.putObject( idUsng, stringIDToTypeID( "Illustrator Export.  This string makes me unique!" ), desc460 );
    executeAction( idExpr, desc459, DialogModes.NO );
  },

  exportToPDF: function(path){
    path = new File(path || (this.getFilePath().replace(/\.ps[db]$/i,'') + '.pdf'))
    if (!path.parent.exists) path.parent.create()
    
    var idsave = charIDToTypeID( "save" );
        var desc461 = new ActionDescriptor();
        var idAs = charIDToTypeID( "As  " );
            var desc462 = new ActionDescriptor();
            var idpdfPresetFilename = stringIDToTypeID( "pdfPresetFilename" );
            desc462.putString( idpdfPresetFilename, "Smallest File Size" );
            var idpdfCompressionType = stringIDToTypeID( "pdfCompressionType" );
            desc462.putInteger( idpdfCompressionType, 10 );
        var idPhtP = charIDToTypeID( "PhtP" );
        desc461.putObject( idAs, idPhtP, desc462 );
        var idIn = charIDToTypeID( "In  " );
        desc461.putPath( idIn, path);
        var idDocI = charIDToTypeID( "DocI" );
        desc461.putInteger( idDocI, 13984 );
        var idCpy = charIDToTypeID( "Cpy " );
        desc461.putBoolean( idCpy, true );
        var idLwCs = charIDToTypeID( "LwCs" );
        desc461.putBoolean( idLwCs, true );
        var idLyrs = charIDToTypeID( "Lyrs" );
        desc461.putBoolean( idLyrs, false );
        var idsaveStage = stringIDToTypeID( "saveStage" );
        var idsaveStageType = stringIDToTypeID( "saveStageType" );
        var idsaveBegin = stringIDToTypeID( "saveBegin" );
        desc461.putEnumerated( idsaveStage, idsaveStageType, idsaveBegin );
    executeAction( idsave, desc461, DialogModes.NO );
  },

////////////////////////////////////////////////////////////////////////////////
// History

  doThenUndo: function FakeDocument$doThenUndo(theThingToDo){
    this.activate()
    var activeHistoryState = app.activeDocument.activeHistoryState
    try {
      return theThingToDo(this)
    }
    catch(e){throw e}
    finally {
      this.activate()
      app.activeDocument.activeHistoryState = activeHistoryState
    }
  },

  doWriteTransaction: function FakeDocument$doTransaction(transaction, name){
    this.getRealDocument().suspendHistory(name || "FakeDocument Transaction", "transaction(this)")
  },

  doTransaction: function FakeDocument$doTransaction(transaction, name){
    this.doWriteTransaction(transaction, name || "temporary FakeDocument Transaction")
    this.undo()
  },

}
/*jshint asi:true*/
////////////////////////////////////////////////////////////////////////////////

FakeLayer.getPathToLayerPNG = function(psdPath, layerCompName, id, state){
  var doc = FakeDocument.getByPath(psdPath)
  var layer
  doc.doTransaction(function(){
    doc.applyLayerCompNamed(layerCompName)
    layer = doc.getFakeLayers().filter(function(layer){return layer.id == id})[0]
    if (!layer) return;
    layer.saveCroppedPNG(state)
  })
  if (!layer) return;
  for (var property in state) {
    layer[property] = state[property]
  }
  return layer.path
}

FakeLayer.layerNamePattern = {
  crop:/\.png$/i
}

FakeLayer.getActiveLayerActionReference = function(){
  var ref = new ActionReference
  var idLyr = charIDToTypeID("Lyr ")
  var idOrdn = charIDToTypeID("Ordn")
  var idTrgt = charIDToTypeID("Trgt")
  ref.putEnumerated(idLyr, idOrdn, idTrgt)
  return ref
}

FakeLayer.getActiveLayerForDocument = function FakeLayer_getActiveLayerForDocument(document) {
  var layer = new FakeLayer(document)
  layer.getActionReference = FakeLayer.getActiveLayerActionReference
  layer.getID()
  layer.getIndex()
  layer.getName()
  delete layer.getActionReference
  return layer.initialize();
}
FakeLayer.getLayerForDocumentByName = function FakeLayer_getLayerForDocumentByName(document, name){ var layer = new FakeLayer(document); layer.name = name; return layer.initialize(); }
FakeLayer.getLayerForDocumentByID = function FakeLayer_getLayerForDocumentByID(document, id){ var layer = new FakeLayer(document); layer.id = id; return layer.initialize(); }
FakeLayer.getLayerForDocumentByIndex = function FakeLayer_getLayerForDocumentByIndex(document, index){ var layer = new FakeLayer(document); layer.index = index; return layer.initialize(); }

FakeLayer.MAX_OPACITY = 0xFF

FakeLayer.from = function FakeLayer_from(document, object){
  if (object instanceof FakeLayer) return object
  var layer = new FakeLayer(document)
  for (var property in object) {
    if (property in FakeLayer.prototype) throw Error("Can't clobber prototype property: '" + property + "'")
    layer[property] = object[property]
  }
  return layer
}

function FakeLayer(document){
  if (!(this instanceof FakeLayer)) throw Error('must be called with `new`');
  if (!(document instanceof FakeDocument)) throw Error('must be called with a FakeDocument');
  
  this.getFakeDocument = function FakeLayer$cached_getFakeDocument(){return document}
}

FakeLayer.prototype = { constructor: FakeLayer,

  getActionReference: function FakeLayer$getActionReference(){
    this.getFakeDocument().activate()
    
    // Cf. photoshopsdk/pluginsdk/documentation/Photoshop Actions Guide.pdf
    var ref = new ActionReference
    if (this.name != null) ref.putName(cTID("Lyr "), this.name)
    if (this.index != null) ref.putIndex(cTID("Lyr "), this.index)
    if (this.id != null) ref.putIdentifier(cTID("Lyr "), this.id)
    if (ref != null)
      this.getActionReference = function FakeLayer$cached_getActionReference(){return ref}
    return ref
  },
  getActionDescriptor: function FakeLayer$getActionDescriptor(){
    this.getFakeDocument().activate()
    
    // Cf. photoshopsdk/pluginsdk/documentation/Photoshop Actions Guide.pdf
    var ref = this.getActionReference()
    var descriptor = null
    try {
      descriptor = executeActionGet(ref)
    } catch(e){}
    ref = null
    if (descriptor != null)
      this.getActionDescriptor = function FakeLayer$cached_getActionDescriptor(){return descriptor}
    else
      return null; //throw Error("Can't get ActionDescriptor")
    return descriptor
  },
  _executeAction: function FakeLayer$_executeAction(actionCharID){
    var idAction = charIDToTypeID(actionCharID)
    var idnull = charIDToTypeID("null")
    
    var list = new ActionList
    list.putReference(this.getActionReference())
    
    var desc = new ActionDescriptor
    desc.putList(idnull, list)
    executeAction(idAction, desc, DialogModes.NO)
  },


////////////////////////////////////////////////////////////////////////////////
// initialize

  initialize: function FakeLayer$initialize(){
    // $.hiresTimer
    if (this.getActionDescriptor() == null)
      return null
    // var timeCost = $.hiresTimer/1000
    
      // throw Error("Missing ActionDescriptor id:"+this.id + " index:"+this.index + " name:"+this.name)
    
    this.initialize = throwMultipleCallError
    
    this.getIndex()
    this.getID()
    
    if (this.getType() == 'Start') this.isGroup = true
    if (this.getType() == 'End') this.isGroupEnd = true
    
    this.getName()
    this.initializeFakeDOM()
    // this.getStateForKey('state')
    // if (timeCost > 2){
      // $.writeln("layer.getActionDescriptor " + timeCost)
      // console.log(this)
    // }
    return this
  },
  
  getStateForKey: function(stateKey){
    if (!stateKey) stateKey = this.getFakeDocument().getActiveLayerCompName()
    if (this[stateKey])
      return this[stateKey]
    
    if (stateKey) // FIXME: Clear the ActionDescriptor cache more intelligently
      delete this.getActionDescriptor
    
    if (!this.layerCompNames) this.layerCompNames = []
    this.layerCompNames.push(stateKey)
    var state = this[stateKey] = {}
    
    state.name = stateKey
    this.calculateParentBounds(state, this.getParent()[stateKey] || (this.getParent()[stateKey] = {}))
    state.opacity = this.getOpacity()
    state.visible = this.isVisible()
    return state
  },

  getState: function(state){
    if (this.isGroupEnd) return state;
    if (state == null) state = {}
    if (state == this)
      this.calculateParentBounds(state, this.getParent())
    else
      this.getBounds(state)
    state.opacity = this.getOpacity()
    state.visible = this.isVisible()
    return state
  },

  getChildren: function FakeLayer$getChildren(){
    if (this.childIndexes == null) return;
    var layers = this.getFakeDocument().getFakeLayers()
    return this.childIndexes.map(function(index){
      return layers[index]
    })
  },

  getParent: function(){throw Error("this is an orphaned layer. Need to initializeFakeDOM")},

  initializeFakeDOM: function FakeLayer$initializeFakeDOM(){
    this.initializeFakeDOM = throwMultipleCallError
    
    var document = this.getFakeDocument()
    var parent = null, nextSibling, previousSibling, previousSiblingParent
    
    this.getParent = function FakeLayer$cached_getParent(){return parent}
    this.getNextSibling = function FakeLayer$cached_getNextSibling(){return nextSibling}
    this.getPreviousSibling = function FakeLayer$cached_getPreviousSibling(){return previousSibling}
    
    previousSibling = document.getFakeLayers()[this.index + 1]
    
    if (previousSibling) {
      previousSibling.getNextSibling = function FakeLayer$cached_getNextSibling(){return this}
    }
    
    if (previousSibling && previousSibling.isGroup) {
      this.parentID = previousSibling.id
      this.parentIndex = previousSibling.index
      previousSibling = null
    }
    else if (previousSibling && previousSibling.isGroupEnd) {
      previousSiblingParent = document.getFakeLayers()[previousSibling.parentIndex]
      this.parentID = previousSiblingParent.parentID
      this.parentIndex = previousSiblingParent.parentIndex
    }
    else if (previousSibling && previousSibling.parentIndex) {
      this.parentID = previousSibling.parentID
      this.parentIndex = previousSibling.parentIndex
    }
    
    if (this.parentID || this.parentIndex) {
      parent = document.getFakeLayers()[this.parentIndex]
    }
    else {
      this.parentID = -1
      this.parentIndex = -1
      parent = document
    }
    if (parent){
      if (parent.childIndexes == null) parent.childIndexes = []
      if (!this.isGroupEnd)
        parent.childIndexes.push(this.index)
      
      // if (this.name.charAt(0) == '@') {
      //   parent[this.name.substr(1) + 'Index'] = this.index
      // }
    }
  },
  
  calculateParentBounds: function FakeLayer$calculateParentBounds(state, parentState){
    if (this.isGroupEnd) return;
    if (parentState == null) return;
    
    var document = this.getFakeDocument()
    
    this.getBounds(state)
    
    if (this.name == '@bounds') this.getBounds(parentState)
    
    if (state.left <= 0
      && state.top <= 0
      && state.right >= document.getWidth()
      && state.bottom >= document.getHeight()) {
      
      if (this.isGroup) {
        state.left = Array$Math_min.mixInto([])
        state.top = Array$Math_min.mixInto([])
        state.right = Array$Math_max.mixInto([])
        state.bottom = Array$Math_max.mixInto([])
      }
      else return;
    }
    
    if (!this.isVisible()) return
    
    if (state.left != null && parentState.left && typeof parentState.left.push == 'function') parentState.left.push(state.left)
    if (state.top != null && parentState.top && typeof parentState.top.push == 'function') parentState.top.push(state.top)
    if (state.right != null && parentState.right && typeof parentState.right.push == 'function') parentState.right.push(state.right)
    if (state.bottom != null && parentState.bottom && typeof parentState.bottom.push == 'function') parentState.bottom.push(state.bottom)
  },

  getBounds: function FakeLayer$getBounds(result){
    if (this.isGroupEnd) return result;
    if (result == null) result = {};
    var bounds = this.getActionDescriptor().getObjectValue(sTID("bounds"))
    result[0] = bounds.getUnitDoubleValue(sTID('left'))
    result[1] = bounds.getUnitDoubleValue(sTID('top'))
    result[2] = bounds.getUnitDoubleValue(sTID('right'))
    result[3] = bounds.getUnitDoubleValue(sTID('bottom'))
    return result
  },

  activate: function(){
    this.getFakeDocument().activate()
    var args = new ActionDescriptor
    args.putReference(charIDToTypeID("null"), this.getActionReference())
    args.putBoolean(charIDToTypeID("MkVs"), false)
    executeAction(charIDToTypeID("slct"), args, DialogModes.NO)
  },
  
  getRealLayer: function(){
    this.activate()
    var realLayer = this.getFakeDocument().getRealDocument().activeLayer
    this.getRealLayer = function(){return realLayer}
    return realLayer
  },

  getBoundsFromDOM: function FakeLayer$getBoundsFromDOM(result){
    if (this.isGroupEnd) return result;
    if (result == null) result = {};
    var bounds = this.getRealLayer().bounds
    result.left = bounds[0].as('px')
    result.top = bounds[1].as('px')
    result.right = bounds[2].as('px')
    result.bottom = bounds[3].as('px')
    // result.width = right - result.left
    // result.height = bottom - result.top
    return result
  },

  getBoundsFromPixels: function(result){
    if (result == null) result = {};
    if (this.isGroupEnd) return result;
    // FIXME: If it has a mask, measure the mask instead
    
    if (!(this.isGroup || this.hasVectorMask())) return this.getBounds(result);
    // TODO: Rasterize vectorMask or measure the points
    
    var doc = this.getFakeDocument()
    var layer = this
    
    layer.doWhileThisIsTheOnlyThingVisible(function(){
      doc.doThenUndo(function(){
        mergeVisible:{
          selectNoLayers:{
            var idselectNoLayers = stringIDToTypeID( "selectNoLayers" );
                var desc253 = new ActionDescriptor();
                var idnull = charIDToTypeID( "null" );
                    var ref173 = new ActionReference();
                    var idLyr = charIDToTypeID( "Lyr " );
                    var idOrdn = charIDToTypeID( "Ordn" );
                    var idTrgt = charIDToTypeID( "Trgt" );
                    ref173.putEnumerated( idLyr, idOrdn, idTrgt );
                desc253.putReference( idnull, ref173 );
            try {
              executeAction( idselectNoLayers, desc253, DialogModes.NO );
            }catch(e){}
          }
          executeAction(charIDToTypeID("MrgV"), undefined, DialogModes.NO)
        }
        FakeLayer.getActiveLayerForDocument(doc).getBounds(result)
      })
    })
    return result
  },

  getOpacity: function FakeLayer$getOpacity(){
    if (this.isGroupEnd) return;
    return this.getActionDescriptor().getDouble(cTID('Opct'))
  },

  isVisible: function FakeLayer$isVisible(){
    if (this.isGroupEnd) return;
    return this.getActionDescriptor().getBoolean(cTID('Vsbl'))
  },

////////////////////////////////////////////////////////////////////////////////
// initializing getters

  getType: function FakeLayer$getType(){
    var type
    this.getType = function FakeLayer$cached_getType(){return type}
    type = app.typeIDToStringID(
      this.getActionDescriptor().getEnumerationValue(sTID("layerSection"))
    ).replace(/^layerSection/,'')
    
    return type
  },
  
  getIndex: function FakeLayer$getIndex(){
    if ("index" in this) return this.index
    try {
      return this.index = this.getActionDescriptor().getInteger(cTID("ItmI"))
    }
    catch(e){
      return null
    }
  },
  
  getID: function FakeLayer$getID(){
    if ("id" in this) return this.id
    return this.id = this.getActionDescriptor().getInteger(cTID("LyrI"))
  },
  
  getName: function FakeLayer$getName(){
    if ("name" in this) return this.name
    if (this.isGroupEnd) return this.name = null
    return this.name = this.getActionDescriptor().getString(cTID("Nm  "))
  },
  
  hasVectorMask: function FakeLayer$hasVectorMask(){
    if ("_hasVectorMask" in this) return this._hasVectorMask
    if (this.isGroupEnd) return this._hasVectorMask = null
    return this._hasVectorMask = this.getActionDescriptor().getBoolean(sTID("hasVectorMask"))
  },


////////////////////////////////////////////////////////////////////////////////
// getters
  
  // getBottom: function FakeLayer$getBottom(){ return this.top + this.height },
  // getRight: function FakeLayer$getRight(){ return this.left + this.width },
  getWidth: function(){ return this.right - this.left },
  getHeight: function(){ return this.bottom - this.top },

  getDefaultFilename: function FakeLayer$getDefaultFilename(){
    return this.getName()
  },
  getDefaultPath: function FakeLayer$getDefaultPath(extension){
    return this.getFakeDocument().getFolderPath() + '/' + this.getDefaultFilename()
  },


////////////////////////////////////////////////////////////////////////////////
// export

  convertToSmartObject: function FakeLayer$convertToSmartObject(){
    this.activate()
    executeAction(stringIDToTypeID("newPlacedLayer"), undefined, DialogModes.NO)
  },
  
  exportContents: function FakeLayer$exportContents(path){
    this.activate()
    path = new File((path || this.getDefaultPath()).replace(/(?:\.psb)?$/, '.psb'))
    if (!path.parent.exists) path.parent.create()
    
    var desc = new ActionDescriptor
    desc.putPath(charIDToTypeID('null'), path)
    try {
      executeAction(stringIDToTypeID("placedLayerExportContents"), desc, DialogModes.NO)
    }
    catch(e){
      var layer = this
      this.getFakeDocument().doThenUndo(function(doc){
        layer.convertToSmartObject()
        executeAction(stringIDToTypeID("placedLayerExportContents"), desc, DialogModes.NO)
      })
    }
  },
  
  saveTrimmedPNG: function FakeLayer$saveTrimmedPNG(path){
    if (path == null) path = this.getDefaultPath()
    var layer = this
    layer.getFakeDocument().doThenUndo(function(){
      layer.doWhileThisIsTheOnlyThingVisible(function(){
        layer.getFakeDocument().trimTransparency()
        savePNG(path)
      })
    })
  },
  
  saveCroppedPNG: function FakeLayer$saveCroppedPNG(state){
    // console.log('saveCroppedPNG')
    if (typeof state == 'string') state = this[state] // saveCroppedPNG('state key')
    if (state == null) state = this.getState();
    
    var path = state.path
    if (path == null) path = this.getDefaultPath();
    state.path = path
    
    var layer = this
    layer.getFakeDocument().doThenUndo(function(){
      // console.log('doThenUndo')
      layer.doWhileThisIsTheOnlyThingVisible(function(){
        // console.log('doWhileThisIsTheOnlyThingVisible')
        layer.getFakeDocument().cropToBounds(+state.top, +state.left, +state.bottom, +state.right)
        savePNG(path)
        // $.bp()
      })
    })
    return state
  },
  
  doWhileThisIsTheOnlyThingVisible: function FakeLayer$doWhileThisIsTheOnlyThingVisible(callback){
    this.getFakeDocument().toggleShowOnly(this)
    this._showAncestors()
    try {
      // $.writeln('doWhileThisIsTheOnlyThingVisible')
      callback.call(this)
    }
    finally {
      this.getFakeDocument().toggleShowOnly(this)
      this._resetAncestorVisibility()
    }
  },

////////////////////////////////////////////////////////////////////////////////
// visible

  _setBool: function FakeLayer$_setBool(key, value){
    var target = new ActionDescriptor
    target.putReference(charIDToTypeID("null"), this.getActionReference())
    
    var args = new ActionDescriptor
    args.putBoolean(key, Boolean(value))
    target.putObject(charIDToTypeID("T   "), charIDToTypeID("Lyr "), args)
    
    try {
      return executeAction(charIDToTypeID("setd"), target, DialogModes.NO)
    }
    catch(e){
      return e
    }
  },
  disableVectorMask: function FakeLayer$disableVectorMask(){
    return this._setBool(stringIDToTypeID("vectorMaskEnabled"), false)
  },
  disableMask: function FakeLayer$disableMask(){
    return this._setBool(charIDToTypeID("UsrM"), false)
  },

  _showAncestors: function FakeLayer$_showAncestors(){
    var layer = this
    while (layer && layer.getParent){
      layer = layer.getParent()
      layer.wasVisible = layer.visible
      layer.show && layer.show()
      layer.disableMask && layer.disableMask()
      layer.disableVectorMask && layer.disableVectorMask()
    }
  },
  _resetAncestorVisibility: function FakeLayer$_resetAncestorVisibility(){
    var layer = this
    while (layer && layer.getParent){
      layer = layer.getParent()
      if (layer.wasVisible && !layer.visible) layer.show && layer.show()
      if (!layer.wasVisible && layer.visible) layer.hide && layer.hide()
      delete layer.wasVisible
    }
  },
  
  hide: function FakeLayer$hide(){
    this._executeAction("Hd  ")
    this.visible = false
  },
  show: function FakeLayer$hide(){
    this._executeAction("Shw ")
    this.visible = true
  },

////////////////////////////////////////////////////////////////////////////////
// setters
  
  setName: function(name){
    this.activate()
    
    var classLayer                   = app.charIDToTypeID('Lyr ');
    var eventSet                     = app.charIDToTypeID('setd');
    var keyName                      = app.charIDToTypeID('Nm  ');
    var keyTo                        = app.charIDToTypeID('T   ');
    var typeNULL                     = app.charIDToTypeID('null');

    // =======================================================
        var desc785 = new ActionDescriptor();
        desc785.putReference( typeNULL, this.getActionReference() );
            var desc786 = new ActionDescriptor();
            desc786.putString( keyName, name );
        desc785.putObject( keyTo, classLayer, desc786 );
    executeAction( eventSet, desc785, DialogModes.NO );
  },
  
  Delete: function(){
    var desc = new ActionDescriptor
    desc.putReference(charIDToTypeID('null'), this.getActionReference())
    executeAction(app.charIDToTypeID('Dlt '), desc, DialogModes.NO)
  },
  
}
Templates = {"index.html": "<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<meta charset=\"utf-8\">\n\t\t\n\t\t<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n\t\t<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">\n\t\t<meta name=\"format-detection\" content=\"telephone=no\">\n\t\t<meta name=\"viewport\" content=\"width=640,initial-scale=0.5,user-scalable=no\">\n\n\t\t<link rel=\"apple-touch-icon-precomposed\" href=\"https://raw.github.com/koenbok/Framer/master/template/icon/apple-touch-icon-144x144-precomposed.png\" sizes=\"144x144\">\n\t\t<link rel=\"apple-touch-icon-precomposed\" href=\"https://raw.github.com/koenbok/Framer/master/template/icon/apple-touch-icon-114x114-precomposed.png\" sizes=\"114x114\">\n\t\t<link rel=\"apple-touch-icon-precomposed\" href=\"https://raw.github.com/koenbok/Framer/master/template/icon/apple-touch-icon-72x72-precomposed.png\" sizes=\"72x72\">\n\t\t<link rel=\"apple-touch-icon-precomposed\" href=\"https://raw.github.com/koenbok/Framer/master/template/icon/apple-touch-icon-precomposed.png\">\n\n\t\t<title>{{ title }}</title>\n\t\t\n\t\t<style type=\"text/css\" media=\"screen\">\n\t\t\n\t\t* {\n\t\t\tmargin:0;\n\t\t\tpadding:0;\n\t\t\tborder:none;\n\t\t\t-webkit-user-select:none;\n\t\t}\n\n\t\tbody {\n\t\t\tbackground-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFMzMzDBMatgEYWQAAABhJREFUeNpiYIADRjhgGNKCw8UfcAAQYACltADJ8fw9RwAAAABJRU5ErkJggg==);\n\t\t\tfont: 28px/1em \"Helvetica\";\n\t\t\tcolor: #FFF;\n\t\t\t-webkit-tap-highlight-color: rgba(0,0,0,0);\n\t\t\t-webkit-perspective: 1000px;\n\t\t}\n\t\t\n\t\t::-webkit-scrollbar {\n\t\t\twidth: 0px;\n\t\t\theight: 0px;\n\t\t}\n\t\t\n\t\t</style>\n\t\t\n\t</head>\n\t<body>\n\t\t{{ views }}\n\t\t<script src=\"framer/framer.js\"></script>\n\t\t<script src=\"framer/framerps.js\"></script>\n\t\t<script src=\"app.js\"></script>\n\t</body>\n</html>", "app.js": "// Hello, welcome to your new Framer project. This is where you should \n// start coding. Feel free to remove all of this code.\n// \n// Just to rehash: Framer just converted all your layer groups into framer\n// views. Just drop index.html (next to this file) on your browser to see\n// the result. Every view is available under the global PSD object, so if you\n// had a layer group called MyPhoto you can find it under PSD[\"MyPhoto\"].\n// \n// You can safely re-run the Framer app any time and this code will stay \n// intact. Framer will only update the graphics.\n// \n// Some links that could come in handy:\n// \n// \t- Docs: \thttp://www.framer.com/documentation\n// \t- Examples: http://www.framer.com/examples\n\n\n// ==============================================================\n// Example: bounce all the views!\n\n\n// Simple reusable function that binds a bounce to a click on a view\nfunction bounceOnClick(view) {\n\t\n\t// If the view is a normal view (not a scrollview)\n\tif (view instanceof View) {\n\t\t\n\t\t// Listen to a click event\n\t\tview.on(\"click\", function(event) {\n\t\t\t\n\t\t\t// Stop sending the click event to underlying views after this\n\t\t\tevent.stopPropagation()\n\t\t\t\n\t\t\t// \"Wind up\" the spring\n\t\t\tview.scale = 0.7\n\t\t\t\n\t\t\t// And scale back to full size with a spring curve\n\t\t\tview.animate({\n\t\t\t\tproperties:{scale:1.0},\n\t\t\t\tcurve: \"spring(1000,15,500)\"\n\t\t\t})\n\t\t})\n\t}\n}\n\n\n// Loop through all the exported views\nfor (var layerGroupName in PSD) {\n\tbounceOnClick(PSD[layerGroupName]);\n}", "framer.js": "// Framer 2.0-20-g9bd31bf (c) 2013 Koen Bok\n// https://github.com/koenbok/Framer\n\nwindow.FramerVersion = \"2.0-20-g9bd31bf\";\n\n\n(function(){var require = function (file, cwd) {\n    var resolved = require.resolve(file, cwd || '/');\n    var mod = require.modules[resolved];\n    if (!mod) throw new Error(\n        'Failed to resolve module ' + file + ', tried ' + resolved\n    );\n    var cached = require.cache[resolved];\n    var res = cached? cached.exports : mod();\n    return res;\n};\n\nrequire.paths = [];\nrequire.modules = {};\nrequire.cache = {};\nrequire.extensions = [\".js\",\".coffee\",\".json\"];\n\nrequire._core = {\n    'assert': true,\n    'events': true,\n    'fs': true,\n    'path': true,\n    'vm': true\n};\n\nrequire.resolve = (function () {\n    return function (x, cwd) {\n        if (!cwd) cwd = '/';\n        \n        if (require._core[x]) return x;\n        var path = require.modules.path();\n        cwd = path.resolve('/', cwd);\n        var y = cwd || '/';\n        \n        if (x.match(/^(?:\\.\\.?\\/|\\/)/)) {\n            var m = loadAsFileSync(path.resolve(y, x))\n                || loadAsDirectorySync(path.resolve(y, x));\n            if (m) return m;\n        }\n        \n        var n = loadNodeModulesSync(x, y);\n        if (n) return n;\n        \n        throw new Error(\"Cannot find module '\" + x + \"'\");\n        \n        function loadAsFileSync (x) {\n            x = path.normalize(x);\n            if (require.modules[x]) {\n                return x;\n            }\n            \n            for (var i = 0; i < require.extensions.length; i++) {\n                var ext = require.extensions[i];\n                if (require.modules[x + ext]) return x + ext;\n            }\n        }\n        \n        function loadAsDirectorySync (x) {\n            x = x.replace(/\\/+$/, '');\n            var pkgfile = path.normalize(x + '/package.json');\n            if (require.modules[pkgfile]) {\n                var pkg = require.modules[pkgfile]();\n                var b = pkg.browserify;\n                if (typeof b === 'object' && b.main) {\n                    var m = loadAsFileSync(path.resolve(x, b.main));\n                    if (m) return m;\n                }\n                else if (typeof b === 'string') {\n                    var m = loadAsFileSync(path.resolve(x, b));\n                    if (m) return m;\n                }\n                else if (pkg.main) {\n                    var m = loadAsFileSync(path.resolve(x, pkg.main));\n                    if (m) return m;\n                }\n            }\n            \n            return loadAsFileSync(x + '/index');\n        }\n        \n        function loadNodeModulesSync (x, start) {\n            var dirs = nodeModulesPathsSync(start);\n            for (var i = 0; i < dirs.length; i++) {\n                var dir = dirs[i];\n                var m = loadAsFileSync(dir + '/' + x);\n                if (m) return m;\n                var n = loadAsDirectorySync(dir + '/' + x);\n                if (n) return n;\n            }\n            \n            var m = loadAsFileSync(x);\n            if (m) return m;\n        }\n        \n        function nodeModulesPathsSync (start) {\n            var parts;\n            if (start === '/') parts = [ '' ];\n            else parts = path.normalize(start).split('/');\n            \n            var dirs = [];\n            for (var i = parts.length - 1; i >= 0; i--) {\n                if (parts[i] === 'node_modules') continue;\n                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';\n                dirs.push(dir);\n            }\n            \n            return dirs;\n        }\n    };\n})();\n\nrequire.alias = function (from, to) {\n    var path = require.modules.path();\n    var res = null;\n    try {\n        res = require.resolve(from + '/package.json', '/');\n    }\n    catch (err) {\n        res = require.resolve(from, '/');\n    }\n    var basedir = path.dirname(res);\n    \n    var keys = (Object.keys || function (obj) {\n        var res = [];\n        for (var key in obj) res.push(key);\n        return res;\n    })(require.modules);\n    \n    for (var i = 0; i < keys.length; i++) {\n        var key = keys[i];\n        if (key.slice(0, basedir.length + 1) === basedir + '/') {\n            var f = key.slice(basedir.length);\n            require.modules[to + f] = require.modules[basedir + f];\n        }\n        else if (key === basedir) {\n            require.modules[to] = require.modules[basedir];\n        }\n    }\n};\n\n(function () {\n    var process = {};\n    var global = typeof window !== 'undefined' ? window : {};\n    var definedProcess = false;\n    \n    require.define = function (filename, fn) {\n        if (!definedProcess && require.modules.__browserify_process) {\n            process = require.modules.__browserify_process();\n            definedProcess = true;\n        }\n        \n        var dirname = require._core[filename]\n            ? ''\n            : require.modules.path().dirname(filename)\n        ;\n        \n        var require_ = function (file) {\n            var requiredModule = require(file, dirname);\n            var cached = require.cache[require.resolve(file, dirname)];\n\n            if (cached && cached.parent === null) {\n                cached.parent = module_;\n            }\n\n            return requiredModule;\n        };\n        require_.resolve = function (name) {\n            return require.resolve(name, dirname);\n        };\n        require_.modules = require.modules;\n        require_.define = require.define;\n        require_.cache = require.cache;\n        var module_ = {\n            id : filename,\n            filename: filename,\n            exports : {},\n            loaded : false,\n            parent: null\n        };\n        \n        require.modules[filename] = function () {\n            require.cache[filename] = module_;\n            fn.call(\n                module_.exports,\n                require_,\n                module_,\n                module_.exports,\n                dirname,\n                filename,\n                process,\n                global\n            );\n            module_.loaded = true;\n            return module_.exports;\n        };\n    };\n})();\n\n\nrequire.define(\"path\",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\nexports.relative = function(from, to) {\n  from = exports.resolve(from).substr(1);\n  to = exports.resolve(to).substr(1);\n\n  function trim(arr) {\n    var start = 0;\n    for (; start < arr.length; start++) {\n      if (arr[start] !== '') break;\n    }\n\n    var end = arr.length - 1;\n    for (; end >= 0; end--) {\n      if (arr[end] !== '') break;\n    }\n\n    if (start > end) return [];\n    return arr.slice(start, end - start + 1);\n  }\n\n  var fromParts = trim(from.split('/'));\n  var toParts = trim(to.split('/'));\n\n  var length = Math.min(fromParts.length, toParts.length);\n  var samePartsLength = length;\n  for (var i = 0; i < length; i++) {\n    if (fromParts[i] !== toParts[i]) {\n      samePartsLength = i;\n      break;\n    }\n  }\n\n  var outputParts = [];\n  for (var i = samePartsLength; i < fromParts.length; i++) {\n    outputParts.push('..');\n  }\n\n  outputParts = outputParts.concat(toParts.slice(samePartsLength));\n\n  return outputParts.join('/');\n};\n\n});\n\nrequire.define(\"__browserify_process\",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};\n\nprocess.nextTick = (function () {\n    var canSetImmediate = typeof window !== 'undefined'\n        && window.setImmediate;\n    var canPost = typeof window !== 'undefined'\n        && window.postMessage && window.addEventListener\n    ;\n\n    if (canSetImmediate) {\n        return function (f) { return window.setImmediate(f) };\n    }\n\n    if (canPost) {\n        var queue = [];\n        window.addEventListener('message', function (ev) {\n            if (ev.source === window && ev.data === 'browserify-tick') {\n                ev.stopPropagation();\n                if (queue.length > 0) {\n                    var fn = queue.shift();\n                    fn();\n                }\n            }\n        }, true);\n\n        return function nextTick(fn) {\n            queue.push(fn);\n            window.postMessage('browserify-tick', '*');\n        };\n    }\n\n    return function nextTick(fn) {\n        setTimeout(fn, 0);\n    };\n})();\n\nprocess.title = 'browser';\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\n\nprocess.binding = function (name) {\n    if (name === 'evals') return (require)('vm')\n    else throw new Error('No such module. (Possibly not yet loaded)')\n};\n\n(function () {\n    var cwd = '/';\n    var path;\n    process.cwd = function () { return cwd };\n    process.chdir = function (dir) {\n        if (!path) path = require('path');\n        cwd = path.resolve(dir, cwd);\n    };\n})();\n\n});\n\nrequire.define(\"/src/css.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  exports.addStyle = function(css) {\n    var styleSheet;\n    styleSheet = document.createElement(\"style\");\n    styleSheet.innerHTML = css;\n    return document.head.appendChild(styleSheet);\n  };\n\n  exports.addStyle(\".framer {\tdisplay: block;\tvisibility: visible;\tposition: absolute;\ttop:auto; right:auto; bottom:auto; left:auto;\twidth:auto; height:auto;\toverflow: visible;\tz-index: 0;\topacity: 1;\tbox-sizing: border-box;\t-webkit-box-sizing: border-box;\t-webkit-transform-origin: 50% 50% 0%;\t-webkit-transform-style: flat;\t-webkit-backface-visibility: hidden;}\");\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/config.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  exports.config = {\n    baseUrl: \"\",\n    timeSpeedFactor: 1,\n    roundingDecimals: 5,\n    animationPrecision: 60,\n    animationDebug: false,\n    animationProfile: false\n  };\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/utils.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var config, _, __domComplete,\n    __slice = [].slice,\n    _this = this,\n    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };\n\n  _ = require(\"underscore\");\n\n  config = require(\"./config\").config;\n\n  Function.prototype.define = function(prop, desc) {\n    Object.defineProperty(this.prototype, prop, desc);\n    return Object.__;\n  };\n\n  exports.delay = function(time, f) {\n    var timer;\n    timer = setTimeout(f, time * config.timeSpeedFactor);\n    if (window._delayTimers == null) {\n      window._delayTimers = [];\n    }\n    window._delayTimers.push(timer);\n    return timer;\n  };\n\n  exports.interval = function(time, f) {\n    var timer;\n    timer = setInterval(f, time * config.timeSpeedFactor);\n    if (window._delayIntervals == null) {\n      window._delayIntervals = [];\n    }\n    window._delayIntervals.push(timer);\n    return timer;\n  };\n\n  exports.debounce = function(threshold, fn, immediate) {\n    var timeout;\n    timeout = null;\n    return function() {\n      var args, delayed, obj;\n      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      obj = this;\n      delayed = function() {\n        if (!immediate) {\n          fn.apply(obj, args);\n        }\n        return timeout = null;\n      };\n      if (timeout) {\n        clearTimeout(timeout);\n      } else if (immediate) {\n        fn.apply(obj, args);\n      }\n      return timeout = setTimeout(delayed, threshold || 100);\n    };\n  };\n\n  exports.throttle = function(delay, fn) {\n    var timer;\n    if (delay === 0) {\n      return fn;\n    }\n    timer = false;\n    return function() {\n      if (timer) {\n        return;\n      }\n      timer = true;\n      if (delay !== -1) {\n        setTimeout((function() {\n          return timer = false;\n        }), delay);\n      }\n      return fn.apply(null, arguments);\n    };\n  };\n\n  exports.max = function(arr) {\n    return Math.max.apply(Math, arr);\n  };\n\n  exports.min = function(arr) {\n    return Math.min.apply(Math, arr);\n  };\n\n  exports.sum = function(a) {\n    if (a.length > 0) {\n      return a.reduce(function(x, y) {\n        return x + y;\n      });\n    } else {\n      return 0;\n    }\n  };\n\n  exports.round = function(value, decimals) {\n    var d;\n    d = Math.pow(10, decimals);\n    return Math.round(value * d) / d;\n  };\n\n  exports.randomColor = function(alpha) {\n    var c;\n    if (alpha == null) {\n      alpha = 1.0;\n    }\n    c = function() {\n      return parseInt(Math.random() * 255);\n    };\n    return \"rgba(\" + (c()) + \", \" + (c()) + \", \" + (c()) + \", \" + alpha + \")\";\n  };\n\n  exports.uuid = function() {\n    var chars, digit, output, r, random, _i;\n    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');\n    output = new Array(36);\n    random = 0;\n    for (digit = _i = 1; _i <= 32; digit = ++_i) {\n      if (random <= 0x02) {\n        random = 0x2000000 + (Math.random() * 0x1000000) | 0;\n      }\n      r = random & 0xf;\n      random = random >> 4;\n      output[digit] = chars[digit === 19 ? (r & 0x3) | 0x8 : r];\n    }\n    return output.join('');\n  };\n\n  exports.cycle = function() {\n    var args, curr;\n    if (_.isArray(arguments[0])) {\n      args = arguments[0];\n    } else {\n      args = Array.prototype.slice.call(arguments);\n    }\n    curr = -1;\n    return function() {\n      curr++;\n      if (curr >= args.length) {\n        curr = 0;\n      }\n      return args[curr];\n    };\n  };\n\n  exports.toggle = exports.cycle;\n\n  exports.isWebKit = function() {\n    return window.WebKitCSSMatrix !== null;\n  };\n\n  exports.isTouch = function() {\n    return window.ontouchstart === null;\n  };\n\n  exports.isMobile = function() {\n    return /iphone|ipod|android|ie|blackberry|fennec/.test(navigator.userAgent.toLowerCase());\n  };\n\n  exports.isLocal = function() {\n    return window.location.href.slice(0, 7) === \"file://\";\n  };\n\n  exports.devicePixelRatio = function() {\n    return window.devicePixelRatio;\n  };\n\n  __domComplete = [];\n\n  document.onreadystatechange = function(event) {\n    var f, _results;\n    if (document.readyState === \"complete\") {\n      _results = [];\n      while (__domComplete.length) {\n        _results.push(f = __domComplete.shift()());\n      }\n      return _results;\n    }\n  };\n\n  exports.domComplete = function(f) {\n    if (document.readyState === \"complete\") {\n      return f();\n    } else {\n      return __domComplete.push(f);\n    }\n  };\n\n  exports.domCompleteCancel = function(f) {\n    return __domComplete = _.without(__domComplete, f);\n  };\n\n  exports.domLoadScript = function(url, callback) {\n    var head, script;\n    script = document.createElement(\"script\");\n    script.type = \"text/javascript\";\n    script.src = url;\n    script.onload = callback;\n    head = document.getElementsByTagName(\"head\")[0];\n    head.appendChild(script);\n    return script;\n  };\n\n  exports.pointDistance = function(pointA, pointB) {\n    var distance;\n    return distance = {\n      x: Math.abs(pointB.x - pointA.x),\n      y: Math.abs(pointB.y - pointA.y)\n    };\n  };\n\n  exports.pointInvert = function(point) {\n    return point = {\n      x: 0 - point.x,\n      y: 0 - point.y\n    };\n  };\n\n  exports.pointTotal = function(point) {\n    return point.x + point.y;\n  };\n\n  exports.frameSize = function(frame) {\n    var size;\n    return size = {\n      width: frame.width,\n      height: frame.height\n    };\n  };\n\n  exports.framePoint = function(frame) {\n    var point;\n    return point = {\n      x: frame.x,\n      y: frame.y\n    };\n  };\n\n  exports.pointAbs = function(point) {\n    return point = {\n      x: Math.abs(point.x),\n      y: Math.abs(point.y)\n    };\n  };\n\n  exports.pointInFrame = function(point, frame) {\n    if (point.x < frame.minX || point.x > frame.maxX) {\n      return false;\n    }\n    if (point.y < frame.minY || point.y > frame.maxY) {\n      return false;\n    }\n    return true;\n  };\n\n  exports.convertPoint = function(point, view1, view2) {\n    var superViews1, superViews2, traverse, view, _i, _j, _len, _len1;\n    point = exports.extend({}, point);\n    traverse = function(view) {\n      var currentView, superViews;\n      currentView = view;\n      superViews = [];\n      while (currentView && currentView.superView) {\n        superViews.push(currentView.superView);\n        currentView = currentView.superView;\n      }\n      return superViews;\n    };\n    superViews1 = traverse(view1);\n    superViews2 = traverse(view2);\n    if (view2) {\n      superViews2.push(view2);\n    }\n    for (_i = 0, _len = superViews1.length; _i < _len; _i++) {\n      view = superViews1[_i];\n      point.x += view.x;\n      point.y += view.y;\n      if (view.scrollFrame) {\n        point.x -= view.scrollFrame.x;\n        point.y -= view.scrollFrame.y;\n      }\n    }\n    for (_j = 0, _len1 = superViews2.length; _j < _len1; _j++) {\n      view = superViews2[_j];\n      point.x -= view.x;\n      point.y -= view.y;\n      if (view.scrollFrame) {\n        point.x += view.scrollFrame.x;\n        point.y += view.scrollFrame.y;\n      }\n    }\n    return point;\n  };\n\n  exports.keys = function(a) {\n    var key, _results;\n    _results = [];\n    for (key in a) {\n      _results.push(key);\n    }\n    return _results;\n  };\n\n  exports.extend = function() {\n    var a, args, key, obj, value, _i, _len, _ref;\n    args = Array.prototype.slice.call(arguments);\n    a = args[0];\n    _ref = args.slice(1);\n    for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n      obj = _ref[_i];\n      for (key in obj) {\n        value = obj[key];\n        a[key] = value;\n      }\n    }\n    return a;\n  };\n\n  exports.update = function(target, source) {\n    var keys;\n    keys = exports.keys(target);\n    exports.extend(target, exports.filter(source, function(k) {\n      return __indexOf.call(keys, k) >= 0;\n    }));\n    return a;\n  };\n\n  exports.copy = function(source) {\n    return exports.extend({}, source);\n  };\n\n  exports.filter = function(source, iterator) {\n    var b, key, value;\n    b = {};\n    for (key in source) {\n      value = source[key];\n      if (iterator(key, value)) {\n        b[key] = value;\n      }\n    }\n    return b;\n  };\n\n  exports.union = function() {\n    return Array.prototype.concat.apply(Array.prototype, arguments);\n  };\n\n  exports.remove = function(a, e) {\n    var t;\n    if ((t = a.indexOf(e)) > -1) {\n      a.splice(t, 1)[0];\n    }\n    return a;\n  };\n\n}).call(this);\n\n});\n\nrequire.define(\"/node_modules/underscore/package.json\",function(require,module,exports,__dirname,__filename,process,global){module.exports = {\"main\":\"underscore.js\"}\n});\n\nrequire.define(\"/node_modules/underscore/underscore.js\",function(require,module,exports,__dirname,__filename,process,global){//     Underscore.js 1.5.1\n//     http://underscorejs.org\n//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n//     Underscore may be freely distributed under the MIT license.\n\n(function() {\n\n  // Baseline setup\n  // --------------\n\n  // Establish the root object, `window` in the browser, or `global` on the server.\n  var root = this;\n\n  // Save the previous value of the `_` variable.\n  var previousUnderscore = root._;\n\n  // Establish the object that gets returned to break out of a loop iteration.\n  var breaker = {};\n\n  // Save bytes in the minified (but not gzipped) version:\n  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;\n\n  // Create quick reference variables for speed access to core prototypes.\n  var\n    push             = ArrayProto.push,\n    slice            = ArrayProto.slice,\n    concat           = ArrayProto.concat,\n    toString         = ObjProto.toString,\n    hasOwnProperty   = ObjProto.hasOwnProperty;\n\n  // All **ECMAScript 5** native function implementations that we hope to use\n  // are declared here.\n  var\n    nativeForEach      = ArrayProto.forEach,\n    nativeMap          = ArrayProto.map,\n    nativeReduce       = ArrayProto.reduce,\n    nativeReduceRight  = ArrayProto.reduceRight,\n    nativeFilter       = ArrayProto.filter,\n    nativeEvery        = ArrayProto.every,\n    nativeSome         = ArrayProto.some,\n    nativeIndexOf      = ArrayProto.indexOf,\n    nativeLastIndexOf  = ArrayProto.lastIndexOf,\n    nativeIsArray      = Array.isArray,\n    nativeKeys         = Object.keys,\n    nativeBind         = FuncProto.bind;\n\n  // Create a safe reference to the Underscore object for use below.\n  var _ = function(obj) {\n    if (obj instanceof _) return obj;\n    if (!(this instanceof _)) return new _(obj);\n    this._wrapped = obj;\n  };\n\n  // Export the Underscore object for **Node.js**, with\n  // backwards-compatibility for the old `require()` API. If we're in\n  // the browser, add `_` as a global object via a string identifier,\n  // for Closure Compiler \"advanced\" mode.\n  if (typeof exports !== 'undefined') {\n    if (typeof module !== 'undefined' && module.exports) {\n      exports = module.exports = _;\n    }\n    exports._ = _;\n  } else {\n    root._ = _;\n  }\n\n  // Current version.\n  _.VERSION = '1.5.1';\n\n  // Collection Functions\n  // --------------------\n\n  // The cornerstone, an `each` implementation, aka `forEach`.\n  // Handles objects with the built-in `forEach`, arrays, and raw objects.\n  // Delegates to **ECMAScript 5**'s native `forEach` if available.\n  var each = _.each = _.forEach = function(obj, iterator, context) {\n    if (obj == null) return;\n    if (nativeForEach && obj.forEach === nativeForEach) {\n      obj.forEach(iterator, context);\n    } else if (obj.length === +obj.length) {\n      for (var i = 0, l = obj.length; i < l; i++) {\n        if (iterator.call(context, obj[i], i, obj) === breaker) return;\n      }\n    } else {\n      for (var key in obj) {\n        if (_.has(obj, key)) {\n          if (iterator.call(context, obj[key], key, obj) === breaker) return;\n        }\n      }\n    }\n  };\n\n  // Return the results of applying the iterator to each element.\n  // Delegates to **ECMAScript 5**'s native `map` if available.\n  _.map = _.collect = function(obj, iterator, context) {\n    var results = [];\n    if (obj == null) return results;\n    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);\n    each(obj, function(value, index, list) {\n      results.push(iterator.call(context, value, index, list));\n    });\n    return results;\n  };\n\n  var reduceError = 'Reduce of empty array with no initial value';\n\n  // **Reduce** builds up a single result from a list of values, aka `inject`,\n  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.\n  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {\n    var initial = arguments.length > 2;\n    if (obj == null) obj = [];\n    if (nativeReduce && obj.reduce === nativeReduce) {\n      if (context) iterator = _.bind(iterator, context);\n      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);\n    }\n    each(obj, function(value, index, list) {\n      if (!initial) {\n        memo = value;\n        initial = true;\n      } else {\n        memo = iterator.call(context, memo, value, index, list);\n      }\n    });\n    if (!initial) throw new TypeError(reduceError);\n    return memo;\n  };\n\n  // The right-associative version of reduce, also known as `foldr`.\n  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.\n  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {\n    var initial = arguments.length > 2;\n    if (obj == null) obj = [];\n    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {\n      if (context) iterator = _.bind(iterator, context);\n      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);\n    }\n    var length = obj.length;\n    if (length !== +length) {\n      var keys = _.keys(obj);\n      length = keys.length;\n    }\n    each(obj, function(value, index, list) {\n      index = keys ? keys[--length] : --length;\n      if (!initial) {\n        memo = obj[index];\n        initial = true;\n      } else {\n        memo = iterator.call(context, memo, obj[index], index, list);\n      }\n    });\n    if (!initial) throw new TypeError(reduceError);\n    return memo;\n  };\n\n  // Return the first value which passes a truth test. Aliased as `detect`.\n  _.find = _.detect = function(obj, iterator, context) {\n    var result;\n    any(obj, function(value, index, list) {\n      if (iterator.call(context, value, index, list)) {\n        result = value;\n        return true;\n      }\n    });\n    return result;\n  };\n\n  // Return all the elements that pass a truth test.\n  // Delegates to **ECMAScript 5**'s native `filter` if available.\n  // Aliased as `select`.\n  _.filter = _.select = function(obj, iterator, context) {\n    var results = [];\n    if (obj == null) return results;\n    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);\n    each(obj, function(value, index, list) {\n      if (iterator.call(context, value, index, list)) results.push(value);\n    });\n    return results;\n  };\n\n  // Return all the elements for which a truth test fails.\n  _.reject = function(obj, iterator, context) {\n    return _.filter(obj, function(value, index, list) {\n      return !iterator.call(context, value, index, list);\n    }, context);\n  };\n\n  // Determine whether all of the elements match a truth test.\n  // Delegates to **ECMAScript 5**'s native `every` if available.\n  // Aliased as `all`.\n  _.every = _.all = function(obj, iterator, context) {\n    iterator || (iterator = _.identity);\n    var result = true;\n    if (obj == null) return result;\n    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);\n    each(obj, function(value, index, list) {\n      if (!(result = result && iterator.call(context, value, index, list))) return breaker;\n    });\n    return !!result;\n  };\n\n  // Determine if at least one element in the object matches a truth test.\n  // Delegates to **ECMAScript 5**'s native `some` if available.\n  // Aliased as `any`.\n  var any = _.some = _.any = function(obj, iterator, context) {\n    iterator || (iterator = _.identity);\n    var result = false;\n    if (obj == null) return result;\n    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);\n    each(obj, function(value, index, list) {\n      if (result || (result = iterator.call(context, value, index, list))) return breaker;\n    });\n    return !!result;\n  };\n\n  // Determine if the array or object contains a given value (using `===`).\n  // Aliased as `include`.\n  _.contains = _.include = function(obj, target) {\n    if (obj == null) return false;\n    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;\n    return any(obj, function(value) {\n      return value === target;\n    });\n  };\n\n  // Invoke a method (with arguments) on every item in a collection.\n  _.invoke = function(obj, method) {\n    var args = slice.call(arguments, 2);\n    var isFunc = _.isFunction(method);\n    return _.map(obj, function(value) {\n      return (isFunc ? method : value[method]).apply(value, args);\n    });\n  };\n\n  // Convenience version of a common use case of `map`: fetching a property.\n  _.pluck = function(obj, key) {\n    return _.map(obj, function(value){ return value[key]; });\n  };\n\n  // Convenience version of a common use case of `filter`: selecting only objects\n  // containing specific `key:value` pairs.\n  _.where = function(obj, attrs, first) {\n    if (_.isEmpty(attrs)) return first ? void 0 : [];\n    return _[first ? 'find' : 'filter'](obj, function(value) {\n      for (var key in attrs) {\n        if (attrs[key] !== value[key]) return false;\n      }\n      return true;\n    });\n  };\n\n  // Convenience version of a common use case of `find`: getting the first object\n  // containing specific `key:value` pairs.\n  _.findWhere = function(obj, attrs) {\n    return _.where(obj, attrs, true);\n  };\n\n  // Return the maximum element or (element-based computation).\n  // Can't optimize arrays of integers longer than 65,535 elements.\n  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)\n  _.max = function(obj, iterator, context) {\n    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {\n      return Math.max.apply(Math, obj);\n    }\n    if (!iterator && _.isEmpty(obj)) return -Infinity;\n    var result = {computed : -Infinity, value: -Infinity};\n    each(obj, function(value, index, list) {\n      var computed = iterator ? iterator.call(context, value, index, list) : value;\n      computed > result.computed && (result = {value : value, computed : computed});\n    });\n    return result.value;\n  };\n\n  // Return the minimum element (or element-based computation).\n  _.min = function(obj, iterator, context) {\n    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {\n      return Math.min.apply(Math, obj);\n    }\n    if (!iterator && _.isEmpty(obj)) return Infinity;\n    var result = {computed : Infinity, value: Infinity};\n    each(obj, function(value, index, list) {\n      var computed = iterator ? iterator.call(context, value, index, list) : value;\n      computed < result.computed && (result = {value : value, computed : computed});\n    });\n    return result.value;\n  };\n\n  // Shuffle an array.\n  _.shuffle = function(obj) {\n    var rand;\n    var index = 0;\n    var shuffled = [];\n    each(obj, function(value) {\n      rand = _.random(index++);\n      shuffled[index - 1] = shuffled[rand];\n      shuffled[rand] = value;\n    });\n    return shuffled;\n  };\n\n  // An internal function to generate lookup iterators.\n  var lookupIterator = function(value) {\n    return _.isFunction(value) ? value : function(obj){ return obj[value]; };\n  };\n\n  // Sort the object's values by a criterion produced by an iterator.\n  _.sortBy = function(obj, value, context) {\n    var iterator = lookupIterator(value);\n    return _.pluck(_.map(obj, function(value, index, list) {\n      return {\n        value : value,\n        index : index,\n        criteria : iterator.call(context, value, index, list)\n      };\n    }).sort(function(left, right) {\n      var a = left.criteria;\n      var b = right.criteria;\n      if (a !== b) {\n        if (a > b || a === void 0) return 1;\n        if (a < b || b === void 0) return -1;\n      }\n      return left.index < right.index ? -1 : 1;\n    }), 'value');\n  };\n\n  // An internal function used for aggregate \"group by\" operations.\n  var group = function(obj, value, context, behavior) {\n    var result = {};\n    var iterator = lookupIterator(value == null ? _.identity : value);\n    each(obj, function(value, index) {\n      var key = iterator.call(context, value, index, obj);\n      behavior(result, key, value);\n    });\n    return result;\n  };\n\n  // Groups the object's values by a criterion. Pass either a string attribute\n  // to group by, or a function that returns the criterion.\n  _.groupBy = function(obj, value, context) {\n    return group(obj, value, context, function(result, key, value) {\n      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);\n    });\n  };\n\n  // Counts instances of an object that group by a certain criterion. Pass\n  // either a string attribute to count by, or a function that returns the\n  // criterion.\n  _.countBy = function(obj, value, context) {\n    return group(obj, value, context, function(result, key) {\n      if (!_.has(result, key)) result[key] = 0;\n      result[key]++;\n    });\n  };\n\n  // Use a comparator function to figure out the smallest index at which\n  // an object should be inserted so as to maintain order. Uses binary search.\n  _.sortedIndex = function(array, obj, iterator, context) {\n    iterator = iterator == null ? _.identity : lookupIterator(iterator);\n    var value = iterator.call(context, obj);\n    var low = 0, high = array.length;\n    while (low < high) {\n      var mid = (low + high) >>> 1;\n      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;\n    }\n    return low;\n  };\n\n  // Safely create a real, live array from anything iterable.\n  _.toArray = function(obj) {\n    if (!obj) return [];\n    if (_.isArray(obj)) return slice.call(obj);\n    if (obj.length === +obj.length) return _.map(obj, _.identity);\n    return _.values(obj);\n  };\n\n  // Return the number of elements in an object.\n  _.size = function(obj) {\n    if (obj == null) return 0;\n    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;\n  };\n\n  // Array Functions\n  // ---------------\n\n  // Get the first element of an array. Passing **n** will return the first N\n  // values in the array. Aliased as `head` and `take`. The **guard** check\n  // allows it to work with `_.map`.\n  _.first = _.head = _.take = function(array, n, guard) {\n    if (array == null) return void 0;\n    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];\n  };\n\n  // Returns everything but the last entry of the array. Especially useful on\n  // the arguments object. Passing **n** will return all the values in\n  // the array, excluding the last N. The **guard** check allows it to work with\n  // `_.map`.\n  _.initial = function(array, n, guard) {\n    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));\n  };\n\n  // Get the last element of an array. Passing **n** will return the last N\n  // values in the array. The **guard** check allows it to work with `_.map`.\n  _.last = function(array, n, guard) {\n    if (array == null) return void 0;\n    if ((n != null) && !guard) {\n      return slice.call(array, Math.max(array.length - n, 0));\n    } else {\n      return array[array.length - 1];\n    }\n  };\n\n  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.\n  // Especially useful on the arguments object. Passing an **n** will return\n  // the rest N values in the array. The **guard**\n  // check allows it to work with `_.map`.\n  _.rest = _.tail = _.drop = function(array, n, guard) {\n    return slice.call(array, (n == null) || guard ? 1 : n);\n  };\n\n  // Trim out all falsy values from an array.\n  _.compact = function(array) {\n    return _.filter(array, _.identity);\n  };\n\n  // Internal implementation of a recursive `flatten` function.\n  var flatten = function(input, shallow, output) {\n    if (shallow && _.every(input, _.isArray)) {\n      return concat.apply(output, input);\n    }\n    each(input, function(value) {\n      if (_.isArray(value) || _.isArguments(value)) {\n        shallow ? push.apply(output, value) : flatten(value, shallow, output);\n      } else {\n        output.push(value);\n      }\n    });\n    return output;\n  };\n\n  // Return a completely flattened version of an array.\n  _.flatten = function(array, shallow) {\n    return flatten(array, shallow, []);\n  };\n\n  // Return a version of the array that does not contain the specified value(s).\n  _.without = function(array) {\n    return _.difference(array, slice.call(arguments, 1));\n  };\n\n  // Produce a duplicate-free version of the array. If the array has already\n  // been sorted, you have the option of using a faster algorithm.\n  // Aliased as `unique`.\n  _.uniq = _.unique = function(array, isSorted, iterator, context) {\n    if (_.isFunction(isSorted)) {\n      context = iterator;\n      iterator = isSorted;\n      isSorted = false;\n    }\n    var initial = iterator ? _.map(array, iterator, context) : array;\n    var results = [];\n    var seen = [];\n    each(initial, function(value, index) {\n      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {\n        seen.push(value);\n        results.push(array[index]);\n      }\n    });\n    return results;\n  };\n\n  // Produce an array that contains the union: each distinct element from all of\n  // the passed-in arrays.\n  _.union = function() {\n    return _.uniq(_.flatten(arguments, true));\n  };\n\n  // Produce an array that contains every item shared between all the\n  // passed-in arrays.\n  _.intersection = function(array) {\n    var rest = slice.call(arguments, 1);\n    return _.filter(_.uniq(array), function(item) {\n      return _.every(rest, function(other) {\n        return _.indexOf(other, item) >= 0;\n      });\n    });\n  };\n\n  // Take the difference between one array and a number of other arrays.\n  // Only the elements present in just the first array will remain.\n  _.difference = function(array) {\n    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));\n    return _.filter(array, function(value){ return !_.contains(rest, value); });\n  };\n\n  // Zip together multiple lists into a single array -- elements that share\n  // an index go together.\n  _.zip = function() {\n    var length = _.max(_.pluck(arguments, \"length\").concat(0));\n    var results = new Array(length);\n    for (var i = 0; i < length; i++) {\n      results[i] = _.pluck(arguments, '' + i);\n    }\n    return results;\n  };\n\n  // Converts lists into objects. Pass either a single array of `[key, value]`\n  // pairs, or two parallel arrays of the same length -- one of keys, and one of\n  // the corresponding values.\n  _.object = function(list, values) {\n    if (list == null) return {};\n    var result = {};\n    for (var i = 0, l = list.length; i < l; i++) {\n      if (values) {\n        result[list[i]] = values[i];\n      } else {\n        result[list[i][0]] = list[i][1];\n      }\n    }\n    return result;\n  };\n\n  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),\n  // we need this function. Return the position of the first occurrence of an\n  // item in an array, or -1 if the item is not included in the array.\n  // Delegates to **ECMAScript 5**'s native `indexOf` if available.\n  // If the array is large and already in sort order, pass `true`\n  // for **isSorted** to use binary search.\n  _.indexOf = function(array, item, isSorted) {\n    if (array == null) return -1;\n    var i = 0, l = array.length;\n    if (isSorted) {\n      if (typeof isSorted == 'number') {\n        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);\n      } else {\n        i = _.sortedIndex(array, item);\n        return array[i] === item ? i : -1;\n      }\n    }\n    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);\n    for (; i < l; i++) if (array[i] === item) return i;\n    return -1;\n  };\n\n  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.\n  _.lastIndexOf = function(array, item, from) {\n    if (array == null) return -1;\n    var hasIndex = from != null;\n    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {\n      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);\n    }\n    var i = (hasIndex ? from : array.length);\n    while (i--) if (array[i] === item) return i;\n    return -1;\n  };\n\n  // Generate an integer Array containing an arithmetic progression. A port of\n  // the native Python `range()` function. See\n  // [the Python documentation](http://docs.python.org/library/functions.html#range).\n  _.range = function(start, stop, step) {\n    if (arguments.length <= 1) {\n      stop = start || 0;\n      start = 0;\n    }\n    step = arguments[2] || 1;\n\n    var len = Math.max(Math.ceil((stop - start) / step), 0);\n    var idx = 0;\n    var range = new Array(len);\n\n    while(idx < len) {\n      range[idx++] = start;\n      start += step;\n    }\n\n    return range;\n  };\n\n  // Function (ahem) Functions\n  // ------------------\n\n  // Reusable constructor function for prototype setting.\n  var ctor = function(){};\n\n  // Create a function bound to a given object (assigning `this`, and arguments,\n  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if\n  // available.\n  _.bind = function(func, context) {\n    var args, bound;\n    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));\n    if (!_.isFunction(func)) throw new TypeError;\n    args = slice.call(arguments, 2);\n    return bound = function() {\n      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));\n      ctor.prototype = func.prototype;\n      var self = new ctor;\n      ctor.prototype = null;\n      var result = func.apply(self, args.concat(slice.call(arguments)));\n      if (Object(result) === result) return result;\n      return self;\n    };\n  };\n\n  // Partially apply a function by creating a version that has had some of its\n  // arguments pre-filled, without changing its dynamic `this` context.\n  _.partial = function(func) {\n    var args = slice.call(arguments, 1);\n    return function() {\n      return func.apply(this, args.concat(slice.call(arguments)));\n    };\n  };\n\n  // Bind all of an object's methods to that object. Useful for ensuring that\n  // all callbacks defined on an object belong to it.\n  _.bindAll = function(obj) {\n    var funcs = slice.call(arguments, 1);\n    if (funcs.length === 0) throw new Error(\"bindAll must be passed function names\");\n    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });\n    return obj;\n  };\n\n  // Memoize an expensive function by storing its results.\n  _.memoize = function(func, hasher) {\n    var memo = {};\n    hasher || (hasher = _.identity);\n    return function() {\n      var key = hasher.apply(this, arguments);\n      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));\n    };\n  };\n\n  // Delays a function for the given number of milliseconds, and then calls\n  // it with the arguments supplied.\n  _.delay = function(func, wait) {\n    var args = slice.call(arguments, 2);\n    return setTimeout(function(){ return func.apply(null, args); }, wait);\n  };\n\n  // Defers a function, scheduling it to run after the current call stack has\n  // cleared.\n  _.defer = function(func) {\n    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));\n  };\n\n  // Returns a function, that, when invoked, will only be triggered at most once\n  // during a given window of time. Normally, the throttled function will run\n  // as much as it can, without ever going more than once per `wait` duration;\n  // but if you'd like to disable the execution on the leading edge, pass\n  // `{leading: false}`. To disable execution on the trailing edge, ditto.\n  _.throttle = function(func, wait, options) {\n    var context, args, result;\n    var timeout = null;\n    var previous = 0;\n    options || (options = {});\n    var later = function() {\n      previous = options.leading === false ? 0 : new Date;\n      timeout = null;\n      result = func.apply(context, args);\n    };\n    return function() {\n      var now = new Date;\n      if (!previous && options.leading === false) previous = now;\n      var remaining = wait - (now - previous);\n      context = this;\n      args = arguments;\n      if (remaining <= 0) {\n        clearTimeout(timeout);\n        timeout = null;\n        previous = now;\n        result = func.apply(context, args);\n      } else if (!timeout && options.trailing !== false) {\n        timeout = setTimeout(later, remaining);\n      }\n      return result;\n    };\n  };\n\n  // Returns a function, that, as long as it continues to be invoked, will not\n  // be triggered. The function will be called after it stops being called for\n  // N milliseconds. If `immediate` is passed, trigger the function on the\n  // leading edge, instead of the trailing.\n  _.debounce = function(func, wait, immediate) {\n    var result;\n    var timeout = null;\n    return function() {\n      var context = this, args = arguments;\n      var later = function() {\n        timeout = null;\n        if (!immediate) result = func.apply(context, args);\n      };\n      var callNow = immediate && !timeout;\n      clearTimeout(timeout);\n      timeout = setTimeout(later, wait);\n      if (callNow) result = func.apply(context, args);\n      return result;\n    };\n  };\n\n  // Returns a function that will be executed at most one time, no matter how\n  // often you call it. Useful for lazy initialization.\n  _.once = function(func) {\n    var ran = false, memo;\n    return function() {\n      if (ran) return memo;\n      ran = true;\n      memo = func.apply(this, arguments);\n      func = null;\n      return memo;\n    };\n  };\n\n  // Returns the first function passed as an argument to the second,\n  // allowing you to adjust arguments, run code before and after, and\n  // conditionally execute the original function.\n  _.wrap = function(func, wrapper) {\n    return function() {\n      var args = [func];\n      push.apply(args, arguments);\n      return wrapper.apply(this, args);\n    };\n  };\n\n  // Returns a function that is the composition of a list of functions, each\n  // consuming the return value of the function that follows.\n  _.compose = function() {\n    var funcs = arguments;\n    return function() {\n      var args = arguments;\n      for (var i = funcs.length - 1; i >= 0; i--) {\n        args = [funcs[i].apply(this, args)];\n      }\n      return args[0];\n    };\n  };\n\n  // Returns a function that will only be executed after being called N times.\n  _.after = function(times, func) {\n    return function() {\n      if (--times < 1) {\n        return func.apply(this, arguments);\n      }\n    };\n  };\n\n  // Object Functions\n  // ----------------\n\n  // Retrieve the names of an object's properties.\n  // Delegates to **ECMAScript 5**'s native `Object.keys`\n  _.keys = nativeKeys || function(obj) {\n    if (obj !== Object(obj)) throw new TypeError('Invalid object');\n    var keys = [];\n    for (var key in obj) if (_.has(obj, key)) keys.push(key);\n    return keys;\n  };\n\n  // Retrieve the values of an object's properties.\n  _.values = function(obj) {\n    var values = [];\n    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);\n    return values;\n  };\n\n  // Convert an object into a list of `[key, value]` pairs.\n  _.pairs = function(obj) {\n    var pairs = [];\n    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);\n    return pairs;\n  };\n\n  // Invert the keys and values of an object. The values must be serializable.\n  _.invert = function(obj) {\n    var result = {};\n    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;\n    return result;\n  };\n\n  // Return a sorted list of the function names available on the object.\n  // Aliased as `methods`\n  _.functions = _.methods = function(obj) {\n    var names = [];\n    for (var key in obj) {\n      if (_.isFunction(obj[key])) names.push(key);\n    }\n    return names.sort();\n  };\n\n  // Extend a given object with all the properties in passed-in object(s).\n  _.extend = function(obj) {\n    each(slice.call(arguments, 1), function(source) {\n      if (source) {\n        for (var prop in source) {\n          obj[prop] = source[prop];\n        }\n      }\n    });\n    return obj;\n  };\n\n  // Return a copy of the object only containing the whitelisted properties.\n  _.pick = function(obj) {\n    var copy = {};\n    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));\n    each(keys, function(key) {\n      if (key in obj) copy[key] = obj[key];\n    });\n    return copy;\n  };\n\n   // Return a copy of the object without the blacklisted properties.\n  _.omit = function(obj) {\n    var copy = {};\n    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));\n    for (var key in obj) {\n      if (!_.contains(keys, key)) copy[key] = obj[key];\n    }\n    return copy;\n  };\n\n  // Fill in a given object with default properties.\n  _.defaults = function(obj) {\n    each(slice.call(arguments, 1), function(source) {\n      if (source) {\n        for (var prop in source) {\n          if (obj[prop] === void 0) obj[prop] = source[prop];\n        }\n      }\n    });\n    return obj;\n  };\n\n  // Create a (shallow-cloned) duplicate of an object.\n  _.clone = function(obj) {\n    if (!_.isObject(obj)) return obj;\n    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);\n  };\n\n  // Invokes interceptor with the obj, and then returns obj.\n  // The primary purpose of this method is to \"tap into\" a method chain, in\n  // order to perform operations on intermediate results within the chain.\n  _.tap = function(obj, interceptor) {\n    interceptor(obj);\n    return obj;\n  };\n\n  // Internal recursive comparison function for `isEqual`.\n  var eq = function(a, b, aStack, bStack) {\n    // Identical objects are equal. `0 === -0`, but they aren't identical.\n    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).\n    if (a === b) return a !== 0 || 1 / a == 1 / b;\n    // A strict comparison is necessary because `null == undefined`.\n    if (a == null || b == null) return a === b;\n    // Unwrap any wrapped objects.\n    if (a instanceof _) a = a._wrapped;\n    if (b instanceof _) b = b._wrapped;\n    // Compare `[[Class]]` names.\n    var className = toString.call(a);\n    if (className != toString.call(b)) return false;\n    switch (className) {\n      // Strings, numbers, dates, and booleans are compared by value.\n      case '[object String]':\n        // Primitives and their corresponding object wrappers are equivalent; thus, `\"5\"` is\n        // equivalent to `new String(\"5\")`.\n        return a == String(b);\n      case '[object Number]':\n        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for\n        // other numeric values.\n        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);\n      case '[object Date]':\n      case '[object Boolean]':\n        // Coerce dates and booleans to numeric primitive values. Dates are compared by their\n        // millisecond representations. Note that invalid dates with millisecond representations\n        // of `NaN` are not equivalent.\n        return +a == +b;\n      // RegExps are compared by their source patterns and flags.\n      case '[object RegExp]':\n        return a.source == b.source &&\n               a.global == b.global &&\n               a.multiline == b.multiline &&\n               a.ignoreCase == b.ignoreCase;\n    }\n    if (typeof a != 'object' || typeof b != 'object') return false;\n    // Assume equality for cyclic structures. The algorithm for detecting cyclic\n    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.\n    var length = aStack.length;\n    while (length--) {\n      // Linear search. Performance is inversely proportional to the number of\n      // unique nested structures.\n      if (aStack[length] == a) return bStack[length] == b;\n    }\n    // Objects with different constructors are not equivalent, but `Object`s\n    // from different frames are.\n    var aCtor = a.constructor, bCtor = b.constructor;\n    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&\n                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {\n      return false;\n    }\n    // Add the first object to the stack of traversed objects.\n    aStack.push(a);\n    bStack.push(b);\n    var size = 0, result = true;\n    // Recursively compare objects and arrays.\n    if (className == '[object Array]') {\n      // Compare array lengths to determine if a deep comparison is necessary.\n      size = a.length;\n      result = size == b.length;\n      if (result) {\n        // Deep compare the contents, ignoring non-numeric properties.\n        while (size--) {\n          if (!(result = eq(a[size], b[size], aStack, bStack))) break;\n        }\n      }\n    } else {\n      // Deep compare objects.\n      for (var key in a) {\n        if (_.has(a, key)) {\n          // Count the expected number of properties.\n          size++;\n          // Deep compare each member.\n          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;\n        }\n      }\n      // Ensure that both objects contain the same number of properties.\n      if (result) {\n        for (key in b) {\n          if (_.has(b, key) && !(size--)) break;\n        }\n        result = !size;\n      }\n    }\n    // Remove the first object from the stack of traversed objects.\n    aStack.pop();\n    bStack.pop();\n    return result;\n  };\n\n  // Perform a deep comparison to check if two objects are equal.\n  _.isEqual = function(a, b) {\n    return eq(a, b, [], []);\n  };\n\n  // Is a given array, string, or object empty?\n  // An \"empty\" object has no enumerable own-properties.\n  _.isEmpty = function(obj) {\n    if (obj == null) return true;\n    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;\n    for (var key in obj) if (_.has(obj, key)) return false;\n    return true;\n  };\n\n  // Is a given value a DOM element?\n  _.isElement = function(obj) {\n    return !!(obj && obj.nodeType === 1);\n  };\n\n  // Is a given value an array?\n  // Delegates to ECMA5's native Array.isArray\n  _.isArray = nativeIsArray || function(obj) {\n    return toString.call(obj) == '[object Array]';\n  };\n\n  // Is a given variable an object?\n  _.isObject = function(obj) {\n    return obj === Object(obj);\n  };\n\n  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.\n  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {\n    _['is' + name] = function(obj) {\n      return toString.call(obj) == '[object ' + name + ']';\n    };\n  });\n\n  // Define a fallback version of the method in browsers (ahem, IE), where\n  // there isn't any inspectable \"Arguments\" type.\n  if (!_.isArguments(arguments)) {\n    _.isArguments = function(obj) {\n      return !!(obj && _.has(obj, 'callee'));\n    };\n  }\n\n  // Optimize `isFunction` if appropriate.\n  if (typeof (/./) !== 'function') {\n    _.isFunction = function(obj) {\n      return typeof obj === 'function';\n    };\n  }\n\n  // Is a given object a finite number?\n  _.isFinite = function(obj) {\n    return isFinite(obj) && !isNaN(parseFloat(obj));\n  };\n\n  // Is the given value `NaN`? (NaN is the only number which does not equal itself).\n  _.isNaN = function(obj) {\n    return _.isNumber(obj) && obj != +obj;\n  };\n\n  // Is a given value a boolean?\n  _.isBoolean = function(obj) {\n    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';\n  };\n\n  // Is a given value equal to null?\n  _.isNull = function(obj) {\n    return obj === null;\n  };\n\n  // Is a given variable undefined?\n  _.isUndefined = function(obj) {\n    return obj === void 0;\n  };\n\n  // Shortcut function for checking if an object has a given property directly\n  // on itself (in other words, not on a prototype).\n  _.has = function(obj, key) {\n    return hasOwnProperty.call(obj, key);\n  };\n\n  // Utility Functions\n  // -----------------\n\n  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its\n  // previous owner. Returns a reference to the Underscore object.\n  _.noConflict = function() {\n    root._ = previousUnderscore;\n    return this;\n  };\n\n  // Keep the identity function around for default iterators.\n  _.identity = function(value) {\n    return value;\n  };\n\n  // Run a function **n** times.\n  _.times = function(n, iterator, context) {\n    var accum = Array(Math.max(0, n));\n    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);\n    return accum;\n  };\n\n  // Return a random integer between min and max (inclusive).\n  _.random = function(min, max) {\n    if (max == null) {\n      max = min;\n      min = 0;\n    }\n    return min + Math.floor(Math.random() * (max - min + 1));\n  };\n\n  // List of HTML entities for escaping.\n  var entityMap = {\n    escape: {\n      '&': '&amp;',\n      '<': '&lt;',\n      '>': '&gt;',\n      '\"': '&quot;',\n      \"'\": '&#x27;',\n      '/': '&#x2F;'\n    }\n  };\n  entityMap.unescape = _.invert(entityMap.escape);\n\n  // Regexes containing the keys and values listed immediately above.\n  var entityRegexes = {\n    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),\n    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')\n  };\n\n  // Functions for escaping and unescaping strings to/from HTML interpolation.\n  _.each(['escape', 'unescape'], function(method) {\n    _[method] = function(string) {\n      if (string == null) return '';\n      return ('' + string).replace(entityRegexes[method], function(match) {\n        return entityMap[method][match];\n      });\n    };\n  });\n\n  // If the value of the named `property` is a function then invoke it with the\n  // `object` as context; otherwise, return it.\n  _.result = function(object, property) {\n    if (object == null) return void 0;\n    var value = object[property];\n    return _.isFunction(value) ? value.call(object) : value;\n  };\n\n  // Add your own custom functions to the Underscore object.\n  _.mixin = function(obj) {\n    each(_.functions(obj), function(name){\n      var func = _[name] = obj[name];\n      _.prototype[name] = function() {\n        var args = [this._wrapped];\n        push.apply(args, arguments);\n        return result.call(this, func.apply(_, args));\n      };\n    });\n  };\n\n  // Generate a unique integer id (unique within the entire client session).\n  // Useful for temporary DOM ids.\n  var idCounter = 0;\n  _.uniqueId = function(prefix) {\n    var id = ++idCounter + '';\n    return prefix ? prefix + id : id;\n  };\n\n  // By default, Underscore uses ERB-style template delimiters, change the\n  // following template settings to use alternative delimiters.\n  _.templateSettings = {\n    evaluate    : /<%([\\s\\S]+?)%>/g,\n    interpolate : /<%=([\\s\\S]+?)%>/g,\n    escape      : /<%-([\\s\\S]+?)%>/g\n  };\n\n  // When customizing `templateSettings`, if you don't want to define an\n  // interpolation, evaluation or escaping regex, we need one that is\n  // guaranteed not to match.\n  var noMatch = /(.)^/;\n\n  // Certain characters need to be escaped so that they can be put into a\n  // string literal.\n  var escapes = {\n    \"'\":      \"'\",\n    '\\\\':     '\\\\',\n    '\\r':     'r',\n    '\\n':     'n',\n    '\\t':     't',\n    '\\u2028': 'u2028',\n    '\\u2029': 'u2029'\n  };\n\n  var escaper = /\\\\|'|\\r|\\n|\\t|\\u2028|\\u2029/g;\n\n  // JavaScript micro-templating, similar to John Resig's implementation.\n  // Underscore templating handles arbitrary delimiters, preserves whitespace,\n  // and correctly escapes quotes within interpolated code.\n  _.template = function(text, data, settings) {\n    var render;\n    settings = _.defaults({}, settings, _.templateSettings);\n\n    // Combine delimiters into one regular expression via alternation.\n    var matcher = new RegExp([\n      (settings.escape || noMatch).source,\n      (settings.interpolate || noMatch).source,\n      (settings.evaluate || noMatch).source\n    ].join('|') + '|$', 'g');\n\n    // Compile the template source, escaping string literals appropriately.\n    var index = 0;\n    var source = \"__p+='\";\n    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {\n      source += text.slice(index, offset)\n        .replace(escaper, function(match) { return '\\\\' + escapes[match]; });\n\n      if (escape) {\n        source += \"'+\\n((__t=(\" + escape + \"))==null?'':_.escape(__t))+\\n'\";\n      }\n      if (interpolate) {\n        source += \"'+\\n((__t=(\" + interpolate + \"))==null?'':__t)+\\n'\";\n      }\n      if (evaluate) {\n        source += \"';\\n\" + evaluate + \"\\n__p+='\";\n      }\n      index = offset + match.length;\n      return match;\n    });\n    source += \"';\\n\";\n\n    // If a variable is not specified, place data values in local scope.\n    if (!settings.variable) source = 'with(obj||{}){\\n' + source + '}\\n';\n\n    source = \"var __t,__p='',__j=Array.prototype.join,\" +\n      \"print=function(){__p+=__j.call(arguments,'');};\\n\" +\n      source + \"return __p;\\n\";\n\n    try {\n      render = new Function(settings.variable || 'obj', '_', source);\n    } catch (e) {\n      e.source = source;\n      throw e;\n    }\n\n    if (data) return render(data, _);\n    var template = function(data) {\n      return render.call(this, data, _);\n    };\n\n    // Provide the compiled function source as a convenience for precompilation.\n    template.source = 'function(' + (settings.variable || 'obj') + '){\\n' + source + '}';\n\n    return template;\n  };\n\n  // Add a \"chain\" function, which will delegate to the wrapper.\n  _.chain = function(obj) {\n    return _(obj).chain();\n  };\n\n  // OOP\n  // ---------------\n  // If Underscore is called as a function, it returns a wrapped object that\n  // can be used OO-style. This wrapper holds altered versions of all the\n  // underscore functions. Wrapped objects may be chained.\n\n  // Helper function to continue chaining intermediate results.\n  var result = function(obj) {\n    return this._chain ? _(obj).chain() : obj;\n  };\n\n  // Add all of the Underscore functions to the wrapper object.\n  _.mixin(_);\n\n  // Add all mutator Array functions to the wrapper.\n  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {\n    var method = ArrayProto[name];\n    _.prototype[name] = function() {\n      var obj = this._wrapped;\n      method.apply(obj, arguments);\n      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];\n      return result.call(this, obj);\n    };\n  });\n\n  // Add all accessor Array functions to the wrapper.\n  each(['concat', 'join', 'slice'], function(name) {\n    var method = ArrayProto[name];\n    _.prototype[name] = function() {\n      return result.call(this, method.apply(this._wrapped, arguments));\n    };\n  });\n\n  _.extend(_.prototype, {\n\n    // Start chaining a wrapped Underscore object.\n    chain: function() {\n      this._chain = true;\n      return this;\n    },\n\n    // Extracts the result from a wrapped and chained object.\n    value: function() {\n      return this._wrapped;\n    }\n\n  });\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/debug.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var EventKeys, config, utils;\n\n  utils = require(\"./utils\");\n\n  config = require(\"./config\").config;\n\n  exports.errorWarning = function(e) {\n    var errorView;\n    errorView = new View({\n      x: 20,\n      y: 20,\n      width: 350,\n      height: 60\n    });\n    errorView.html = \"<b>Javascript Error</b>\t\t<br>Inspect the error console for more info.\";\n    errorView.style = {\n      font: \"13px/1.3em Menlo, Monaco\",\n      backgroundColor: \"rgba(255,0,0,0.5)\",\n      padding: \"12px\",\n      border: \"1px solid rgba(255,0,0,0.5)\",\n      borderRadius: \"5px\"\n    };\n    errorView.scale = 0.5;\n    return errorView.animate({\n      properties: {\n        scale: 1.0\n      },\n      curve: \"spring(2500,30,1500)\"\n    });\n  };\n\n  exports.debugView = function() {\n    if (window.Framer._togglingDebug === true) {\n      return;\n    }\n    window.Framer._togglingDebug = true;\n    View.Views.map(function(view, i) {\n      var color, node;\n      if (view._debug) {\n        view._element.removeChild(view._debug.node);\n        view.style = view._debug.style;\n        return delete view._debug;\n      } else {\n        color = \"rgba(50,150,200,.35)\";\n        node = document.createElement(\"div\");\n        node.innerHTML = \"\" + (view.name || view.id);\n        if (view.superView) {\n          node.innerHTML += \" <span style='opacity:.5'>\t\t\t\t\tin \" + (view.superView.name || view.superView.id) + \"\t\t\t\t</span>\";\n        }\n        node.style.position = \"absolute\";\n        node.style.padding = \"3px\";\n        view._debug = {\n          style: utils.extend({}, view.style),\n          node: node\n        };\n        view._element.appendChild(node);\n        return view.style = {\n          color: \"white\",\n          margin: \"-1px\",\n          font: \"10px/1em Monaco\",\n          backgroundColor: \"\" + color,\n          border: \"1px solid \" + color,\n          backgroundImage: null\n        };\n      }\n    });\n    return window.Framer._togglingDebug = false;\n  };\n\n  EventKeys = {\n    Shift: 16,\n    Escape: 27\n  };\n\n  window.document.onkeydown = function(event) {\n    if (event.keyCode === EventKeys.Shift) {\n      return config.timeSpeedFactor = 25;\n    }\n  };\n\n  window.document.onkeyup = function(event) {\n    if (event.keyCode === EventKeys.Shift) {\n      config.timeSpeedFactor = 1;\n    }\n    if (event.keyCode === EventKeys.Escape) {\n      return exports.debugView();\n    }\n  };\n\n  window.onerror = exports.errorWarning;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/tools/init.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  exports.tools = {};\n\n  exports.tools.facebook = (require(\"./facebook\")).facebook;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/tools/facebook.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var FacebookAccessTokenKey, FacebookBaseURL, facebook;\n\n  facebook = {};\n\n  FacebookAccessTokenKey = \"token\";\n\n  FacebookBaseURL = \"https://graph.facebook.com/me\";\n\n  facebook.query = function(query, callback) {\n    var _ref;\n    facebook._token = localStorage.getItem(FacebookAccessTokenKey);\n    if ((_ref = facebook._token) === (void 0) || _ref === \"\") {\n      facebook._tokenDialog();\n      return;\n    }\n    return facebook._loadJQuery(function() {\n      var data;\n      data = {\n        fields: query,\n        method: \"GET\",\n        format: \"json\",\n        access_token: facebook._token\n      };\n      return $.ajax({\n        url: FacebookBaseURL,\n        data: data,\n        dataType: \"json\",\n        success: callback,\n        error: function(error) {\n          var _ref1;\n          console.log(\"error\", error);\n          if ((_ref1 = error.status) === 0 || _ref1 === 400) {\n            return facebook._tokenDialog();\n          }\n        }\n      });\n    });\n  };\n\n  facebook.logout = function() {\n    localStorage.setItem(FacebookAccessTokenKey, \"\");\n    return document.location.reload();\n  };\n\n  facebook._loadJQuery = function(callback) {\n    var script;\n    if (typeof $ === \"undefined\") {\n      script = document.createElement(\"script\");\n      script.src = \"http://cdnjs.cloudflare.com/ajax/libs/zepto/1.0/zepto.min.js\";\n      script.type = \"text/javascript\";\n      document.getElementsByTagName(\"head\")[0].appendChild(script);\n      return script.onload = callback;\n    } else {\n      return callback();\n    }\n  };\n\n  facebook._tokenDialog = function() {\n    var view;\n    view = new View({\n      width: 500,\n      height: 120,\n      midX: window.innerWidth / 2,\n      midY: window.innerHeight / 2\n    });\n    view.style = {\n      padding: \"20px\",\n      backgroundColor: \"#e5e5e5\",\n      webkitBoxShadow: \"0px 2px 10px 0px rgba(0,0,0,.2)\",\n      border: \"1px solid rgba(0,0,0,.1)\",\n      borderRadius: \"4px\"\n    };\n    view.html = \"\t\t<input type='text' id='tokenDialog'\t\t\tplaceholder='Paste Facebook Access Token' \t\t\tstyle='font:16px/1em Menlo;width:440px;padding:10px 10px 5px 5px' \t\t\tonpaste='tools.facebook._tokenDialogUpdate(this)'\t\t\tonkeyup='tools.facebook._tokenDialogUpdate(this)'\t\t>\t\t<div style='\t\t\ttext-align:center;\t\t\tfont-size:18px;\t\t\tfont-weight:\t\t\tbold;\t\t\tpadding-top:20px\t\t'>\t\t\t<a href='https://developers.facebook.com/tools/explorer' target='new'>\t\t\t\tFind access token here\t\t\t</a>\t\t</div\t\";\n    return utils.delay(0, function() {\n      var tokenInput;\n      tokenInput = window.document.getElementById(\"tokenDialog\");\n      return tokenInput.focus();\n    });\n  };\n\n  facebook._tokenDialogUpdate = function(event) {\n    if (event.value.length > 50) {\n      localStorage.setItem(FacebookAccessTokenKey, event.value);\n      return document.location.reload();\n    }\n  };\n\n  exports.facebook = facebook;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/views/view.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var Animation, EventEmitter, Frame, Matrix, View, check, utils, _,\n    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },\n    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };\n\n  utils = require(\"../utils\");\n\n  check = require(\"check-types\");\n\n  _ = require(\"underscore\");\n\n  Frame = require(\"../primitives/frame\").Frame;\n\n  Matrix = require(\"../primitives/matrix\").Matrix;\n\n  EventEmitter = require(\"../eventemitter\").EventEmitter;\n\n  Animation = require(\"../animation\").Animation;\n\n  exports.ViewList = [];\n\n  View = (function(_super) {\n    __extends(View, _super);\n\n    function View(args) {\n      this.__insertElement = __bind(this.__insertElement, this);\n      if (args == null) {\n        args = {};\n      }\n      this._offset = {\n        x: 0,\n        y: 0\n      };\n      View.Views.push(this);\n      this.id = View.Views.length;\n      this._element = document.createElement(\"div\");\n      this._element.id = this.id;\n      this.addClass(\"framer\");\n      this._subViews = [];\n      this._currentAnimations = [];\n      this.clip = args.clip || View.Properties.clip;\n      this.properties = args;\n      this.index = 0;\n      if (typeof this._postCreate === \"function\") {\n        this._postCreate();\n      }\n      if (!args.superView) {\n        this._insertElement();\n      }\n    }\n\n    View.prototype._postCreate = function() {};\n\n    View.define(\"name\", {\n      get: function() {\n        return this._name || this.id;\n      },\n      set: function(value) {\n        this._name = value;\n        return this._element.setAttribute(\"name\", this._name);\n      }\n    });\n\n    View.define(\"properties\", {\n      get: function() {\n        var key, p, value, _ref;\n        p = {};\n        _ref = View.Properties;\n        for (key in _ref) {\n          value = _ref[key];\n          p[key] = this[key];\n        }\n        return p;\n      },\n      set: function(args) {\n        var key, value, _ref, _ref1, _ref2, _ref3, _results;\n        _ref = View.Properties;\n        for (key in _ref) {\n          value = _ref[key];\n          if ((_ref1 = args[key]) !== null && _ref1 !== (void 0)) {\n            this[key] = args[key];\n          }\n        }\n        _ref2 = Frame.CalculatedProperties;\n        _results = [];\n        for (key in _ref2) {\n          value = _ref2[key];\n          if ((_ref3 = args[key]) !== null && _ref3 !== (void 0)) {\n            _results.push(this[key] = args[key]);\n          } else {\n            _results.push(void 0);\n          }\n        }\n        return _results;\n      }\n    });\n\n    View.define(\"frame\", {\n      get: function() {\n        return new Frame({\n          x: this.x,\n          y: this.y,\n          width: this.width,\n          height: this.height\n        });\n      },\n      set: function(value) {\n        var p, _i, _len, _ref, _results;\n        if (!value) {\n          return;\n        }\n        _ref = [\"x\", \"y\", \"width\", \"height\"];\n        _results = [];\n        for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n          p = _ref[_i];\n          _results.push(this[p] = value[p]);\n        }\n        return _results;\n      }\n    });\n\n    View.prototype.convertPoint = function(point) {\n      return utils.convertPoint(point, null, this);\n    };\n\n    View.prototype.screenFrame = function() {\n      return utils.convertPoint(this.frame, this, null);\n    };\n\n    View.prototype.contentFrame = function() {\n      var maxX, maxY, minX, minY;\n      minX = utils.min(_.pluck(this.subViews, \"minX\"));\n      maxX = utils.max(_.pluck(this.subViews, \"maxX\"));\n      minY = utils.min(_.pluck(this.subViews, \"minY\"));\n      maxY = utils.max(_.pluck(this.subViews, \"maxY\"));\n      return new Frame({\n        x: minX,\n        y: minY,\n        width: maxX - minX,\n        height: maxY - minY\n      });\n    };\n\n    View.prototype.centerFrame = function() {\n      var frame;\n      if (this.superView) {\n        frame = this.frame;\n        frame.midX = this.superView.width / 2.0;\n        frame.midY = this.superView.height / 2.0;\n        return frame;\n      } else {\n        frame = this.frame;\n        frame.midX = window.innerWidth / 2.0;\n        frame.midY = window.innerHeight / 2.0;\n        return frame;\n      }\n    };\n\n    View.prototype.centeredFrame = View.centerFrame;\n\n    View.prototype.centerX = function() {\n      return this.x = this.centerFrame().x;\n    };\n\n    View.prototype.centerY = function() {\n      return this.y = this.centerFrame().y;\n    };\n\n    View.prototype.center = function() {\n      return this.frame = this.centerFrame();\n    };\n\n    View.prototype.pixelAlign = function() {\n      return this.frame = {\n        x: parseInt(this.x),\n        y: parseInt(this.y)\n      };\n    };\n\n    View.define(\"width\", {\n      get: function() {\n        return parseFloat(this.style.width);\n      },\n      set: function(value) {\n        this.animateStop();\n        this.style.width = \"\" + value + \"px\";\n        this.emit(\"change:width\");\n        return this.emit(\"change:frame\");\n      }\n    });\n\n    View.define(\"height\", {\n      get: function() {\n        return parseFloat(this.style.height);\n      },\n      set: function(value) {\n        this.animateStop();\n        this.style.height = \"\" + value + \"px\";\n        this.emit(\"change:height\");\n        return this.emit(\"change:frame\");\n      }\n    });\n\n    View.define(\"x\", {\n      get: function() {\n        return this._matrix.x - this._offset.x;\n      },\n      set: function(value) {\n        this._setMatrixValue(\"x\", value + this._offset.x);\n        return this.emit(\"change:frame\");\n      }\n    });\n\n    View.define(\"y\", {\n      get: function() {\n        return this._matrix.y - this._offset.y;\n      },\n      set: function(value) {\n        this._setMatrixValue(\"y\", value + this._offset.y);\n        return this.emit(\"change:frame\");\n      }\n    });\n\n    View.define(\"z\", {\n      get: function() {\n        return this._matrix.z;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"z\", value);\n      }\n    });\n\n    View.define(\"scale\", {\n      get: function() {\n        return this._matrix.scale;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"scale\", value);\n      }\n    });\n\n    View.define(\"scaleX\", {\n      get: function() {\n        return this._matrix.scaleX;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"scaleX\", value);\n      }\n    });\n\n    View.define(\"scaleY\", {\n      get: function() {\n        return this._matrix.scaleY;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"scaleY\", value);\n      }\n    });\n\n    View.define(\"scaleZ\", {\n      get: function() {\n        return this._matrix.scaleZ;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"scaleZ\", value);\n      }\n    });\n\n    View.define(\"rotation\", {\n      get: function() {\n        return this._matrix.rotation;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"rotation\", value);\n      }\n    });\n\n    View.define(\"rotationX\", {\n      get: function() {\n        return this._matrix.rotationX;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"rotationX\", value);\n      }\n    });\n\n    View.define(\"rotationY\", {\n      get: function() {\n        return this._matrix.rotationY;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"rotationY\", value);\n      }\n    });\n\n    View.define(\"rotationZ\", {\n      get: function() {\n        return this._matrix.rotationZ;\n      },\n      set: function(value) {\n        return this._setMatrixValue(\"rotationZ\", value);\n      }\n    });\n\n    View.define(\"_matrix\", {\n      get: function() {\n        if (!this.__matrix) {\n          this.__matrix = new Matrix(new WebKitCSSMatrix(this._element.style.webkitTransform));\n        }\n        return this.__matrix;\n      },\n      set: function(matrix) {\n        if (!matrix) {\n          this.__matrix = null;\n          this.style.webkitTransform = null;\n          return;\n        }\n        if (matrix instanceof WebKitCSSMatrix) {\n          matrix = new Matrix(matrix);\n        }\n        if (!matrix instanceof Matrix) {\n          throw Error(\"View._matrix.set should be Matrix not \" + (typeof matrix));\n        }\n        this.__matrix = matrix;\n        return this.style.webkitTransform = this.__matrix.css();\n      }\n    });\n\n    View.prototype._setMatrixValue = function(property, value) {\n      var _ref;\n      this.animateStop();\n      this._matrix[property] = value;\n      this._matrix = this._matrix;\n      this.emit(\"change:\" + property);\n      if ((_ref = property.slice(-1)) === \"X\" || _ref === \"Y\" || _ref === \"Z\") {\n        return this.emit(\"change:\" + property.slice(0, +(property.length - 1) + 1 || 9e9));\n      }\n    };\n\n    View.prototype._computedMatrix = function() {\n      return new WebKitCSSMatrix(this.computedStyle.webkitTransform);\n    };\n\n    View.define(\"opacity\", {\n      get: function() {\n        return parseFloat(this.style.opacity || 1);\n      },\n      set: function(value) {\n        this.animateStop();\n        this.style.opacity = value;\n        return this.emit(\"change:opacity\");\n      }\n    });\n\n    View.define(\"clip\", {\n      get: function() {\n        return this._clip;\n      },\n      set: function(value) {\n        this._clip = value;\n        if (value === true) {\n          this.style.overflow = \"hidden\";\n        }\n        if (value === false) {\n          this.style.overflow = \"visible\";\n        }\n        return this.emit(\"change:clip\");\n      }\n    });\n\n    View.define(\"visible\", {\n      get: function() {\n        return this._visible || true;\n      },\n      set: function(value) {\n        this._visible = value;\n        if (value === true) {\n          this.style.display = \"block\";\n        }\n        if (value === false) {\n          this.style.display = \"none\";\n        }\n        return this.emit(\"change:visible\");\n      }\n    });\n\n    View.define(\"superView\", {\n      get: function() {\n        return this._superView || null;\n      },\n      set: function(view) {\n        if (view === this._superView) {\n          return;\n        }\n        utils.domCompleteCancel(this.__insertElement);\n        if (this._superView) {\n          this._superView._element.removeChild(this._element);\n          this._superView._subViews = _.without(this._superView._subViews, this);\n          this._superView.emit(\"change:subViews\", {\n            added: [],\n            removed: [this]\n          });\n        }\n        if (view) {\n          view._element.appendChild(this._element);\n          view._subViews.push(this);\n          view.emit(\"change:subViews\", {\n            added: [this],\n            removed: []\n          });\n        } else {\n          this._insertElement();\n        }\n        this._superView = view;\n        this.bringToFront();\n        return this.emit(\"change:superView\");\n      }\n    });\n\n    View.define(\"subViews\", {\n      get: function() {\n        return this._subViews.map(function(view) {\n          return view;\n        });\n      }\n    });\n\n    View.define(\"siblingViews\", {\n      get: function() {\n        var _this = this;\n        if (this.superView === null) {\n          return _.filter(View.ViewList, function(view) {\n            return view !== _this && view.superView;\n          });\n        } else {\n          return _.filter(this.superView.subViews, function(view) {\n            return view !== _this;\n          });\n        }\n      }\n    });\n\n    View.prototype.addSubView = function(view) {\n      return view.superView = this;\n    };\n\n    View.prototype.removeSubView = function(view) {\n      if (__indexOf.call(this.subViews, view) < 0) {\n        return;\n      }\n      return view.superView = null;\n    };\n\n    View.define(\"index\", {\n      get: function() {\n        return parseInt(this.style['z-index'] || 0);\n      },\n      set: function(value) {\n        this.style['z-index'] = value;\n        return this.emit(\"change:index\");\n      }\n    });\n\n    View.prototype.placeBefore = function(view) {\n      return this.index = view.index + 1;\n    };\n\n    View.prototype.placeBehind = function(view) {\n      return this.index = view.index - 1;\n    };\n\n    View.prototype.switchPlaces = function(view) {\n      var indexA, indexB;\n      indexA = this.index;\n      indexB = view.index;\n      view.index = indexA;\n      return this.index = indexB;\n    };\n\n    View.prototype.bringToFront = function() {\n      var siblingIndexes;\n      siblingIndexes = _.pluck(this.siblingViews, \"index\");\n      return this.index = (utils.max(siblingIndexes) + 1) || 0;\n    };\n\n    View.prototype.sendToBack = function() {\n      var siblingIndexes;\n      siblingIndexes = _.pluck(this.siblingViews, \"index\");\n      return this.index = (utils.min(siblingIndexes) - 1) || 0;\n    };\n\n    View.prototype.animate = function(args, callback) {\n      var animation;\n      args.view = this;\n      animation = new Animation(args);\n      animation.start(callback);\n      return animation;\n    };\n\n    View.prototype.animateStop = function() {\n      return this._currentAnimations.map(function(animation) {\n        return animation.stop();\n      });\n    };\n\n    View.define(\"html\", {\n      get: function() {\n        return this._element.innerHTML;\n      },\n      set: function(value) {\n        this._element.innerHTML = value;\n        return this.emit(\"change:html\");\n      }\n    });\n\n    View.define(\"style\", {\n      get: function() {\n        return this._element.style;\n      },\n      set: function(value) {\n        utils.extend(this._element.style, value);\n        return this.emit(\"change:style\");\n      }\n    });\n\n    View.define(\"computedStyle\", {\n      get: function() {\n        return document.defaultView.getComputedStyle(this._element);\n      },\n      set: function(value) {\n        throw Error(\"computedStyle is readonly\");\n      }\n    });\n\n    View.define(\"class\", {\n      get: function() {\n        return this._element.className;\n      },\n      set: function(value) {\n        this._element.className = value;\n        return this.emit(\"change:class\");\n      }\n    });\n\n    View.define(\"classes\", {\n      get: function() {\n        var classes;\n        classes = this[\"class\"].split(\" \");\n        classes = _(classes).filter(function(item) {\n          return item !== \"\" && item !== null;\n        });\n        classes = _(classes).unique();\n        return classes;\n      },\n      set: function(value) {\n        return this[\"class\"] = value.join(\" \");\n      }\n    });\n\n    View.prototype.addClass = function(className) {\n      var classes;\n      classes = this.classes;\n      classes.push(className);\n      return this.classes = classes;\n    };\n\n    View.prototype.removeClass = function(className) {\n      return this.classes = _.filter(this.classes, function(item) {\n        return item !== className;\n      });\n    };\n\n    View.prototype._insertElement = function() {\n      return utils.domComplete(this.__insertElement);\n    };\n\n    View.prototype.__insertElement = function() {\n      if (!Framer._rootElement) {\n        Framer._rootElement = document.createElement(\"div\");\n        Framer._rootElement.id = \"FramerRoot\";\n        document.body.appendChild(Framer._rootElement);\n      }\n      return Framer._rootElement.appendChild(this._element);\n    };\n\n    View.prototype.destroy = function() {\n      if (this._element.parentNode) {\n        return this._element.parentNode.removeChild(this._element);\n      }\n    };\n\n    View.prototype.addListener = function(event, listener) {\n      View.__super__.addListener.apply(this, arguments);\n      return this._element.addEventListener(event, listener);\n    };\n\n    View.prototype.removeListener = function(event, listener) {\n      View.__super__.removeListener.apply(this, arguments);\n      return this._element.removeEventListener(event, listener);\n    };\n\n    View.prototype.on = View.prototype.addListener;\n\n    View.prototype.off = View.prototype.removeListener;\n\n    return View;\n\n  })(Frame);\n\n  View.Properties = utils.extend(Frame.Properties, {\n    frame: null,\n    clip: true,\n    opacity: 1.0,\n    rotationX: 0,\n    rotationY: 0,\n    rotationZ: 0,\n    rotation: 0,\n    scale: 1.0,\n    scaleX: 1.0,\n    scaleY: 1.0,\n    scaleZ: 1.0,\n    style: null,\n    html: null,\n    \"class\": \"\",\n    superView: null,\n    visible: true,\n    index: 0\n  });\n\n  View.Views = [];\n\n  exports.View = View;\n\n}).call(this);\n\n});\n\nrequire.define(\"/node_modules/check-types/package.json\",function(require,module,exports,__dirname,__filename,process,global){module.exports = {\"main\":\"./src/check-types.js\"}\n});\n\nrequire.define(\"/node_modules/check-types/src/check-types.js\",function(require,module,exports,__dirname,__filename,process,global){/**\n * This module exports functions for checking types\n * and throwing exceptions.\n */\n\n/*globals define, module */\n\n(function (globals) {\n    'use strict';\n\n    var functions = {\n        verifyQuack: verifyQuack,\n        quacksLike: quacksLike,\n        verifyInstance: verifyInstance,\n        isInstance: isInstance,\n        verifyEmptyObject: verifyEmptyObject,\n        isEmptyObject: isEmptyObject,\n        verifyObject: verifyObject,\n        isObject: isObject,\n        verifyLength: verifyLength,\n        isLength: isLength,\n        verifyArray: verifyArray,\n        isArray: isArray,\n        verifyFunction: verifyFunction,\n        isFunction: isFunction,\n        verifyUnemptyString: verifyUnemptyString,\n        isUnemptyString:isUnemptyString,\n        verifyString: verifyString,\n        isString: isString,\n        verifyEvenNumber: verifyEvenNumber,\n        isEvenNumber: isEvenNumber,\n        verifyOddNumber: verifyOddNumber,\n        isOddNumber: isOddNumber,\n        verifyPositiveNumber: verifyPositiveNumber,\n        isPositiveNumber: isPositiveNumber,\n        verifyNegativeNumber: verifyNegativeNumber,\n        isNegativeNumber: isNegativeNumber,\n        verifyNumber: verifyNumber,\n        isNumber: isNumber\n    };\n\n    exportFunctions();\n\n    /**\n     * Public function `verifyQuack`.\n     *\n     * Throws an exception if an object does not share\n     * the properties of a second, archetypal object\n     * (i.e. doesn't 'quack like a duck').\n     *\n     * @param thing {object}     The object to test.\n     * @param duck {object}      The archetypal object,\n     *                           or 'duck', that the test\n     *                           is against.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyQuack (thing, duck, message) {\n        if (quacksLike(thing, duck) === false) {\n            throw new Error(message || 'Invalid type');\n        }\n    }\n\n    /**\n     * Public function `quacksLike`.\n     *\n     * Tests whether an object 'quacks like a duck'.\n     * Returns `true` if the first argument has all of\n     * the properties of the second, archetypal argument\n     * (the 'duck'). Returns `false` otherwise. If either\n     * argument is not an object, an exception is thrown.\n     *\n     * @param thing {object} The object to test.\n     * @param duck {object}  The archetypal object, or\n     *                       'duck', that the test is\n     *                       against.\n     */\n    function quacksLike (thing, duck) {\n        var property;\n\n        verifyObject(thing);\n        verifyObject(duck);\n\n        for (property in duck) {\n            if (duck.hasOwnProperty(property)) {\n                if (thing.hasOwnProperty(property) === false) {\n                    return false;\n                }\n\n                if (typeof thing[property] !== typeof duck[property]) {\n                    return false;\n                }\n            }\n        }\n\n        return true;\n    }\n\n    /**\n     * Public function `verifyInstance`.\n     *\n     * Throws an exception if an object is not an instance\n     * of a prototype.\n     *\n     * @param thing {object}       The object to test.\n     * @param prototype {function} The prototype that the\n     *                             test is against.\n     * @param [message] {string}   An optional error message\n     *                             to set on the thrown Error.\n     */\n    function verifyInstance (thing, prototype, message) {\n        if (isInstance(thing, prototype) === false) {\n            throw new Error(message || 'Invalid type');\n        }\n    }\n\n    /**\n     * Public function `isInstance`.\n     *\n     * Returns `true` if an object is an instance of a prototype,\n     * `false` otherwise.\n     *\n     * @param thing {object}       The object to test.\n     * @param prototype {function} The prototype that the\n     *                             test is against.\n     */\n    function isInstance (thing, prototype) {\n        if (typeof thing === 'undefined' || thing === null) {\n            return false;\n        }\n\n        if (isFunction(prototype) && thing instanceof prototype) {\n            return true;\n        }\n\n        return false;\n    }\n\n    /**\n     * Public function `verifyEmptyObject`.\n     *\n     * Throws an exception unless something is an empty, non-null,\n     * non-array object.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyEmptyObject (thing, message) {\n        if (isEmptyObject(thing) === false) {\n            throw new Error(message || 'Invalid empty object');\n        }\n    }\n\n    /**\n     * Public function `isEmptyObject`.\n     *\n     * Returns `true` if something is an empty, non-null, non-array object, `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isEmptyObject (thing) {\n        var property;\n\n        if (isObject(thing)) {\n            for (property in thing) {\n                if (thing.hasOwnProperty(property)) {\n                    return false;\n                }\n            }\n\n            return true;\n        }\n\n        return false;\n    }\n\n    /**\n     * Public function `verifyObject`.\n     *\n     * Throws an exception unless something is a non-null,\n     * non-array object.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyObject (thing, message) {\n        if (isObject(thing) === false) {\n            throw new Error(message || 'Invalid object');\n        }\n    }\n\n    /**\n     * Public function `isObject`.\n     *\n     * Returns `true` if something is a non-null, non-array\n     * object, `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isObject (thing) {\n        return typeof thing === 'object' && thing !== null && isArray(thing) === false;\n    }\n\n    /**\n     * Public function `verifyLength`.\n     *\n     * Throws an exception unless something is a non-null,\n     * non-array object.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyLength (thing, length, message) {\n        if (isLength(thing, length) === false) {\n            throw new Error(message || 'Invalid length');\n        }\n    }\n\n    /**\n     * Public function `isLength`.\n     *\n     * Returns `true` if something is has a length property\n     * matching the specified value, `false` otherwise.\n     *\n     * @param thing  The thing to test.\n     * @param length The required length to test against.\n     */\n    function isLength (thing, length) {\n        return thing && thing.length === length;\n    }\n\n    /**\n     * Public function `verifyArray`.\n     *\n     * Throws an exception unless something is an array.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyArray (thing, message) {\n        if (isArray(thing) === false) {\n            throw new Error(message || 'Invalid array');\n        }\n    }\n\n    /**\n     * Public function `isArray`.\n     *\n     * Returns `true` something is an array, `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isArray (thing) {\n        return Object.prototype.toString.call(thing) === '[object Array]';\n    }\n\n    /**\n     * Public function `verifyFunction`.\n     *\n     * Throws an exception unless something is function.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyFunction (thing, message) {\n        if (isFunction(thing) === false) {\n            throw new Error(message || 'Invalid function');\n        }\n    }\n\n    /**\n     * Public function `isFunction`.\n     *\n     * Returns `true` if something is function, `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isFunction (thing) {\n        return typeof thing === 'function';\n    }\n\n    /**\n     * Public function `verifyUnemptyString`.\n     *\n     * Throws an exception unless something is a non-empty string.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyUnemptyString (thing, message) {\n        if (isUnemptyString(thing) === false) {\n            throw new Error(message || 'Invalid string');\n        }\n    }\n\n    /**\n     * Public function `isUnemptyString`.\n     *\n     * Returns `true` if something is a non-empty string, `false`\n     * otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isUnemptyString (thing) {\n        return isString(thing) && thing !== '';\n    }\n\n    /**\n     * Public function `verifyString`.\n     *\n     * Throws an exception unless something is a string.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyString (thing, message) {\n        if (isString(thing) === false) {\n            throw new Error(message || 'Invalid string');\n        }\n    }\n\n    /**\n     * Public function `isString`.\n     *\n     * Returns `true` if something is a string, `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isString (thing) {\n        return typeof thing === 'string';\n    }\n\n    /**\n     * Public function `verifyOddNumber`.\n     *\n     * Throws an exception unless something is an odd number.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyOddNumber (thing, message) {\n        if (isOddNumber(thing) === false) {\n            throw new Error(message || 'Invalid number');\n        }\n    }\n\n    /**\n     * Public function `isOddNumber`.\n     *\n     * Returns `true` if something is an odd number,\n     * `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isOddNumber (thing) {\n        return isNumber(thing) && (thing % 2 === 1 || thing % 2 === -1);\n    }\n\n    /**\n     * Public function `verifyEvenNumber`.\n     *\n     * Throws an exception unless something is an even number.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyEvenNumber (thing, message) {\n        if (isEvenNumber(thing) === false) {\n            throw new Error(message || 'Invalid number');\n        }\n    }\n\n    /**\n     * Public function `isEvenNumber`.\n     *\n     * Returns `true` if something is an even number,\n     * `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isEvenNumber (thing) {\n        return isNumber(thing) && thing % 2 === 0;\n    }\n\n    /**\n     * Public function `verifyPositiveNumber`.\n     *\n     * Throws an exception unless something is a positive number.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyPositiveNumber (thing, message) {\n        if (isPositiveNumber(thing) === false) {\n            throw new Error(message || 'Invalid number');\n        }\n    }\n\n    /**\n     * Public function `isPositiveNumber`.\n     *\n     * Returns `true` if something is a positive number,\n     * `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isPositiveNumber (thing) {\n        return isNumber(thing) && thing > 0;\n    }\n\n    /**\n     * Public function `verifyNegativeNumber`.\n     *\n     * Throws an exception unless something is a positive number.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyNegativeNumber (thing, message) {\n        if (isNegativeNumber(thing) === false) {\n            throw new Error(message || 'Invalid number');\n        }\n    }\n\n    /**\n     * Public function `isNegativeNumber`.\n     *\n     * Returns `true` if something is a positive number,\n     * `false` otherwise.\n     *\n     * @param thing          The thing to test.\n     */\n    function isNegativeNumber (thing) {\n        return isNumber(thing) && thing < 0;\n    }\n\n    /**\n     * Public function `verifyNumber`.\n     *\n     * Throws an exception unless something is a number, excluding NaN.\n     *\n     * @param thing              The thing to test.\n     * @param [message] {string} An optional error message\n     *                           to set on the thrown Error.\n     */\n    function verifyNumber (thing, message) {\n        if (isNumber(thing) === false) {\n            throw new Error(message || 'Invalid number');\n        }\n    }\n\n    /**\n     * Public function `isNumber`.\n     *\n     * Returns `true` if something is a number other than NaN,\n     * `false` otherwise.\n     *\n     * @param thing The thing to test.\n     */\n    function isNumber (thing) {\n        return typeof thing === 'number' && isNaN(thing) === false;\n    }\n\n    function exportFunctions () {\n        if (typeof define === 'function' && define.amd) {\n            define(function () {\n                return functions;\n            });\n        } else if (typeof module !== 'undefined' && module !== null) {\n            module.exports = functions;\n        } else {\n            globals.check = functions;\n        }\n    }\n}(this));\n\n\n});\n\nrequire.define(\"/src/primitives/frame.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var EventEmitter, Frame, utils,\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  utils = require(\"../utils\");\n\n  EventEmitter = require(\"../eventemitter\").EventEmitter;\n\n  Frame = (function(_super) {\n    __extends(Frame, _super);\n\n    function Frame(args) {\n      this.properties = args;\n    }\n\n    Frame.define(\"properties\", {\n      get: function() {\n        var key, p, value, _ref;\n        p = {};\n        _ref = Frame.Properties;\n        for (key in _ref) {\n          value = _ref[key];\n          p[key] = this[key] || Frame.Properties[key];\n        }\n        return p;\n      },\n      set: function(args) {\n        var key, value, _ref, _ref1, _ref2, _ref3, _results;\n        _ref = Frame.Properties;\n        for (key in _ref) {\n          value = _ref[key];\n          if ((_ref1 = args[key]) !== null && _ref1 !== (void 0)) {\n            this[key] = args[key];\n          }\n        }\n        _ref2 = Frame.CalculatedProperties;\n        _results = [];\n        for (key in _ref2) {\n          value = _ref2[key];\n          if ((_ref3 = args[key]) !== null && _ref3 !== (void 0)) {\n            _results.push(this[key] = args[key]);\n          } else {\n            _results.push(void 0);\n          }\n        }\n        return _results;\n      }\n    });\n\n    Frame.define(\"minX\", {\n      get: function() {\n        return this.x;\n      },\n      set: function(value) {\n        return this.x = value;\n      }\n    });\n\n    Frame.define(\"midX\", {\n      get: function() {\n        return this.x + (this.width / 2.0);\n      },\n      set: function(value) {\n        if (this.width === 0) {\n          return this.x = 0;\n        } else {\n          return this.x = value - (this.width / 2.0);\n        }\n      }\n    });\n\n    Frame.define(\"maxX\", {\n      get: function() {\n        return this.x + this.width;\n      },\n      set: function(value) {\n        if (this.width === 0) {\n          return this.x = 0;\n        } else {\n          return this.x = value - this.width;\n        }\n      }\n    });\n\n    Frame.define(\"minY\", {\n      get: function() {\n        return this.y;\n      },\n      set: function(value) {\n        return this.y = value;\n      }\n    });\n\n    Frame.define(\"midY\", {\n      get: function() {\n        return this.y + (this.height / 2.0);\n      },\n      set: function(value) {\n        if (this.height === 0) {\n          return this.y = 0;\n        } else {\n          return this.y = value - (this.height / 2.0);\n        }\n      }\n    });\n\n    Frame.define(\"maxY\", {\n      get: function() {\n        return this.y + this.height;\n      },\n      set: function(value) {\n        if (this.height === 0) {\n          return this.y = 0;\n        } else {\n          return this.y = value - this.height;\n        }\n      }\n    });\n\n    Frame.prototype.merge = function(r2) {\n      var frame, r1;\n      r1 = this;\n      frame = {\n        x: Math.min(r1.x, r2.x),\n        y: Math.min(r1.y, r2.y),\n        width: Math.max(r1.width, r2.width),\n        height: Math.max(r1.height, r2.height)\n      };\n      return new Frame(frame);\n    };\n\n    return Frame;\n\n  })(EventEmitter);\n\n  Frame.Properties = {\n    x: 0,\n    y: 0,\n    z: 0,\n    width: 0,\n    height: 0\n  };\n\n  Frame.CalculatedProperties = {\n    minX: null,\n    midX: null,\n    maxX: null,\n    minY: null,\n    midY: null,\n    maxY: null\n  };\n\n  exports.Frame = Frame;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/eventemitter.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var check, eventCheck,\n    __slice = [].slice;\n\n  check = require(\"check-types\");\n\n  eventCheck = function(event) {\n    return check.verifyUnemptyString(event, \"Missing event type\");\n  };\n\n  exports.EventEmitter = (function() {\n    function EventEmitter() {\n      this.events = {};\n    }\n\n    EventEmitter.prototype.emit = function() {\n      var args, event, listener, _i, _len, _ref, _ref1, _results;\n      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      eventCheck(event);\n      if (!((_ref = this.events) != null ? _ref[event] : void 0)) {\n        return;\n      }\n      _ref1 = this.events[event];\n      _results = [];\n      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n        listener = _ref1[_i];\n        _results.push(listener.apply(null, args));\n      }\n      return _results;\n    };\n\n    EventEmitter.prototype.addListener = function(event, listener) {\n      var _base;\n      eventCheck(event);\n      if (this.events == null) {\n        this.events = {};\n      }\n      if ((_base = this.events)[event] == null) {\n        _base[event] = [];\n      }\n      return this.events[event].push(listener);\n    };\n\n    EventEmitter.prototype.removeListener = function(event, listener) {\n      var l;\n      check.verifyUnemptyString(event);\n      if (!this.events) {\n        return;\n      }\n      if (!this.events[event]) {\n        return;\n      }\n      return this.events[event] = (function() {\n        var _i, _len, _ref, _results;\n        _ref = this.events[event];\n        _results = [];\n        for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n          l = _ref[_i];\n          if (l !== listener) {\n            _results.push(l);\n          }\n        }\n        return _results;\n      }).call(this);\n    };\n\n    EventEmitter.prototype.once = function(event, listener) {\n      var fn,\n        _this = this;\n      eventCheck(event);\n      fn = function() {\n        _this.removeListener(event, fn);\n        return listener.apply(null, arguments);\n      };\n      return this.on(event, fn);\n    };\n\n    EventEmitter.prototype.removeAllListeners = function(event) {\n      var listener, _i, _len, _ref, _results;\n      eventCheck(event);\n      if (!this.events) {\n        return;\n      }\n      if (!this.events[event]) {\n        return;\n      }\n      _ref = this.events[event];\n      _results = [];\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        listener = _ref[_i];\n        _results.push(this.removeListener(event, listener));\n      }\n      return _results;\n    };\n\n    EventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\n    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;\n\n    return EventEmitter;\n\n  })();\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/primitives/matrix.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var EmptyMatrix, Matrix, utils, _;\n\n  _ = require(\"underscore\");\n\n  utils = require(\"../utils\");\n\n  EmptyMatrix = new WebKitCSSMatrix();\n\n  Matrix = (function() {\n    function Matrix(matrix) {\n      if (matrix instanceof WebKitCSSMatrix) {\n        this.from(matrix);\n      }\n    }\n\n    Matrix.define(\"x\", {\n      get: function() {\n        return this._x || 0;\n      },\n      set: function(value) {\n        return this._x = value;\n      }\n    });\n\n    Matrix.define(\"y\", {\n      get: function() {\n        return this._y || 0;\n      },\n      set: function(value) {\n        return this._y = value;\n      }\n    });\n\n    Matrix.define(\"z\", {\n      get: function() {\n        return this._z || 0;\n      },\n      set: function(value) {\n        return this._z = value;\n      }\n    });\n\n    Matrix.define(\"scaleX\", {\n      get: function() {\n        return this._scaleX || 1;\n      },\n      set: function(value) {\n        return this._scaleX = value;\n      }\n    });\n\n    Matrix.define(\"scaleY\", {\n      get: function() {\n        return this._scaleY || 1;\n      },\n      set: function(value) {\n        return this._scaleY = value;\n      }\n    });\n\n    Matrix.define(\"scaleZ\", {\n      get: function() {\n        return this._scaleZ || 1;\n      },\n      set: function(value) {\n        return this._scaleZ = value;\n      }\n    });\n\n    Matrix.define(\"scale\", {\n      get: function() {\n        return (this._scaleX + this._scaleY) / 2.0;\n      },\n      set: function(value) {\n        return this._scaleX = this._scaleY = value;\n      }\n    });\n\n    Matrix.define(\"rotationX\", {\n      get: function() {\n        return this._rotationX || 0;\n      },\n      set: function(value) {\n        return this._rotationX = value;\n      }\n    });\n\n    Matrix.define(\"rotationY\", {\n      get: function() {\n        return this._rotationY || 0;\n      },\n      set: function(value) {\n        return this._rotationY = value;\n      }\n    });\n\n    Matrix.define(\"rotationZ\", {\n      get: function() {\n        return this._rotationZ || 0;\n      },\n      set: function(value) {\n        return this._rotationZ = value;\n      }\n    });\n\n    Matrix.define(\"rotation\", {\n      get: function() {\n        return this.rotationZ;\n      },\n      set: function(value) {\n        return this.rotationZ = value;\n      }\n    });\n\n    Matrix.prototype.decompose = function(m) {\n      var result;\n      result = {};\n      result.translation = {\n        x: m.m41,\n        y: m.m42,\n        z: m.m43\n      };\n      result.scale = {\n        x: Math.sqrt(m.m11 * m.m11 + m.m12 * m.m12 + m.m13 * m.m13),\n        y: Math.sqrt(m.m21 * m.m21 + m.m22 * m.m22 + m.m23 * m.m23),\n        z: Math.sqrt(m.m31 * m.m31 + m.m32 * m.m32 + m.m33 * m.m33)\n      };\n      result.rotation = {\n        x: -Math.atan2(m.m32 / result.scale.z, m.m33 / result.scale.z),\n        y: Math.asin(m.m31 / result.scale.z),\n        z: -Math.atan2(m.m21 / result.scale.y, m.m11 / result.scale.x)\n      };\n      return result;\n    };\n\n    Matrix.prototype.from = function(matrix) {\n      var v;\n      v = this.decompose(matrix);\n      this.x = v.translation.x;\n      this.y = v.translation.y;\n      this.scaleX = v.scale.x;\n      this.scaleY = v.scale.y;\n      this.scaleZ = v.scale.z;\n      this.rotationX = v.rotation.x / Math.PI * 180;\n      this.rotationY = v.rotation.y / Math.PI * 180;\n      return this.rotationZ = v.rotation.z / Math.PI * 180;\n    };\n\n    Matrix.prototype.set = function(view) {\n      return view._matrix = this;\n    };\n\n    Matrix.prototype.css = function() {\n      var m;\n      m = EmptyMatrix;\n      m = m.translate(this._x, this._y, this._z);\n      m = m.rotate(this._rotationX, this._rotationY, this._rotationZ);\n      m = m.scale(this._scaleX, this._scaleY, this._scaleZ);\n      return m.toString();\n    };\n\n    return Matrix;\n\n  })();\n\n  exports.Matrix = Matrix;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/animation.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var Animation, AnimationCounter, AnimationList, EventEmitter, Matrix, bezier, config, css, parseCurve, spring, utils, _,\n    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  _ = require(\"underscore\");\n\n  config = require(\"./config\").config;\n\n  utils = require(\"./utils\");\n\n  css = require(\"./css\");\n\n  EventEmitter = require(\"./eventemitter\").EventEmitter;\n\n  Matrix = require(\"./primitives/matrix\").Matrix;\n\n  spring = require(\"./curves/spring\");\n\n  bezier = require(\"./curves/bezier\");\n\n  AnimationCounter = 0;\n\n  AnimationList = [];\n\n  parseCurve = function(a, prefix) {\n    a = a.replace(prefix, \"\");\n    a = a.replace(/\\s+/g, \"\");\n    a = a.replace(\"(\", \"\");\n    a = a.replace(\")\", \"\");\n    a = a.split(\",\");\n    return a.map(function(i) {\n      return parseFloat(i);\n    });\n  };\n\n  Animation = (function(_super) {\n    __extends(Animation, _super);\n\n    Animation.prototype.AnimationProperties = [\"view\", \"properties\", \"curve\", \"time\", \"origin\", \"tolerance\", \"precision\", \"modifiers\", \"limits\", \"debug\", \"profile\", \"callback\"];\n\n    Animation.prototype.AnimatableCSSProperties = {\n      opacity: \"\",\n      width: \"px\",\n      height: \"px\"\n    };\n\n    Animation.prototype.AnimatableMatrixProperties = [\"x\", \"y\", \"z\", \"scaleX\", \"scaleY\", \"scaleZ\", \"rotationX\", \"rotationY\", \"rotationZ\"];\n\n    function Animation(args) {\n      this._cleanup = __bind(this._cleanup, this);\n      this._finalize = __bind(this._finalize, this);\n      this.stop = __bind(this.stop, this);\n      this.reverse = __bind(this.reverse, this);\n      this.start = __bind(this.start, this);\n      var p, _i, _len, _ref;\n      _ref = this.AnimationProperties;\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        p = _ref[_i];\n        this[p] = args[p];\n      }\n      if (this.time == null) {\n        this.time = 1000;\n      }\n      if (this.curve == null) {\n        this.curve = \"linear\";\n      }\n      this.count = 0;\n      if (this.precision == null) {\n        this.precision = config.animationPrecision;\n      }\n      if (this.debug == null) {\n        this.debug = config.animationDebug;\n      }\n      if (this.profile == null) {\n        this.profile = config.animationProfile;\n      }\n      AnimationCounter += 1;\n      this.animationId = AnimationCounter;\n    }\n\n    Animation.define(\"view\", {\n      get: function() {\n        return this._view;\n      },\n      set: function(view) {\n        if (view === null || view === this._view) {\n          return;\n        }\n        this._originalProperties = view.properties;\n        return this._view = view;\n      }\n    });\n\n    Animation.prototype.start = function(callback) {\n      var animatedProperties, backsideVisibility, k, propertiesA, propertiesB, startTime, v, _i, _len, _ref, _ref1,\n        _this = this;\n      AnimationList.push(this);\n      if (this.view === null) {\n        throw new Error(\"Animation does not have a view to animate\");\n      }\n      startTime = new Date().getTime();\n      this.count++;\n      this.animationName = \"framer-animation-\" + this.animationId + \"-\" + this.count;\n      if (this.debug) {\n        console.log(\"Animation[\" + this.animationId + \"].start\");\n      }\n      if (this.debug) {\n        console.log(\"Animation[\" + this.animationId + \"].view = \" + this.view.name);\n      }\n      if (this.profile) {\n        console.profile(this.animationName);\n      }\n      this.view.animateStop();\n      this.view._currentAnimations.push(this);\n      this.curveValues = this._parseCurve(this.curve);\n      this.totalTime = (this.curveValues.length / this.precision) * 1000;\n      propertiesA = this.view.properties;\n      propertiesB = this.properties;\n      if (propertiesB.scale) {\n        propertiesB.scaleX = propertiesB.scale;\n        propertiesB.scaleY = propertiesB.scale;\n      }\n      if (propertiesB.rotation) {\n        propertiesB.rotationZ = propertiesB.rotation;\n      }\n      this.propertiesA = {};\n      this.propertiesB = {};\n      _ref = this.AnimatableMatrixProperties;\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        k = _ref[_i];\n        this.propertiesA[k] = propertiesA[k];\n        if (propertiesB.hasOwnProperty(k)) {\n          this.propertiesB[k] = propertiesB[k];\n        } else {\n          this.propertiesB[k] = propertiesA[k];\n        }\n      }\n      _ref1 = this.AnimatableCSSProperties;\n      for (k in _ref1) {\n        v = _ref1[k];\n        if (propertiesB.hasOwnProperty(k)) {\n          this.propertiesA[k] = propertiesA[k];\n          this.propertiesB[k] = propertiesB[k];\n        }\n      }\n      animatedProperties = [];\n      for (k in this.propertiesA) {\n        if (this.debug) {\n          console.log(\" .\" + k + \" \" + this.propertiesA[k] + \" -> \" + this.propertiesB[k]);\n        }\n        if (this.propertiesA[k] !== this.propertiesB[k]) {\n          animatedProperties.push(k);\n        }\n      }\n      if (animatedProperties.length === 0) {\n        console.log(\"Animation[\" + this.animationId + \"] Warning: nothing to animate\");\n        return;\n      }\n      this.keyFrameAnimationCSS = this._css();\n      this.view.once(\"webkitAnimationEnd\", function(event) {\n        event.stopPropagation();\n        return _this._finalize();\n      });\n      backsideVisibility = \"visible\";\n      if (this.origin) {\n        this.view.style[\"-webkit-transform-origin\"] = this.origin;\n      }\n      css.addStyle(\"\t\t\t\" + this.keyFrameAnimationCSS + \"\t\t\t\t\t.\" + this.animationName + \" {\t\t\t\t-webkit-animation-duration: \" + (this.totalTime / 1000) + \"s;\t\t\t\t-webkit-animation-name: \" + this.animationName + \";\t\t\t\t-webkit-animation-timing-function: linear;\t\t\t\t-webkit-animation-fill-mode: both;\t\t\t\t-webkit-backface-visibility: \" + backsideVisibility + \";\t\t\t}\");\n      this.view.addClass(this.animationName);\n      this.view.once(\"webkitAnimationStart\", function(event) {\n        var endTime;\n        _this.emit(\"start\", event);\n        if (_this.debug) {\n          endTime = new Date().getTime() - startTime;\n          console.log(\"Animation[\" + _this.animationId + \"].setupTime = \" + endTime + \"ms\");\n          return console.log(\"Animation[\" + _this.animationId + \"].totalTime = \" + (utils.round(_this.totalTime, 0)) + \"ms\");\n        }\n      });\n      if (this.profile) {\n        return console.profileEnd(this.animationName);\n      }\n    };\n\n    Animation.prototype.reverse = function() {\n      var k, options, p, v, _i, _len, _ref, _ref1;\n      options = {};\n      _ref = this.AnimationProperties;\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        p = _ref[_i];\n        options[p] = this[p];\n      }\n      options.properties = {};\n      _ref1 = this._originalProperties;\n      for (k in _ref1) {\n        v = _ref1[k];\n        options.properties[k] = this._originalProperties[k];\n      }\n      return new Animation(options);\n    };\n\n    Animation.prototype.stop = function() {\n      if (this.debug) {\n        console.log(\"Animation[\" + this.animationId + \"].stop \" + this.animationName);\n      }\n      return this._cleanup(false);\n    };\n\n    Animation.prototype._finalize = function() {\n      if (this.debug) {\n        console.log(\"Animation[\" + this.animationId + \"].end \" + this.animationName);\n      }\n      this._cleanup(true);\n      return typeof callback === \"function\" ? callback() : void 0;\n    };\n\n    Animation.prototype._cleanup = function(completed) {\n      var computedStyles, endMatrix, endStyles, k, v, _ref, _ref1;\n      this.view._currentAnimations = _.without(this.view._currentAnimations, this);\n      if (completed) {\n        endMatrix = utils.extend(new Matrix(), this.propertiesB);\n        endStyles = {};\n        _ref = this.AnimatableCSSProperties;\n        for (k in _ref) {\n          v = _ref[k];\n          endStyles[k] = this.propertiesB[k] + v;\n        }\n      } else {\n        endMatrix = new Matrix(this.view._computedMatrix());\n        endStyles = {};\n        computedStyles = this.view.computedStyle;\n        _ref1 = this.AnimatableCSSProperties;\n        for (k in _ref1) {\n          v = _ref1[k];\n          endStyles[k] = computedStyles[k];\n        }\n      }\n      this.view.removeClass(this.animationName);\n      this.view._matrix = endMatrix;\n      this.view.style = endStyles;\n      if (typeof this.callback === \"function\") {\n        this.callback(this);\n      }\n      return this.emit(\"end\");\n    };\n\n    Animation.prototype._keyFrames = function() {\n      var currentKeyFrame, curveValue, deltas, keyFrames, position, propertyName, stepDelta, stepIncrement, _i, _len, _ref;\n      stepIncrement = 0;\n      stepDelta = 100 / (this.curveValues.length - 1);\n      deltas = this._deltas();\n      keyFrames = {};\n      _ref = this.curveValues;\n      for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n        curveValue = _ref[_i];\n        position = stepIncrement * stepDelta;\n        position = utils.round(position, config.roundingDecimals);\n        currentKeyFrame = {};\n        for (propertyName in this.propertiesA) {\n          currentKeyFrame[propertyName] = curveValue * deltas[propertyName] + this.propertiesA[propertyName];\n        }\n        keyFrames[position] = currentKeyFrame;\n        stepIncrement++;\n      }\n      return keyFrames;\n    };\n\n    Animation.prototype._css = function() {\n      var cssString, keyFrames, matrix, position, propertyName, unit, values, _i, _len, _ref, _ref1;\n      keyFrames = this._keyFrames();\n      cssString = [];\n      cssString.push(\"@-webkit-keyframes \" + this.animationName + \" {\\n\");\n      matrix = new Matrix();\n      for (position in keyFrames) {\n        values = keyFrames[position];\n        cssString.push(\"\\t\" + position + \"%\\t{ -webkit-transform: \");\n        _ref = this.AnimatableMatrixProperties;\n        for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n          propertyName = _ref[_i];\n          if (values.hasOwnProperty(propertyName)) {\n            matrix[propertyName] = values[propertyName];\n          } else {\n            matrix[propertyName] = this.view[propertyName];\n          }\n        }\n        cssString.push(matrix.css() + \"; \");\n        _ref1 = this.AnimatableCSSProperties;\n        for (propertyName in _ref1) {\n          unit = _ref1[propertyName];\n          if (!values.hasOwnProperty(propertyName)) {\n            continue;\n          }\n          cssString.push(\"\" + propertyName + \":\" + (utils.round(values[propertyName], config.roundingDecimals)) + unit + \"; \");\n        }\n        cssString.push(\"}\\n\");\n      }\n      cssString.push(\"}\\n\");\n      return cssString.join(\"\");\n    };\n\n    Animation.prototype._deltas = function() {\n      var deltas, k;\n      deltas = {};\n      for (k in this.propertiesA) {\n        deltas[k] = (this.propertiesB[k] - this.propertiesA[k]) / 100.0;\n      }\n      return deltas;\n    };\n\n    Animation.prototype._parseCurve = function(curve) {\n      var factor, precision, time, v;\n      if (curve == null) {\n        curve = \"\";\n      }\n      curve = curve.toLowerCase();\n      factor = config.timeSpeedFactor;\n      precision = this.precision * factor;\n      time = this.time * factor;\n      if (curve === \"linear\") {\n        return bezier.defaults.Linear(this.precision, time);\n      } else if (curve === \"ease\") {\n        return bezier.defaults.Ease(this.precision, time);\n      } else if (curve === \"ease-in\") {\n        return bezier.defaults.EaseIn(this.precision, time);\n      } else if (curve === \"ease-out\") {\n        return bezier.defaults.EaseOut(this.precision, time);\n      } else if (curve === \"ease-in-out\") {\n        return bezier.defaults.EaseInOut(this.precision, time);\n      } else if (curve.slice(0, +(\"bezier-curve\".length - 1) + 1 || 9e9) === \"bezier-curve\") {\n        v = parseCurve(curve, \"bezier-curve\");\n        return bezier.BezierCurve(v[0], v[1], v[2], v[3], precision, time);\n      } else if (curve.slice(0, +(\"spring\".length - 1) + 1 || 9e9) === \"spring\") {\n        v = parseCurve(curve, \"spring\");\n        return spring.SpringCurve(v[0], v[1], v[2], precision);\n      } else {\n        console.log(\"Animation.parseCurve: could not parse curve '\" + curve + \"'\");\n        return bezier.defaults.Linear(this.precision, this.time);\n      }\n    };\n\n    return Animation;\n\n  })(EventEmitter);\n\n  exports.Animation = Animation;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/curves/spring.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var Spring, SpringCurve, defaults, springAccelerationForState, springEvaluateState, springEvaluateStateWithDerivative, springIntegrateState,\n    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };\n\n  defaults = {\n    tension: 80,\n    friction: 8,\n    velocity: 0,\n    speed: 1 / 60.0,\n    tolerance: .1\n  };\n\n  springAccelerationForState = function(state) {\n    return -state.tension * state.x - state.friction * state.v;\n  };\n\n  springEvaluateState = function(initialState) {\n    var output;\n    output = {};\n    output.dx = initialState.v;\n    output.dv = springAccelerationForState(initialState);\n    return output;\n  };\n\n  springEvaluateStateWithDerivative = function(initialState, dt, derivative) {\n    var output, state;\n    state = {};\n    state.x = initialState.x + derivative.dx * dt;\n    state.v = initialState.v + derivative.dv * dt;\n    state.tension = initialState.tension;\n    state.friction = initialState.friction;\n    output = {};\n    output.dx = state.v;\n    output.dv = springAccelerationForState(state);\n    return output;\n  };\n\n  springIntegrateState = function(state, speed) {\n    var a, b, c, d, dvdt, dxdt;\n    a = springEvaluateState(state);\n    b = springEvaluateStateWithDerivative(state, speed * 0.5, a);\n    c = springEvaluateStateWithDerivative(state, speed * 0.5, b);\n    d = springEvaluateStateWithDerivative(state, speed, c);\n    dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx);\n    dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);\n    state.x = state.x + dxdt * speed;\n    state.v = state.v + dvdt * speed;\n    return state;\n  };\n\n  Spring = (function() {\n    function Spring(args) {\n      this.next = __bind(this.next, this);\n      this.reset = __bind(this.reset, this);\n      args = args || {};\n      this.velocity = args.velocity || defaults.velocity;\n      this.tension = args.tension || defaults.tension;\n      this.friction = args.friction || defaults.friction;\n      this.speed = args.speed || defaults.speed;\n      this.tolerance = args.tolerance || defaults.tolerance;\n      this.reset();\n    }\n\n    Spring.prototype.reset = function() {\n      this.startValue = 0;\n      this.currentValue = this.startValue;\n      this.endValue = 100;\n      return this.moving = true;\n    };\n\n    Spring.prototype.next = function() {\n      var finalVelocity, net1DVelocity, netFloat, netValueIsLow, netVelocityIsLow, stateAfter, stateBefore, stopSpring, targetValue;\n      targetValue = this.currentValue;\n      stateBefore = {};\n      stateAfter = {};\n      stateBefore.x = targetValue - this.endValue;\n      stateBefore.v = this.velocity;\n      stateBefore.tension = this.tension;\n      stateBefore.friction = this.friction;\n      stateAfter = springIntegrateState(stateBefore, this.speed);\n      this.currentValue = this.endValue + stateAfter.x;\n      finalVelocity = stateAfter.v;\n      netFloat = stateAfter.x;\n      net1DVelocity = stateAfter.v;\n      netValueIsLow = Math.abs(netFloat) < this.tolerance;\n      netVelocityIsLow = Math.abs(net1DVelocity) < this.tolerance;\n      stopSpring = netValueIsLow && netVelocityIsLow;\n      this.moving = !stopSpring;\n      if (stopSpring) {\n        finalVelocity = 0;\n        this.currentValue = this.endValue;\n      }\n      this.velocity = finalVelocity;\n      return this.currentValue;\n    };\n\n    Spring.prototype.all = function() {\n      var count, _results;\n      this.reset();\n      count = 0;\n      _results = [];\n      while (this.moving) {\n        if (count > 3000) {\n          throw Error(\"Spring: too many values\");\n        }\n        count++;\n        _results.push(this.next());\n      }\n      return _results;\n    };\n\n    Spring.prototype.time = function() {\n      return this.all().length * this.speed;\n    };\n\n    return Spring;\n\n  })();\n\n  SpringCurve = function(tension, friction, velocity, fps) {\n    var spring;\n    spring = new Spring({\n      tension: tension,\n      friction: friction,\n      velocity: velocity,\n      speed: 1 / fps\n    });\n    return spring.all();\n  };\n\n  exports.SpringCurve = SpringCurve;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/curves/bezier.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var BezierCurve, UnitBezier, defaults;\n\n  UnitBezier = (function() {\n    UnitBezier.prototype.epsilon = 1e-6;\n\n    function UnitBezier(p1x, p1y, p2x, p2y) {\n      this.cx = 3.0 * p1x;\n      this.bx = 3.0 * (p2x - p1x) - this.cx;\n      this.ax = 1.0 - this.cx - this.bx;\n      this.cy = 3.0 * p1y;\n      this.by = 3.0 * (p2y - p1y) - this.cy;\n      this.ay = 1.0 - this.cy - this.by;\n    }\n\n    UnitBezier.prototype.sampleCurveX = function(t) {\n      return ((this.ax * t + this.bx) * t + this.cx) * t;\n    };\n\n    UnitBezier.prototype.sampleCurveY = function(t) {\n      return ((this.ay * t + this.by) * t + this.cy) * t;\n    };\n\n    UnitBezier.prototype.sampleCurveDerivativeX = function(t) {\n      return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;\n    };\n\n    UnitBezier.prototype.solveCurveX = function(x) {\n      var d2, i, t0, t1, t2, x2;\n      t2 = x;\n      i = 0;\n      while (i < 8) {\n        x2 = this.sampleCurveX(t2) - x;\n        if (Math.abs(x2) < this.epsilon) {\n          return t2;\n        }\n        d2 = this.sampleCurveDerivativeX(t2);\n        if (Math.abs(d2) < this.epsilon) {\n          break;\n        }\n        t2 = t2 - x2 / d2;\n        i++;\n      }\n      t0 = 0.0;\n      t1 = 1.0;\n      t2 = x;\n      if (t2 < t0) {\n        return t0;\n      }\n      if (t2 > t1) {\n        return t1;\n      }\n      while (t0 < t1) {\n        x2 = this.sampleCurveX(t2);\n        if (Math.abs(x2 - x) < this.epsilon) {\n          return t2;\n        }\n        if (x > x2) {\n          t0 = t2;\n        } else {\n          t1 = t2;\n        }\n        t2 = (t1 - t0) * .5 + t0;\n      }\n      return t2;\n    };\n\n    UnitBezier.prototype.solve = function(x) {\n      return this.sampleCurveY(this.solveCurveX(x));\n    };\n\n    return UnitBezier;\n\n  })();\n\n  BezierCurve = function(a, b, c, d, time, fps) {\n    var curve, step, steps, values, _i;\n    curve = new UnitBezier(a, b, c, d);\n    values = [];\n    steps = ((time / 1000) * fps) - 1;\n    if (steps > 3000) {\n      throw Error(\"Bezier: too many values\");\n    }\n    for (step = _i = 0; 0 <= steps ? _i <= steps : _i >= steps; step = 0 <= steps ? ++_i : --_i) {\n      values.push(curve.solve(step / steps) * 100);\n    }\n    return values;\n  };\n\n  defaults = {};\n\n  defaults.Linear = function(time, fps) {\n    return BezierCurve(0, 0, 1, 1, time, fps);\n  };\n\n  defaults.Ease = function(time, fps) {\n    return BezierCurve(.25, .1, .25, 1, time, fps);\n  };\n\n  defaults.EaseIn = function(time, fps) {\n    return BezierCurve(.42, 0, 1, 1, time, fps);\n  };\n\n  defaults.EaseOut = function(time, fps) {\n    return BezierCurve(0, 0, .58, 1, time, fps);\n  };\n\n  defaults.EaseInOut = function(time, fps) {\n    return BezierCurve(.42, 0, .58, 1, time, fps);\n  };\n\n  exports.defaults = defaults;\n\n  exports.BezierCurve = BezierCurve;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/views/scrollview.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var Frame, View,\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  Frame = require(\"../primitives/frame\").Frame;\n\n  View = require(\"./view\").View;\n\n  exports.ScrollView = (function(_super) {\n    __extends(ScrollView, _super);\n\n    function ScrollView() {\n      ScrollView.__super__.constructor.apply(this, arguments);\n      this.style[\"overflow\"] = \"scroll\";\n      this.style[\"-webkit-overflow-scrolling\"] = \"touch\";\n      this.style[\"overflow-x\"] = \"scroll\";\n      this.style[\"overflow-y\"] = \"scroll\";\n    }\n\n    ScrollView.define(\"scrollVertical\", {\n      get: function() {\n        return this.style[\"overflow-y\"] !== \"hidden\";\n      },\n      set: function(value) {\n        return this.style[\"overflow-y\"] = value ? \"scroll\" : \"hidden\";\n      }\n    });\n\n    ScrollView.define(\"scrollHorizontal\", {\n      get: function() {\n        return this.style[\"overflow-x\"] !== \"hidden\";\n      },\n      set: function(value) {\n        return this.style[\"overflow-x\"] = value ? \"scroll\" : \"hidden\";\n      }\n    });\n\n    ScrollView.prototype.scrollToTop = function() {\n      return this._element.scrollTop = 0;\n    };\n\n    ScrollView.prototype.scrollToBottom = function() {\n      var _this = this;\n      return setTimeout(function() {\n        return _this.scrollPoint = _this._element.scrollHeight - _this.frame.height;\n      }, 0);\n    };\n\n    ScrollView.define(\"scrollPoint\", {\n      get: function() {\n        return this._element.scrollTop;\n      },\n      set: function(value) {\n        return this._element.scrollTop = value;\n      }\n    });\n\n    ScrollView.define(\"scrollFrame\", {\n      get: function() {\n        return new Frame({\n          x: this._element.scrollLeft,\n          y: this._element.scrollTop,\n          width: this.width,\n          height: this.height\n        });\n      },\n      set: function(frame) {\n        this._element.scrollLeft = frame.x;\n        return this._element.scrollTop = frame.y;\n      }\n    });\n\n    return ScrollView;\n\n  })(View);\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/views/imageview.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var View, config, uitis,\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  uitis = require(\"../utils\");\n\n  View = require(\"./view\").View;\n\n  config = require(\"../config\").config;\n\n  exports.ImageView = (function(_super) {\n    __extends(ImageView, _super);\n\n    function ImageView(args) {\n      ImageView.__super__.constructor.apply(this, arguments);\n      if (args == null) {\n        args = {};\n      }\n      this.style[\"background-repeat\"] = \"no-repeat\";\n      this.style[\"background-size\"] = \"cover\";\n      this.image = args.image;\n    }\n\n    ImageView.define(\"image\", {\n      get: function() {\n        return this._image;\n      },\n      set: function(value) {\n        var loader, _ref, _ref1,\n          _this = this;\n        if (this._image === value) {\n          return this.emit(\"load\", loader);\n        }\n        this._image = config.baseUrl + value;\n        if (utils.isLocal()) {\n          this._image += \"?nocache=\" + (Date.now());\n        }\n        if ((_ref = this.events) != null ? _ref.hasOwnProperty(\"load\" || ((_ref1 = this.events) != null ? _ref1.hasOwnProperty(\"error\") : void 0)) : void 0) {\n          loader = new Image();\n          loader.name = this.image;\n          loader.src = this.image;\n          loader.onload = function() {\n            _this.style[\"background-image\"] = \"url('\" + _this.image + \"')\";\n            return _this.emit(\"load\", loader);\n          };\n          return loader.onerror = function() {\n            return _this.emit(\"error\", loader);\n          };\n        } else {\n          return this.style[\"background-image\"] = \"url('\" + this.image + \"')\";\n        }\n      }\n    });\n\n    return ImageView;\n\n  })(View);\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/primitives/events.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var Events, utils, _;\n\n  _ = require(\"underscore\");\n\n  utils = require(\"../utils\");\n\n  Events = {};\n\n  if (utils.isTouch()) {\n    Events.TouchStart = \"touchstart\";\n    Events.TouchEnd = \"touchend\";\n    Events.TouchMove = \"touchmove\";\n  } else {\n    Events.TouchStart = \"mousedown\";\n    Events.TouchEnd = \"mouseup\";\n    Events.TouchMove = \"mousemove\";\n  }\n\n  Events.MouseOver = \"mouseover\";\n\n  Events.MouseOut = \"mouseout\";\n\n  Events.touchEvent = function(event) {\n    var touchEvent, _ref, _ref1;\n    touchEvent = (_ref = event.touches) != null ? _ref[0] : void 0;\n    if (touchEvent == null) {\n      touchEvent = (_ref1 = event.changedTouches) != null ? _ref1[0] : void 0;\n    }\n    if (touchEvent == null) {\n      touchEvent = event;\n    }\n    return touchEvent;\n  };\n\n  exports.Events = Events;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/ui/init.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  exports.GridView = (require(\"./gridview\")).GridView;\n\n  exports.Draggable = (require(\"./draggable\")).Draggable;\n\n  exports.ScrollView = (require(\"./scrollview\")).ScrollView;\n\n  exports.PagingView = (require(\"./pagingview\")).PagingView;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/ui/gridview.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var View,\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  View = require(\"../views/view\").View;\n\n  exports.GridView = (function(_super) {\n    __extends(GridView, _super);\n\n    function GridView(args) {\n      GridView.__super__.constructor.apply(this, arguments);\n      this.rows = args.rows || 2;\n      this.cols = args.cols || 2;\n      this.views = {};\n      this.update();\n    }\n\n    GridView.prototype.update = function() {\n      var colIndex, frame, rowIndex, view, _i, _ref, _results;\n      _results = [];\n      for (rowIndex = _i = 1, _ref = this.rows; 1 <= _ref ? _i <= _ref : _i >= _ref; rowIndex = 1 <= _ref ? ++_i : --_i) {\n        _results.push((function() {\n          var _j, _ref1, _results1;\n          _results1 = [];\n          for (colIndex = _j = 1, _ref1 = this.cols; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; colIndex = 1 <= _ref1 ? ++_j : --_j) {\n            view = this.createView();\n            view.superView = this;\n            frame = {\n              width: this.width / this.cols,\n              height: this.height / this.cols\n            };\n            frame.x = (colIndex - 1) * frame.width;\n            frame.y = (rowIndex - 1) * frame.height;\n            view.frame = frame;\n            _results1.push(this.views[\"\" + rowIndex + \".\" + colIndex] = view);\n          }\n          return _results1;\n        }).call(this));\n      }\n      return _results;\n    };\n\n    GridView.prototype.createView = function() {\n      var view;\n      view = new View;\n      view.style.backgroundColor = utils.randomColor(.1);\n      view.clip = false;\n      return view;\n    };\n\n    return GridView;\n\n  })(View);\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/ui/draggable.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var EventEmitter, Events, _,\n    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  _ = require(\"underscore\");\n\n  EventEmitter = require(\"../eventemitter\").EventEmitter;\n\n  Events = require(\"../primitives/events\").Events;\n\n  Events.DragStart = \"dragstart\";\n\n  Events.DragMove = \"dragmove\";\n\n  Events.DragEnd = \"dragend\";\n\n  exports.Draggable = (function(_super) {\n    __extends(Draggable, _super);\n\n    Draggable.VelocityTimeOut = 100;\n\n    function Draggable(view) {\n      this.view = view;\n      this._touchEnd = __bind(this._touchEnd, this);\n      this._touchStart = __bind(this._touchStart, this);\n      this._updatePosition = __bind(this._updatePosition, this);\n      this.speed = {\n        x: 1.0,\n        y: 1.0\n      };\n      this._deltas = [];\n      this._isDragging = false;\n      this.attach();\n    }\n\n    Draggable.prototype.attach = function() {\n      return this.view.on(Events.TouchStart, this._touchStart);\n    };\n\n    Draggable.prototype.remove = function() {\n      return this.view.off(Events.TouchStart, this._touchStart);\n    };\n\n    Draggable.prototype.calculateVelocity = function() {\n      var curr, prev, time, timeSinceLastMove, velocity;\n      if (this._deltas.length < 2) {\n        return {\n          x: 0,\n          y: 0\n        };\n      }\n      curr = this._deltas.slice(-1)[0];\n      prev = this._deltas.slice(-2, -1)[0];\n      time = curr.t - prev.t;\n      timeSinceLastMove = new Date().getTime() - prev.t;\n      if (timeSinceLastMove > this.VelocityTimeOut) {\n        return {\n          x: 0,\n          y: 0\n        };\n      }\n      velocity = {\n        x: (curr.x - prev.x) / time,\n        y: (curr.y - prev.y) / time\n      };\n      if (velocity.x === Infinity) {\n        velocity.x = 0;\n      }\n      if (velocity.y === Infinity) {\n        velocity.y = 0;\n      }\n      return velocity;\n    };\n\n    Draggable.prototype._updatePosition = function(event) {\n      var correctedDelta, delta, touchEvent;\n      touchEvent = Events.touchEvent(event);\n      delta = {\n        x: touchEvent.clientX - this._start.x,\n        y: touchEvent.clientY - this._start.y\n      };\n      correctedDelta = {\n        x: delta.x * this.speed.x,\n        y: delta.y * this.speed.y,\n        t: event.timeStamp\n      };\n      this.view.x = this._start.x + correctedDelta.x - this._offset.x;\n      this.view.y = this._start.y + correctedDelta.y - this._offset.y;\n      this._deltas.push(correctedDelta);\n      return this.view.emit(Events.DragMove, event);\n    };\n\n    Draggable.prototype._touchStart = function(event) {\n      var touchEvent;\n      this.view.animateStop();\n      this._isDragging = true;\n      touchEvent = Events.touchEvent(event);\n      this._start = {\n        x: touchEvent.clientX,\n        y: touchEvent.clientY\n      };\n      this._offset = {\n        x: touchEvent.clientX - this.view.x,\n        y: touchEvent.clientY - this.view.y\n      };\n      document.addEventListener(Events.TouchMove, this._updatePosition);\n      document.addEventListener(Events.TouchEnd, this._touchEnd);\n      return this.emit(Events.DragStart, event);\n    };\n\n    Draggable.prototype._touchEnd = function(event) {\n      this._isDragging = false;\n      document.removeEventListener(Events.TouchMove, this._updatePosition);\n      document.removeEventListener(Events.TouchEnd, this._touchEnd);\n      this.emit(Events.DragEnd, event);\n      return this._deltas = [];\n    };\n\n    return Draggable;\n\n  })(EventEmitter);\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/ui/scrollview.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var Events, ScrollView, View, utils,\n    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  utils = require(\"../utils\");\n\n  View = require(\"../views/view\").View;\n\n  Events = require(\"../primitives/events\").Events;\n\n  Events.ScrollStart = \"scrollstart\";\n\n  Events.Scroll = \"scroll\";\n\n  Events.ScrollEnd = \"scrollend\";\n\n  ScrollView = (function(_super) {\n    __extends(ScrollView, _super);\n\n    function ScrollView() {\n      this._endBehaviourSnap = __bind(this._endBehaviourSnap, this);\n      this._endBehaviourMomentum = __bind(this._endBehaviourMomentum, this);\n      this._scrollEnd = __bind(this._scrollEnd, this);\n      this._scroll = __bind(this._scroll, this);\n      this._scrollStart = __bind(this._scrollStart, this);\n      this._updateSize = __bind(this._updateSize, this);\n      this._changeSubViews = __bind(this._changeSubViews, this);\n      ScrollView.__super__.constructor.apply(this, arguments);\n      this.clip = true;\n      this.contentView = new View({\n        superView: this\n      });\n      this.contentView.on(\"change:subViews\", this._changeSubViews);\n      this._dragger = new ui.Draggable(this.contentView);\n      this._dragger.on(Events.DragStart, this._scrollStart);\n      this._dragger.on(Events.DragMove, this._scroll);\n      this._dragger.on(Events.DragEnd, this._scrollEnd);\n      this.endBehaviour = this._endBehaviourMomentum;\n    }\n\n    ScrollView.prototype.centerView = function(view, animate) {\n      if (animate == null) {\n        animate = false;\n      }\n      return this.scrollFrame = this._scrollFrameForView(view);\n    };\n\n    ScrollView.prototype.snapToView = function(view, curve) {\n      if (curve == null) {\n        curve = \"spring(1000,20,1000)\";\n      }\n      return this.contentView.animate({\n        properties: utils.pointInvert(this._scrollFrameForView(view)),\n        curve: curve\n      });\n    };\n\n    ScrollView.prototype.closestView = function(frame) {\n      var _this = this;\n      if (frame == null) {\n        frame = this.scrollFrame;\n      }\n      return _.first(_.sortBy(this.contentView.subViews, function(view) {\n        return utils.pointTotal(utils.pointDistance(view.frame, frame));\n      }));\n    };\n\n    ScrollView.prototype.calculateVelocity = function() {\n      return this._dragger.calculateVelocity();\n    };\n\n    ScrollView.define(\"scrollX\", {\n      get: function() {\n        return this._dragger.speed.x === 1;\n      },\n      set: function(value) {\n        return this._dragger.speed.x = value === true ? 1 : 0;\n      }\n    });\n\n    ScrollView.define(\"scrollY\", {\n      get: function() {\n        return this._dragger.speed.y === 1;\n      },\n      set: function(value) {\n        return this._dragger.speed.y = value === true ? 1 : 0;\n      }\n    });\n\n    ScrollView.define(\"scrollFrame\", {\n      get: function() {\n        return new Framer.Frame(utils.pointInvert(this.contentView));\n      },\n      set: function(frame) {\n        return this.contentView.frame = utils.pointInvert(utils.framePoint(this.contentView.frame));\n      }\n    });\n\n    ScrollView.define(\"paging\", {\n      get: function() {\n        return this._paging;\n      },\n      set: function(value) {\n        this._paging = value;\n        if (value === true) {\n          return this.endBehaviour = this._endBehaviourSnap;\n        } else {\n          return this.endBehaviour = this._endBehaviourMomentum;\n        }\n      }\n    });\n\n    ScrollView.prototype._scrollFrameForView = function(view) {\n      var frame;\n      return frame = {\n        x: view.x + (view.width - this.width) / 2.0,\n        y: view.y + (view.height - this.height) / 2.0\n      };\n    };\n\n    ScrollView.prototype._changeSubViews = function(event) {\n      var _ref, _ref1,\n        _this = this;\n      if (event != null) {\n        if ((_ref = event.added) != null) {\n          _ref.map(function(view) {\n            return view.on(\"change:frame\", _this._updateSize);\n          });\n        }\n      }\n      if (event != null) {\n        if ((_ref1 = event.removed) != null) {\n          _ref1.map(function(view) {\n            return view.off(\"change:frame\", _this._updateSize);\n          });\n        }\n      }\n      return this._updateSize();\n    };\n\n    ScrollView.prototype._updateSize = function() {\n      return this.contentView.frame = utils.frameSize(this.contentView.contentFrame());\n    };\n\n    ScrollView.prototype._scrollStart = function(event) {\n      event.preventDefault();\n      return this.emit(Events.ScrollStart, event);\n    };\n\n    ScrollView.prototype._scroll = function(event) {\n      event.preventDefault();\n      return this.emit(Events.Scroll, event);\n    };\n\n    ScrollView.prototype._scrollEnd = function(event) {\n      event.preventDefault();\n      if (typeof this.endBehaviour === \"function\") {\n        this.endBehaviour(event);\n      }\n      return this.emit(Events.ScrollEnd, event);\n    };\n\n    ScrollView.prototype._endBehaviourMomentum = function(event) {\n      var animation, constant1, constant2, totalVelocity, touchEvent, velocity;\n      touchEvent = Events.touchEvent(event);\n      constant1 = 1000;\n      constant2 = 0;\n      velocity = this.calculateVelocity();\n      totalVelocity = utils.pointAbs(utils.pointTotal(velocity));\n      return animation = this.contentView.animate({\n        properties: {\n          x: parseInt(this.contentView.x + (velocity.x * constant1)),\n          y: parseInt(this.contentView.y + (velocity.y * constant1))\n        },\n        curve: \"spring(100,80,\" + (totalVelocity * constant2) + \")\"\n      });\n    };\n\n    ScrollView.prototype._endBehaviourSnap = function(event) {\n      var animation, constant1, constant2, curve, friction, totalVelocity, touchEvent, velocity;\n      touchEvent = Events.touchEvent(event);\n      constant1 = 1;\n      constant2 = 1;\n      friction = 32;\n      velocity = this.calculateVelocity();\n      totalVelocity = utils.pointAbs(utils.pointTotal(velocity));\n      curve = \"spring(300,\" + (friction * constant1) + \",\" + (totalVelocity * constant2) + \")\";\n      return animation = this.snapToView(this.closestView(), curve);\n    };\n\n    return ScrollView;\n\n  })(View);\n\n  exports.ScrollView = ScrollView;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/ui/pagingview.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var PagingView, ScrollView,\n    __hasProp = {}.hasOwnProperty,\n    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };\n\n  ScrollView = require(\"./scrollview\").ScrollView;\n\n  PagingView = (function(_super) {\n    __extends(PagingView, _super);\n\n    function PagingView() {\n      PagingView.__super__.constructor.apply(this, arguments);\n      this.endBehaviour = this._endBehaviourSnap;\n    }\n\n    return PagingView;\n\n  })(ScrollView);\n\n  exports.PagingView = PagingView;\n\n}).call(this);\n\n});\n\nrequire.define(\"/src/init.coffee\",function(require,module,exports,__dirname,__filename,process,global){(function() {\n  var Animation, EventEmitter, Events, Frame, Global, ImageView, Matrix, ScrollView, View, ViewList, config, css, debug, tools, utils;\n\n  css = require(\"./css\");\n\n  config = require(\"./config\").config;\n\n  utils = require(\"./utils\");\n\n  debug = require(\"./debug\");\n\n  tools = require(\"./tools/init\").tools;\n\n  View = require(\"./views/view\").View;\n\n  ViewList = require(\"./views/view\").ViewList;\n\n  ScrollView = require(\"./views/scrollview\").ScrollView;\n\n  ImageView = require(\"./views/imageview\").ImageView;\n\n  Animation = require(\"./animation\").Animation;\n\n  Frame = require(\"./primitives/frame\").Frame;\n\n  Matrix = require(\"./primitives/matrix\").Matrix;\n\n  EventEmitter = require(\"./eventemitter\").EventEmitter;\n\n  Events = require(\"./primitives/events\").Events;\n\n  Global = {};\n\n  Global.View = View;\n\n  Global.ScrollView = ScrollView;\n\n  Global.ImageView = ImageView;\n\n  Global.Animation = Animation;\n\n  Global.Frame = Frame;\n\n  Global.Matrix = Matrix;\n\n  Global.EventEmitter = EventEmitter;\n\n  Global.Events = Events;\n\n  Global.utils = utils;\n\n  Global.tools = tools;\n\n  Global.ui = require(\"./ui/init\");\n\n  Global.ViewList = ViewList;\n\n  Global.debug = debug.debug;\n\n  Global.css = css;\n\n  Global.config = config;\n\n  if (window) {\n    window.Framer = Global;\n    window._ = require(\"underscore\");\n    _.extend(window, Global);\n  }\n\n  if (!utils.isWebKit()) {\n    alert(\"Sorry, only WebKit browsers are currently supported. \\See https://github.com/koenbok/Framer/issues/2 for more info.\");\n  }\n\n}).call(this);\n\n});\nrequire(\"/src/init.coffee\");\n})();\n\n", "framerps.js": "var loadViews = function() {\n\t\n\tvar Views = []\n\tvar ViewsByName = {}\n\t\n\tcreateView = function(info, superView) {\n\t\t\n\t\t// console.log(\"createView\", info.name, \"superView: \", superView)\n\t\t\n\t\tvar viewType, viewFrame\n\t\tvar viewInfo = {\n\t\t\tclip: false\n\t\t}\n\t\t\n\t\tif (info.image) {\n\t\t\tviewType = ImageView\n\t\t\tviewFrame = info.image.frame\n\t\t\tviewInfo.image = \"images/\" + info.name + \".\" + info.imageType\n\t\t}\n\t\t\n\t\telse {\n\t\t\tviewType = View\n\t\t\tviewFrame = info.layerFrame\n\t\t}\n\t\t\n\t\t// If this layer group has a mask, we take the mask bounds\n\t\t// as the frame and clip the layer\n\t\tif (info.maskFrame) {\n\t\t\tviewFrame = info.maskFrame\n\t\t\tviewInfo.clip = true\n\t\t\t\n\t\t\t// If the layer name has \"scroll\" we make this a scroll view\n\t\t\tif (info.name.toLowerCase().indexOf(\"scroll\") != -1) {\n\t\t\t\tviewType = ScrollView\n\t\t\t}\n\t\t\t\n\t\t\t// If the layer name has \"paging\" we make this a paging view\n\t\t\tif (info.name.toLowerCase().indexOf(\"paging\") != -1) {\n\t\t\t\tviewType = ui.PagingView\n\t\t\t}\n\n\t\t}\n\t\t\n\t\tvar view = new viewType(viewInfo)\n\t\t\n\t\tview.frame = viewFrame\n\t\t\n\t\t// If the view has a contentview (like a scrollview) we add it\n\t\t// to that one instead.\n\t\tif (superView && superView.contentView) {\n\t\t\tview.superView = superView.contentView\n\t\t} else {\n\t\t\tview.superView = superView\n\t\t}\n\t\t\n\t\tview.name = info.name\n\t\tview.viewInfo = info\n\t\t\n\t\tViews.push(view)\n\t\tViewsByName[info.name] = view\n\n\t\t// If the layer name contains draggable we create a draggable for this layer\n\t\tif (info.name.toLowerCase().indexOf(\"draggable\") != -1) {\n\t\t\tview.draggable = new ui.Draggable(view)\n\t\t}\n\n\t\tfor (var i in info.children) {\n\t\t\tcreateView(info.children[info.children.length - 1 - i], view)\n\t\t}\n\n\t}\n\t\t\n\t// Loop through all the photoshop documents\n\tfor (var documentName in FramerPS) {\n\t\t// Load the layers for this document\n\t\tfor (var layerIndex in FramerPS[documentName]) {\n\t\t\tcreateView(FramerPS[documentName][layerIndex])\n\t\t}\n\t}\n\t\n\t\n\tfor (var i in Views) {\n\t\t\n\t\tvar view = Views[i]\n\t\t\n\t\t// // Views without subviews and image should be 0x0 pixels\n\t\tif (!view.image && !view.viewInfo.maskFrame && !view.subViews.length) {\n\t\t\tconsole.log(view.name, view.viewInfo.maskFrame)\n\t\t\tview.frame = {x:0, y:0, width:0, height:0}\n\t\t}\n\t\t\n\t\tfunction shouldCorrectView(view) {\n\t\t\treturn !view.image && !view.viewInfo.maskFrame\n\t\t}\n\n\t\t// If a view has no image or mask, make it the size of it's combined subviews\n\t\tif (shouldCorrectView(view)) {\n\n\t\t\tvar frame = null\n\t\t\t\n\t\t\tfunction traverse(views) {\n\t\t\t\tviews.map(function(view) {\n\n\t\t\t\t\tif (shouldCorrectView(view)) {\n\t\t\t\t\t\treturn\n\t\t\t\t\t}\n\n\t\t\t\t\tif (!frame) {\n\t\t\t\t\t\tframe = view.frame\n\t\t\t\t\t} else {\n\t\t\t\t\t\tframe = frame.merge(view.frame)\n\t\t\t\t\t}\n\n\t\t\t\t\ttraverse(view.subViews)\n\t\t\t\t})\n\t\t\t}\n\t\t\t\n\t\t\ttraverse(view.subViews)\n\t\t\tview.frame = frame\n\t\t\t\n\t\t}\n\t\t\n\t\t// Correct all the view frames for the superView coordinate system\n\t\tif (view.superView) {\n\t\t\tview.frame = view.superView.convertPoint(view.frame)\n\t\t}\n\t\t\n\t}\n\t\n\treturn ViewsByName\n\n}\n\nwindow.PSD = loadViews()\n"}
// Generated by CoffeeScript 1.4.0
var SaveJPG, SavePNG, checkDocument, console, createFolder, dupLayers, exportImage, fileExists, frameForBounds, getCumulativeHash, getHash, getMetaData, getModificationTime, getXMPData, json, psAlert, readFile, rename, strFrame, writeFile, writeTemplate,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

console = {};

console.log = function() {
  var args;
  args = Array.prototype.slice.call(arguments);
  if (!CONFIG.logPaths) {
    return;
  }
  if (!GLOBAL._logFiles) {
    GLOBAL._logFiles = _(CONFIG.logPaths).map(function(path) {
      var f;
      f = new File(path);
      f.lineFeed = "Unix";
      f.open("w");
      return f;
    });
  }
  return _(GLOBAL._logFiles).map(function(f) {
    return f.writeln(args.join(" "));
  });
};

psAlert = function(title, content) {
  return alert("Framer: " + title + "\n" + (content.replace(/\t/g, "")));
};

checkDocument = function() {
  try {
    activeDocument.path;
    return true;
  } catch (error) {
    return false;
  }
};

json = function(thing) {
  return JSON.stringify(thing, null, "\t");
};

createFolder = function(path) {
  return (new Folder(path)).create();
};

fileExists = function(path) {
  return (new File(path)).exists;
};

frameForBounds = function(bounds) {
  var frame;
  if (!bounds) {
    console.log("Warning: missing bounds");
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
  }
  frame = {
    x: parseInt(bounds[0]),
    y: parseInt(bounds[1]),
    width: parseInt(bounds[2] - parseInt(bounds[0])),
    height: parseInt(bounds[3] - parseInt(bounds[1]))
  };
  return frame;
};

strFrame = function(f) {
  return "x:" + f.x + " y:" + f.y + " width:" + f.width + " height:" + f.height;
};

rename = function(names, name) {
  var c, newName;
  if (__indexOf.call(names, name) < 0) {
    return name;
  }
  if (("" + (parseInt(name.split(" ").pop()))) === name.split(" ").pop()) {
    c = parseInt(name.split(" ").pop());
    name = name.split(" ").slice(0, -1).join(" ");
  } else {
    c = 2;
  }
  newName = name;
  while (__indexOf.call(names, newName) >= 0) {
    newName = "" + name + "-" + c;
    c++;
  }
  return newName;
};

exportImage = function(layerSet, path, imageType) {
  var height, layerName, newHeight, newWidth, oldHeight, oldWidth, rootLayerSet, width, x, y, _i, _len, _ref;
  if (imageType == null) {
    imageType = "png";
  }
  layerName = layerSet.name;
  activeDocument.activeLayer = layerSet;
  dupLayers();
  rootLayerSet = activeDocument.layerSets[0];
  _ref = rootLayerSet.layerSets;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    layerSet = _ref[_i];
    layerSet.visible = false;
  }
  oldWidth = parseInt(app.activeDocument.width);
  oldHeight = parseInt(app.activeDocument.height);
  app.activeDocument.trim(TrimType.TRANSPARENT, true, true, false, false);
  newHeight = parseInt(app.activeDocument.height);
  newWidth = parseInt(app.activeDocument.width);
  x = oldWidth - newWidth;
  y = oldHeight - newHeight;
  app.activeDocument.trim(TrimType.TRANSPARENT, false, false, true, true);
  width = parseInt(app.activeDocument.width);
  height = parseInt(app.activeDocument.height);
  if (imageType === "jpg") {
    SaveJPG(path);
  } else {
    SavePNG(path);
  }
  app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
  return {
    x: x,
    y: y,
    width: width,
    height: height
  };
};

writeFile = function(path, data) {
  var f;
  try {
    f = new File(path);
    f.lineFeed = "Unix";
    f.remove();
    f.open('w');
    f.write(data);
    return f.close();
  } catch (error) {
    return alert(error);
  }
};

readFile = function(path) {
  var data, f;
  try {
    f = new File(path);
    f.lineFeed = "Unix";
    f.open('r');
    data = f.read(data);
    f.close();
    return data;
  } catch (error) {
    return alert(error);
  }
};

dupLayers = function() {
  var desc143, ref73, ref74;
  desc143 = new ActionDescriptor();
  ref73 = new ActionReference();
  ref73.putClass(charIDToTypeID("Dcmn"));
  desc143.putReference(charIDToTypeID("null"), ref73);
  desc143.putString(charIDToTypeID("Nm  "), activeDocument.activeLayer.name);
  ref74 = new ActionReference();
  ref74.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc143.putReference(charIDToTypeID("Usng"), ref74);
  return executeAction(charIDToTypeID("Mk  "), desc143, DialogModes.NO);
};

SavePNG = function(path) {
  var f, pngOpts;
  f = new File(path);
  pngOpts = new PNGSaveOptions();
  pngOpts.format = SaveDocumentType.PNG;
  pngOpts.PNG8 = false;
  pngOpts.transparency = true;
  pngOpts.interlaced = false;
  pngOpts.quality = 100;
  pngOpts.compression = 5;
  return activeDocument.saveAs(f, pngOpts, true, Extension.LOWERCASE);
};

SaveJPG = function(path) {
  var f, jpegOpts;
  f = new File(path);
  jpegOpts = new JPEGSaveOptions();
  jpegOpts.format = SaveDocumentType.JPEG;
  jpegOpts.quality = 8;
  return activeDocument.saveAs(f, jpegOpts, true, Extension.LOWERCASE);
};

writeTemplate = function(name, path, replace) {
  if (replace == null) {
    replace = function(v) {
      return v;
    };
  }
  if (!fileExists(path)) {
    writeFile(path, replace(Templates[name]));
    return console.log("Writing " + path);
  } else {
    return console.log("Skipping " + path + " (exists)");
  }
};

getMetaData = function(layer) {
  var layerID, ref;
  layerID = layer.getID();
  ref = new ActionReference();
  ref.putProperty(stringIDToTypeID("property"), stringIDToTypeID("metadata"));
  ref.putIdentifier(stringIDToTypeID("layer"), layerID);
  return executeActionGet(ref).getObjectValue(stringIDToTypeID("metadata"));
};

getModificationTime = function(layer) {
  var metadata;
  metadata = getMetaData(layer);
  return metadata.getDouble(stringIDToTypeID("layerTime")) * 1000;
};

getCumulativeHash = function(layer) {
  var add, layerTimes;
  layerTimes = "";
  add = function(layer) {
    if (layer.isGroup === true) {
      return _(layer.getChildren()).map(function(layer) {
        layerTimes += getModificationTime(layer);
        return add(layer, layerTimes);
      });
    }
  };
  add(layer);
  return getHash(layerTimes);
};

getXMPData = function(layer) {
  var data, xmp;
  if (!ExternalObject.AdobeXMPScript) {
    ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
  }
  data = layer.xmpMetadata.rawData;
  return xmp = new XMPMeta(data);
};

getHash = function(s) {
  var c, hash, i;
  hash = 0;
  if (s.length === 0) {
    return hash;
  }
  i = 0;
  while (i < s.length) {
    c = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
    i++;
  }
  return Math.abs(hash);
};
// Generated by CoffeeScript 1.4.0
var CONFIG, GLOBAL, main,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

GLOBAL = {};

CONFIG = {};

main = function() {
  var PREVIOUS, changedCount, count, data, document, fakeLayerGroups, fakeLayers, folder, layerGroupNames, layerGroupRenames, layerInfo, layerInfoData, layerInfoDataTemplate, process, rootLayerGroups, traverse, _i, _len, _ref;
  if (!checkDocument()) {
    psAlert("Please save document first", "You need to save your document before 			running Framer so we know where to write to.");
    return;
  }
  CONFIG.docName = activeDocument.name.replace(".psd", "");
  CONFIG.path = "" + activeDocument.path + "/" + CONFIG.docName;
  CONFIG.relativeImagePath = "images";
  CONFIG.imagePath = "" + CONFIG.path + "/" + CONFIG.relativeImagePath;
  CONFIG.framerPath = "" + CONFIG.path + "/framer";
  CONFIG.viewInfoPath = "" + CONFIG.framerPath + "/views." + CONFIG.docName + ".js";
  CONFIG.logPaths = ["/tmp/framerps.log", "" + CONFIG.framerPath + "/framerps.log"];
  if (__indexOf.call(CONFIG.path, "AutoRecover") >= 0) {
    console.log("\nSUCCESS: But nothing to do");
    psAlert("Woops", "This looks like an auto recovered file. It is unlikely			you actually want to do this.");
    return;
  }
  if (activeDocument.name.slice(-4).toLowerCase() !== ".psd") {
    console.log("\nSUCCESS: But nothing to do");
    psAlert("Not a PSD file", "Framer needs layers to work on something.");
    return;
  }
  if (preferences.rulerUnits !== Units.PIXELS) {
    console.log("\nSUCCESS: But nothing to do");
    psAlert("Rulers unit not pixels", "Please set your ruler units to pixels in preferences.");
    return;
  }
  if (activeDocument.mode !== DocumentMode.RGB) {
    console.log("\nSUCCESS: But nothing to do");
    psAlert("Need RGB Document", "Please convert your document to RGB before proecessing.");
    return;
  }
  _ref = [CONFIG.path, CONFIG.imagePath, CONFIG.framerPath];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    folder = _ref[_i];
    createFolder(folder);
  }
  console.log(JSON.stringify(CONFIG));
  console.log("\nRunning for " + CONFIG.path);
  layerInfoDataTemplate = "		window.FramerPS = window.FramerPS || {};\n		window.FramerPS['" + CONFIG.docName + "'] = ";
  data = readFile(CONFIG.viewInfoPath);
  data = data.replace(layerInfoDataTemplate, "");
  try {
    data = JSON.parse(data);
  } catch (err) {
    console.log("Could not read data file");
    data = false;
  }
  PREVIOUS = {};
  process = function(layerInfo) {
    PREVIOUS[layerInfo.id] = layerInfo;
    return layerInfo.children.map(process);
  };
  if (data !== false) {
    data.map(process);
  }
  document = new FakeDocument(activeDocument);
  fakeLayers = _(document.getFakeLayers()).filter(function(layer) {
    return layer !== null && layer.isVisible();
  });
  fakeLayerGroups = _(fakeLayers).filter(function(layer) {
    return layer.isGroup && layer.isVisible();
  });
  if (fakeLayerGroups.length === 0) {
    console.log("\nSUCCESS: But nothing to do");
    psAlert("No layer groups, nothing to do", "Each layer groups becomes a view, 			and this document has none. Create a layer group with some layers and 			try again.");
    return;
  }
  layerGroupNames = [];
  layerGroupRenames = [];
  _(fakeLayerGroups).map(function(layerGroup) {
    var invalidChar, invalidChars, layerGroupName, layerGroupNameOld, _j, _len1;
    layerGroupName = layerGroup.getName();
    layerGroupNameOld = layerGroup.getName();
    invalidChars = ["/", ":"];
    for (_j = 0, _len1 = invalidChars.length; _j < _len1; _j++) {
      invalidChar = invalidChars[_j];
      if (layerGroupName.match(invalidChar)) {
        layerGroupName = layerGroupName.replace(invalidChar, "-");
      }
    }
    if (__indexOf.call(layerGroupNames, layerGroupName) >= 0) {
      layerGroupName = rename(layerGroupNames, layerGroupName);
    }
    if (layerGroupName !== layerGroupNameOld) {
      layerGroup.setName(layerGroupName);
      console.log("Renaming " + layerGroupNameOld + " -> " + layerGroupName);
    }
    return layerGroupNames.push(layerGroupName);
  });
  fakeLayers = _(document.getFakeLayers()).filter(function(layer) {
    return layer !== null && layer.isVisible();
  });
  fakeLayerGroups = _(fakeLayers).filter(function(layer) {
    return layer.isGroup && layer.isVisible();
  });
  count = 0;
  changedCount = 0;
  traverse = function(layerGroups) {
    return _(layerGroups).map(function(layerGroup) {
      var imageFrame, imagePath, layerInfo, maskBounds, modificationHash, prefix, previousLayerInfo, relativeImagePath, subArtLayers, subGroupLayers, subLayers;
      prefix = "" + (layerGroup.getName()) + ": ";
      count++;
      subLayers = layerGroup.getChildren();
      subGroupLayers = _(subLayers).filter(function(layer) {
        return layer.isGroup === true && layer.isVisible();
      });
      subArtLayers = _(subLayers).filter(function(layer) {
        return layer.isGroup === void 0 && layer.isVisible();
      });
      modificationHash = getCumulativeHash(layerGroup);
      modificationHash = modificationHash.toString();
      previousLayerInfo = PREVIOUS[layerGroup.getID()];
      imagePath = "" + CONFIG.imagePath + "/" + (layerGroup.getName()) + ".png";
      relativeImagePath = "" + CONFIG.relativeImagePath + "/" + (layerGroup.getName()) + ".png";
      if (previousLayerInfo && previousLayerInfo.modification) {
        if (modificationHash === previousLayerInfo.modification) {
          if (fileExists(imagePath)) {
            return previousLayerInfo;
          }
        }
      }
      changedCount += 1;
      layerInfo = {
        id: layerGroup.getID(),
        name: layerGroup.getName(),
        layerFrame: null,
        maskFrame: null,
        image: null,
        imageType: null,
        children: [],
        modification: modificationHash
      };
      layerInfo.layerFrame = frameForBounds(layerGroup.getBounds());
      if (subArtLayers.length) {
        console.log("" + prefix + "Exporting image");
        layerInfo.imageType = "png";
        if (layerInfo.name.indexOf("jpg") !== -1) {
          layerInfo.imageType = "jpg";
        }
        imageFrame = exportImage(layerGroup.getRealLayer(), imagePath, layerInfo.imageType);
        layerInfo.image = {
          path: relativeImagePath,
          frame: imageFrame
        };
      }
      if (layerGroup.hasVectorMask()) {
        console.log("" + prefix + "Calculating vector mask bounds");
        maskBounds = Stdlib.getVectorMaskBounds(activeDocument, layerGroup.getRealLayer());
        layerInfo.maskFrame = frameForBounds(maskBounds);
      }
      layerInfo.children = traverse(subGroupLayers);
      console.log("PROGRESS: " + ((count / fakeLayerGroups.length) * 100));
      return layerInfo;
    });
  };
  rootLayerGroups = _(fakeLayerGroups).filter(function(layer) {
    return layer.getParent() instanceof FakeDocument;
  });
  layerInfo = traverse(rootLayerGroups);
  console.log("" + changedCount + " views changed");
  writeTemplate("index.html", "" + CONFIG.path + "/index.html", function(data) {
    data = data.replace("{{ views }}", "<script src=\"framer/views." + CONFIG.docName + ".js\"></script>");
    data = data.replace("{{ title }}", CONFIG.docName);
    return data;
  });
  writeTemplate("app.js", "" + CONFIG.path + "/app.js", function(data) {
    return data.replace("{{ document }}", CONFIG.docName);
  });
  writeTemplate("framer.js", "" + CONFIG.framerPath + "/framer.js");
  writeTemplate("framerps.js", "" + CONFIG.framerPath + "/framerps.js");
  layerInfoData = layerInfoDataTemplate + JSON.stringify(layerInfo, null, "\t");
  writeFile(CONFIG.viewInfoPath, layerInfoData);
  console.log("\nSUCCESS: " + (File.decode(CONFIG.path)));
  return File.decode(CONFIG.path);
};

main();
