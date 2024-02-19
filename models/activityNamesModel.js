const mongoose = require('mongoose'); const activityNamesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        unique: true,
    }
})

var studentdata = mongoose.model('studentdata', activityNamesSchema);
module.exports = studentdata;