raptor-amd
==========
This modules enabled AMD in the web browser when using RaptorJS 3 by bridging the [RaptorJS 3 CommonJS Module Loader](https://github.com/raptorjs/raptor-modules) with an AMD module loader.

# Overview

When the code for this module is included on the page, a global `require` variable and a global `define` variable are added to the page support AMD. Internally, this module uses a bridge to the RaptorJS CommonJS module loader. This allows an AMD module to be required by a CommonJS module and vice-versa.

# Installation

```
npm install raptor-amd --save
```
# Usage

This module can be enabled on the page by either requiring the module:

```javascript
require('raptor-amd');
```

Alternatively, you can add the following dependency to your page's `optimizer.json`:

```json
{
    "dependencies": [
        "raptor-amd/optimizer.json"
    ]
}
```

If you decide to add the `"raptor-amd/optimizer.json"` dependency to your `optimizer.json` then it is not necessary to `require` the module.

# Example

```javascript
// Define a module named "foo" that exports an object with a name property:
define('foo', function(require, exports, module) {
    exports.name = 'Foo!';
});

// Dependencies can be added to an array or pulled in using require:
define('bar', ['baz'], function(baz, require, exports, module) {
    var foo = require('foo');
    // Do something with foo...
});


// You can also use the global require to load the "foo" module:
var foo = require('foo');
```
