const path = require('path');
const { Readable } = require('stream');
const fs = require('fs');
const express = require('express');
const denodo = require('./denodo.model');
var bodyParser = require('body-parser')

const app = express();
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  // denodo.executeQuery(res);
  res.sendFile(path.join(__dirname, 'views','index.html'));
});

app.post('/query',(req, res) => {
  let filename = req.body.filename;
  let query = req.body.query;
  denodo.executeQuery(res, filename, query);
});


app.listen(3000,()=>{
  console.log("Server Started");
})

 