(function () {
	"use strict";

	var tests = [];

	function init() {
		console.log('TestsView::init');
		Menu.title('Unit Tests');
		Menu.message('0 Fail 0 Pass');

		$('.-tests-action-add').on('click', onAddBtnClick);	
	}



	function onAddBtnClick() {

		function modalOpened() {
			console.info('TestsView::onAddBtnClick::modalOpened');

			var codeEditor = CodeMirror($('.-tests-modal-add-code')[0], {
				lineNumbers: true
			});
		}

		function modalSubmitted(evt) {
			evt.preventDefault();
			console.info('TestsView::onAddBtnClick::modalSubmitted');

			return false;
		}

		console.info('TestsView::onAddBtnClick');
		$('.-tests-modal-add')
			.foundation('reveal', 'open')
			.on('opened', modalOpened)
			.on('submit', modalSubmitted);
	}

	init();
})();