(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // CMD
        module.exports = factory();
    } else {
        //root is window
        try {
            if (!(localStorageName in window)) {
                root.localStorage = factory();
            };
            return;
        } catch (e) {}
    }
}(this, function() {

    var localStorage = {},
        win = window,
        doc = win.document,
        localStorageName = 'localStorage',
        scriptTag = 'script',
        storage

    localStorage.disabled = false;
    localStorage.setItem = function(key, value) {}
    localStorage.getItem = function(key, defaultVal) {}
    localStorage.hasItem = function(key) {
        return localStorage.getItem(key) !== undefined
    }
    localStorage.remove = function(key) {}
    localStorage.clear = function() {}
    localStorage.transact = function(key, defaultVal, transactionFn) {
        if (transactionFn == null) {
            transactionFn = defaultVal
            defaultVal = null
        }
        if (defaultVal == null) {
            defaultVal = {}
        }
        var val = localStorage.getItem(key, defaultVal);
        transactionFn(val)
        localStorage.setItem(key, val)
    }
    localStorage.getAll = function() {}
    localStorage.forEach = function() {}

    localStorage.serialize = function(value) {
        return JSON.stringify(value)
    }
    localStorage.deserialize = function(value) {
        if (typeof value != 'string') {
            return undefined
        }
        try {
            return JSON.parse(value)
        } catch (e) {
            return value || undefined
        }
    }

    function isLocalStorageNameSupported() {
        try {
            return (localStorageName in win && win[localStorageName])
        } catch (err) {
            return false
        }
    }

    if (isLocalStorageNameSupported()) {
        storage = win[localStorageName];
        localStorage.setItem = function(key, val) {
            if (val === undefined) {
                return localStorage.remove(key);
            }
            storage.setItem(key, localStorage.serialize(val));
            return val;
        };
        localStorage.getItem = function(key, defaultVal) {
            var val = localStorage.deserialize(storage.getItem(key))
            return (val === undefined ? defaultVal : val);
        };
        localStorage.remove = function(key) {
            storage.removeItem(key);
        };
        localStorage.clear = function() {
            storage.clear();
        };
        localStorage.getAll = function() {
            var ret = {};
            localStorage.forEach(function(key, val) {
                ret[key] = val;
            })
            return ret;
        };
        localStorage.forEach = function(callback) {
            for (var i = 0; i < storage.length; i++) {
                var key = storage.key(i);
                callback(key, localStorage.getItem(key));
            }
        };
    } else if (doc.documentElement.addBehavior) {
        var storageOwner, storageContainer;
        try {
            storageContainer = new ActiveXObject('htmlfile');
            storageContainer.open();
            storageContainer.write('<' + scriptTag + '>document.w=window</' + scriptTag + '><iframe src="favicon.ico"></iframe>');
            storageContainer.close();
            storageOwner = storageContainer.w.frames[0].document;
            storage = storageOwner.createElement('div');
        } catch (e) {
            storage = doc.createElement('div');
            storageOwner = doc.body;
        }
        var withIEStorage = function(storeFunction) {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0);
                args.unshift(storage);
                storageOwner.appendChild(storage);
                storage.addBehavior('#default#userData');
                storage.load(localStorageName);
                var result = storeFunction.apply(localStorage, args);
                storageOwner.removeChild(storage);
                return result;
            }
        }

        var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g");
        var ieKeyFix = function(key) {
            return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___');
        }
        localStorage.setItem = withIEStorage(function(storage, key, val) {
            key = ieKeyFix(key);
            if (val === undefined) {
                return localStorage.remove(key);
            }
            storage.setAttribute(key, localStorage.serialize(val));
            storage.save(localStorageName);
            return val;
        })
        localStorage.getItem = withIEStorage(function(storage, key, defaultVal) {
            key = ieKeyFix(key);
            var val = localStorage.deserialize(storage.getAttribute(key));
            return (val === undefined ? defaultVal : val);
        })
        localStorage.remove = withIEStorage(function(storage, key) {
            key = ieKeyFix(key);
            storage.removeAttribute(key);
            storage.save(localStorageName);
        })
        localStorage.clear = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes;
            storage.load(localStorageName);
            while (attributes.length) {
                storage.removeAttribute(attributes[0].name);
            }
            storage.save(localStorageName);
        })
        localStorage.getAll = function(storage) {
            var ret = {}
            localStorage.forEach(function(key, val) {
                ret[key] = val;
            })
            return ret;
        }
        localStorage.forEach = withIEStorage(function(storage, callback) {
            var attributes = storage.XMLDocument.documentElement.attributes;
            for (var i = 0, attr; attr = attributes[i]; ++i) {
                callback(attr.name, localStorage.deserialize(storage.getAttribute(attr.name)));
            };
        })
    }

    try {
        var testKey = '__localStorage__'
        localStorage.setItem(testKey, testKey);
        if (localStorage.getItem(testKey) != testKey) {
            localStorage.disabled = true;
        }
        localStorage.remove(testKey)
    } catch (e) {
        localStorage.disabled = true;
    }
    localStorage.enabled = !localStorage.disabled;

    return localStorage;
}));