require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.26",
  networks:
    {
      crossfi:{
        accounts:[process.env.PRIVATE_KEY],
        url:process.env.RPC_URL
      }
    }
};
