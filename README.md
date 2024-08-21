
# ECOR-CMS

The ECOR-CMS is a powerful internal tool designed to empower East Coast Railway employees to efficiently manage and resolve complaints with ease and precision.


## Features

- User registration and login
- Submit complaints with file uploads
- View complaints submitted by the user
- Admin dashboard to view and manage complaints
- Forward complaints to specific admins
- Add remarks to complaints
- Delete complaints
- Dynamic fetching of admin names


## Technologies Used
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Frontend: HTML, CSS, JavaScript
- File Uploads: Multer
- Authentication: bcrypt, express-session
## Usage

- Submit a complaint: Fill out the complaint form and submit it. You will receive a complaint ID for future references.

- View complaints: Log in with your credentials to view the complaints you have submitted.

- Admin management: Admins can log in to view all complaints, forward them to other admins, add remarks, and close complaints.

## Project Structure
```bash
complaint-management-system/
├── public/
│   ├── home.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   └── ...
├── routes/
│   └── auth.js
├── models/
│   ├── User.js
│   ├── complaint.js
│   ├── counter.js
│   └── remarks.js
├── db/
│   └── connect.js
├── uploads/
├── .env
├── index.js
├── package.json
└── README.md
```
