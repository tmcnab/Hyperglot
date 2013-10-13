app.generated = (function (self) 
{
	var leftPaneSelector = '#outputPaneLeft';
	var rightPaneSelector = '#outputPaneRight';
	var escodegen = require('escodegen');
	var codegenEditor = null;
	var astEditor = null;


	self.setAST = function (ast) {
		astEditor.getSession().setValue(JSON.stringify(ast, null, '  '));
		self.generateJS(ast);
	};

	self.generateJS = function (ast) {
		try {
			codegenEditor.getSession().setValue(escodegen.generate(ast));
			app.nav.info('[Escodegen] successfully compiled AST.')
		}
		catch (ex) {
			codegenEditor.getSession().setValue('');
			app.nav.error('[Escodegen] ' + ex);
		}
	};

	self.init = function () {
		var session = null;

		// The AST of the generated language source
		astEditor = ace.edit('outputPaneLeft');
		astEditor.setReadOnly(true);
		astEditor.setTheme(app.settings.aceTheme());
		session = astEditor.getSession();
		session.setMode("ace/mode/json");
		session.setUseWorker(false);

		// The generated JS source from the AST
		codegenEditor = ace.edit('outputPaneRight');
		codegenEditor.setReadOnly(true);
		codegenEditor.setTheme(app.settings.aceTheme());
		session = codegenEditor.getSession();
		session.setMode("ace/mode/javascript");
		session.setUseWorker(false);
	};

	self.resize = function () {
		var height = $(window).height() - app.settings.heightOffset();
		$(leftPaneSelector).height(height);
		$(rightPaneSelector).height(height);
	};

	return self;	
})(app.generated || {});