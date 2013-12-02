function routeSelected(viewName) {
	if (viewName == '') return;
	$('.main-section').load('html/' + viewName + '.html', function() {
		$.getScript('js/Views/' + viewName + '.js', function() {
			Menu.close();
		});
	});
}

// RiotJS Router
$.route(function(hash) {
	console.log("Router transitioned to '" + hash + "'.");
	routeSelected(hash.substring(1));
});

function navigateTo(viewName) {
	window.location.hash = viewName;
}

$(document).on('ready', function() {
	navigateTo('DecoderView');	// Last View Selected || 'DocsHGView'
})