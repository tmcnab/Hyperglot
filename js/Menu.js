/*
 *
 */

var Menu = (function(self) {

	self.close = function () {
		$('.off-canvas-wrap').removeClass('move-right');
	};

	self.message = function (str) {
		$('.-menu-message').text(str);
	};

	self.title = function (str) {
		$('.-menu-title').text(str);
	};

	return self;
})(Menu || {});