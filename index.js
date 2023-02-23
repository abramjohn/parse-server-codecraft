var express = require('express');
var ParseServer = require('parse-server').ParseServer;
// var S3Adapter = require('parse-server').S3Adapter;
var ParseDashboard = require('parse-dashboard');
var path = require('path');
var multer  = require('multer');
var cors  = require('cors');
var passport  = require('passport');


var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
	console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
	//**** General Settings ****//

	databaseURI: databaseUri || 'mongodb://localhost:27017/placebooking',
	cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
	serverURL: process.env.SERVER_URL || 'http://192.168.8.129:1337/api',  // Don't forget to change to https if needed
	
	//**** Security Settings ****//
	// allowClientClassCreation: process.env.CLIENT_CLASS_CREATION || false, 
	appId: process.env.APP_ID || 'PlaceBookingApp',
	masterKey: process.env.MASTER_KEY || 'PlaceBooking2022', //Add your master key here. Keep it secret!	
	javascriptKey: process.env.JAVASCRIPT_KEY || 'JAVASCRIPT_KEY'
	
	
	//**** Live Query ****//
	// liveQuery: {
	// 	classNames: ["TestObject", "Place", "Team", "Player", "ChatMessage"] // List of classes to support for query subscriptions
	// },

	//**** Email Verification ****//
	/* Enable email verification */
	// verifyUserEmails: true,
	/* The public URL of your app */
	// This will appear in the link that is used to verify email addresses and reset passwords.
	/* Set the mount path as it is in serverURL */
	//publicServerURL: process.env.SERVER_URL || 'http://192.168.8.129:1337/api',
	/* This will appear in the subject and body of the emails that are sent */
	// appName: process.env.APP_NAME || "CodeCraft", 

	// emailAdapter: {
	// 	module: 'parse-server-simple-mailgun-adapter',
	// 	options: {
	// 		fromAddress: process.env.EMAIL_FROM || "test@example.com",
	// 		domain: process.env.MAILGUN_DOMAIN || "example.com",
	// 		apiKey: process.env.MAILGUN_API_KEY  || "apikey"
	// 	}
	// },
	
	//**** File Storage ****//
	// filesAdapter: new S3Adapter(
	// 	{
	// 		directAccess: true
	// 	}
	// )
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var dashboard = new ParseDashboard({
	'allowInsecureHTTP': true, 
	"apps": [
		{
			
		  "serverURL": "http://192.168.8.129:1337/api",
		  "appId": "PlaceBookingApp",
		  "masterKey": "PlaceBooking2022",
		  "appName": "PlaceBooking",
		  "javascriptKey": "JAVASCRIPT_KEY"
		}
	  ],
	  "users": [
		{
		  "user":"admin",
		  "pass":"admin123"
		}
	  ]
});

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/api';
app.use(mountPath, api);

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);


// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
	res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function (req, res) {
	res.sendFile(path.join(__dirname, '/public/test.html'));
});




app.use(cors());

app.use('/Places_Images', express.static(path.join(__dirname,'/Places_Images')));

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
	  cb(null, './Places_Images')
	},
	filename: function (req, file, cb) {
	  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
	  cb(null, `${Date.now()}_${file.originalname}`)
	}
  })
  
  const upload = multer({ storage: storage })

  app.post("/single", upload.single("image"), (req, res) =>{
	const file =req.file;
	if(file){
		res.json(file);
	}
	else{
		throw new Error("File upload unsuccessful!");
	}
  });
 
  //*******Auth service *******/

  //app.use(bodyParser.urlencoded({extended: false }));
  ///app.use(bodyParser.json());

  //app.use('/api', routes);
  
  
 // app.use(passport.initialize());
  //var passportMiddleware = require('./UserAuth/middleware/passport');
  //passport.use(passportMiddleware);




var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
	console.log('Place Server running on port '  + port + '.');
});


// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);