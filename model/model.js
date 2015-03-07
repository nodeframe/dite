var tungus = require('tungus');
var mongoose = require('mongoose');
var repository = mongoose.Schema({
    pname: String,
    url: String,
    credential: {
        username: String,
        password: String
    },
    path: String,
    branch: String,
    status: String,
    released: Date
});

var Repository = mongoose.model('Repository', repository);

exports.Repository = Repository; 