import { displayMap } from "./mapbox.js";
import { login, logout } from "./loginn.js";
import { updateSettings} from "./updateSettings.js";
import { showAlert } from "./alerts.js";
import { bookTour } from "./stripe.js";
// DOM ELEMENTS
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookTourBtn = document.getElementById("bookTourBtn");

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener("click", logout);

if (userDataForm) {
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("photo", document.getElementById("photo").files[0]);
    updateSettings(formData,'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    updateSettings({passwordCurrent,password,passwordConfirm},'password');
  });
}

// Book tour directly from tour page
if (bookTourBtn) {
  bookTourBtn.addEventListener("click", async (e) => {
    e.target.textContent = "Processing...";
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  })
}