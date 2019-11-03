#![no_std]

use eng_wasm::*;
use eng_wasm_derive::pub_interface;
use serde::{Serialize, Deserialize};

// Encrypted state keys
static MILLIONAIRES: &str = "millionaires";

#[derive(Serialize, Deserialize)]
pub struct Millionaire {
	address: H160,
	net_worth: U256,
}

struct MillionairesContract;

#[pub_interface]

impl MillionairesContract {
	// private
	fn get_millionaires() -> Vec<Millionaire> {
		read_state!(MILLIONAIRES).unwrap_or_default()
	}

	// public
	pub fn add_millionaire(address: H160, net_worth: U256) {
		let mut millionaires = Self::get_millionaires();
		millionaires.push(
			Millionaire {
				address,
				net_worth,
			}
		);

		write_state!(MILLIONAIRES => millionaires);
	}

	pub fn compute_richest() -> H160 {
		match Self::get_millionaires().iter().max_by_key(|m| m.net_worth) {
			Some(millionaire) => {
				millionaire.address
			},
			None => H160::zero(),
		}
	}
}

