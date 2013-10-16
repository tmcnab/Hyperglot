app.exportPane = (function (self) 
{
	var fs = require('fs');

	self.run = function () {
		if (app.grammar.parser == null) {
			alert("Can't create null compiler.");
			return;
		}

		var parserSrc = "module.exports = " + app.grammar.parser.toSource();
		fs.writeFileSync(process.env.PWD + '/hgc/parser.js', parserSrc);

		var zipFile = new require('adm-zip')();
		zipFile.addLocalFile(process.env.PWD + '/hgc/package.json');
		zipFile.addLocalFile(process.env.PWD + '/hgc/hgc');
		zipFile.addLocalFile(process.env.PWD + '/hgc/parser.js');

		var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
		zipFile.writeZip(homeDir +  "/hgc-compiler.zip");
	};

	$('#exportPaneBtnDone').on('click', self.run);

	return self;	
})(app.exportPane || {});