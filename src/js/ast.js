var ast = (function (self) 
{
	self.Identifier = function (name) {
		return { type:'Identifier', name:name };
	};

	self.Literal = function (value) {
		return { type:'Literal', value:value };
	};

	return self;
})(ast || {});