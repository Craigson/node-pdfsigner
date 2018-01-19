/*
TODO:
- change margin as an option
*/

/*
	options = {
		name: 'your name',
		ip: 'your IP',
		date: true (defaults to true),
		filename: 'filename.pdf'
	}
*/
const spawn = require('child_process').spawn;
const fs = require('fs')
const PDFDocument = require('pdfkit')



// needs to return watermark filename
async function createWatermarkPdf(options){

	console.log('execute createWatermarkPdf')

	let date = new Date()
	let filenameArr = options.name.split(' ') // <<< add error checking here
	let stampFile = filenameArr.join('_') + '_watermark.pdf'
	const doc = new PDFDocument({margin:0})
	doc.fontSize(8)
	if (options.name) doc.text("Signed by: " + options.name, 50, 740)
	if (options.ip) doc.text("IP: " + options.ip, 50, 750)
	if (options.date && options.date == true) doc.text("Signed on: " + date, 380, 750)
	doc.pipe( fs.createWriteStream(stampFile))
	doc.end()

	return stampFile

}

// Command: pdftk <input pdf> stamp <watermark pdf> output <output filename>
// TODO: need to handle the case where options is an empty object
async function stampPdf(original, stamp, options)
{
	console.log('execute stampPdf')

	try {
		let args =[signPdf.command]
		let outputFilename
	
		args.push(original)
		args.push('stamp')
		args.push(stamp)
		args.push('output')
	
		// check for filename option and if it includes the .pdf extension
		if (options.filename) {
			if (options.filename.indexOf('.pdf') < 0) outputFilename = options.filename + '.pdf'
			else outputFilename = options.filename
		} else {
			outputFilename = 'output.pdf'
		}
	
		args.push(outputFilename)
	
		// create a shell and run the pdftk CLI tool
		if (process.platform === 'win32') {
			var child = spawn(args[0], args.slice(1));
		} else if (process.platform === 'darwin') {
			var child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat ; exit ${PIPESTATUS[0]}']);
		} else {
			// this nasty business prevents piping problems on linux
			// The return code should be that of wkhtmltopdf and not of cat
			// http://stackoverflow.com/a/18295541/1705056
			console.log('Executing command: ' + args.join(' '))
			var child = spawn(signPdf.shell, ['-c', args.join(' ') + ' | cat ; exit ${PIPESTATUS[0]}']);
		}
	
		var stream = child.stdout;
	
		// call the callback with null error when the process exits successfully
		child.on('exit', function(code) {
			console.log('child exit')
			if (code !== 0) {
			stderrMessages.push('signPdf exited with code ' + code);
			handleError(stderrMessages);
			console.log('child exiting, executing callback')
			}

			// return outputFilename;
		});
	
		// setup error handling
		var stderrMessages = [];
	
		function handleError(err) {
			var errObj = null;
			if (Array.isArray(err)) {
				errObj = new Error(err.join('\n'));
			} else if (err) {
				errObj =  new Error(err);
			}
			child.removeAllListeners('exit');
			child.kill();
			// call the callback if there is one
	
			// if not, or there are listeners for errors, emit the error event
			if (stream.listeners('error').length > 0) {
				stream.emit('error', errObj);
			}
		}
	
		child.once('error', function(err) {
			throw new Error(err); // critical error
		});
	
		child.stderr.on('data', function(data) {
		});

	} catch (err) {

		return err

	}
	

} // end of stampPdf

async function signPdf(original, options){

	console.log('executing signPdf')

	let name, ip
	// determine if the 
	if (!options) {
		options = {};
		name = "Unknown"
		ip = "Unkown"
	} else {
		name = options.name
		ip = options.ip
	}

	try {
		// generate the watermark with the signature
		const signatureStamp = await createWatermarkPdf(options)

		// stamp the pdf
		const result = stampPdf(original, signatureStamp, options)
		console.log('result is: ' + result)
		return await returnFilename(result)
		
	} catch (err) {
		logger.error(err)
	}
}

async function returnFilename(file)
{
	console.log('file ', file)
	return file
	
}


signPdf.command = 'pdftk'
signPdf.shell = '/bin/bash'
module.exports = signPdf