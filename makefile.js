//import typechain from 'typechain/generateSource'
let {tsxBuild, tsxWatch, solBuild, solWatch, cssTypeBuild, cssTypeWatch} = require('soliditySapper');

//import {tsxBuild, tsxWatch, solBuild} from 'soliditySapper/tsxCompiler';
const generateSource = require('typechain/dist/generateSource').generateSource
const prettier = require('prettier')
const fs = require('fs')

const solIndeces = [
    //'src/contracts src/contracts/MainContract.sol dist'
    'src/contracts src/contracts/StakingContract.sol dist'
];

const tsxIndeces = [
    //'rootDir relativePathToIndex.ts outputDir'
    'src/gui staking.ts dist'
];

const cssTypeIndeces = [
    __dirname + '/src'
];

const tsxParameters = {
    tsconfig: __dirname + "/tsconfig.json"
};

const ensureFolder = (folder) => {
    try {
        fs.mkdirSync(folder)
    } catch (e) {
        if (!e || (e && e.code !== 'EEXIST')) {
            // directory already exists
            throw e
        }
    }
}

let commands;
commands = {
    // main commands
    build: () => commands.buildContracts() && commands.buildTsContractWrapping() && commands.buildCssType() && commands.buildGui(),
    watch: () => commands.watchContracts() && commands.watchCssType() && commands.watchGui(),

    // build subcommands
    buildContracts: () => solIndeces.map((item) => solBuild(...item.split(' ').filter((dummy, index) => index > 0))),
    buildGui: () => tsxIndeces.map((item) => tsxBuild(...item.split(' ').concat([tsxParameters]))),
    buildCssType: () => cssTypeBuild(cssTypeIndeces),
    buildTsContractWrapping: () => {
        const outputDir = 'dist/tsWrappings/'
        const abisPath = 'dist/StakingContract_abi.json'
        const fileContent = fs.readFileSync(abisPath).toString()
        const abis = JSON.parse(fileContent)

        ensureFolder(outputDir)

        const applyGeneratedClassPatches = (item) => {
            item = item.replace(/return promisify\(this\.rawWeb3Contract\.(\w+), \[(.+)\]\)/g, 'return this.rawWeb3Contract.methods.$1($2).call()')

            return item
        }

        const applyRuntimePatches = (item) => {
            item = item.replace(/= ([^.]+)\.eth\s*\.contract\(([^)]+)\)\s*.at\(([^)]+)\)/g, '= new $1.eth.Contract($2, $3)')
            item = item.replace('rawWeb3Contract[this.methodName]', 'rawWeb3Contract.methods[this.methodName]')
            item = item.replace('rawWeb3Contract[this.eventName]', 'rawWeb3Contract.events[this.eventName]')

            return item
        }

        const prettierConfig = {
            printWidth: 100,
            tabWidth: 4,
            semi: true,
            singleQuote: false,
            trailingComma: 'all',
            parser: 'typescript'
        }

        Object.keys(abis).map(key => {
            const abiString = abis[key]
            const abi = JSON.parse(abiString)
            const outputPath = outputDir + key + '.ts'

            const typescriptWrapper = generateSource(abi, {
                fileName: key,
                relativeRuntimePath: './typechain-runtime' //runtimeRelativePath,
            })

            const formattedSourceCode = prettier.format(typescriptWrapper, prettierConfig)
            const patchedWrapper = applyGeneratedClassPatches(formattedSourceCode)

            fs.writeFileSync(outputPath, patchedWrapper);
        })

        const runtimeDependency = fs.readFileSync(__dirname + '/node_modules/typechain/runtime/typechain-runtime.ts').toString()

        const patchedRuntimeDependency = applyRuntimePatches(runtimeDependency)
        console.log(patchedRuntimeDependency)
        fs.writeFileSync(outputDir + '/typechain-runtime.ts', patchedRuntimeDependency, prettierConfig)

        return true
    },

    // watch subcommands
    watchContracts: async () => solIndeces.map((item) => solWatch(...item.split(' '))),
    watchCssType: async () => cssTypeWatch(cssTypeIndeces),
    watchGui: async () => tsxIndeces.map((item) => tsxWatch(...item.split(' ').concat([tsxParameters])))

};

if (process.argv.length != 3 || !commands[process.argv[2]]) {
    console.log('invalid arguments');
    process.exit(1);
}

ensureFolder(__dirname + '/dist')
commands[process.argv[2]]();
