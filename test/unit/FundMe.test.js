const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function() {
      let fundMe
      let deployer
      let mockV3Aggregator
      const sendValue = ethers.utils.parseEther("1") // 1 ETH
      beforeEach(async function() {
        //get deployer from namedAccounts
        deployer = (await getNamedAccounts()).deployer
        //deploy all deploy-contracts tagged 'all'
        await deployments.fixture(["all"])
        //Fetch the latest FundMe contract
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      //assert that something is true
      describe("constructor", async function() {
        it("sets the aggregator addresses correctly", async function() {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      //expect something to fail
      describe("fund", async function() {
        it("Fails if you don't send enough ETH", async function() {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })

        it("updates the amount funded data structure", async function() {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })

        it("adds funder to array of getFunder", async function() {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("Withdraw", async function() {
        beforeEach(async function() {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single founder", async function() {
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })

        it("Withdraw ETH from multiple founders", async function() {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //Make sure getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
        it("Only allows owner to withdraw", async function() {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
        })

        it("cheaper withdraw", async function() {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //Make sure getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
