const express = require("express");
const redis = require("redis");
const validUrl = require("valid-url");
const shortid = require("shortid");
const bodyParser = require("body-parser");

const redisClient = redis.createClient(process.env.REDIS_URI);

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("working");
});

app.get("/:code", (req, res) => {
  const { code } = req.params;
  new Promise((resolve, reject) =>
    redisClient.get(code, (err, reply) => {
      !err ? resolve(reply) : reject(err);
    })
  )
		.then(result => {
			result === null ? 
			res.send('Link has expired') :
			res.redirect(result)
		})
    .catch(err => res.send("Not a valid link"));
});

app.post("/create-tiny", async (req, res) => {
  const { url } = req.body;
  if (validUrl.isUri(url)) {
		let safety = 0;
		let hasFoundCode = false; 
    while (safety < 100) {
      const urlCode = shortid.generate();
      await new Promise((resolve, reject) =>
        redisClient.exists(urlCode, (err, reply) => {
          !err ? resolve(reply) : reject(err);
        })
      ).then(async reply => {
        if (!reply) {
          await new Promise((resolve, reject) => redisClient.set(urlCode, url, 'EX', 10, (err, reply) => {
						!err ? resolve(reply) : reject(err)
					}))
					.then(() => {
						hasFoundCode = true; 
						res.send(urlCode)
					})
        }
			})
			.catch(console.log)
			if (hasFoundCode) {
				break; 
			}
      safety++;
    }
    if (safety === 100) {
        res.status(409).send('Could not store url code. Please try again')
    }
  } else {
    res.send("Not a valid url");
  }
});

const PORT = process.env.PORT || 1235;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
