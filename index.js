const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const path = require("path");
const exp = require("constants");
const usermodel = require("./model/user");
const postmodel = require("./model/post");
const bcrypt = require("bcrypt");
const { log } = require("console");
const cookieParser = require("cookie-parser");
const user = require("./model/user");
const { name } = require("ejs");
const crypto= require("crypto")
const  multer= require("multer")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12,function (err,bytes){
        const fn = bytes.toString("hex")+path.extname(file.originalname)
        cb(null, fn)
    })
  }
})

const upload = multer({ storage: storage })

app.set("view engine", "ejs");
app.use(cookie()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"))

app.get("/", function (req, res) {
    res.render("index");
})
app.post("/register", async function (req, res) {
    let { name, email, password } = req.body;
    let find = await usermodel.findOne({ email });
    if (find) return res.status(500).send("user already exits");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createuser = await usermodel.create({
                Username: name,
                email,
                password: hash
            })
            let token = jwt.sign({ email: email, userid: createuser._id }, "password");
            res.cookie("token", token);
            res.redirect("/profile");
        })

    })
})
app.get("/login", function (req, res) {
    res.render("login");
})
app.get("/profile", isloogedin, async function (req, res) {

    let user = await usermodel.findOne({ email: req.user.email }).populate("post");
    const Other_users = await usermodel.find({
    _id: { $ne: user._id } }).populate("post");

    res.render("profile", { user,"Others":Other_users });
})

app.get("/profile/:userid",isloogedin,async (req,res)=>{
    res.render("Upload_profile")
})
app.post("/profile/:Userid",isloogedin, upload.single('image'),async (req,res)=>{

   const user = await usermodel.findById(req.params.Userid);
    user.images= req.file.filename
    await user.save()

    res.redirect("/profile")
})

app.get("/like/:postId", isloogedin, async (req, res) => {
    const post = await postmodel.findById(req.params.postId);
    let data = jwt.verify(req.cookies.token, "password");
    // console.log(data)
    const userId = data.userid;
    // console.log(userId)
    if (!post) {
        return res.status(404).send("Post not found");
    }
    
    if (post.like.includes(userId)) {
        post.like.pull(userId);   // unlike
    } else {
        post.like.push(userId);   // like
    }

    await post.save();
    res.redirect("/profile");
});

app.get("/likes/:id",isloogedin,async (req,res)=>{
    const post = await postmodel.findById(req.params.id).populate("like");
    // console.log(post)

        const Users = post.like.map(u => ({
        username: u.Username,
        image: u.images   // or u.profilePic
    }));
    console.log(Users)
    res.render("Likes",{"User_names":Users})
})

app.get("/posts/:name",isloogedin,async function (req,res){
    let user = await usermodel.findOne({Username:req.params.name}).populate("post");

    res.render("User-posts",{user});
})
app.post("/create_post", isloogedin, async function (req, res) {
    let user = await usermodel.findOne({ email: req.user.email });
    let { content } = req.body;
    let post = await postmodel.create({
        user: user._id,
        content,
    })
    user.post.push(post._id);
    await user.save();
    res.redirect("/profile");

})
app.post("/login", async function (req, res) {
    let { email, password } = req.body;
    let find = await usermodel.findOne({ email });
    if (!find) return res.status(500).send("somthing went wrong!");
    bcrypt.compare(password, find.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: find._id }, "password");
            res.cookie("token", token);
            res.redirect("/profile");
        }
        else res.redirect("/login");
    })
})
app.get("/edit/:id",isloogedin,async function(req,res){
    let post= await postmodel.findOne({_id:req.params.id}).populate("user");
    res.render("edit",{post}); 
})

app.post("/edit/:id",isloogedin,async function (req,res){
    let post= await postmodel.findOne({_id:req.params.id}).populate("user");
    let {content} = req.body;
    post.content= content
    await post.save();
    res.redirect("/profile")
})
app.get("/logout", function (req, res) {
    res.cookie("token", "");
    res.redirect("/login");
})
function isloogedin(req, res, next) {
    if (!req.cookies || !req.cookies.token) res.send("you must be logged in");
    else {
        let data = jwt.verify(req.cookies.token, "password");
        // console.log(data);
        req.user = data;
        next();
    }

}
//middleware function for cheking if user is logged in or not

app.listen(3000);