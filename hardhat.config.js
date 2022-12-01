require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")
/** @type import('hardhat/config').HardhatUserConfig */
const GOERLI = process.env.GOERLI_URL || ""
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 2
    }
  },
  localhost: {
    url: "http://127.0.0.1:8545/",
    chainId: 31337
  },
  solidity: {
    compilers: [{ version: "0.8.8" }, { version: "0.6.6" }]
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  //Use to keep track of accounts that are deploying contracts
  namedAccounts: {
    deployer: {
      //if using default network, use account (private key) in 0th position
      default: 0
    },
    user: {
      default: 1
    }
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true
  }
}
