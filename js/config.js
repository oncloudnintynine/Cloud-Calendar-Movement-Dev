const ENV = 'Dev'; // TOGGLE TO 'Prod' FOR PRODUCTION

const DEV_URL = 'https://script.google.com/macros/s/AKfycbzEFd3-Bu1-h1oUKNwz8kEE8qyfMP9KzooIoIszVpL4LDXaSyn_xiPCYJrG_nJfUE2hZQ/exec';
const PROD_URL = 'https://script.google.com/macros/s/AKfycbw6GmmwAW7UoSpjNoCnkdeAVDHmA0amBu73hy43NOj77KGggTzXeRvOFhpWA_dDE3k7/exec';

const API_URL = ENV === 'Dev' ? DEV_URL : PROD_URL;
