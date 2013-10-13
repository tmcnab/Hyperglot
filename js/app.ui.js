app.ui = (function (self) 
{

	function initTabs() {
		$('a[data-toggle="tab"]').click(function (e) {
			e.preventDefault();
			$(this).tab('show');
		});
	}

	function onResize() {
		app.grammar.resize();
		app.language.resize();
		app.generated.resize();
	}

	self.init = function () {
		initTabs();

		app.grammar.init();
		app.language.init();
		app.generated.init();

		$(window).resize(onResize);
		onResize();
	};

	return self;
})(app.ui || {});