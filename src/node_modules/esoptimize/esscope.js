(function() {
  'use strict';

  var estraverse = typeof window !== 'undefined' ? window.estraverse : require('estraverse');
  var esscope = typeof window !== 'undefined' ? (window.esscope = {}) : exports;

  function assert(truth) {
    if (!truth) {
      throw new Error('assertion failed');
    }
  }

  function Variable(name, scope) {
    this.name = name;
    this.scope = scope;
    this.references = [];
  }

  Variable.prototype.referenceForNode = function(node) {
    for (var i = 0; i < this.references.length; i++) {
      if (this.references[i].node === node) return this.references[i];
    }
    return null;
  };

  Variable.prototype.isGlobal = function() {
    return this.scope.parentScope === null;
  };

  Variable.prototype.isVariable = function() {
    return this.references.some(function(reference) {
      var decl = reference.declarationNode;
      return decl !== null && decl.type === 'VariableDeclarator';
    });
  };

  Variable.prototype.isArgument = function() {
    return this.references.some(function(reference) {
      var decl = reference.declarationNode;
      return decl !== null && (decl.type === 'FunctionExpression' ||
        decl.type === 'FunctionDeclaration') && decl.params.indexOf(reference.node) >= 0;
    });
  };

  Variable.prototype.isCaptured = function() {
    return this.references.some(function(reference) {
      return reference.scope !== this.scope;
    }, this);
  };

  Variable.prototype.isReadFrom = function() {
    return this.references.some(function(reference) {
      return reference.isRead;
    });
  };

  Variable.prototype.isWrittenTo = function() {
    return this.references.some(function(reference) {
      return reference.isWrite;
    });
  };

  function Reference(node, scope) {
    this.node = node;
    this.scope = scope;
    this.variable = null;
    this.isRead = false;
    this.isWrite = false;
    this.declarationNode = null;
  }

  function Scope(parentScope, node) {
    this.parentScope = parentScope;
    this.childScopes = [];
    this.node = node;
    this.variables = [];
  }

  function variableForName(scope, name) {
    for (var i = 0; i < scope.variables.length; i++) {
      if (scope.variables[i].name === name) return scope.variables[i];
    }
    return null;
  }

  Scope.prototype.childScopeForNode = function(node) {
    for (var i = 0; i < this.childScopes.length; i++) {
      if (this.childScopes[i].node === node) {
        return this.childScopes[i];
      }
    }
    return null;
  };

  Scope.prototype.variableForName = function(name) {
    for (var scope = this; scope !== null; scope = scope.parentScope) {
      var variable = variableForName(scope, name);
      if (variable !== null) return variable;
    }
    return null;
  };

  Scope.prototype.define = function(name) {
    var variable = variableForName(this, name);
    if (variable === null) {
      variable = new Variable(name, this);
      this.variables.push(variable);
    }
    return variable;
  };

  function Resolver(parentResolver, node) {
    var parentScope = parentResolver !== null ? parentResolver.scope : null;
    this.parentResolver = parentResolver;
    this.scope = new Scope(parentScope, node);
    this.references = [];
    if (parentScope !== null) parentScope.childScopes.push(this.scope);
  }

  Resolver.prototype.close = function() {
    var globalScope = this.scope;
    while (globalScope.parentScope !== null) {
      globalScope = globalScope.parentScope;
    }
    for (var i = 0; i < this.references.length; i++) {
      var reference = this.references[i];
      reference.variable = this.scope.variableForName(reference.node.name);
      if (reference.variable === null) reference.variable = globalScope.define(reference.node.name);
      reference.variable.references.push(reference);
    }
  };

  Resolver.prototype.recordReference = function(node) {
    var reference = new Reference(node, this.scope);
    this.references.push(reference);
    return reference;
  };

  function nodeStartsNewScope(node) {
    return node.type === 'Program' || node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
  }

  function analyze(node) {
    var currentResolver = null;
    var parentStack = [];
    var parent = null;

    function enter(node) {
      if (node.type === 'VariableDeclarator' || node.type === 'FunctionDeclaration') {
        currentResolver.scope.define(node.id.name);
      }
    }

    function leave(node) {
      if (node.type === 'Identifier') {
        var reference = currentResolver.recordReference(node);

        if (parent.type === 'VariableDeclarator') {
          reference.isWrite = parent.init !== null;
          reference.declarationNode = parent;
        }

        else if (parent.type === 'FunctionExpression' || parent.type === 'FunctionDeclaration') {
          reference.isWrite = true;
          reference.declarationNode = parent;
        }

        else if (parent.type === 'AssignmentExpression' && parent.left === node) {
          reference.isWrite = true;

          if (parent.operator !== '=') {
            reference.isRead = true;
          }
        }

        else {
          reference.isRead = true;
        }
      }

      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        for (var i = 0; i < node.params.length; i++) {
          currentResolver.scope.define(node.params[i].name);
        }
      }
    }

    estraverse.traverse(node, {
      enter: function(node) {
        enter(node);
        if (nodeStartsNewScope(node)) {
          currentResolver = new Resolver(currentResolver, node);
        }
        parentStack.push(parent);
        parent = node;
      },

      leave: function(node) {
        parent = parentStack.pop();
        leave(node);
        if (nodeStartsNewScope(node)) {
          currentResolver.close();
          if (currentResolver.parentResolver !== null) {
            currentResolver = currentResolver.parentResolver;
          }
        }
      }
    });

    return currentResolver.scope;
  }

  esscope.Variable = Variable;
  esscope.Reference = Reference;
  esscope.Scope = Scope;
  esscope.nodeStartsNewScope = nodeStartsNewScope;
  esscope.analyze = analyze;

}.call(this));
