var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session');
var mongoose = require('mongoose');
var moment = require('moment');
var models = require('/Users/wenzt/Desktop/MyNote/models/models.js');

var User = models.User;
var Note = models.Note;
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error', console.error.bind(console, '连接失败'));


var app = express();

app.set('views', path.join('/Users/wenzt/Desktop/MyNote', 'views'));
app.set('view engine', 'ejs');//f name is one of the application settings,
                              // it affects the behavior of the application.

app.use(express.static(path.join('/Users/wenzt/Desktop/MyNote', 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//Mounts the middleware function(s) at the path. If path is not specified, it defaults to “/”.

app.use(session({
    secret: '1234',
    name: 'mynote',
    cookie: {maxAge: 1000 * 60 * 20 * 3 * 24 * 365},  //保存登录状态
    resave: false,
    saveUninitialized: true
}));

app.use(function (req, res, next) {   //提示密码用户名错误
                                      //console.log(1);
                                      //res.locals.user = req.session.user;
    var err = req.session.error;
    //console.log(err);
    //delete req.session.error;
    //res.locals.message = '';
    res.locals.message = '<div class="alert alert-danger alert-dismissible" style="display: none"><button type="button" class="close" data-dissmiss="alert" area-hidden="true">×</button>' + err + '</div>';
    if (req.session.error) {
        //console.log(err);
        res.locals.message = '<div class="alert alert-info alert-dismissible" style="display: block"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' + err + '</div>';
    }
    next();
});


app.get('/', function (req, res) {    //解决未登录情况下进入主页的错误
    if (req.session.user != null) {
        Note.find({author: req.session.user.username}).exec(function (err, allNotes) {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            res.render('index', {
                user: req.session.user,
                //title: '首页',
                notes: allNotes
            });
        })
    }
    else {
        res.render('index', {     // pass a local variable to the view
            user: req.session.user,
            title: '首页',
            //notes:allNotes
        });
    }
});

/*app.get('/detail/', function (req, res) {
 res.render('detail', {
 title: '查看笔记'
 });
 });*/

app.get('/detail/:_id', function (req, res) {
    Note.findOne({_id: req.params._id}).exec(function (err, art) {
        if (err) {
            console.log(err);
            return res.redirect('/')
        }
        if (art) {
            res.render('detail', {
                title: '笔记详情',
                user: req.session.user,
                art: art,
                moment: moment
            })
        }

    });
});


app.get('/post', function (req, res) {
    res.render('post', {
        user: req.session.user,
        title: '发布'
    });
});

app.post('/post', function (req, res) {
    var note = new Note({
        title: req.body.title,
        author: req.session.user.username,
        tag: req.body.tag,
        content: req.body.content
    });

    note.save(function (err, doc) {
        if (err) {
            console.log(err);
            return res.redirect('/post');
        }
        console.log('文章发表!');
        return res.redirect('/');
    });
});

app.get('/register', function (req, res) {
    if (req.session.user) return res.redirect('/');
    else {
        res.render('register', {
            user: req.session.user,
            title: '注册'
        });
    }
});

app.post('/register', function (req, res) {
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;

    if (username.trim().length == 0) {
        console.log('用户名不能为空');
        return res.redirect('/register');
    }

    if (username.trim().length == 0 || passwordRepeat.trim().length == 0) {
        console.log('密码不能为空');
        return res.redirect('/register');
    }

    if (password !== passwordRepeat) {
        console.log('密码输入不一致');
        return res.redirect('/register');
    }

    User.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.redirect('/register');
        }

        if (user) {
            console.log('用户名已经存在');
            return res.redirect('/register');
        }

        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');

        var newUser = new User({
            username: username,
            password: md5password
        });

        newUser.save(function (err, doc) {
            if (err) {
                console.log(err);
                return res.redirect('/register');
            }
            console.log('注册成功!');
            return res.redirect('/');
        })

    })
});


app.get('/login', function (req, res) {   //已经登录的不能再到login
    if (req.session.user) return res.redirect('/');
    else {
        res.render('login', {
            user: req.session.user,
            title: '登录'
        });
    }
});

app.post('/login', function (req, res) {
    var username = req.body.username,
        password = req.body.password;


    User.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.redirect('/login');
        }

        if (!user) {
            console.log('用户名不存在');
            req.session.error = '用户名或密码错误';
            return res.redirect('/login');
        }

        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');

        if (user.password !== md5password) {
            req.session.error = '用户名或密码错误';
            //window.alert('1');
            console.log('密码错误!');
            return res.redirect('/login');
        }

        console.log('登录成功!');
        user.password = null;
        delete user.password;
        req.session.user = user;
        return res.redirect('/');
    })
});


app.get('/quit', function (req, res) {
    req.session.user = null;
    console.log('退出!');
    return res.redirect('/');
});


app.listen(3000, function (req, res) {
    console.log('app is running at port 3000');
});