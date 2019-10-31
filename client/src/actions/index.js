// Redux action for when enigma-js client library has been initialized
export const initializeEnigma = (enigma) => {
    return {
        type: 'ENIGMA_INITIALIZED',
        payload: enigma
    };
};

// Redux action for when web3 accounts have been initialized
export const initializeAccounts = (accounts) => {
    // TODO: change this back to using all accounts after issue is fixed
    return {
        type: 'ACCOUNTS_INITIALIZED',
        //payload: accounts
        // the 10th account is reserved for the enigma_km - @enigmampc/discovery-cli 0.1.3
        payload: accounts.slice(0, 9)
    };
};

// Redux action for when millionaires problem has been deployed to a particular address
export const deployMillionairesProblem = (deployedMillionairesProblem) => {
    return {
        type: 'MILLIONAIRES_PROBLEM_DEPLOYED',
        payload: deployedMillionairesProblem
    };
};

// Redux action for when richest millionaire's address has been computed
export const computeRichestMillionaire = (richestMillionaire) => {
    return {
        type: 'RICHEST_MILLIONAIRE_COMPUTED',
        payload: richestMillionaire
    };
};

// Redux action for notification message has been sent for snackbar display
export const notifyMessage = (notification) => {
    return {
        type: 'MESSAGE_NOTIFIED',
        payload: notification
    };
};