
// defining a mongoose schema 
// including the module
var mongoose = require('mongoose');
// declare schema object.
var Schema = mongoose.Schema;

var userChatSchema = new Schema({
date    : {type : Date},
message : {type : String, default : ''}
});

mongoose.model('UserChat',userChatSchema);