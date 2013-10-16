# Esoptimize

Esoptimize is a JavaScript optimizer that is designed to work well with [esprima](http://github.com/Constellation/esprima) and [escodegen](http://github.com/Constellation/escodegen).

### Usage

Esoptimize can be installed using `npm install esoptimize` and used by calling `esoptimize.optimize(ast)` where `ast` is a JavaScript abstract syntax tree that conforms to the [SpiderMonkey Parser API](https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API) format.

### Features

* Constant propagation
* Dead code elimination
