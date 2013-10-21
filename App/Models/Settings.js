var Settings = (function()
{
	var self = {};

	function get (k) {
		return localStorage.getItem(key);
	}

	function set (k,v) {
		localStorage.setItem(key, value);
		return get(key);
	}

	function setIfNull (k,v) {

	}

	self.Init = function() {
		
	}

	return self;
})();