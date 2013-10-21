var EditorViewController = (function() 
{
	var self = {};
	var editors = {};
	var parser = null;
	var ast = null;
	var activeDocument = null;

	function activeDocumentChanged() {
		activeDocument.modified = new Date();
		Projects.Update(activeDocument, function (didUpdate) {
			if (!didUpdate) {
				self.ErrorMsg('NEDB', 'Failed to update progress.')
			}
		});
	}

	function configureEditor (e) {
		e.setTheme('ace/theme/tomorrow_night_bright');
		return e;
	}

	function resize() {
		for (var sel in editors) {
			$(sel).height($(window).height() - 60);
		}
	}

	function buildParser () {
		try {
			var preamble = "{\n var ast = require('ast-types').builders;\n}\n";
			var input = preamble + activeDocument.grammar;
			parser = require('pegjs').buildParser(input, activeDocument.options.pegjs);
			self.InfoMsg('PEGJS', 'Parser constructed.');
			return true;
		} 
		catch (ex) {
			parser = null;
			self.ErrorMsg('PEGJS', ex.message);
			return false;
		}
	}

	function buildAST() {
		buildParser();
		if (parser == null) return false;

		try {
			//-- Generate AST
			ast = parser.parse(activeDocument.language);

			//-- Set the AST output viewer content
			var astPretty = JSON.stringify(ast, null, 2);
			editors['#outputPaneLeft'].getSession().setValue(astPretty);
			self.InfoMsg('Parser',  'AST generated.');

			try {
				var generatedScript = require('escodegen').generate(ast);
				editors['#outputPaneRight'].getSession().setValue(generatedScript);
				self.InfoMsg('Escodegen', 'Successfully compiled AST to EcmaScript.');
			} catch (ex) {
				editors['#outputPaneRight'].getSession().setValue('');
				self.ErrorMsg('Escodegen', ex);
			}
			return true;
		} 
		catch (ex) {
			self.ErrorMsg('Parser', ex);
			ast = null;
			return false;
		}
	}

	function decode() {
		try {
			var tree = require('esprima').parse(activeDocument.ecmascript);
			var content = JSON.stringify(tree, null, 2);
			editors['#decoderPaneRight'].getSession().setValue(content);
			self.InfoMsg('Esprima', 'AST Generated.');
		} catch (ex) {
			self.ErrorMsg('Esprima', ex);
		}
	};


	self.Init = function(){
		var session = null;
		
		//-- Grammar Editor Configuration --//
		editors['#grammarEditor'] = configureEditor(ace.edit('grammarEditor'));
		session = editors['#grammarEditor'].getSession();
		session.setMode("ace/mode/javascript");
		session.setUseWorker(false);
		session.on('change', function() {
			activeDocument.grammar = editors['#grammarEditor'].getSession().getValue();
			activeDocumentChanged();
			buildParser();
		});


		//-- Language Editor Configuration --//
		editors['#languageEditor'] = configureEditor(ace.edit('languageEditor'))
		session = editors['#languageEditor'].getSession();
		session.on('change', function() {
			activeDocument.language = editors['#languageEditor'].getSession().getValue();
			activeDocumentChanged();
			buildAST();
		});

		//-- AST Viewer Configuration --//
		editors['#outputPaneLeft'] = configureEditor(ace.edit('outputPaneLeft'));
		editors['#outputPaneLeft'].setReadOnly(true);
		session = editors['#outputPaneLeft'].getSession();
		session.setMode('ace/mode/json');
		session.setUseWorker(false);

		//-- AST-to-ES5 Viewer Configuration --//
		editors['#outputPaneRight'] = configureEditor(ace.edit('outputPaneRight'));
		editors['#outputPaneRight'].setReadOnly(true);
		session = editors['#outputPaneRight'].getSession();
		session.setMode('ace/mode/javascript');
		session.setUseWorker(false);


		//-- EcmaScript AST Viewer Configuration --//
		editors['#decoderPaneRight'] = configureEditor(ace.edit('decoderPaneRight'));
		editors['#decoderPaneRight'].setReadOnly(true);
		session = editors['#decoderPaneRight'].getSession();
		session.setMode("ace/mode/json");
		session.setUseWorker(false);


		//-- EcmaScript Editor Configuration --//
		editors['#decoderPaneLeft'] = configureEditor(ace.edit('decoderPaneLeft'));
		session = editors['#decoderPaneLeft'].getSession();
		session.setMode("ace/mode/javascript");
		session.setUseWorker(false);
		session.on('change', function() {
			activeDocument.ecmascript = editors['#decoderPaneLeft'].getSession().getValue();
			activeDocumentChanged();
			decode();
		});

		//-- Configure the Tabbables --//
		$('a[data-toggle="tab"]').click(function (e) {
			e.preventDefault();
			$(this).tab('show');
		});

		$('#ideCloseBtn').on('click', function (evt) {
			self.Dismiss();
		});

		$('#exportPaneBtn').on('click', self.ExportHGC);

		//-- Bind the Window Resize Event --//
		$(window).resize(resize);
	};

	self.ExportHGC = function () {

		//-- 
		if (!buildParser) {
			ModalViewController.Alert("Parser didn't build, cannot export hgc");
			return;
		} 

		//-- 
		var cwd = process.cwd();
		var parserSrc = "module.exports = " + parser.toSource();
		require('fs').writeFileSync(cwd + '/hgc/parser.js', parserSrc);

		//--
		var zipFile = new require('adm-zip')();
		zipFile.addLocalFile(cwd + '/hgc/package.json');
		zipFile.addLocalFile(cwd + '/hgc/hgc');
		zipFile.addLocalFile(cwd + '/hgc/parser.js');

		var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
		zipFile.writeZip(homeDir +  "/" + activeDocument.name + ".zip");
	};


	self.InfoMsg = function (category, message) {
		var text = '[' + category + '] ' + message;
		$('#messages').html(text);
	};

	self.ErrorMsg = function (category, message) {
		var text = ' [' + category + '] ' + message;
		var messageHtml = $('<i>').addClass('icon-warning-sign').text(text);
		$('#messages').html(messageHtml);
	};

	self.Open = function (projectId) {
		
		function onFound (err, docs) {
			if (err) {
				ModalViewController.Alert(err);
				return;
			}

			//-- Load Active Document, Load Editors --//
			activeDocument = docs[0];
			editors['#grammarEditor'].getSession().setValue(activeDocument.grammar);
			editors['#languageEditor'].getSession().setValue(activeDocument.language);
			editors['#decoderPaneLeft'].getSession().setValue(activeDocument.ecmascript);

			$('#exportPanePath').text("~/" + activeDocument.name + ".zip");

			self.Present();
		}

		Projects.Get(projectId, onFound);
	}

	self.Present = function() {
		$('#ideView').show();
		resize();
	};

	self.Dismiss = function() {
		$('#ideView').hide();
		ProjectsViewController.Present();
	};

	return self;
})();