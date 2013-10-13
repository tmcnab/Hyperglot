app.generated = (function (self) 
{
	var leftPaneSelector = '#outputPaneLeft';
	var rightPaneSelector = '#outputPaneRight';
	var escodegen = require('escodegen');

	var codegenEditor = null;

	self.setAST = function (ast) {
		$(leftPaneSelector).html(jsonTree.create(ast));
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
		codegenEditor = ace.edit('outputPaneRight');
		codegenEditor.setReadOnly(true);
		codegenEditor.setTheme("ace/theme/tomorrow_night_bright");

		var session = codegenEditor.getSession();
		session.setMode("ace/mode/javascript");
		session.setUseWorker(false);
	};

	self.resize = function () {
		$(rightPaneSelector).height($(window).height() - 60);
	};

	return self;	
})(app.generated || {});