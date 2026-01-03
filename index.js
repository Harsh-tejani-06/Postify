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
const crypto = require("crypto")
const multer = require("multer");
const { AsyncResource } = require("async_hooks");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, bytes) {
            const fn = bytes.toString("hex") + path.extname(file.originalname)
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

app.get("/profile", isloogedin, async (req, res, next) => {
    try {
        const user = await usermodel
            .findOne({ email: req.user.email })
            .populate("post")
            .populate({
                path: "friends",
                populate: { path: "post" }
            });

        res.render("profile", {
            user,
            Others: user.friends
        });

    } catch (err) {
        next(err);
    }
});



app.get("/profile/:userid", isloogedin, async (req, res) => {
    res.render("Upload_profile")
})

// Finding Friends list Route
app.get("/find-friends", isloogedin, async (req, res) => {
    const userId = req.user.userid;

    // get current logged-in user
    const currentUser = await usermodel.findById(userId);

    // safety check
    if (!currentUser) {
        return res.redirect("/profile");
    }

    // ids of users who are already friends
    const friendIds = currentUser.friends.map(id => id.toString());

    // ids of users to exclude:
    // 1. current user
    // 2. already friends
    const excludeIds = [userId, ...friendIds];

    // find users except current user & friends
    const allUsers = await usermodel.find({
        _id: { $nin: excludeIds }
    });

    // convert sentRequests ObjectIds to string (for EJS includes check)
    const sentRequests = (currentUser.sentRequests || []).map(id =>
        id.toString()
    );

    res.render("Add_Friends_List", {
        allUsers,
        sentRequests
    });
});


// Private Account Get 
app.get("/Private-Account", isloogedin, async (req, res) => {
    const id = req.user.userid;

    const user = await usermodel.findOne({ _id: id });

    if (!user) {
        return res.status(404).send("User not found");
    }

    const statuss = user.Private ? "Private" : "Public";

    res.render("Private_Account", { Status: statuss });
});
// Private Account Post
app.post("/Private-Account", isloogedin, async (req, res) => {
    const id = req.user.userid;

    const user = await usermodel.findById(id);
    user.Private = !user.Private;   // toggle
    await user.save();

    res.redirect("/Private-Account");
});


app.post("/profile/:Userid", isloogedin, upload.single('image'), async (req, res) => {

    const user = await usermodel.findById(req.params.Userid);
    user.images = req.file.filename
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

app.get("/likes/:id", isloogedin, async (req, res) => {
    const post = await postmodel.findById(req.params.id).populate("like");
    // console.log(post)

    const Users = post.like.map(u => ({
        username: u.Username,
        image: u.images   // or u.profilePic
    }));
    console.log(Users)
    res.render("Likes", { "User_names": Users })
})
app.get("/Profile/likes/:id", isloogedin, async (req, res) => {
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
    res.redirect("/posts/:name");
})

app.get("/posts/:name", isloogedin, async function (req, res) {
    let user = await usermodel.findOne({ Username: req.params.name }).populate("post");

    res.render("User-posts", { user });
})

//Friend-List || List of Frieds
app.get("/friend-list", isloogedin, async (req, res) => {
    try {
        // Get the current user's ID
        const userId = req.user.userid;

        // Find the user and populate the 'friends' field.
        // This converts the list of friend IDs into actual User objects
        const user = await usermodel.findOne({ _id: userId }).populate('friends');

        // Extract the friends array (or empty array if none exist)
        const friends = user.friends || [];

        // Render the page passing the 'friends' variable required by your EJS
        res.render("frineds-list", { 
            friends: friends 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong fetching friends.");
    }
});



//Add Friend Request
app.get("/add-friend/:friend_id", isloogedin, async (req, res) => {
    const senderId = req.user.userid;
    const receiverId = req.params.friend_id;

    if (senderId === receiverId) {
        return res.redirect("/find-friends");
    }

    const sender = await usermodel.findById(senderId);
    const receiver = await usermodel.findById(receiverId);

    if (!sender || !receiver) {
        return res.redirect("/find-friends");
    }

    // ✅ check if already friends
    if (sender.friends.includes(receiverId)) {
        return res.redirect("/find-friends");
    }

    // ✅ check if request already sent
    const alreadyRequested = receiver.friendRequests.some(
        req => req.from.toString() === senderId
    );

    if (alreadyRequested) {
        return res.redirect("/find-friends");
    }

    // ✅ push request
    receiver.friendRequests.push({
        from: senderId,
        status: "pending"
    });

    sender.sentRequests.push(receiverId);

    await receiver.save();
    await sender.save();

    res.redirect("/find-friends");
});

//Pull Back Request 
app.get("/pull-friend-request/:friend_id", isloogedin, async (req, res) => {
    const senderId = req.user.userid;
    const receiverId = req.params.friend_id;

    const sender = await usermodel.findById(senderId);
    const receiver = await usermodel.findById(receiverId);

    if (!sender || !receiver) {
        return res.redirect("/find-friends");
    }

    // 🔴 REMOVE receiverId from sender.sentRequests
    sender.sentRequests = sender.sentRequests.filter(
        id => id.toString() !== receiverId
    );

    // 🔴 REMOVE senderId from receiver.friendRequests
    receiver.friendRequests = receiver.friendRequests.filter(
        req => req.from.toString() !== senderId
    );

    await sender.save();
    await receiver.save();

    res.redirect("/find-friends");
});


//Remove Friend Request
app.get("/remove-friend/:id", isloogedin, async (req, res) => {
    const userId = req.user.userid;
    const friendId = req.params.id;

    const user = await usermodel.findById(userId);
    const friend = await usermodel.findById(friendId);

    if (!user || !friend) {
        return res.redirect("/Friend-List");
    }

    // Remove each other from friends list
    user.friends.pull(friendId);
    friend.friends.pull(userId);

    await user.save();
    await friend.save();

    res.redirect("/Friend-List");
});

app.get("/friend-requests", isloogedin, async (req, res) => {
    const user = await usermodel
        .findById(req.user.userid)
        .populate("friendRequests.from", "Username images");

    console.log(user.friendRequests)
    res.render("Friend_requests", {
        requests: user.friendRequests
    });
});

//Accept Friend Request
app.post("/accept-request/:name", isloogedin, async (req, res) => {
    const userId = req.user.userid;   // current logged-in user
    const sender = await usermodel.findOne({ Username: req.params.name });
    const receiver = await usermodel.findById(userId);

    if (!sender || !receiver) {
        return res.redirect("/friend-requests");
    }

    // 1️⃣ Add each other as friends (avoid duplicates)
    if (!receiver.friends.includes(sender._id)) {
        receiver.friends.push(sender._id);
    }

    if (!sender.friends.includes(receiver._id)) {
        sender.friends.push(receiver._id);
    }

    // 2️⃣ REMOVE request from receiver.friendRequests
    receiver.friendRequests = receiver.friendRequests.filter(
        req => req.from.toString() !== sender._id.toString()
    );

    // 3️⃣ REMOVE request from sender.sentRequests
    sender.sentRequests = sender.sentRequests.filter(
        id => id.toString() !== receiver._id.toString()
    );

    await receiver.save();
    await sender.save();

    res.redirect("/friend-requests");
});


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

//Edit Post route
app.get("/edit/:id", isloogedin, async function (req, res) {
    let post = await postmodel.findOne({ _id: req.params.id }).populate("user");
    res.render("edit", { post });
})

app.post("/edit/:id", isloogedin, async function (req, res) {
    let post = await postmodel.findOne({ _id: req.params.id }).populate("user");
    let { content } = req.body;
    post.content = content
    await post.save();
    res.redirect("/profile")
})

//Delete Post route
app.get("/delete/:id", isloogedin, async function (req, res) {
    // let post = await postmodel.findOne({ _id: req.params.id });

    await postmodel.deleteOne({_id:req.params.id})
    // postmodel
    // await postmodel.save();
    res.redirect("/profile")
})

app.get("/logout", function (req, res) {
    res.cookie("token", "");
    res.redirect("/login");
})


//middleware function for cheking if user is logged in or not
function isloogedin(req, res, next) {
    if (!req.cookies || !req.cookies.token) {
        return res.redirect("/login");  // ✅ STOP HERE
    }

    try {
        let data = jwt.verify(req.cookies.token, "password");
        req.user = data;
        next();
    } catch (err) {
        return res.redirect("/login");
    }
}


app.listen(3000);
