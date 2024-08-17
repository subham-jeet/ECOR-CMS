const loginBtn = document.getElementById("login-btn");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const body = document.body;
const contentFrame = document.getElementById("content-frame");
const sidebarLinks = document.querySelectorAll('.sidebar ul li');

loginBtn.addEventListener("click", function() {
  window.location.href = "login.html"; // Open login.html in the same tab
});

darkModeToggle.addEventListener("click", function() {
  body.classList.toggle("dark-mode");
});

// Add active class to the current button
sidebarLinks.forEach(link => {
  link.addEventListener('click', function() {
    sidebarLinks.forEach(item => item.classList.remove('active'));
    this.classList.add('active');
  });
});
