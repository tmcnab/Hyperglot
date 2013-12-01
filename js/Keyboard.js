(function () {
	var initKbdCommands = function() {
		var kbdsc = [
			{ sel: '.-tool-peg', mac: '⌘+1',   win: '^+1'   },
			{ sel: '.-tool-jsd', mac: '⌘+2',   win: '^+2'   },
			{ sel: '.-docs-hgc', mac: '⌘+D+1', win: '^+D+1' },
			{ sel: '.-docs-pjs', mac: '⌘+D+2', win: '^+D+2' },
			{ sel: '.-docs-ast', mac: '⌘+D+3', win: '^+D+3' }
		];

		$.each(kbdsc, function (i, item) {
			$(item.sel).text(item.mac);
		});
	};

	initKbdCommands();
})();
