var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')
var express = require('express')
//Url sample database
var urlDatabase = {
  "b2xVn2": {
    id: "userRandomID",
    longURL : "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    id: "user2RandomID",
    longURL : "http://www.google.com"
  }
};
//users sample database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "123@123", 
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}
//generate Random String(for Users, shortURl id)
function generateRandomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//check user email
function findUserByEmail(email) {
  for(let userid in users) {
    if(users[userid].email === email) {
      return users[userid];
    }
  }
  return null;
}
//to show the given URL for each users
function urlsForUser(id) {
  let result = {};
  for(let shortURL in urlDatabase) {
    if( urlDatabase[shortURL].id === id){
      result[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return result;
}
//check user
function userIsNotLoggedIn(userid) {
  if(!userid) {
    return null;
  }
  return userid; 
}

//configuration

app.set("view engine", "ejs");

//middleware

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [`This is a tinyapp file`],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
//First page
app.get("/", (req, res) => {
  let user_id = req.session.user_id;
  let loggedInUser = userIsNotLoggedIn(user_id)
  if(!loggedInUser) {
    res.redirect('/login')
    return ;
  } else {
    res.redirect('/urls')
  }
});

//List of URLs in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//Homepage(list of urls)
app.get("/urls", (req, res) => {
  let user_id = req.session.user_id;
  let result = urlsForUser(user_id);
  let templateVars = { urls: result, user: users[user_id]};
  let loggedInUser = userIsNotLoggedIn(user_id);
  if(!loggedInUser) {
    res.status(400).send('You shoud login First or Register<br>Go to <a href="/login">login</a> in page<br>or go to <a href="/register">Register</a> page');
    return ;
  }
  res.render("urls_index", templateVars);
});
//generate randomId
app.post("/urls", (req, res) => {
  let randomId = generateRandomString();
  let userid = req.session.user_id;
  let editLongURL = "http://" + req.body.longURL;
  urlDatabase[randomId] = {
    id : userid,
    longURL : editLongURL
  }
  res.redirect('/urls');  
});
//delete the URL
app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls')
});
//add a new longURL
app.get("/urls/new", (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { urls: urlDatabase, user: users[user_id] };
  let loggedInUser = userIsNotLoggedIn(user_id)
  if(!loggedInUser) {
    res.status(400).send('You shoud login in First or Register<br>Go to <a href="/login">login</a> in page<br>or go to <a href="/register">Register</a> page'); 
  }
  res.render("urls_new", templateVars);
});
//go to the website
app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    let URL = "http://" + longURL;
    res.redirect(longURL);
    return ;
  } else {
    res.status(400).send(`You shoud put right shortURL<br>Go to 
    <a href="/urls">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
  }
});
//list of the specific shortURl and longURL
app.get("/urls/:id", (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { shortURL: req.params.id, urls: urlDatabase, user: users[user_id] };
  let loggedInUser = userIsNotLoggedIn(user_id)
  if(!loggedInUser) {
    res.status(400).send(`You shoud login in First or Register<br>Go to 
    <a href="/login">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
  }
  if(req.params.id in urlDatabase) {
    res.render("urls_show", templateVars);
    return ;
  } else {
    res.status(400).send(`You shoud put right shortURL or the shortURL its not yours<br>Go to 
    <a href="/login">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
  }
});
//edit the longURL
app.post("/urls/:id", (req, res) => {
  let newLongURL = req.body.update;
  let shortURL = req.params.id;
  let urls = urlDatabase;
  let userid = req.session.user_id;
  urlDatabase[shortURL] = {
    id : userid,
    longURL: newLongURL
  }
  res.redirect('/urls') 
});
//login page
app.get("/login", (req, res) => {
  let templateVars = { user: users };
  res.render("urls_login", templateVars);
});
//generate a new user
app.post("/login", (req, res) => {
  let email = req.body.email
  let password = req.body.password
  if(email === '' || password === ''){
    res.status(400).send('Email and Password cannot be empty.<br><a href="/login">return login</a>')
  }
  let user = findUserByEmail(email)
  if(!user) {
    res.status(400).send('Email is not existed.<br><a href="/login">return login</a>')
    return ;
  }
  if(bcrypt.compare(password, user.password)) {
    req.session.user_id = user.id
    res.redirect('/urls')
    return ;
  }
  res.status(400).send('Email and Password are not matched.<br><a href="/login">return login</a>')
});
//logout and clear cookie
app.post("/logout", (req, res) => {
  req.session = null; 
  res.redirect('/urls')  
});
//register page
app.get("/register", (req, res) => {
  let templateVars = { user : users };
  res.render("urls_register", templateVars);
});
//create a new user
app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  const bcrypt = require('bcrypt');
  const hashed_password = bcrypt.hashSync(password, 10);
  if(email === '' || hashed_password === ''){
    res.status(400).send('Email and Password cannot be empty.<br><a href="/register">return register</a>');
  }
  let user = findUserByEmail(email);

  if(user) {
    res.status(400).send('Email and Password exist.<br><a href="/register">return register</a>');
    return ;
  }
  users[user_id] = { 
    id: user_id, 
    email: email, 
    password: hashed_password 
  }
  req.session.user_id = user_id;
  res.redirect('/urls')  ;
});
//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});