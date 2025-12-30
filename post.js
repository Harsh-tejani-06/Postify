const mongoose = require("mongoose");


const postSchema = new mongoose.Schema({
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        },
        date:{
            type:Date,
            default: Date.now
        },
        content:String,
    like:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  }
  ]
});

// Use 'userSchema' instead of the incorrect 'userschema'
module.exports = mongoose.model('post', postSchema);
