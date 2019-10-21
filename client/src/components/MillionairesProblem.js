// Imports - React
import React, { Component } from 'react';
// Imports - Redux
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
// Imports - Frameworks (Semantic-UI and Material-UI)
import { Message } from "semantic-ui-react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import FormControl from "@material-ui/core/FormControl/FormControl";
import InputLabel from "@material-ui/core/InputLabel/InputLabel";
import Select from "@material-ui/core/Select/Select";
import TextField from "@material-ui/core/TextField/TextField";
// Imports - Components
import Notifier, {openSnackbar} from "./Notifier";
// Imports - Reducers (Redux)
import { computeRichestMillionaire } from "../actions";
// Imports - enigma-js client library utility packages
import { utils, eeConstants } from 'enigma-js';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class MillionairesProblem extends Component {
    constructor(props) {
        super(props);
        this.onAddMillionaire = this.onAddMillionaire.bind(this);
        this.onComputeRichest = this.onComputeRichest.bind(this);
    }

    // Redux form/material-ui render address select component
    static renderAddressInput({input, label, meta: { touched, error }, children, ...custom }) {
        return (
            <div>
                <FormControl error={touched && error} fullWidth>
                    <Select
                        native
                        {...input}
                        {...custom}
                        inputProps={{
                            name: 'millionaireAddress',
                            id: 'millionaire-address'
                        }}
                    >
                        {children}
                    </Select>
                </FormControl>
            </div>

        )
    }

    // Redux form/material-ui render net worth text field component
    static renderNetWorthInput({label, input, meta: { touched, invalid, error }, ...custom }) {
        return (
            <TextField
                label={label}
                type="number"
                placeholder={label}
                error={touched && invalid}
                helperText={touched && error}
                {...input}
                {...custom}
                fullWidth
            />
        )
    }

    // Redux form callback when add millionaire info is submitted
    async onAddMillionaire({ millionaireAddress, millionaireNetWorth } ) {
        // Create compute task metadata
        // computeTask(
        //      fn - the signature of the function we are calling (Solidity-types, no spaces)
        //      args - the args passed into our method w/ format [[arg_1, type_1], [arg_2, type_2], …, [arg_n, type_n]]
        //      gasLimit - ENG gas units to be used for the computation task
        //      gasPx - ENG gas price to be used for the computation task in grains format (10⁸)
        //      sender - Ethereum address deploying the contract
        //      scAddr - the secret contract address for which this computation task belongs to
        // )
        const taskFn = 'add_millionaire(address,uint256)';
        const taskArgs = [
            [millionaireAddress, 'address'],
            [millionaireNetWorth, 'uint256'],
        ];
        const taskGasLimit = 10000000;
        const taskGasPx = utils.toGrains(1e-7);
        let task = await new Promise((resolve, reject) => {
            this.props.enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, millionaireAddress,
                this.props.deployedMillionairesProblem)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => {
                    if (error.hasOwnProperty('message')){
                        openSnackbar({ message: error.message});
                    }
                    reject(error);
                });
        });
        openSnackbar({ message: 'Task pending: adding millionaire' });
        while (task.ethStatus === 1) {
            // Poll for task record status and finality on Ethereum after worker has finished computation
            task = await this.props.enigma.getTaskRecordStatus(task);
            await sleep(1000);
        }
        // ethStatus === 2 means task has successfully been computed and committed on Ethereum
        task.ethStatus === 2 ?
            openSnackbar({ message: 'Task succeeded: added millionaire' })
            :
            openSnackbar({ message: 'Task failed: did not add millionaire' })
        ;
        this.props.reset('addMillionaire');
    }

    // Callback when compute richest button is clicked
    async onComputeRichest() {
        // Create compute task metadata
        const taskFn = 'compute_richest()';
        const taskArgs = [];
        const taskGasLimit = 10000000;
        const taskGasPx = utils.toGrains(1e-7);
        let task = await new Promise((resolve, reject) => {
            this.props.enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, this.props.accounts[0],
                this.props.deployedMillionairesProblem)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => {
                    if (error.hasOwnProperty('message')){
                        openSnackbar({ message: error.message});
                    }
                    reject(error);
                });
        });
        openSnackbar({ message: 'Task pending: computing richest millionaire' });
        while (task.ethStatus === 1) {
            task = await this.props.enigma.getTaskRecordStatus(task);
            await sleep(1000);
        }
        if (task.ethStatus === 2) {
            openSnackbar({ message: 'Task succeeded: computed richest millionaire' });
            // Get task result by passing in existing task - obtains the encrypted, abi-encoded output
            task = await new Promise((resolve, reject) => {
                this.props.enigma.getTaskResult(task)
                    .on(eeConstants.GET_TASK_RESULT_RESULT, (result) => resolve(result))
                    .on(eeConstants.ERROR, (error) => reject(error));
            });
            // Decrypt the task result - obtains the decrypted, abi-encoded output
            task = await this.props.enigma.decryptTaskResult(task);
            // Abi-decode the output to its desired components
            const richestMillionaireAddress = this.props.enigma.web3.eth.abi.decodeParameters([{
                type: 'address',
                name: 'richestMillionaire',
            }], task.decryptedOutput).richestMillionaire;
            this.props.computeRichestMillionaire(richestMillionaireAddress);
        } else {
            openSnackbar({ message: 'Task failed: did not compute richest millionaire' });
        }
    }

    render() {
        if (this.props.deployedMillionairesProblem === null) {
            return (
                <div>
                    <Message color="red">Millionaires' Problem secret contract not yet deployed...</Message>
                </div>
            )
        }
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <h3>Millionaires Problem Secret Contract Address: {this.props.deployedMillionairesProblem}</h3>
                    </Grid>
                    <Grid item xs={6}>
                        <div>
                            <Notifier />
                            <h4>Enter Millionaire Details</h4>
                            <form>
                                <div>
                                    <InputLabel htmlFor="millionaire-address">Address</InputLabel>
                                    <Field
                                        name="millionaireAddress"
                                        component={MillionairesProblem.renderAddressInput}
                                    >
                                        <option value="" />
                                        {this.props.accounts.map((account, i) => {
                                            return (
                                                <option key={i} value={account}>{account}</option>
                                            );
                                        })}
                                    </Field>
                                </div>
                                <div>
                                    <Field
                                        name="millionaireNetWorth"
                                        component={MillionairesProblem.renderNetWorthInput}
                                        label="Net Worth"
                                    />
                                </div>
                                <br />
                                <div>
                                    <Button
                                        onClick={this.props.handleSubmit(this.onAddMillionaire)}
                                        variant='outlined'
                                        color='secondary'>
                                        Submit
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Grid>
                    <Grid item xs={6}>
                        <div>
                            <h4>Richest Millionaire</h4>
                            <p>
                                {
                                    this.props.richestMillionaire !== null ?
                                        this.props.richestMillionaire
                                        :
                                        "TBD"
                                }
                            </p>
                            <Button
                                onClick={this.onComputeRichest}
                                variant='contained'
                                color='primary'>
                                Compute Richest
                            </Button>
                        </div>
                    </Grid>
                </Grid>
            </div>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        enigma: state.enigma,
        accounts: state.accounts,
        deployedMillionairesProblem: state.deployedMillionairesProblem,
        richestMillionaire: state.richestMillionaire
    }
};
export default connect(mapStateToProps, { computeRichestMillionaire })(reduxForm({
    form: 'addMillionaire',
})(MillionairesProblem));
