const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const MillionairesProblemContract = artifacts.require("MillionairesProblem");
const { Enigma, utils, eeConstants } = require('enigma-js/node');

var EnigmaContract;
if (typeof process.env.SGX_MODE === 'undefined' || (process.env.SGX_MODE != 'SW' && process.env.SGX_MODE != 'HW')) {
    console.log(`Error reading ".env" file, aborting....`);
    process.exit();
} else if (process.env.SGX_MODE == 'SW') {
    EnigmaContract = require('../build/enigma_contracts/EnigmaSimulation.json');
} else {
    EnigmaContract = require('../build/enigma_contracts/Enigma.json');
}
const EnigmaTokenContract = require('../build/enigma_contracts/EnigmaToken.json');


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let enigma = null;

contract("MillionairesProblem", accounts => {
    let millionaire1 = accounts[0];
    let millionaire2 = accounts[1];
    let task;

    before(function() {
        enigma = new Enigma(
            web3,
            EnigmaContract.networks['4447'].address,
            EnigmaTokenContract.networks['4447'].address,
            'http://localhost:3333', {
                gas: 4712388,
                gasPrice: 100000000000,
                from: accounts[0],
            },
        );
        enigma.admin();
        enigma.setTaskKeyPair('cupcake');

        contractAddr = fs.readFileSync('test/millionaires_problem.txt', 'utf-8');
    })

    // Helper function to wait for final task completion
    async function finalTaskStatus() {
        do {
            await sleep(1000);
            task = await enigma.getTaskRecordStatus(task);
        } while (task.ethStatus != eeConstants.ETH_STATUS_VERIFIED && task.ethStatus != eeConstants.ETH_STATUS_FAILED);

        return task.ethStatus;
    }

    it('should add millionaire #1', async() => {
        let taskFn = 'add_millionaire(address,uint256)';
        let taskArgs = [
            [millionaire1, 'address'],
            [17000000, 'uint256'],
        ];
        let taskGasLimit = 500000;
        let taskGasPx = utils.toGrains(1);
        task = await new Promise((resolve, reject) => {
            enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, accounts[0], contractAddr)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => reject(error));
        });
        expect(await finalTaskStatus()).to.equal(eeConstants.ETH_STATUS_VERIFIED);
    });

    it('should add millionaire #2', async() => {
        let taskFn = 'add_millionaire(address,uint256)';
        let taskArgs = [
            [millionaire2, 'address'],
            [289487121, 'uint256'],
        ];
        let taskGasLimit = 500000;
        let taskGasPx = utils.toGrains(1);
        task = await new Promise((resolve, reject) => {
            enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, accounts[0], contractAddr)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => reject(error));
        });
        expect(await finalTaskStatus()).to.equal(eeConstants.ETH_STATUS_VERIFIED);
    });

    it('should execute task to compute richest millionaire', async() => {
        let taskFn = 'compute_richest()';
        let taskArgs = [];
        let taskGasLimit = 500000;
        let taskGasPx = utils.toGrains(1);
        task = await new Promise((resolve, reject) => {
            enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, accounts[0], contractAddr)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => reject(error));
        });
        expect(await finalTaskStatus()).to.equal(eeConstants.ETH_STATUS_VERIFIED);
    });

    it('should get the result and verify the computation of richest millionaire is correct', async() => {
        // Get Enigma task result
        task = await new Promise((resolve, reject) => {
            enigma.getTaskResult(task)
                .on(eeConstants.GET_TASK_RESULT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => reject(error));
        });
        expect(task.engStatus).to.equal('SUCCESS');

        // Decrypt Enigma task result
        task = await enigma.decryptTaskResult(task);
        let richestMillionaire = web3.eth.abi.decodeParameters([{
            type: 'address',
            name: 'richestMillionaire',
        }], task.decryptedOutput).richestMillionaire;

        expect(richestMillionaire).to.equal(millionaire2);
    });

});