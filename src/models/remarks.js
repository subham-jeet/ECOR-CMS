// const mongoose = require('mongoose');

// const remarkSchema = new mongoose.Schema({
//     complaintId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Complaint',
//         required: true
//     },
//     text: {
//         type: String,
//         required: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// const Remark = mongoose.model('Remark', remarkSchema);

// module.exports = Remark;
const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
    complaintNo: {
        type: Number, // Assuming complaintNo is of type Number
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Remark = mongoose.model('Remark', remarkSchema);

module.exports = Remark;
