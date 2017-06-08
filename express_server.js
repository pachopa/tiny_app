var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//configuration

app.set("view engine", "ejs");

//middleware

app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));

//
app.get("/", (req, res) => {
  res.end("Hello!");
});
//List of URLs in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//Homepage(list of urls)
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});
//generate randomId
app.post("/urls", (req, res) => {
  let randomId = generateRandomString();
  urlDatabase[randomId] = "http://" + req.body.longURL ;
  res.redirect('/urls')     
});
//delete the URL
app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls')     
});
//add a new longURL
app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});
//go to the website
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});
//list of the specific shortURl and longURL
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});
//edit the longURL
app.post("/urls/:id", (req, res) => {
  let newLongURL = req.body.update;
  let shortURL = req.params.id;
  let urls = urlDatabase;
  urls[shortURL] = 'http://' + newLongURL;
  res.redirect('/urls')     
});
//generate a new user
app.post("/login", (req, res) => {
  let userId = req.body.username;
  res.cookie('username', userId);
  res.redirect('/urls')     
});
//logout 
app.post("/logout", (req, res) => {
  let userId = req.cookies.username;
  res.clearCookie("username", userId); 
  res.redirect('/urls')  
});

//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});