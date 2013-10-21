
function main() {

	// Initialize View Controllers
	ProjectsViewController.Init();
	ModalViewController.Init();
	EditorViewController.Init();

	ProjectsViewController.Present();
}

$(document).ready(main);