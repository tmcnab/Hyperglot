app.language = (function (self) 
{
	var DEFAULT_TEXT = "";
	var editor = null;

	function onChange () {
		var text = editor.getSession().getValue();
		localStorage.setItem('app.language.text', text);
		parse();
	}

	function parse () {
		var text = editor.getSession().getValue();
		
		try {
			var output = app.grammar.parser.parse(text);
			app.nav.info('Parser: No Errors');
			try {
				$('#outputDisplay').text(JSON.stringify(output, null, '  '));
			} 
			catch (ex) {
				$('#outputDisplay').text(output);
			}
		} 
		catch (ex) {
			app.nav.error('Parser: ' + ex.message);
		}
	}

	self.init = function () {
		editor = ace.edit("inputEditor");
		editor.setTheme("ace/theme/xcode");

		var session = editor.getSession();
		session.setValue(localStorage.getItem('app.language.text') || DEFAULT_TEXT);
		session.on('change', onChange);
	};

	self.resize = function () {
		$('#inputEditor').height($(window).height() - 30);
	};

	return self;	
})(app.language || {});