var ProjectsViewController = (function() 
{
	var self = {};
	var lvSelector = '#landingView';
	var npSelector = '#newProjectView';

	//-- Private Members --//

	function updateProjectList() {

		var tableSelector = '#projectList > tbody';

		function addDocumentToList(doc) {
			
			var tr = $('<tr>');
			var td = $('<td>');

			var text = $('<a>').text(doc.name)
							.data('id', doc._id)
							.attr('href','#')
							.on('click', function () {
								EditorViewController.Open(doc._id);
								ProjectsViewController.Dismiss();
							});
			var when = $('<span>').text(moment(doc.updated).fromNow()).addClass('pull-right');

			var tdRemove = $('<td>').append($('<i>').addClass('icon-remove')).on('click', function (evt) {
				var message = "Are you sure you want to delete the " + doc.name + " project? This can't be undone.";
				function handler(bool) {
					if (bool) {
						ProjectsViewController.Remove(doc._id);
					}
				}
				
				ModalViewController.Confirm(message, handler, "Yes", "No");
			}).css({
				width: '1px',
				cursor: 'pointer'
			});

			tr.append(td.append(text).append(when))
			  .append(tdRemove);
			
			
			$(tableSelector).append(tr);
		}

		function onList(err, docs) {
			if (err) {
				alert('This should be better handled.');
			} else {
				docs = docs.sort(function (x, y) {
					b = new Date(x.updated);
					a = new Date(y.updated);
					return a < b ? -1 : a > b ? 1 : 0;
				});

				for (var i = 0; i < docs.length; i++) {
					addDocumentToList(docs[i]);
				};
			}
		}

		// Remove existing children then kick things into action
		$(tableSelector).children().remove();
		Projects.List(onList);
	}

	function onSubmit (evt) {
		evt.preventDefault();

		function onCreated (err, proj) {
			if (err) {
				alert('Error: ProjectView::onCreate');
			} 
			else {
				EditorViewController.Open(proj._id);
				self.Dismiss();
				EditorViewController.Present();
			}
		}

		// Grab the user desired project name and start doing shit
		var projectName = $('[name="npvName"]').val();
		Projects.Create(projectName, onCreated);
	};

	
	//-- Public Members --//

	self.Dismiss = function() {
		$(lvSelector).hide();
		$(npSelector).modal('hide');
	};

	self.Init = function() {

		$(npSelector).submit(onSubmit)
		  .on('shown.bs.modal', function() {
  			$('[name="npvName"]').focus();
		}).on('hide.bs.modal',  function() {
			$('[name="npvName"]').blur();
		})


        $('#semver').text(VERSION);
	};

	self.Present = function() {
		updateProjectList();
		$(lvSelector).show();
		$('[name="npvName"]').val('');
	};

	self.Remove = function (id) {

		function after (didRemoveProject) {
			if (didRemoveProject) {
				updateProjectList();
			} else {
				ModalViewController.Alert("There was an error removing the project.");
			}
		}

		Projects.Remove(id, after);
	}


	return self;
})();;
