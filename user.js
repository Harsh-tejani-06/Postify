const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/min-project-1");

const userSchema = new mongoose.Schema({
  Username: String,
  email: String,
  password: String,
  post:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"post"
    }
  ],
  images:{
    type:String,
    default:"Defult.png"
  },
  Private:{
    type:Boolean,
    default:false
  },
  friends: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "user"
}],

friendRequests: [{
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  status: {
    type: String,
    enum: ["pending", "accepted"],
    default: "pending"
  }
}],
sentRequests:[{
  type:mongoose.Schema.Types.ObjectId,
  ref:"user"
}]

});

// Use 'userSchema' instead of the incorrect 'userschema'
module.exports = mongoose.model('user', userSchema);
