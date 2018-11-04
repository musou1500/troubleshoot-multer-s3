const http = require('http');
const stream = require('stream');
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require('./mock-s3.js')();

const app = express();

const consumeStream = stream => {
  return new Promise((resolve, reject) => {
    stream.on('data', () => {});
    stream.on('end', () => resolve({ meta: 'dmy' }));
  });
};

app.get('/', (req, res, next) => res.send({ message: 'hello' }));
app.post("/upload", (req, res, next) => {
  const passThrough = new stream.PassThrough();
  const upload = multer({
    storage: multerS3({
      s3,
      bucket: "some-bucket",

      metadata: async (req, file, cb) => {
        try {
          file.stream.pipe(passThrough);
          // read, process metadata
          const { meta } = await consumeStream(file.stream);
          cb(null, meta);
        } catch(e) {
          cb(e);
        }
      },
      contentType: (req, file, cb) => cb(null, 'png', passThrough)
    })
  }).single('vrm');

  upload(req, res, err => {
    res.send({
      result: err ? 'error' : 'ok'
    });
  });
});


const server = http.createServer(app);
server.listen(3000);
