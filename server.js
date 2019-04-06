const express = require('express'); 
const redis = require('redis'); 
const validUrl = require("valid-url");
const shortid = require("shortid");
const bodyParser = require('body-parser'); 

const redisClient = redis.createClient(process.env.REDIS_URI);

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('working')
})

app.get('/:code', (req, res) => {
    const { code } = req.params; 
    new Promise((resolve, reject) => redisClient.get(code, (err, reply) => {
        if (!err) {
            resolve(reply)
        } else {
            reject(err)
        }
    }))
        .then(result => res.redirect(result))
})

app.post('/create-tiny', async (req, res) => {
    const { url } = req.body; 
    if (validUrl.isUri(url)) {
        const urlCode = shortid.generate()
        const hasUrlCode = await new Promise((resolve, reject) => redisClient.exists(urlCode, async (err, reply) => {
            if (!err) {
                resolve(reply)
            } else {
                reject(err)
            }
        }))
        if (!hasUrlCode) {
            Promise.resolve(redisClient.set(urlCode, url))
                .then(res.send(urlCode))
        } else {
            res.send('Short url already exists, try again!'); 
        }
    } else {
        res.send('Not a valid url')
    }
})

const PORT = process.env.PORT || 1235;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
})
