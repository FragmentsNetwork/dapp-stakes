//import Web3 from 'web3'
const Web3 = require('web3')
const Web3EventCompatibility = require('web3-event-compatibility')

declare global {
    interface Window {
        web3: any
        ethereum: any
    }
}


async function loadWeb3() {

    if (typeof window.web3 !== 'undefined') {
        return new Web3(window.web3.currentProvider)
    }

    return await new Promise((resolve, reject) => {
        // Listen for provider injection
        window.addEventListener('message', ({data}) => {
            if (data && data.type && data.type === 'ETHEREUM_PROVIDER_SUCCESS') {
                // Use injected provider, start dapp...
                resolve(new Web3(window.ethereum))
            }
        })

        // Request provider
        // window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, '*');
        //window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST', web3: true }, '*');
        window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, '*');
    })
}

export async function compatibilityWrapper(web3) {
    const web3Events = new Web3EventCompatibility(web3, window.web3);

    return web3Events.web3

}

let web3Cache

export async function getWeb3() {
    if (!web3Cache) {
        //web3Cache = await compatibilityWrapper(await loadWeb3())
        web3Cache = await loadWeb3()
    }
    return web3Cache
}