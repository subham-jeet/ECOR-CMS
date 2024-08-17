const express = require('express');
const multer = require('multer');
const Complaint = require('../models/Complaint');
const router = express.Router();
// const Counter = require('../models/counter');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Route to handle form submissions
router.post('/complaints', upload.single('reference'), async (req, res) => {
    try {
        const { employeeNo, employeeName, divisionContact, department, website, module, description } = req.body;
        const reference = req.file ? req.file.path : null;

        // Get the next sequence value
        // const counter = await Counter.findOneAndUpdate(
        //     { name: 'complaintId' },
        //     { $inc: { seq: 1 } },
        //     { new: true, upsert: true, returnOriginal: false } // `returnOriginal: false` ensures the updated document is returned
        // );
        // console.log('Counter after increment:', counter);

        const complaint = new Complaint({
            // complaintId: counter.seq,  // Assign the incremented ID
            employeeNo,
            employeeName,
            divisionContact,
            department,
            website,
            module,
            description,
            reference
        });

        await complaint.save();
        res.status(201).send(`Complaint submitted successfully`);
        console.log(complaint._id)
    } catch (error) {
        console.error(`Error submitting complaint: ${error.message}`);
        res.status(400).send('Error submitting complaint');
    }
});

module.exports = router;
