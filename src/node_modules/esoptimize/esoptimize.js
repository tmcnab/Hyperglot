(function() {
  'use strict';

  var esscope = typeof window !== 'undefined' ? window.esscope : require('./esscope');
  var estraverse = typeof window !== 'undefined' ? window.estraverse : require('estraverse');
  var esoptimize = typeof window !== 'undefined' ? (window.esoptimize = {}) : exports;

  var isValidIdentifier = new RegExp('^(?!(?:' + [
    'do',
    'if',
    'in',
    'for',
    'let',
    'new',
    'try',
    'var',
    'case',
    'else',
    'enum',
    'eval',
    'false',
    'null',
    'this',
    'true',
    'void',
    'with',
    'break',
    'catch',
    'class',
    'const',
    'super',
    'throw',
    'while',
    'yield',
    'delete',
    'export',
    'import',
    'public',
    'return',
    'static',
    'switch',
    'typeof',
    'default',
    'extends',
    'finally',
    'package',
    'private',
    'continue',
    'debugger',
    'function',
    'arguments',
    'interface',
    'protected',
    'implements',
    'instanceof'
  ].join('|') + ')$)[$A-Z_a-z][$A-Z_a-z0-9]*$');

  var oppositeOperator = {
    '&&': '||',
    '||': '&&',
    '<': '>=',
    '>': '<=',
    '<=': '>',
    '>=': '<',
    '==': '!=',
    '!=': '==',
    '!==': '===',
    '===': '!=='
  };

  var parent = null;
  var scope = null;

  function assert(truth) {
    if (!truth) {
      throw new Error('assertion failed');
    }
  }

  function hasSideEffects(node) {
    if (node.type === 'Literal' || node.type === 'Identifier' || node.type === 'FunctionExpression') {
      return false;
    }

    if (node.type === 'MemberExpression') {
      return hasSideEffects(node.object) || hasSideEffects(node.property);
    }

    if (node.type === 'SequenceExpression') {
      return node.expressions.some(hasSideEffects);
    }

    if (node.type === 'ArrayExpression') {
      return node.elements.some(hasSideEffects);
    }

    if (node.type === 'ObjectExpression') {
      return node.properties.some(function(property) {
        return hasSideEffects(property.value);
      });
    }

    return true;
  }

  function declareScopeVariables() {
    var variables = scope.variables;
    var node = scope.node;

    variables = variables.filter(function(variable) {
      return variable.isVariable() && !variable.isArgument();
    });

    if (variables.length === 0) {
      return {
        type: 'EmptyStatement'
      };
    }

    return {
      type: 'VariableDeclaration',
      declarations: variables.map(function(variable) {
        return {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: variable.name
          },
          init: null
        };
      }),
      kind: 'var'
    };
  }

  function normalize(node) {
    return estraverse.replace(node, wrapVisitorScope({
      leave: function(node) {
        // Hoist global variables
        if (node.type === 'Program') {
          return {
            type: 'Program',
            body: [declareScopeVariables()].concat(node.body)
          };
        }

        // Hoist local variables
        if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
          return {
            type: node.type,
            id: node.id,
            params: node.params,
            defaults: node.defaults,
            body: {
              type: 'BlockStatement',
              body: [declareScopeVariables()].concat(node.body.body)
            },
            rest: node.rest,
            generator: node.generator,
            expression: node.expression
          };
        }

        if (node.type === 'Property') {
          assert(node.key.type === 'Literal' || node.key.type === 'Identifier');
          return {
            type: 'Property',
            key: {
              type: 'Literal',
              value: node.key.type === 'Literal' ? node.key.value + '' : node.key.name
            },
            value: node.value,
            kind: node.kind
          };
        }

        if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
          return {
            type: 'MemberExpression',
            computed: true,
            object: node.object,
            property: {
              type: 'Literal',
              value: node.property.name
            }
          };
        }

        if (node.type === 'VariableDeclaration') {
          var expressions = node.declarations.filter(function(node) {
            return node.init !== null;
          }).map(function(node) {
            return {
              type: 'AssignmentExpression',
              operator: '=',
              left: node.id,
              right: node.init
            }
          });

          if (expressions.length === 0) {
            return {
              type: 'EmptyStatement'
            };
          }

          return {
            type: 'ExpressionStatement',
            expression: {
              type: 'SequenceExpression',
              expressions: expressions
            }
          };
        }

        if (node.type === 'ForStatement' && node.init !== null) {
          return {
            type: 'ForStatement',
            init:
              node.init.type === 'EmptyStatement' ? null :
              node.init.type === 'ExpressionStatement' ? node.init.expression :
              node.init,
            test: node.test,
            update: node.update,
            body: node.body
          };
        }
      }
    }));
  }

  function denormalize(node) {
    return estraverse.replace(node, {
      leave: function(node) {
        if (node.type === 'Literal') {
          if (node.value === void 0) {
            return {
              type: 'UnaryExpression',
              operator: 'void',
              argument: {
                type: 'Literal',
                value: 0
              }
            };
          }

          if (typeof node.value === 'number') {
            if (isNaN(node.value)) {
              return {
                type: 'BinaryExpression',
                operator: '/',
                left: {
                  type: 'Literal',
                  value: 0
                },
                right: {
                  type: 'Literal',
                  value: 0
                }
              }
            }

            if (!isFinite(node.value)) {
              return {
                type: 'BinaryExpression',
                operator: '/',
                left: node.value < 0 ? {
                  type: 'UnaryExpression',
                  operator: '-',
                  argument: {
                    type: 'Literal',
                    value: 1
                  }
                } : {
                  type: 'Literal',
                  value: 1
                },
                right: {
                  type: 'Literal',
                  value: 0
                }
              }
            }

            if (node.value < 0) {
              return {
                type: 'UnaryExpression',
                operator: '-',
                argument: {
                  type: 'Literal',
                  value: -node.value
                }
              };
            }

            if (node.value === 0 && 1 / node.value < 0) {
              return {
                type: 'Literal',
                value: 0
              };
            }
          }
        }

        if (node.type === 'Property') {
          var key = node.key;
          assert(key.type === 'Literal');
          if (isValidIdentifier.test(key.value)) {
            key = {
              type: 'Identifier',
              name: key.value
            };
          }
          return {
            type: 'Property',
            key: key,
            value: node.value,
            kind: node.kind
          };
        }

        if (node.type === 'MemberExpression' && node.computed && node.property.type === 'Literal' && isValidIdentifier.test(node.property.value)) {
          return {
            type: 'MemberExpression',
            computed: false,
            object: node.object,
            property: {
              type: 'Identifier',
              name: node.property.value
            }
          };
        }
      }
    });
  }

  function foldConstants(node) {
    return estraverse.replace(node, {
      enter: function(node) {
        if (node.type === 'UnaryExpression' && node.operator === '!') {
          if (node.argument.type === 'BinaryExpression' && node.argument.operator in oppositeOperator) {
            return {
              type: 'BinaryExpression',
              operator: oppositeOperator[node.argument.operator],
              left: node.argument.left,
              right: node.argument.right
            };
          }

          if (node.argument.type === 'LogicalExpression' && node.argument.operator in oppositeOperator) {
            return {
              type: 'LogicalExpression',
              operator: oppositeOperator[node.argument.operator],
              left: {
                type: 'UnaryExpression',
                operator: '!',
                argument: node.argument.left
              },
              right: {
                type: 'UnaryExpression',
                operator: '!',
                argument: node.argument.right
              }
            };
          }
        }
      },

      leave: function(node) {
        if (node.type === 'SequenceExpression') {
          var expressions = node.expressions;

          expressions = Array.prototype.concat.apply([], expressions.map(function(node) {
            return node.type === 'SequenceExpression' ? node.expressions : node;
          }));

          expressions = expressions.slice(0, -1).filter(hasSideEffects).concat(expressions.slice(-1));

          if (expressions.length > 1) {
            return {
              type: 'SequenceExpression',
              expressions: expressions
            };
          }

          return expressions[0];
        }

        if (node.type === 'UnaryExpression' && node.argument.type === 'Literal') {
          var operator = new Function('a', 'return ' + node.operator + ' a;');
          return {
            type: 'Literal',
            value: operator(node.argument.value)
          }
        }

        if ((node.type === 'BinaryExpression' || node.type === 'LogicalExpression') && node.left.type === 'Literal' && node.right.type === 'Literal') {
          var operator = new Function('a', 'b', 'return a ' + node.operator + ' b;');
          return {
            type: 'Literal',
            value: operator(node.left.value, node.right.value)
          };
        }

        if (node.type === 'ConditionalExpression' && node.test.type === 'Literal') {
          return node.test.value ? node.consequent : node.alternate;
        }

        if (node.type === 'MemberExpression' && node.property.type === 'Literal' && !hasSideEffects(node.object)) {
          assert(node.computed);

          if (node.object.type === 'ObjectExpression') {
            for (var i = 0; i < node.object.properties.length; i++) {
              var property = node.object.properties[i];
              assert(property.key.type === 'Literal' && typeof property.key.value === 'string');
              if (property.key.value === node.property.value + '') {
                return property.value;
              }
            }
          }

          if (node.object.type === 'Literal' && typeof node.object.value === 'string') {
            if (node.property.value === 'length') {
              return {
                type: 'Literal',
                value: node.object.value.length
              };
            }

            if (typeof node.property.value === 'number') {
              // Check for a match inside the string literal
              var index = node.property.value >>> 0;
              if (index === +node.property.value && index < node.object.value.length) {
                return {
                  type: 'Literal',
                  value: node.object.value[index]
                };
              }

              // Optimize to an empty string literal (may still be a numeric property on String.prototype)
              return {
                type: 'MemberExpression',
                computed: true,
                object: {
                  type: 'Literal',
                  value: ''
                },
                property: node.property
              }
            }
          }

          if (node.object.type === 'ArrayExpression') {
            if (node.property.value === 'length') {
              return {
                type: 'Literal',
                value: node.object.elements.length
              };
            }

            if (typeof node.property.value === 'number') {
              // Check for a match inside the array literal
              var index = node.property.value >>> 0;
              if (index === +node.property.value && index < node.object.elements.length) {
                return node.object.elements[index];
              }

              // Optimize to an empty array literal (may still be a numeric property on Array.prototype)
              return {
                type: 'MemberExpression',
                computed: true,
                object: {
                  type: 'ArrayExpression',
                  elements: []
                },
                property: node.property
              }
            }
          }
        }
      }
    });
  }

  function filterDeadCode(nodes) {
    return nodes.filter(function(node) {
      if (node.type === 'EmptyStatement') {
        return false;
      }

      if (node.type === 'VariableDeclaration' && node.declarations.length === 0) {
        return false;
      }

      // Users won't like it if we remove 'use strict' directives
      if (node.type === 'ExpressionStatement' && !hasSideEffects(node.expression) &&
          (node.expression.type !== 'Literal' || node.expression.value !== 'use strict')) {
        return false;
      }

      return true;
    });
  }

  function flattenNodeList(nodes) {
    return Array.prototype.concat.apply([], nodes.map(function(node) {
      if (node.type === 'BlockStatement') {
        return node.body;
      }

      if (node.type === 'ExpressionStatement' && node.expression.type === 'SequenceExpression') {
        return flattenNodeList(node.expression.expressions).map(function(node) {
          return {
            type: 'ExpressionStatement',
            expression: node
          }
        });
      }

      if (node.type === 'SequenceExpression') {
        return flattenNodeList(node.expressions);
      }

      return node;
    }));
  }

  function hoistUseStrict(nodes) {
    var useStrict = false;

    nodes = nodes.filter(function(node) {
      if (node.type === 'ExpressionStatement' && node.expression.type === 'Literal' && node.expression.value === 'use strict') {
        useStrict = true;
        return false;
      }
      return true;
    });

    if (useStrict) {
      return [{
        type: 'ExpressionStatement',
        expression: {
          type: 'Literal',
          value: 'use strict'
        }
      }].concat(nodes);
    }

    return nodes;
  }

  function canRemoveVariable(name) {
    var variable = scope.variableForName(name);
    assert(variable !== null);
    return !variable.isGlobal() && !variable.isArgument() && (!variable.isReadFrom() || !variable.isWrittenTo());
  }

  function removeDeadCode(node) {
    return estraverse.replace(node, wrapVisitorScope(wrapVisitorParent({
      leave: function(node) {
        if (node.type === 'Program') {
          return {
            type: 'Program',
            body: hoistUseStrict(flattenNodeList(filterDeadCode(node.body)))
          };
        }

        if (node.type === 'BlockStatement') {
          var body = hoistUseStrict(flattenNodeList(filterDeadCode(node.body)));

          if (parent === null || (parent.type !== 'FunctionExpression' && parent.type !== 'FunctionDeclaration' &&
              parent.type !== 'TryStatement' && parent.type !== 'CatchClause')) {
            if (body.length === 0) {
              return {
                type: 'EmptyStatement'
              };
            }

            if (body.length === 1) {
              return body[0];
            }
          }

          return {
            type: 'BlockStatement',
            body: body
          };
        }

        if (node.type === 'ForStatement') {
          if (node.test !== null && node.test.type === 'Literal' && !node.test.value) {
            if (node.init === null) {
              return {
                type: 'EmptyStatement'
              };
            }

            if (node.init.type === 'VariableDeclaration') {
              return node.init;
            }

            return {
              type: 'ExpressionStatement',
              expression: node.init
            };
          }
        }

        if (node.type === 'TryStatement') {
          var handler = node.handlers.length === 1 ? node.handlers[0] : null;
          var finalizer = node.finalizer;
          assert(node.handlers.length < 2);

          if (node.block.body.length === 0) {
            return {
              type: 'EmptyStatement'
            };
          }

          if (handler !== null && handler.body.body.length === 0) {
            handler = null;
          }

          if (finalizer !== null && finalizer.body.length === 0) {
            finalizer = null;
          }

          if (handler === null && finalizer === null) {
            return node.block;
          }

          return {
            type: 'TryStatement',
            block: node.block,
            guardedHandlers: [],
            handlers: handler !== null ? [handler] : [],
            finalizer: finalizer
          };
        }

        if (node.type === 'SwitchStatement' && (!node.cases || node.cases.length === 0)) {
          return {
            type: 'ExpressionStatement',
            expression: node.discriminant
          };
        }

        if (node.type === 'ReturnStatement' && node.argument !== null && node.argument.type === 'Literal' && node.argument.value === void 0) {
          return {
            type: 'ReturnStatement',
            argument: null
          };
        }

        if (node.type === 'WhileStatement') {
          if (node.test.type === 'Literal' && !node.test.value) {
            return {
              type: 'EmptyStatement'
            };
          }
        }

        if (node.type === 'DoWhileStatement') {
          if (node.test.type === 'Literal' && !node.test.value) {
            return node.body;
          }
        }

        if (node.type === 'WithStatement') {
          if (node.body.type === 'EmptyStatement') {
            return {
              type: 'ExpressionStatement',
              expression: node.object
            };
          }
        }

        if (node.type === 'IfStatement') {
          if (node.test.type === 'Literal') {
            return node.test.value ? node.consequent : node.alternate || {
              type: 'EmptyStatement'
            };
          }

          if (node.consequent.type === 'EmptyStatement' && (node.alternate === null || node.alternate.type === 'EmptyStatement')) {
            return {
              type: 'ExpressionStatement',
              expression: node.test
            };
          }

          if (node.alternate !== null && node.alternate.type === 'EmptyStatement') {
            return {
              type: 'IfStatement',
              test: node.test,
              consequent: node.consequent,
              alternate: null
            };
          }
        }

        if (node.type === 'Identifier' && canRemoveVariable(node.name)) {
          var variable = scope.variableForName(node.name);
          assert(variable !== null);
          if (variable.referenceForNode(node).isRead) {
            return {
              type: 'Literal',
              value: void 0
            };
          }
        }

        if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier' && canRemoveVariable(node.left.name)) {
          return node.right;
        }

        if (node.type === 'FunctionDeclaration' && canRemoveVariable(node.id.name)) {
          return {
            type: 'EmptyStatement'
          };
        }

        if (node.type === 'VariableDeclaration') {
          return {
            type: 'VariableDeclaration',
            declarations: node.declarations.filter(function(node) {
              return !canRemoveVariable(node.id.name);
            }),
            kind: node.kind
          };
        }
      }
    })));
  }

  function wrapVisitorParent(visitor) {
    var parentStack = [];
    return {
      enter: function(node) {
        if (visitor.enter) node = visitor.enter(node) || node;
        parentStack.push(parent);
        parent = node;
        return node;
      },

      leave: function(node) {
        parent = parentStack.pop();
        if (visitor.leave) node = visitor.leave(node) || node;
        return node;
      }
    };
  }

  function wrapVisitorScope(visitor) {
    scope = null;
    return {
      enter: function(node) {
        if (esscope.nodeStartsNewScope(node)) {
          scope = scope === null ? esscope.analyze(node) : scope.childScopeForNode(node);
          assert(scope !== null);
        }
        if (visitor.enter) node = visitor.enter(node) || node;
        return node;
      },

      leave: function(node) {
        if (visitor.leave) node = visitor.leave(node) || node;
        if (esscope.nodeStartsNewScope(node)) scope = scope.parentScope;
        return node;
      }
    };
  }

  function optimize(node) {
    node = normalize(node);
    node = foldConstants(node);
    node = removeDeadCode(node);
    node = denormalize(node);
    return node;
  }

  esoptimize.optimize = optimize;

}.call(this));
