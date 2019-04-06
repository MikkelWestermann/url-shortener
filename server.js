const express = require('express'); 

const app = express();

app.get('/', (req, res) => {
    console.log('Hello World!')
    res.send('<h1>Helloooo World!</h1>')
})

const PORT = process.env.PORT || 1235;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
})
