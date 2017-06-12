var express = require('express');
var path = require('path');             // used in File Uploader
var formidable = require('formidable'); // used in File Uploader
var fs = require('fs');                 // used in File Uploader
var nodemailer = require('nodemailer'); // used in File Uploader
var app = express();

// Use express.static middleware to serve up the static files in our public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/Node-js-Uploader', function(request, response) {
  response.render('pages/Node-js-Uploader');
});

app.get('/Upload-List', function(request, response) {

  const uploadFolder = path.join(__dirname, 'public/uploads');
  fs.readdir(uploadFolder, function (err, files) {
    if (err) {
      response.send(err);
    }
    response.send(files);
  }); // END readdir
});


app.post('/Node-js-Uploader', function(req, res) {
  // create an incoming form object
  var form = new formidable.IncomingForm();
  var msgComplete;
  var acceptableExt = ["pdf","png","jpg","gif","mp4","mov","avi","txt","mpeg4","flv"];

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, 'public/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    var ext = file.name.split('.').pop();
    console.log("ext:", ext);
    if (file.size > 50000000) {
      msgComplete = "Upload Failed: file too large";
      fs.unlink(file.path, (err) => {
        if (err) throw err;
        console.log('successfully deleted '+ file.path);
      });
    } else if(!ext || !acceptableExt.includes(ext)) {
      msgComplete = "Upload Failed: " + file.name+ " is not a valid file type";
      fs.unlink(file.path, (err) => {
        if (err) throw err;
        console.log('successfully deleted '+ file.path);
      });
    } else {
      fs.rename(file.path, path.join(form.uploadDir, file.name));
      msgComplete = file.name+ " Uploaded Successfully";
    }
    console.log("Msg Complete:", msgComplete);
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the file(s) have been uploaded, send a response to the client
  form.on('end', function() {
    // Notify someone when files are uploaded
    var transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      tls: {
        ciphers:'SSLv3'
      },
      auth: {
        user: 'your@email.com',
        pass: 'your-pasword'
      }
    });

    var mailOptions = {
      from: 'your@email.com',
      to: 'your@email.com',
      subject: 'A file was uploaded to your website',
      text: `Hi,
A file was just uploaded to your personal
website via the upload form on the File Uploader page.

http://www.yourdomain.com/Node-js-Uploader

You had better check this page to ensure that the uploaded file 
is not any offensive or copywrited material.

Kind regards,
Your Name`
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        res.end(error.toString());
      } else {
        res.end(msgComplete);
      }
    });
    // END Notify someone of uploaded file(s)

  }); // END upload(s) complete

  // parse the incoming request containing the form data
  form.parse(req);
});


app.listen(3000, function() {
  console.log('Node app is running on port', 3000);
});

