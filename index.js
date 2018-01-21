/*
	This package references code from Devon Govett's node-wkhtmltopdf (https://github.com/devongovett/node-wkhtmltopdf)
	
	pdftk CLI command: pdftk <input pdf> stamp <watermark pdf> output <output filename>
	*/

const spawn = require('child_process').spawn;
const fs = require('fs')
const PDFDocument = require('pdfkit')

function signPdf(original, options = {}, callback){

	const defaults = {
		name: "Unknown",
		ip: 'Unknown',
		date: true,
		resultFilename: 'output.pdf',
		fontSize: 8,
		color: "black",
		removeSignaturePdf: true
	};

	let actual = Object.assign({}, defaults, options);

	// create the signature
	let date = new Date()
	let filenameArr = actual.name.split(' ') // <<< add error checking here
	let signatureFile = filenameArr.join('_') + '_signature.pdf'
	const doc = new PDFDocument({margin:0})
	doc.fontSize(actual.fontSize)
	doc.fill(actual.color)
	doc.text("Signed by: " + actual.name, 50, 740)
	doc.text("IP address: " + actual.ip, 50, 750)
	if (actual.date) doc.text("Signed on: " + date, 380, 750)
	doc.pipe( fs.createWriteStream(signatureFile))
	doc.end()
	
	try {
		let child
		let args =[signPdf.command]
		let outputFilename
	
		args.push(original)
		args.push('stamp')
		args.push(signatureFile)
		args.push('output')
	
		// check for filename option and if it includes the .pdf extension
		if (actual.resultFilename) {
			if (actual.resultFilename.indexOf('.pdf') < 0) outputFilename = actual.resultFilename + '.pdf'
			else outputFilename = options.resultFilename
		} else {
			outputFilename = 'output.pdf'
		}
		
		args.push(outputFilename)
	
		console.log('Executing command: ' + args.join(' '))

		// create a shell and run the pdftk CLI tool
		if (process.platform === 'win32') {
			child = spawn(args[0], args.slice(1));
		} else if (process.platform === 'darwin') {
			child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat ; exit ${PIPESTATUS[0]}']);
		} else {
			// this nasty business prevents piping problems on linux
			// The return code should be that of wkhtmltopdf and not of cat
			// http://stackoverflow.com/a/18295541/1705056
			child = spawn(signPdf.shell, ['-c', args.join(' ') + ' | cat ; exit ${PIPESTATUS[0]}']);
		}
	
		let stream = child.stdout;
	
		// call the callback with null error when the process exits successfully
		child.on('exit', function(code) {
			if (code !== 0) {
				console.log('Error: ')
				stderrMessages.push('signPdf exited with code ' + code);
				handleError(stderrMessages);
				return
			}

			if (actual.removeSignaturePdf)
			{
				try {
					fs.unlinkSync(signatureFile);
					console.log(`successfully deleted file ${signatureFile}`);
					callback(null, outputFilename)
				  } catch (err) {
					console.error('Error: ', err)
				}
			} else {
				callback(null, outputFilename)
			}

			

			// return outputFilename;
		});
	
		// setup error handling
		let stderrMessages = [];
	
		function handleError(err) {
			let errObj = null;
			if (Array.isArray(err)) {
				errObj = new Error(err.join('\n'));
			} else if (err) {
				errObj =  new Error(err);
			}
			child.removeAllListeners('exit');
			child.kill();

			if (callback) callback(errObj)
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
			stderrMessages.push((data || '').toString());
			// console.log(data)
		});

	} catch (err) {

		return err

	}
	
}


signPdf.command = 'pdftk'
signPdf.shell = '/bin/bash'
module.exports = signPdf