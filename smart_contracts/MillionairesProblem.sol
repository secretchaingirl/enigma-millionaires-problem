pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract MillionairesProblem {
    address private owner;
    address private scAuthorized;

    address[] private registeredMillionaires;

    constructor
            (
            )
            public
    {
        owner = msg.sender;
    }

    modifier onlyEnigma() {
        require(msg.sender == scAuthorized, "only Enigma is authorized");
        _;
    }

    modifier onlyOwner()
    {
        require(msg.sender == owner, "only contract owner is authorized");
        _;
    }
}
