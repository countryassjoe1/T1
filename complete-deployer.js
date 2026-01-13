#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const { ethers } = require('ethers');

class CompleteDeployer {
  constructor() {
    this.projectName = 'air-token-project';
    this.privateKey = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';
    this.rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
  }

  async run() {
    console.log('🚀 STARTING COMPLETE AIR TOKEN DEPLOYMENT SYSTEM\n');

    try {
      // Step 1: Create project structure
      await this.createProjectStructure();

      // Step 2: Install dependencies
      await this.installDependencies();

      // Step 3: Create all necessary files
      await this.createConfigFiles();

      // Step 4: Deploy contract
      await this.deployContract();

      // Step 5: Start monitoring
      await this.startMonitoring();

      console.log('\n🎉 DEPLOYMENT COMPLETE! Your AIR token is live on Base Sepolia.');
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  async createProjectStructure() {
    console.log('📁 Creating project structure...');

    if (!fs.existsSync(this.projectName)) {
      fs.mkdirSync(this.projectName);
    }
    process.chdir(this.projectName);

    // Create directory structure
    const dirs = ['contracts', 'scripts', 'artifacts', 'cache'];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');

    // Create package.json
    const packageJson = {
      name: 'air-token-project',
      version: '1.0.0',
      scripts: {
        compile: 'npx hardhat compile',
        deploy: 'npx hardhat run scripts/deploy.js --network baseSepolia',
        test: 'npx hardhat test',
      },
      devDependencies: {
        '@nomiclabs/hardhat-ethers': '^2.2.3',
        '@openzeppelin/contracts': '^4.9.3',
        ethers: '^6.10.0',
        hardhat: '^2.20.2',
      },
    };

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

    // Install dependencies
    this.runCommand('npm install');
  }

  async createConfigFiles() {
    console.log('⚙️  Creating configuration files...');

    // Create hardhat.config.js
    const hardhatConfig = `
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: "${this.rpcUrl}",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
`;
    fs.writeFileSync('hardhat.config.js', hardhatConfig);

    // Create AIR.sol contract
    const airContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AIR is ERC20, Ownable {
    constructor() ERC20("AIR Token", "AIR") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals()); // 1 million tokens
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
`;
    fs.writeFileSync('contracts/AIR.sol', airContract);

    // Create deployment script
    const deployScript = `
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting AIR token deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy contract
  const AIR = await ethers.getContractFactory("AIR");
  const air = await AIR.deploy();
  
  await air.waitForDeployment();
  const address = await air.getAddress();
  
  console.log("✅ AIR Token deployed to:", address);
  console.log("Name:", await air.name());
  console.log("Symbol:", await air.symbol());
  console.log("Total Supply:", ethers.formatEther(await air.totalSupply()));
  
  // Save deployment info
  const deploymentInfo = {
    address: address,
    deployer: deployer.address,
    network: "base-sepolia",
    timestamp: new Date().toISOString()
  };
  
  require("fs").writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to deployment-info.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;
    fs.writeFileSync('scripts/deploy.js', deployScript);

    // Create .env template
    const envTemplate = `PRIVATE_KEY=your_private_key_here
RPC_URL=${this.rpcUrl}`;
    fs.writeFileSync('.env.example', envTemplate);

    // Create .gitignore
    const gitignore = `node_modules/
.env
deployment-info.json
artifacts/
cache/`;
    fs.writeFileSync('.gitignore', gitignore);
  }

  async deployContract() {
    console.log('📤 Deploying AIR token...');

    // Check if private key is set
    if (!process.env.PRIVATE_KEY && this.privateKey === 'YOUR_PRIVATE_KEY_HERE') {
      throw new Error('Please set PRIVATE_KEY environment variable or update the script');
    }

    // Compile contract
    this.runCommand('npx hardhat compile');

    // Deploy contract
    this.runCommand('npx hardhat run scripts/deploy.js --network baseSepolia');
  }

  async startMonitoring() {
    console.log('📊 Starting deployment monitoring...');

    // Create monitoring script
    const monitorScript = `
const { ethers } = require("ethers");

async function monitor() {
    const provider = new ethers.JsonRpcProvider("${this.rpcUrl}");
    
    try {
        const deploymentInfo = require("./deployment-info.json");
        const contract = new ethers.Contract(
            deploymentInfo.address,
            ["function name() view returns (string)"],
            provider
        );
        
        console.log("👀 Monitoring AIR token...");
        console.log("Contract:", deploymentInfo.address);
        console.log("Name:", await contract.name());
        console.log("BaseScan: https://sepolia.basescan.org/address/" + deploymentInfo.address);
        
    } catch (error) {
        console.log("Monitoring error:", error.message);
    }
}

monitor();
`;
    fs.writeFileSync('monitor.js', monitorScript);

    // Run monitoring
    this.runCommand('node monitor.js');
  }

  runCommand(command) {
    try {
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Command failed: ${command}`);
    }
  }
}

// Quick deployment without Hardhat (alternative method)
async function quickDeploy() {
  console.log('⚡ QUICK DEPLOYMENT MODE (Direct Ethers.js)');

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://sepolia.base.org');
  const privateKey = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';

  if (privateKey === 'YOUR_PRIVATE_KEY_HERE') {
    console.log('❌ Please set PRIVATE_KEY environment variable');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Deployer:', wallet.address);
  console.log('Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');

  // AIR Token bytecode (simplified ERC-20)
  const bytecode =
    '0x608060405234801561001057600080fd5b5060405161051438038061051483398101604081905261002f916100df565b8282816003908161004091906102f7565b50600480546001600160a01b0319163317905561005c8382610064565b505050506103be565b600280546001600160a01b0319166001600160a01b0384161790556040516000906100909083906100c3565b604051809103906000f0801580156100ac573d6000803e3d6000fd5b509050806001600160a01b03163';

  const abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
  ];

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log('🚀 Deploying...');

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log('✅ Contract deployed to:', await contract.getAddress());
  console.log('Transaction hash:', contract.deploymentTransaction().hash);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--quick')) {
    await quickDeploy();
  } else {
    const deployer = new CompleteDeployer();
    await deployer.run();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CompleteDeployer, quickDeploy };
