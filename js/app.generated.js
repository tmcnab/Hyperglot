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

	self.generateJS = function (ast) 
	{
		try {
			codegenEditor.getSession().setValue(
				escodegen.generate(ast)
			);
			app.nav.info('Escodegen: successfully compiled AST.')
		}
		catch (ex) {
			codegenEditor.getSession().setValue('');
			app.nav.error('Escodegen ' + ex);
		}
	};

	self.init = function () {
		astEditor = ace.edit('outputPaneLeft');
		codegenEditor = ace.edit('outputPaneRight');
		
		astEditor.setReadOnly(true);
		codegenEditor.setReadOnly(true);

		astEditor.setTheme("ace/theme/tomorrow_night_bright");
		codegenEditor.setTheme("ace/theme/tomorrow_night_bright");

		var session = codegenEditor.getSession();
		session.setMode("ace/mode/javascript");
		session.setUseWorker(false);

		session = astEditor.getSession();
		session.setMode("ace/mode/json");
		session.setUseWorker(false);
	};

	self.resize = function () {
		$(leftPaneSelector).height($(window).height() - 60);
		$(rightPaneSelector).height($(window).height() - 60);
	};

	return self;	
})(app.generated || {});