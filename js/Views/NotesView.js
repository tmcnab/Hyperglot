(function() {

	try {
		Menu.title('Project Notes');
		Menu.message('');

		var opts = {
			autofocus: true,
			lineNumbers: true
		};

		var cm = CodeMirror(document.getElementById('notesEditor'), opts);
		Menu.close();
	} catch (ex) {
		console.error(ex);
	}
})();