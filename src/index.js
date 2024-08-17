const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
require("./db/connect");
const bcrypt = require('bcrypt');


const static_path = path.join(__dirname, "../public");
app.use(express.static(static_path));

// Parse incoming request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const Complaint = require('./models/complaint');
const Counter = require('./models/counter');
const User = require('./models/User'); // Adjust the path as per your actual file structure


// Set up session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true  }));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'C:/Users/skrih/Desktop/Railway CMS project/Reference Uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// // Set up multer for file uploads with the new storage path
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'E:\\ECR Internship\\Complaints raise');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);  // Ensure unique filenames
//     }
// });
// const upload = multer({ storage: storage });

const authRoutes = require('../routes/auth');
app.use(authRoutes);

// Initialize the counter for the first time if it doesn't exist
async function initializeCounter() {
    try {
        const counter = await Counter.findOneAndUpdate(
            { name: 'complaintNo' },
            { $setOnInsert: { seq: 0 } },
            { new: true, upsert: true }
        );
        console.log('Counter initialized:', counter);
    } catch (err) {
        console.error('Error initializing counter:', err);
    }
}

initializeCounter();

app.get('/', (req, res) => {
    res.sendFile(path.join(static_path, 'home.html'));
});

// Route to handle complaint form submission
app.post('/complaints', upload.single('reference'), async (req, res) => {
    try {
        const counter = await Counter.findOneAndUpdate(
            { name: 'complaintNo' },
            { $inc: { seq: 1 } },
            { new: true }
        );

        const referenceFile = req.file ? req.file.filename : null;

        const complaintData = {
            employeeNo: req.body.employeeNo,
            employeeName: req.body.employeeName,
            divisionContact: req.body.divisionContact,
            department: req.body.department,
            website: req.body.website,
            module: req.body.module,
            description: req.body.description,
            reference: referenceFile,
            complaintNo: counter.seq,
            currentAdmin: '',
            createdAt: new Date(),
            status: 'Pending'

        };

        const newComplaint = new Complaint(complaintData);
        const savedComplaint = await newComplaint.save();   

        res.status(201).send(`
            <div style="background-color: #4CAF50; color: white; padding: 1rem 2rem; border-radius: 4px; margin-bottom:10px">
                Complaint submitted successfully. Your complaint ID is: <span style="font-weight: bold;">${savedComplaint.complaintNo}</span>
            </div>
            <div style="background-color: #FF0000; color: white; padding: 1rem 2rem; border-radius: 4px;">
                <span style="font-weight: bold;">Kindly note down your Complaint ID for future references</span>
            </div>
        `);
    } catch (err) {
        console.error('Error submitting complaint:', err);
        res.status(500).send('An error occurred while submitting the complaint');
    }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Endpoint to fetch all complaints
app.get('/all-complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find({ status: { $ne: 'Closed' } });
        res.json(complaints);
    } catch (error) {
        res.status(500).send('Error fetching complaints');
    }
});


// Endpoint to fetch all complaints for a specific employeeNo
app.get('/complaints', async (req, res) => {
    try {
        const { employeeNo } = req.query;
        if (!employeeNo) {
            return res.status(400).json({ error: 'Missing parameter: employeeNo' });
        }

        const complaints = await Complaint.find({ employeeNo });
        if (complaints.length > 0) {
            res.json(complaints);
        } else {
            res.status(404).json({ error: 'No complaints found for this employee number.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch complaint details by complaintNo
app.get('/complaint', async (req, res) => {
    try {
        const { employeeNo, complaintNo } = req.query;
        let query;
        if (employeeNo) {
            query = { employeeNo };
        } else if (complaintNo) {
            query = { complaintNo };
        } else {
            return res.status(400).json({ error: 'Missing parameters: employeeNo or complaintNo' });
        }

        const complaint = await Complaint.findOne(query);
        if (complaint) {
            res.json(complaint);
        } else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const Remark = require('./models/remarks');

// Fetch remarks for a specific complaint by complaintNo
app.get('/complaints/:complaintNo/remarks', async (req, res) => {
    try {
        const { complaintNo } = req.params;
        const complaint = await Complaint.findOne({ complaintNo });
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        const remarks = await Remark.find({ complaintNo });
        res.json(remarks);
    } catch (error) {
        console.error('Error fetching remarks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Endpoint to fetch admin users
app.get('/admins', async (req, res) => {
    try {
        const admins = await User.find({ usertype: 'Admin' }, 'name').exec();
        res.json(admins);
    } catch (error) {
        console.error('Error fetching admin users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Add a new remark for a specific complaint by complaintNo
app.post('/complaints/:complaintNo/remarks', async (req, res) => {
    try {
        const { complaintNo } = req.params;
        const remark = new Remark({
            complaintNo,
            text: req.body.text
        });
        const savedRemark = await remark.save();

        // If an admin is specified, update the current admin for the complaint
        if (req.body.admin) {
            await Complaint.findOneAndUpdate(
                { complaintNo },
                { currentAdmin: req.body.admin }
            );
        }

        res.status(201).json(savedRemark);
    } catch (error) {
        console.error('Error adding remark:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch complaint details by complaintNo
app.get('/complaints/:complaintNo', async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ complaintNo: req.params.complaintNo });
        if (complaint) {
            res.json(complaint);
        } else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/current-admin', (req, res) => {
    if (req.session.userName) {
        res.json({ currentAdmin: req.session.userName });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});



app.get('/complaints/assigned/:currentAdmin', async (req, res) => {
    const admin = req.params.currentAdmin;
    console.log(`Fetching complaints for admin: ${admin}`);

    try {
        const complaints = await Complaint.find({ currentAdmin: admin, status: { $ne: 'Closed' } }).exec();
        console.log(`Found complaints: ${JSON.stringify(complaints)}`);
        res.json(complaints);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).send('Error fetching complaints');
    }
});


// Endpoint to delete a complaint by complaintNo
app.delete('/complaints/:complaintNo', async (req, res) => {
    try {
        const { complaintNo } = req.params;
        const deletedComplaint = await Complaint.findOneAndDelete({ complaintNo });

        if (deletedComplaint) {
            res.status(200).json({ message: 'Complaint deleted successfully' });
        } else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a new user
app.post('/users', async (req, res) => {
    try {
        const { name, email, password, number, usertype } = req.body;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            number,
            usertype
        });

        const savedUser = await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: savedUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a user by email
app.delete('/users/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const deletedUser = await User.findOneAndDelete({ email });

        if (deletedUser) {
            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({ usertype: 'User' });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Routes to fetch total complaints, total admins, complaints by month, and complaints by website
app.get('/reports/total-complaints', async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        res.json({ totalComplaints });
    } catch (error) {
        console.error('Error fetching total complaints:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/reports/total-admins', async (req, res) => {
    try {
        const totalAdmins = await User.countDocuments({ usertype: 'Admin' });
        res.json({ totalAdmins });
    } catch (error) {
        console.error('Error fetching total admins:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// app.get('/reports/complaints-by-month', async (req, res) => {
//     try {
//         const complaintsByMonth = await Complaint.aggregate([
//             {
//                 $group: {
//                     _id: { $month: "$createdAt" },
//                     count: { $sum: 1 }
//                 }
//             },
//             { $sort: { _id: 1 } }
//         ]);
//         res.json(complaintsByMonth);
//     } catch (error) {
//         console.error('Error fetching complaints by month:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
// Complaints by month endpoint
app.get('/reports/complaints-by-month', async (req, res) => {
    try {
        const complaintsByMonth = await Complaint.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json(complaintsByMonth);
    } catch (error) {
        res.status(500).send('Error fetching complaints by month');
    }
});
// Complaints by date range endpoint
app.get('/reports/complaints-by-date-range', async (req, res) => {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);

    try {
        const complaints = await Complaint.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        });
        res.json(complaints);
    } catch (error) {
        res.status(500).send('Error fetching complaints by date range');
    }
});
app.get('/reports/complaints-by-website', async (req, res) => {
    try {
        const complaintsByWebsite = await Complaint.aggregate([
            {
                $group: {
                    _id: "$website",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(complaintsByWebsite);
    } catch (error) {
        console.error('Error fetching complaints by website:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Closed complaints endpoint
app.get('/reports/closed-complaints', async (req, res) => {
    try {
        const totalClosedComplaints = await Complaint.countDocuments({ status: 'Closed' });
        res.json({ totalClosedComplaints });
    } catch (error) {
        res.status(500).send('Error fetching closed complaints');
    }
});

// Processing complaints endpoint
app.get('/reports/processing-complaints', async (req, res) => {
    try {
        const totalProcessingComplaints = await Complaint.countDocuments({ status: 'Forwarded' });
        res.json({ totalProcessingComplaints });
    } catch (error) {
        res.status(500).send('Error fetching processing complaints');
    }
});





app.patch('/complaints/:complaintNo', async (req, res) => {
    const { complaintNo } = req.params;
    const { status, currentAdmin } = req.body;
  
    try {
      const updateFields = {};
      if (status) updateFields.status = status;
      if (currentAdmin) updateFields.currentAdmin = currentAdmin;
  
      const updatedComplaint = await Complaint.findOneAndUpdate(
        { complaintNo },
        { $set: updateFields },
        { new: true }
      );
  
      if (!updatedComplaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }
  
      res.json(updatedComplaint);
    } catch (error) {
      res.status(500).json({ message: 'Error updating complaint', error });
    }
  });
// Endpoint to get the current user's name
app.get('/current-user', (req, res) => {
    if (req.session.userName) {
        res.json({ userName: req.session.userName });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});