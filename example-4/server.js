var Http = require('http');

var count = 0;
function requestHandle(req, res) {
	var message;
	count += 1;
	res.writeHead(201, {
		'Content-Type': 'text/plain'
	});

	message = 'Visitor count: ' + count + ', path: ' + req.url;
	console.log(message);
	res.end(message);
}

var server = Http.createServer(requestHandle);
server.listen(3000, function() {
	console.log('Listening on port 3000');
})
