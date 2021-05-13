import axios from 'axios';
import { showAlert } from './alert';

//'type' will be either 'data' or 'password' (cuz we have different api call for changing password)
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/update-password'
        : '/api/v1/users/update-me';

    const res = await axios.patch(url, data);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
      window.location.reload(true); //to refresh the page and show updated data
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
