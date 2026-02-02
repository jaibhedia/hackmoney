import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        // Arc Testnet
        arcTestnet: {
            url: "https://5042002.rpc.thirdweb.com",
            chainId: 5042002,
            accounts: process.env.DEPLOYER_PRIVATE_KEY
                ? [process.env.DEPLOYER_PRIVATE_KEY]
                : [],
            // Arc uses USDC for gas, so no native currency needed
        },
        // Local development
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        // Hardhat network for testing
        hardhat: {
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: {
            arcTestnet: process.env.ARC_EXPLORER_API_KEY || "",
        },
        customChains: [
            {
                network: "arcTestnet",
                chainId: 5042002,
                urls: {
                    apiURL: "https://explorer.arc.network/api",
                    browserURL: "https://explorer.arc.network",
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
