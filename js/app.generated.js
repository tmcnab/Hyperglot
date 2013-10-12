app.generated = (function (self) 
{
	var leftPaneSelector = '#outputPaneLeft';
	var rightPaneSelector = '#outputPaneRight';
	var escodegen = require('escodegen');

	self.setAST = function (ast) {
		$(leftPaneSelector).html(jsonTree.create(ast));
		self.generateJS(ast);
	};

	self.generateJS = function (ast) {
		try {
			$(rightPaneSelector).text(escodegen.generate(ast));
			app.nav.info('Escodegen: success')
		}
		catch (ex) {
			var msg = 'Escodegen ' + ex;
			$(rightPaneSelector).text(msg);
			app.nav.error(msg);
		}
	};

	return self;	
})(app.generated || {});