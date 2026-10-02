// Compatibility redirect. Start the main website with npm start.
require('node:http').createServer((req,res)=>{res.writeHead(302,{Location:'http://localhost:3000/admin.html'});res.end();}).listen(3333,'127.0.0.1');
