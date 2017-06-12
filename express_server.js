'use strict';
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
//Url sample database
const urlDatabase = {};
//users sample database
const users = {};
//configuration
app.set("view engine", "ejs");
//middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [`This is a tinyapp file`],
  maxAge: 24 * 60 * 60 * 1000
}));
//generate Random String(for Users, shortURl id)
function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
  const result = {};
  for(let shortURL in urlDatabase) {
    if( urlDatabase[shortURL].id === id){
      result[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return result;
}
//check user
function userIsNotLoggedIn(userid) {
  if ( !userid ) { return null; }
  return userid;
}
//First page
app.get("/", (req, res) => {
  const userId = req.session.userId;
  const loggedInUser = userIsNotLoggedIn(userId);
  if(!loggedInUser) {
    res.redirect('/login');
    return ;
  } else {
    res.redirect('/urls');
  }
});
//List of URLs in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//Homepage(list of urls)
app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  const result = urlsForUser(userId);
  const templateVars = { urls: result, user: users[userId]};
  const loggedInUser = userIsNotLoggedIn(userId);
  if(!loggedInUser) {
    res.status(401).send('You shoud login First or Register<br>Go to <a href="/login">login</a> in page<br>or go to <a href="/register">Register</a> page');
    return ;
  }
  res.render("urls_index", templateVars);
});
//generate randomId
app.post("/urls", (req, res) => {
  const randomId = generateRandomString();
  const userid = req.session.userId;
  const editLongURL = "http://" + req.body.longURL;
  urlDatabase[randomId] = {
    id: userid,
    longURL: editLongURL
  };
  res.redirect('/urls');
});
//delete the URL
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.userId;
  const loggedInUser = userIsNotLoggedIn(userId);
  if(!loggedInUser) {
    res.redirect('/login');
    return ;
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});
//add a new longURL
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  const templateVars = { urls: urlDatabase, user: users[userId] };
  const loggedInUser = userIsNotLoggedIn(userId);
  if(!loggedInUser) {
    res.status(401).send('You shoud login in First or Register<br>Go to <a href="/login">login</a> in page<br>or go to <a href="/register">Register</a> page');
  }
  res.render("urls_new", templateVars);
});
//go to the website
app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
    return ;
  } else {
    res.status(401).send(`You shoud put right shortURL<br>Go to 
    <a href="/urls">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
  }
});
//list of the specific shortURl and longURL
app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const templateVars = { shortURL: req.params.id, urls: urlDatabase, user: users[userId] };
  const loggedInUser = userIsNotLoggedIn(userId);
  if (loggedInUser) {
    if(req.params.id in urlDatabase) {
      res.render("urls_show", templateVars);
      return ;
    } else {
      res.status(401).send(`You shoud put right shortURL or the shortURL its not yours<br>Go to 
      <a href="/login">login</a> in page<br>or go to <a href="/register">
     Register</a> page`);
      return ;
    }
  } else {
    res.status(401).send(`You shoud login in First or Register<br>Go to 
    <a href="/login">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
    return ;
  }
});
//edit the longURL
app.post("/urls/:id", (req, res) => {
  const newLongURL = req.body.update;
  const shortURL = req.params.id;
  const urls = urlDatabase;
  const userid = req.session.userId;
  const loggedInUser = userIsNotLoggedIn(userid);
  if(loggedInUser) {
    urlDatabase[shortURL] = {
      id: userid,
      longURL: newLongURL
    };
    res.redirect('/urls');
  } else {
    res.status(401).send(`You shoud login in First or Register<br>Go to 
    <a href="/login">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
    return ;
  }
});
//login page
app.get("/login", (req, res) => {
  const templateVars = { user: users };
  res.render("urls_login", templateVars);
});
//generate a new user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if(email === '' || password === ''){
    res.status(401).send('Email and Password cannot be empty.<br><a href="/login">return login</a>');
  }
  
  let user = findUserByEmail(email);
  if(!user) {
    res.status(401).send('Email is not existed.<br><a href="/login">return login</a>');
    return ;
  }
  if(bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/urls');
    return ;
  }
  res.status(401).send('Email and Password are not matched.<br><a href="/login">return login</a>');
});
//logout and clear cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});
//register page
app.get("/register", (req, res) => {
  const templateVars = { user: users };
  res.render("urls_register", templateVars);
});
//create a new user
app.post("/register", (req, res) => {
  let userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if(email === '' || hashedPassword === ''){
    res.status(401).send('Email and Password cannot be empty.<br><a href="/register">return register</a>');
  }
  let user = findUserByEmail(email);
  if(user) {
    res.status(401).send('Email and Password exist.<br><a href="/register">return register</a>');
    return ;
  }
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword
  };
  req.session.userId = userId;
  res.redirect('/urls')  ;
});
//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});