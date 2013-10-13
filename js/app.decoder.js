app.decoder = (function (self) 
{
	var esprima = require('esprima');	
	var jsEditor = null;
	var astEditor = null;

	var jsEditorChange = function () {
		try {
			var text = jsEditor.getSession().getValue();
			var tree = esprima.parse(text);
			astEditor.getSession().setValue(
				JSON.stringify(tree, null, 2)
			);
			app.nav.info('[Esprima] AST Generated.')
		}
		catch (ex) 
		{
			app.nav.error('[Esprima] ' + ex);
		}
	};

	self.init = function () 
	{
		var session = null;

		// Setup LHS Editor (Javascript)
		jsEditor = ace.edit('decoderPaneLeft');
		jsEditor.setTheme(app.settings.aceTheme());
		session = jsEditor.getSession();
		session.setMode("ace/mode/javascript");
		session.setUseWorker(false);
		session.on('change', jsEditorChange);


		// Setup RHS Viewer (JSON)
		astEditor = ace.edit('decoderPaneRight');
		astEditor.setTheme(app.settings.aceTheme());
		astEditor.setHighlightActiveLine(false);
		astEditor.setReadOnly(true);
		session = astEditor.getSession();
		session.setMode("ace/mode/json");				// Output of Esprima is JSON-format AST
		session.setUseWorker(false);					// Don't need error reporting
	};

	self.resize = function () {
		var height = $(window).height() - 60;
		$('#decoderPaneLeft').height(height);
		$('#decoderPaneRight').height(height);
	};

	return self;
})(app.decoder ||{});