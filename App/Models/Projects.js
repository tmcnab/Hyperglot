var Projects = (function() 
{
	var self = {};

	var db = new (require('nedb'))({ 
		autoload:true, 
		filename:'hyperglot.db', 
		nodeWebkitAppName:'hyperglot' 
	});


	// Creates a new Project
	self.Create = function (name, fn) {
		var newProj = new Project();
		newProj.name = name;
		db.insert(newProj, fn);
	};

	self.Get = function (id, fn) {
		db.find({ _id: id}, fn);
	};

	self.List = function (fn) {
		db.find({}, fn);
	};

	self.Remove = function (id, fn) {
		db.remove({ _id:id }, {}, function (err, nRemoved) 
		{
			if (err) {
				console.error(err);
				fn(false);
			} else {
				fn(true);
			}
		});
	};

	self.Update = function (doc, fn) {
		db.update({ _id:doc._id }, doc, {}, function (err, nReplaced) {
			fn(err == undefined || err == null);
		});
	};

	return self;
})();