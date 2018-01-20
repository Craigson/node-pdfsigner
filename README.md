# node-pdfsigner

A Javascript library that electronically signs and dates a PDF document for Node.

## Requirements

Node-pdfsigner relies on devongovett's npm package [pdfkit](https://github.com/devongovett/pdfkit) and PDF Labs' [PDFtk Server](https://www.pdflabs.com/tools/pdftk-server/) CLI tool PDFtk Server.

## Installation

Installation uses the [npm](http://npmjs.org/) package manager.  Just type the following command after installing npm.

    npm install pdfkit

You'll need to follow the instructions from PDF labs [here](https://www.pdflabs.com/tools/pdftk-server/) to install <I>pdftk</I>.

To install on Ubuntu Linux:


    sudo apt-get install pdftk


## Usage

The package makes use of the ES6 async/await feature to sign a pdf in a two-step process. A pdf is created using pdfkit that contains the signature, then the watermark pdf is overplayed and combined with the input file.

```
const pdfSigner = require('pdfSigner')

var options = {
	name: 'Craigson',
	ip: '192.168.1.99',
	date: true,
	filename: 'output.pdf'
}

pdfSigner('sample.pdf', options)

```

## Notes

Only tested on Ubuntu 16.04

## License

PDFKit is available under the MIT license.