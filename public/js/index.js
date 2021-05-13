/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { stripeSession } from './stripe';

// console.log('hello from index');

// # DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.login-form .form');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookTourButton = document.querySelector('#book-tour-btn');

// VALUES

// # DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations); //dataset property converts the name to camelCase
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (updateDataForm) {
  updateDataForm.addEventListener('submit', e => {
    e.preventDefault();

    // we need to send data as "multipart formdata" cuz thats how photo can be sent
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    const saveBtn = document.querySelector('.btn--save-password');
    saveBtn.textContent = 'Updating...';

    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    await updateSettings(
      { currentPassword, password, confirmPassword },
      'password'
    );

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    saveBtn.textContent = 'Save Password';
  });
}

if (bookTourButton) {
  const tourId = bookTourButton.dataset.tourId; //dataset property converts the name to camelCase
  bookTourButton.addEventListener('click', async () => {
    bookTourButton.textContent = 'Processing...';
    await stripeSession(tourId);
    bookTourButton.textContent = 'Book tour now!';
  });
}
