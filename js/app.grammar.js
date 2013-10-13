app.grammar = (function (self) 
{
	var DEFAULT_TEXT = "Program\n  = \n  { return ast.Program([]) }\n";

	var editor = null;
	self.parser = null;

	function onChange() {
		// Grab the text from the editor and save it into localstorage
		var text = editor.getSession().getValue();
		localStorage.setItem('app.grammar.text', text);
		buildParser();
	}

	function buildParser() {
		var input = localStorage.getItem('app.grammar.text') || "";
		try {
			var preamble = "{\n var ast = require('ast-types').builders;\n}\n";
			var opts = {
 							 cache: self.options.cache(),
				trackLineAndColumn: self.options.trackLineAndColumn()
			};

			self.parser = PEG.buildParser(preamble + input, opts);
			app.nav.info('PEG: parser constructed.')
		}
		catch (ex) {
			self.parser = null;
			app.nav.error('PEG: ' + ex.message);
		}
	}

	self.init = function() {
		editor = ace.edit('grammarEditor');
		editor.setTheme("ace/theme/tomorrow_night_bright");

		var session = editor.getSession();
		session.setMode("ace/mode/javascript");
		session.setUseWorker(false);
		session.setValue(localStorage.getItem('app.grammar.text') || DEFAULT_TEXT);
		session.on('change', onChange);
		buildParser();
	};

	self.resize = function () {
		$('#grammarEditor').height($(window).height() - 60);
	};


	self.options = {};
	self.options.trackLineAndColumn = function (bool) {
		if (bool) {
			localStorage.setItem('app.grammar.trackLineAndColumn', bool);
		}

		return localStorage.getItem('app.grammar.trackLineAndColumn') || false;
	};

	self.options.cache = function (bool) {
		if (bool) {
			localStorage.setItem('app.grammar.cache', bool);
		}

		return localStorage.getItem('app.grammar.cache') || false;
	};

	return self;
})(app.grammar || {});