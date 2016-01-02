function Logger() {

}

Logger.prototype.log = function() {
	console.log.apply(console, arguments);
}

module.exports = Logger;
