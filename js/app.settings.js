app.settings = (function (self) 
{
	var fs = require('fs');

	function get (key, defaultValue) {

		if (localStorage.getItem(key) == null && defaultValue != undefined) {
			set(key, defaultValue);
		}

		return localStorage.getItem(key);
	}

	function set (key, value) {
		localStorage.setItem(key, value);
		return localStorage.getItem(key);
	}

	self.aceTheme = function () {
		return get('app.settings.editor.theme', 'ace/theme/tomorrow_night_bright');
	};

	self.heightOffset = function () {
		return 60;
	}

	self.grammarText = function (text) {
		return get('app.grammar.text', '');
	}

	return self;	
})(app.settings || {});