var ModalViewController = (function() 
{
	var self = {};


	self.Init = function(){ }

	self.Error = function(message){
		$('#singleButtonModalView .modal-title').text('Error');
		$('#singleButtonModalView .modal-body p').text(message);
		$('#singleButtonModalView').modal('show');
	}

	self.Info = function (message) {
		$('#singleButtonModalView .modal-title').text('Information');
		$('#singleButtonModalView .modal-body p').text(message);
		$('#singleButtonModalView').modal('show');
	};

	self.Confirm = function (message, fn, yesLabel, noLabel) {
		yesLabel = yesLabel || "Confirm";
		noLabel = noLabel || "Deny";

		$('#cMVYesBtn').off().on('click', function() {
			$('#confirmModalView').modal('hide');
			fn(true);
		}).text(yesLabel);

		$('#cMVNoBtn').off().on('click', function() {
			$('#confirmModalView').modal('hide');
			fn(false);
		}).text(noLabel);

		$('#confirmModalView .modal-body p').text(message)
		$('#confirmModalView').modal('show');
	};

	return self;
})();