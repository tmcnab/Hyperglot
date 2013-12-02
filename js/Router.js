var Router = (function(self) 
{
	self.open = function(viewName) {
		if (viewName == '') return;			// Riot.js router calls '' on load.

		$('.main-section').load('html/' + viewName + '.html', function() {
			$.getScript('js/Views/' + viewName + '.js', function() {
				Menu.close();
			});
		});
	};


	self.init = function() {
		$.route(function(hash) {
			console.log("Router transitioned to '" + hash + "'.");
			routeSelected(hash.substring(1));
		});
	};


	return self;	
})(Router || {});