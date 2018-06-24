var WebSocketServer = require('ws').Server,
	mss = new WebSoocketServer({port: 8080});

var connections = [];

mss.on('connection', function connection(ws) {
	console.log('new connection');
    connections.push(ws);

    ws.on('message', function incoming(message) {
		console.log('===========');
		console.log('new message', message);

		connections.forEach(function (connection) {
			console.log('sending date to client');

			connection.send(message, function (e) {
				if(e){
					connections = connections.filter(function (current) {
						return current !== connection;
                    });

					console.log('close connection');
				}
            })
        })

		console.log('==============');
		
		ws.on('close', function () {
			connections = connections.filter(function (current) {
				return current !== vs;
            })

			console.log('close connection')
        })
    })
})