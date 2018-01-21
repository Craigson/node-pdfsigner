const pdfSigner = require('pdfSigner')

const options = {
    name: 'John Doe',
    ip: '59.164.59.14',
    date: true,
    resultFilename: 'example_output.pdf',
    color: "red"
}

pdfSigner('sample.pdf', options, function(err, output){
    if (err) console.log('callback: ', err)
    
    console.log(`Created signed PDF file: ${output}`)
});





