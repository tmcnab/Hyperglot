app.nav = (function () {

	self = {};

	var sel = '#messages';
	var oldMessage = '';

	self.info = function (message) {
		if (message == oldMessage) return;
		else oldMessage = message;

		$(sel).fadeOut('fast', function() {
			$(sel).html(message).fadeIn('fast');
		});
	};

	self.error = function (message) 
	{
		if (message == oldMessage) return;
		else oldMessage = message;

		var html = '<span class="glyphicon glyphicon-warning-sign"></span> ' + message;
			
		$(sel).fadeOut('fast', function() {
			$(sel).html(html).fadeIn('fast');
		});
	};

	return self;
})(app.nav || {});