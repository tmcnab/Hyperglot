app.language = (function (self) 
{
	var DEFAULT_TEXT = "";
	var editor = null;

	self.currentAST = null;

	function onChange () {
		var text = editor.getSession().getValue();
		localStorage.setItem('app.language.text', text);
		parse();
	}

	self.parse = function () {
		var text = editor.getSession().getValue();
		
		try {
			self.currentAST = app.grammar.parser.parse(text);
			app.nav.info('[Parser] AST generated.');
			try {
				app.generated.setAST(self.currentAST);
			} 
			catch (ex) {
				app.generated.setAST(self.currentAST);
			}
		} 
		catch (ex) {
			app.nav.error('[Parser] ' + ex.message);
		}
	}

	self.init = function() {
		editor = ace.edit("inputEditor");
		editor.setTheme(app.settings.aceTheme());

		var session = editor.getSession();
		session.setValue(localStorage.getItem('app.language.text') || DEFAULT_TEXT);
		session.on('change', onChange);
	};



	self.resize = function () {
		$('#inputEditor').height($(window).height() - 60);
	};

	return self;	
})(app.language || {});