const axios = require('axios');

function test(){
    axios.post(`https://metapong-contract.onrender.com/api/tournament/reset`)
    .then(res=>res.json())
    .then(res => console.log(res.data))
    .catch(err => console.log(err))
}

test()
