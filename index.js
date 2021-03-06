var https = require("https"),
  fs = require("fs");

// Import Firebase Admin SDK
var admin = require("firebase-admin");
// Get a database reference to our blog
var serviceAccount = require("./enjilchat-alpha-firebase-adminsdk-ro8js-944c945eb0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://enjilchat-alpha.firebaseio.com"
});


// Get a database reference to our blog
var db = admin.database();
var ref = db.ref("messages");

/* Set FIREBASE_URL and FIREBASE_SECRET */
var FIREBASE_URL = "https://enjilchat-alpha.firebaseio.com";
var FIREBASE_SECRET = "0dnX5eHlh29VNewzLWsYLStFe7PrsDCnqhLTssKd";

function fetchData() {
  var url =
    FIREBASE_URL +
    "/messages.json?print=pretty&format=export&auth=" +
    FIREBASE_SECRET;

  var scoreReq = https
    .get(url, function(response) {
      var completeResponse = "";
      response.on("data", function(chunk) {
        completeResponse += chunk;
      });
      response.on("end", function() {
        backup(completeResponse);
      });
    })
    .on("error", function(e) {
      console.log(
        "[ERROR] " + new Date() + " problem with request: " + e.message
      );
    });
}

function backup(data) {
  var filename = getFileName("json");
  writeToFile(filename, data);
  combineBackups(data);
}

function getFileName(format) {
  return (
    __dirname +
    "/backup/" +
    new Date()
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "") +
    "." +
    format
  );
}

function writeToFile(filename, data) {
  fs.writeFile(filename, data, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("[SUCCESS] " + new Date() + " JSON saved to " + filename);
    }
  });
}

function writeCombineFile(filename, data) {
	fs.writeFile(filename, data, function(err) {
	  if (err) {
		console.log(err);
	  } else {
		console.log("[SUCCESS] " + new Date() + " JSON saved to " + filename);
		deleteOldMessages();
	  }
	});
  }
function combineBackups(data) {
	var combinedBackupFile = __dirname + "/backup/combinedBackup.json";

	var obj1 = JSON.parse(fs.readFileSync(combinedBackupFile, 'utf8'));

	var obj2 = JSON.parse(data);
	
	//console.log('obj1');
	//console.log(JSON.stringify(obj1, null, 2));
	//console.log('obj2');
	//console.log(JSON.stringify(obj2, null, 2));

	for (var chat in obj2) {
		//if this chat exist in the old file 
		if (obj2.hasOwnProperty(chat) && obj1.hasOwnProperty(chat)) {
	
			for (var message in obj2[chat]) {
				//message in both objects move on
				if (obj2[chat].hasOwnProperty(message) && obj1[chat].hasOwnProperty(message)) {
					//console.log('both message');
					//console.log(obj2[chat][message]);
				}
				//message in new object but not old add it.
				else if (obj2[chat].hasOwnProperty(message) && !obj1[chat].hasOwnProperty(message)) {
					//console.log('new message');
					//console.log(obj2[chat][message]);
					obj1[chat][message] = obj2[chat][message];
				}
			}
		}
		//if this chat doesn't exist in the old file
		if (obj2.hasOwnProperty(chat) && !obj1.hasOwnProperty(chat)) { 
			//console.log(JSON.stringify(obj2[chat]));
			obj1[chat] = obj2[chat];
		}
	}
	writeCombineFile(combinedBackupFile, JSON.stringify(obj1, null, 2));
}

function deleteOldMessages() {
	console.log("Delete Old Messages from Firebase");
	var now = Date.now();
	var cutoff = now - 168 * 60 * 60 * 1000;
	var updates = {};
	  return ref.once('value', function(snapshot) {
		// create a map with all children that need to be removed
		var updates = {};
		console.log("snapshot foreach");
		snapshot.forEach(function(child) {
			var chat = child.key
			child.forEach(function(grandchild) {

				if (grandchild.val().time <= cutoff) {
					updates['/' + chat + '/' + grandchild.key] = null;
					console.log(grandchild.key + " will be deleted");
				}
			})
		});
		// execute all updates in one go and return the result to end the function
		console.log(updates);
		return ref.update(updates);
	  });
};

function init() {
  fetchData();
     setInterval(fetchData, 86400000);//daily backup
  //setInterval(fetchData, 120000); //every 2 minutes backup for testing.
}

init();
