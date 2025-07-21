const express = require('express');
const app = express();
const path = require('path');
const cookieparser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// const multer = require('multer');
const upload = require('./config/multerconfig.js')

const usermodel = require('./models/user.js');
const postmodel = require('./models/post');
// const crypto = require('crypto');

app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.render("index");
})

//understanding multer

// ---------------------------
app.post('/register', async (req, res) => {

    let { name, username, email, age, password } = req.body;
    let user = await usermodel.findOne({ email });
    if (user) return res.status(500).send("User already exists");
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const newUser = await usermodel.create({
                username,
                email,
                name,
                age,
                password: hash
            });
            let token = jwt.sign({ email, userid: newUser._id }, "secret");
            res.cookie("token", token);
            res.send("registered");
        })
    })

})
app.get('/login', (req, res) => {
    res.render("login");
})
app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await usermodel.findOne({ email });
    if (!user) return res.status(500).send("Something went wrong");
    await bcrypt.compare(password, user.password, (err, result) => {
        if (result) {

            let token = jwt.sign({ email, userid: user._id }, "secret");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        }
        else {
            res.redirect('/login')

        }
        ;
    })
})
app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/login');
})
app.get('/profile/upload', isLoggedIn, (req, res) => {
    res.render("test");
})
//metjod to have protected routes
function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") res.redirect("/login");
    else {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;//hamne request mei user naam ka parameter add kar diya jise hamne dataa bola
        next();
    }

}

//---------------------------------------------------------

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email }).populate("posts");
    ;//kyuki abhi users mei post sirf ek id thi par aap chahte ho ki id na dikhe balki post dikhe, that is ow you handle this
    //n Mongoose (MongoDB's Node.js ODM), the .populate() method is used to replace the IDs in an array with the actual referenced documents from another collection.
    res.render("profile", { user });
})
//-------------------------------------------------------------



app.post('/post', isLoggedIn, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email });
    let { content } = req.body;
    let post = await postmodel.create({
        user: user._id,
        content
    })
    user.posts.push(post._id);
    await user.save();//jab bhi ham manually aise kaam karte hain in that case we need to save it
    res.redirect('/profile');
})
app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postmodel.findOne({ _id: req.params.id }).populate("user");
    if (post.likes.indexOf(req.user.userid) === -1) {//ye -1 tab aata hai jab wo element present nhi hota
        post.likes.push(req.user.userid);
    }
    else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);//else we will dislike that element
    }

    await post.save();
    res.redirect("/profile");
    // console.log(req.user);

})
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postmodel.findOne({ _id: req.params.id }).populate("user");
    res.render("edit", { post })


})
app.post('/edit/:id', isLoggedIn, async (req, res) => {
    let content = req.body.content;
    let updatedPost = await postmodel.findOneAndUpdate({ _id: req.params.id }, { content: content }, { new: true });
    res.redirect('/profile');



})
app.post('/upload', upload.single("image"), isLoggedIn, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email });
    user.dp = req.file.filename;
    await user.save();
    res.redirect('/profile')
})
app.listen(3000, (err) => {
    if (err) console.log("❌ Server error:", err);
    else console.log("✅ Server running on http://localhost:3000");
});
