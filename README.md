Frontend Attendance System
Overview
This project is a simple Frontend Attendance System with separate Login and Signup pages and distinct features for Admin and Employee users. It is a frontend-only prototype with dummy data for demonstration purposes.
Features
Common Features
Separate pages for Login and Signup
Responsive layout with basic CSS styling
Dummy user data for testing authentication

Admin Features
View all employee attendance records
Approve or reject leave requests
Manage employee profiles

Employee Features
View own attendance
Submit leave requests
View and update personal profile

Dummy Users
For testing purposes, the system includes 5 dummy users. Use the login credentials provided in the project files.
Pages & Navigation
login.html - Login page for Admin and Employees
signup.html - Registration page for new users (dummy data only)
dashboard.html - Redirected after login depending on user role
Admin dashboard contains attendance list, leave requests, profile management
Employee dashboard contains attendance, leave request submission, profile details

Folder Structure
frontend-attendance/
│
├── index.html          # Optional landing page
├── login.html          # Login page
├── signup.html         # Signup page
├── dashboard.html      # Dashboard for admin/employee
├── css/
│   └── style.css       # Styles for all pages
├── js/
│   └── script.js       # Handles login logic and role-based redirection
└── README.md           # This file

How to Run
Clone the repository or download the project folder.
Open login.html in any browser.
Use the dummy credentials to login as Admin or Employee.
Navigate through the dashboard to explore features.

Notes
This is a frontend-only system; no backend or database integration is implemented.
All user data and actions are simulated with dummy data.
Dashboard features are functional using JavaScript logic only.

Future Enhancements
Add backend support using Node.js/Express or PHP.
Integrate database for real user management.

Add real-time notifications for leave approvals.


Implement role-based access control for secure routing.

