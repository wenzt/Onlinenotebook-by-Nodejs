var http = require('http');
var TOKEN ='weixin';
var qs = require('qs');
function checkSignature(params,token){
    var key = [token,params.timestamp,params.nonce].sort().join('');
    var sha1 = require('crypto').createHash('sha1');
    sha1.update(key);
    return
}

var server = http.createServer(function (req,res) {

    //var query = req('url').parse(req.url).query;
   // var params = qs.parse(query);


    var postdata = '';
    req.addListener('data',function(postchunk){
        postdata+=postchunk;

    });
    req.addListener('end', function (){
        console.log(postdata);
        res.end('success');
    })
});
server.listen(9529);
console.log('listen port 9529' );
