var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

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

function generateRandomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function findUserByEmail(email) {
  for(let userid in users) {
    if(users[userid].email === email) {
      return users[userid];
  }
  }
  return null;
}

function urlsForUser(id) {
  let result = {};
  for(let shortURL in urlDatabase) {
    if( urlDatabase[shortURL].id === id){
      result[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return result;
}

function userIsNotLoggedIn(userid) {
  if(!userid) {
    return null;
  }
  return userid; 
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
  
  let user_id = req.cookies["user_id"]
  let result = urlsForUser(user_id)
  let templateVars = { urls: result, user: users[user_id]};
  let loggedInUser = userIsNotLoggedIn(user_id)
  if(!loggedInUser) {
    res.status(400).send('You shoud login in First or Register<br>Go to <a href="/login">login</a> in page<br>or go to <a href="/register">Register</a> page');
  }
  res.render("urls_index", templateVars);
});
//generate randomId
app.post("/urls", (req, res) => {
  let randomId = generateRandomString();
  let userid = req.cookies.user_id;
  let editLongURL = req.body.longURL
  urlDatabase[randomId] = {
    id : userid,
    longURL : editLongURL
  }
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
  let user_id = req.cookies["user_id"]
  console.log(user_id, "user_id")
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
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(400).send(`You shoud put right shortURL<br>Go to 
    <a href="/login">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
  }
});
//list of the specific shortURl and longURL
app.get("/urls/:id", (req, res) => {
  let user_id = req.cookies["user_id"]
  let templateVars = { shortURL: req.params.id, urls: urlDatabase, user: users[user_id] };
  let loggedInUser = userIsNotLoggedIn(user_id)
  if(!loggedInUser) {
    res.status(400).send(`You shoud login in First or Register<br>Go to 
    <a href="/login">login</a> in page<br>or go to <a href="/register">
    Register</a> page`);
  }
  res.render("urls_show", templateVars);
});
//edit the longURL
app.post("/urls/:id", (req, res) => {
  let newLongURL = req.body.update;
  let shortURL = req.params.id;
  let urls = urlDatabase;
  let userid = req.cookies.user_id;
  urlDatabase[shortURL] = {
    id : userid,
    longURL: newLongURL
  }
  
  res.redirect('/urls') 
});

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
  //question how can i compare users email is existed or not 

  let user = findUserByEmail(email)
  if(!user) {
    res.status(400).send('Email is not existed.<br><a href="/login">return login</a>')
    return ;
  }

  if(user.password === password) {
    res.cookie('user_id', user.id)
    res.redirect('/urls')
    return ;
  }
  res.status(400).send('Email and Password are not matched.<br><a href="/login">return login</a>')
});
//logout and clear cookie
app.post("/logout", (req, res) => {
  let userId = req.cookies.user_id;
  //question req.cookies[user_id] <- when i use why i get the error
  //console.log(userId)
  res.clearCookie("user_id", userId); 
  res.redirect('/urls')  
});
//register page
app.get("/register", (req, res) => {
  let templateVars = { user : users };
  res.render("urls_register", templateVars);
});
//
app.post("/register", (req, res) => {
  // let templateVars = { email : req.body.email, password : req.body.password }
  let user_id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  if(email === '' || password === ''){
    res.status(400).send('Email and Password cannot be empty.<br><a href="/register">return register</a>')
  }
  let user = findUserByEmail(email);

  if(user) {
    res.status(400).send('Email and Password exist.<br><a href="/register">return register</a>')
    return ;
  }
  users[user_id] = { 
    id: user_id, 
    email: email, 
    password: password 
  }
  res.cookie('user_id', user_id)
  res.redirect('/urls')  
});

//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});