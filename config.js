const ENV = 'Dev'; // TOGGLE TO 'Prod' FOR PRODUCTION

const DEV_URL = 'https://script.google.com/macros/s/AKfycbwUaKsHpWkPVpQ7Y0RahYTdIcy6K_Wh6lihPyzo6KmY-f1mdIY-A4cAN41I0YwRGK48gg/exec';
const PROD_URL = 'https://script.google.com/macros/s/AKfycbw6GmmwAW7UoSpjNoCnkdeAVDHmA0amBu73hy43NOj77KGggTzXeRvOFhpWA_dDE3k7/exec';

const API_URL = ENV === 'Dev' ? DEV_URL : PROD_URL;
