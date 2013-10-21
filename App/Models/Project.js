function Project () {
	
	var DEFAULT_PEG = "Program = stmts:Statement* {\n\treturn ast.program(stmts);\n}\n\nStatement = \n";
	
	this.ecmascript = "";

	this.grammar = DEFAULT_PEG;		// The PEG source text

	this._id = "";					// The UUID of the Project

	this.name = "";					// The name of the Project

	this.options = {				// Per-Project Options
		pegjs: {
			cache: false,
			trackLineAndColumn: false
		},
		hgc: {
			esoptimize: true
		}
	};

	this.language = "";				// The "Input" pane text

	this.updated = new Date();		// When it was last updated

	this.version = {				// SemVer of the Project
		major: 0,
		minor: 0,
		patch: 0
	};
}