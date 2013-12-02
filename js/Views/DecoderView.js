(function () {
	"use strict";

	var esprima = require('esprima');

	var leftEditor = null,
	   rightEditor = null;

	function init () {
		Menu.title('JS → AST');

		leftEditor = CodeMirror($('.-decoder-input-editor')[0], {
			autofocus: true,
			lineNumbers: true
		});

		rightEditor = CodeMirror($('.-decoder-output-editor')[0], {
			lineNumbers: true,
			readOnly: true
		});
	}


	init();
})();