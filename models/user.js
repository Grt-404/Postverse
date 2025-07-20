const mongoose = require('mongoose');
const post = require('./post');

mongoose.connect('mongodb://127.0.0.1:27017/mini-project'); // fixed URI

const userSchema = mongoose.Schema({
    username: {
        type: String
    },
    name: String,
    age: Number,
    email: String,
    //saying tat post is an array of id
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,//iska matlab hota hai ki iska type ek id hai
            ref: post
        }
    ],
    password: String
});

// prevent OverwriteModelError
module.exports = mongoose.model('user', userSchema);
