const express = require('express');
const router = express.Router();
const User = require('../src/models/User');



// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, number, usertype } = req.body;
        const user = new User({ name, email, password, number, usertype });
        await user.save();
        if (usertype === 'Admin') {
            res.redirect('/pg5.HTML');
        } else if (usertype === 'User') {
            res.redirect('/home.HTML');
        } 
        else if (usertype === 'SuperAdmin') {
            res.redirect('/admin.HTML');
        }
        
        else {
            res.status(400).send('Invalid user type');
        }
    } catch (error) {
        res.status(400).send('Error signing up');
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && await user.comparePassword(password)) {
            // Set session variables upon successful login
            req.session.userId = user._id;
            req.session.userType = user.usertype;
            req.session.userName = user.name;

            if (user.usertype === 'Admin') {
                res.redirect('/pg5.HTML'); // Redirect to admin page
            } else if (user.usertype === 'User') {
                res.redirect('/home.HTML');
             } // Redirect to user page 
            else if (user.usertype === 'SuperAdmin') {
                res.redirect('/admin.HTML'); }
             else {
                res.status(400).send('Invalid user type');
            }
        } else {
            res.status(400).send('Invalid email or password');
        }
    } catch (error) {
        res.status(400).send('Error logging in');
    }
});

module.exports = router;
