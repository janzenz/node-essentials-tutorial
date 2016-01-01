(function(undefined) {
	function Logger() {

	}

	Logger.prototype.log = function() {
		console.log.apply(console, arguments);
	}

	this.Logger = Logger;
})()

var logger = new Logger();
logger.log('test', 'hello');
