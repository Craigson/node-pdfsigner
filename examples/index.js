const pdfSigner = require('pdfSigner')
const publicIp = require('public-ip');

publicIp.v4().then(ip => {
	console.log(ip);
    
    var options = {
        name: 'John Doe',
        ip: ip,
        date: true,
        filename: 'example_output.pdf',
        color: "red"
    }
    
    pdfSigner('sample.pdf', options)

});



