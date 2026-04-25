const axios = require('axios');

(async () => {
  // 1. Login as tenant
  const loginRes = await axios.post('http://localhost:3000/api/v1/auth/tenant/login', {
    phone: '13800000001',
    password: '123456'
  });
  const token = loginRes.data.data.token;
  console.log('Tenant token:', token);

  // 2. Fetch form config
  const res = await axios.get('http://localhost:3000/api/v1/tenant/form-config/work_order_create', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Form config response:', JSON.stringify(res.data, null, 2));
})();
