/*
TODO:
- change margin as an option
*/

// Command: pdftk <input pdf> stamp <watermark pdf> output <output filename>

/*
	options = {
		name: 'your name',
		ip: 'your IP',
		date: true (defaults to true),
		filename: 'filename.pdf'
	}
*/
console.log('loading pdfSigner')

const spawn = require('child_process').spawn;
const fs = require('fs')
const PDFDocument = require('pdfkit')

function signPdf(original, options, callback)
{
	if (!options) {
		options = {};
	  } else if (typeof options == 'function') {
		callback = options;
		options = {};
	}

	var args = [signPdf.command];

	// this logic could use some better error handling
	createWatermarkPdf(options.name, options.ip)
	.then( watermark => {

		args.push(original)
		args.push('stamp')
		args.push(watermark)
		args.push('output')
		// TODO add check for .pdf extension
		if (options.filename) args.push(options.filename)
		else args.push('result.pdf')

		console.log('successfully created watermark')
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
			if (code !== 0) {
			stderrMessages.push('signPdf exited with code ' + code);
			handleError(stderrMessages);
			} else if (callback) {
			console.log('child exiting, executing callback')
			callback(null, stream); // stream is child.stdout
			}
		});
	
		// setup error handling
		var stderrMessages = [];
		function handleError(err) {
			var errObj = null;
			if (Array.isArray(err)) {
				// check ignore warnings array before killing child
				if (options.ignore && options.ignore instanceof Array) {
				var ignoreError = false;
				options.ignore.forEach(function(opt) {
					err.forEach(function(error) {
					if (typeof opt === 'string' && opt === error) {
						ignoreError = true;
					}
					if (opt instanceof RegExp && error.match(opt)) {
						ignoreError = true;
					}
					});
				});
				if (ignoreError) {
					return true;
				}
				}
				errObj = new Error(err.join('\n'));
			} else if (err) {
				errObj =  new Error(err);
			}
			child.removeAllListeners('exit');
			child.kill();
			// call the callback if there is one
	
			if (callback) {
				callback(errObj);
			}
	
			// if not, or there are listeners for errors, emit the error event
			if (!callback || stream.listeners('error').length > 0) {
				stream.emit('error', errObj);
			}
		}
	
		child.once('error', function(err) {
		throw new Error(err); // critical error
		});
	
		child.stderr.on('data', function(data) {
		stderrMessages.push((data || '').toString());
		if (options.debug instanceof Function) {
			options.debug(data);
		} else if (options.debug) {
			console.log('[node-wkhtmltopdf] [debug] ' + data.toString());
		}
		});
	
		return stream;

	})




} // end of signPdf

signPdf.command = 'pdftk'
signPdf.shell = '/bin/bash'
module.exports = signPdf


function createWatermarkPdf(name, ip){

	return new Promise( (resolve, reject) => {
		let date = new Date()
		console.log('date ', date)
		const doc = new PDFDocument({margin:0})
		doc.fontSize(8)
		doc.text("Signed by: " + name, 50, 750)
		doc.text("IP: " + ip, 150, 750)
		doc.text("Signed on: " + date, 380, 750)
		doc.pipe( fs.createWriteStream('watermark.pdf'))
		doc.end()
		resolve('watermark.pdf')
	})

}

