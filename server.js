const express = require("express");
const redis = require("redis");
const validUrl = require("valid-url");
const shortid = require("shortid");
const bodyParser = require("body-parser");
const cors = require('cors');

const redisClient = redis.createClient(process.env.REDIS_URI);

const app = express();

// CORS

const whitelist = ['localhost', 'localhost:3000', 'http://localhost:3000']

const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (whitelist.includes(req.header('Origin'))) {
    console.log("TCL: corsOptionsDelegate -> whitelist", whitelist)
    corsOptions = {
      origin: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Current-Region']
    }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = {
      origin: false
    }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

app.use(cors(corsOptionsDelegate));

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("working");
});

  
app.get("/:code", (req, res) => {
  const { code } = req.params;
	new Promise((resolve, reject) =>
		// Retrieve value from redis db where key is code
    redisClient.get(code, (err, reply) => {
			// Check response from redis
      !err ? resolve(reply) : reject(err);
    })
  )
    .then(result => {
			// Check that response is not null and redirect 
      result ? res.redirect(result) : res.send("Link has expired")
    })
    .catch(err => res.send("Not a valid link"));
});

app.post("/create-tiny", async (req, res) => {
	const { url, duration } = req.body;
	// Check that the url is valid
  if (validUrl.isUri(url)) {
    let safety = 0;
		let hasFoundCode = false;
		// Loop insertion of key/value in db to make sure
		// there are no dublicate keys in the db. 
		// side note: 100 might be a bit excessive, but better
		// safe than sorry, right...
    while (safety < 100) {
			// Generate a random string of characters
      const urlCode = shortid.generate();
			await new Promise((resolve, reject) =>
				// Check if the url code already exsists in the db
        redisClient.exists(urlCode, (err, reply) => {
          !err ? resolve(reply) : reject(err);
        })
      )
        .then(async reply => {
					// Check that the reply is 0 <- meaning that the 
					// url code does not exist in the db
          if (!reply) {
						await new Promise((resolve, reject) =>
							// Insert the url code and url as key/value in db
							// with an expiration of duration <- in seconds
              redisClient.set(urlCode, url, "EX", duration, (err, reply) => {
                !err ? resolve(reply) : reject(err);
              })
            ).then(() => {
							// Everything was successful!!!
              hasFoundCode = true;
              res.send(urlCode);
            });
          }
        })
        .catch(console.log);
      if (hasFoundCode) {
        break;
      }
      safety++;
		}
		// It was not possible to find a url code that did not exist in the db already
    if (safety === 100) {
      res.status(409).send("Could not store url code. Please try again");
    }
  } else {
    res.send("Not a valid url");
  }
});

const PORT = process.env.PORT || 1235;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
