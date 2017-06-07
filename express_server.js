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


//router
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  //console.log(templateVars)
  res.render("urls_index", templateVars);
});


app.post("/urls", (req, res) => {
  let randomId = generateRandomString();
  urlDatabase[randomId] = "http://" + req.body.longURL ;
  res.redirect('/urls')     
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls')     
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let newLongURL = req.body.update;
  let shortURL = req.params.id;
  let urls = urlDatabase;
  urls[shortURL] = 'http://' + newLongURL;
  res.redirect('/urls')     
});

app.post("/login", (req, res) => {
  let userId = req.body.username;
  res.cookie('username', userId);
  res.redirect('/urls')     
});

app.post("/logout", (req, res) => {
  let userId = req.cookies.username;
  res.clearCookie("username", userId); 
  res.redirect('/urls')  
});

//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});