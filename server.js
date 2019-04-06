const express = require('express'); 
const redis = require('redis'); 

const redisClient = redis.createClient(process.env.REDIS_URI); 

const app = express();

app.get('/', (req, res) => {
    res.send('<h1>Helloooo World!</h1>')
})

const PORT = process.env.PORT || 1235;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
})
