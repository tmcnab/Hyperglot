(function () {
	"use strict";

	var editor = null;

	function init() {
		Menu.title('Grammar')

		var el = $('.-grammar-editor')[0];
		editor = CodeMirror(el, {
			lineNumbers: true
		});
	}


	init();
})();