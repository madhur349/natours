// Import axios from CDN
const axios = window.axios;

// Configure axios defaults
axios.defaults.baseURL = '/api/v1';
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default axios; 