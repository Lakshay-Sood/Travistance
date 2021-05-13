/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  // axios.defaults.baseURL = '127.0.0.1';
  try {
    const res = await axios({
      method: 'post',
      url: '/api/v1/users/login',
      baseURL: 'http://127.0.0.1:8050',
      data: {
        email,
        password
      }
    });

    //res.data is the data object we sent thru our api
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/'); //redirect to homepage after 1.5s
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:8050/api/v1/users/logout');

    if (res.data.status === 'success') {
      showAlert('success', 'Logged out successfully!');
      window.setTimeout(() => {
        location.reload(true); //'true' so that it reloads from server and not just from browser cache
      }, 1500);
    }
  } catch (err) {
    showAlert('error', 'Error loggin out');
  }
};
