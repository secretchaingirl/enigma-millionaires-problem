import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

// Responds to initializeEnigma action to save enigma-js client library object
const initializeEnigmaReducer = (enigma = null, action) => {
    if (action.type === 'ENIGMA_INITIALIZED') {
        return action.payload;
    }

    return enigma;
};

// Responds to initializeAccounts action to save web3 accounts
const initializeAccountsReducer = (accounts = [], action) => {
    if (action.type === 'ACCOUNTS_INITIALIZED') {
        return action.payload;
    }

    return accounts;
};

// Responds to deployMillionairesProblem action to save deployed Millionaires' Problem secret contract address
const deployedMillionairesProblemReducer = (deployedMillionairesProblem = null, action) => {
    if (action.type === 'MILLIONAIRES_PROBLEM_DEPLOYED') {
        return action.payload;
    }

    return deployedMillionairesProblem;
};

// Responds to computeRichestMillionaire action to save richest millionaire's address
const computeRichestMillionaireReducer = (richestMillionaire = null, action) => {
    if (action.type === 'RICHEST_MILLIONAIRE_COMPUTED') {
        return action.payload;
    }

    return richestMillionaire;
};

// Responds to notifyMessage action to save snackbar open status and any contained message
const notifyMessageReducer = (notification = { open: false, message: '' }, action) => {
    if (action.type === 'MESSAGE_NOTIFIED') {
        return action.payload;
    }

    return notification;
};

// Combine reducers to state variables named by the keys here; includes a redux-form reducer
export default combineReducers({
    enigma: initializeEnigmaReducer,
    accounts: initializeAccountsReducer,
    deployedMillionairesProblem: deployedMillionairesProblemReducer,
    richestMillionaire: computeRichestMillionaireReducer,
    notification: notifyMessageReducer,
    form: formReducer
});