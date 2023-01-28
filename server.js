// requires
const express = require("express");
const path = require("path");
const crypto = require('crypto');
const session = require('express-session');
const passport = require('passport');
const fileupload = require("express-fileupload");
const mongoose = require("mongoose");
const ejs = require("ejs");
const fs = require('fs');
const passportLocalMongoose = require("passport-local-mongoose");

const date = new Date();
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];


// app
app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());
app.use(express.json());
app.use(session(
    {
        secret: 'mySecret', resave: false, saveUninitialized: false,
    }));
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT



// mongoose

mongoose.connect('mongodb+srv://babaef:ronaldoo123@cluster0.yljpnc2.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true });

// bloggi

const blogSchema = new mongoose.Schema({
    title: String,
    article: String,
    bannerImage: {
        data: Buffer,
        contentType: String
    },
    publishedAt: String
})

const Blog = new mongoose.model("blog", blogSchema);

// user

const userSchema = new mongoose.Schema({
    username: String,
    password: String
})
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

// serialize


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


// routes
// get

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});


app.get("/", (req, res) => {
    console.log(req.user)
    req.session.filepath = null;
    Blog.find(function (err, result) {

        if (err) {
            console.log(err);
        }
        if (result.length === 0) {
            res.render(__dirname + "/views/home", {
                newitem: null,
                user: req.user
            })
        } else {
            res.render(__dirname + "/views/home", { newitem: result, user: req.user })
        }
    })
})
app.get("/favicon.ico", (req, res) => {
    res.sendStatus(404);
});

app.get("/login", function (req, res) {
    console.log(req.user)
    res.render(__dirname + "/views/login")
});

app.get("/register", function (req, res) {
    res.render(__dirname + "/views/register")
});


app.get("/editor", (req, res) => {
    if (req.isAuthenticated()) {
        console.log(req.user);
        const filepathim = req.session.filepath;
        if (filepathim) {
            res.render(__dirname + "/views/editor", { imagepath: "/img/" + `${filepathim.name}` });
        } else {
            res.render(__dirname + "/views/editor", { imagepath: null });
        }
    } else {
        res.redirect("/login")
    }
})

app.get("/:blog", (req, res) => {
    const item_id = req.params.blog;
    console.log(item_id)

    Blog.findOne({ _id: item_id }, function (err, result) {
        if (err) {
            res.send(err)
        } else {

            res.render(__dirname + "/views/blog", {
                nthblog: result, image: result.bannerImage.data.toString('base64')
            })
        }
    })

})

// post

app.post("/editor", (req, res) => {
    const title = req.body.title;
    const article = req.body.article;
    const d = `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
    console.log(req.session.fileim)
    const newblog = new Blog({
        title: title,
        article: article,
        bannerImage: {
            data: fs.readFileSync(path.join(req.session.fileim)),
            contentType: 'image/png'
        },
        publishedAt: d.toString()
    })
    newblog.save();
    res.redirect("/");
})



app.post('/upload', function (req, res) {
    const file = req.files.upload;

    const filePath = path.join(__dirname, 'public', 'img', `${file.name}`)

    req.session.filepath = file;
    req.session.fileim = filePath;
    file.mv(filePath, err => {
        if (err) return res.status(500).send(err)
        res.redirect("/editor");
    })
})


app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/editor");
            })
        }
    })
})

app.post("/login", (req, res) => {
    const email = req.body.email;
    User.findOne({ username: email }, function (err, u) {
        if (err) {
            console.log(err);
        } else {
            if (u) {
                u.authenticate(req.body.password, (err, model, info) => {
                    if (info) {
                        res.send("Wrong email or password!");
                    }
                    if (err) {
                        console.log(err);
                    } else if (model) {
                        req.login(u, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                passport.authenticate("local");
                                req.session.save((error) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.redirect("/");
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.send("Wrong email or password!");
            }
        }
    });
});


app.listen(port, () => {
    console.log("listeninggggg.....");
})