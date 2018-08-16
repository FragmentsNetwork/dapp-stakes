import {Address, StakingEvents, IFormatters} from './customTypes'
import {StakingContract} from '../../dist/tsWrappings/StakingContract'
import {getWeb3, compatibilityWrapper} from './web3Loader'
import {InterfaceMicroController} from './interfaceMicroController'
import Web3 from 'web3'
import * as BigNumber from 'bignumber'


export class StakingMicroController {

    private stakingContractAddress: Address
    private userAddress: Address
    private rootElement: HTMLElement
    private stakingContract: StakingContract
    private stakingContractEventWatchable: StakingContract // this is needed due to problems with web3 + websockets + metamask https://github.com/MetaMask/metamask-extension/issues/3642
    private loadingIndex: number = 0
    private web3: Web3
    private interfaceMicroController: InterfaceMicroController

    public constructor() {

    }

    /////////////////// Init ///////////////////////////////////////////////////
    public async load(stakingContractAddress: Address, userAddress: Address, rootElement: HTMLElement, formatters: IFormatters): Promise<boolean> {
        this.stakingContractAddress = stakingContractAddress
        this.userAddress = userAddress
        this.rootElement = rootElement

        this.web3 = await getWeb3()

        this.stakingContract = new StakingContract(this.web3, stakingContractAddress)
        this.stakingContractEventWatchable = new StakingContract(await compatibilityWrapper(this.web3), this.stakingContractAddress)
        this.interfaceMicroController = new InterfaceMicroController(this, rootElement, formatters)
        await this.interfaceMicroController.init()

        await this.useLoading((async () => {
            if (await this.fetchIsStakeLocked()) {
                this.stakeLockStart()
            }
            await this.balanceChanged(await this.fetchBalance())
            await this.contractHistoryLoaded(await this.fetchContractHistory())
            await this.watchNewEvents()
        })())

        return true
    }

    public async unload(): Promise<boolean> {
        await this.interfaceMicroController.removeListeners()

        return true
    }


    /////////////////// Utils //////////////////////////////////////////////////
    private async useLoading(promise) {
        if (this.loadingIndex++ == 0) {
            this.loadingStart()
        }

        await promise.catch(error => console.error(error))

        if (--this.loadingIndex == 0) {
            this.loadingEnd()
        }
    }

    private async getBlockTimestamp(blockNumber: number): Promise<number> {
        return (await this.web3.eth.getBlock(blockNumber)).timestamp * 1000
    }

    private async getBlockDatetime(blockNumber: number): Promise<Date> {
        return new Date(await this.getBlockTimestamp(blockNumber))
    }

    /////////////////// Actions ////////////////////////////////////////////////
    public async increaseStake(value: number) {
        const func = this.stakingContract.rawWeb3Contract.methods.putStake().send({value: value, from: this.userAddress})
        await this.useLoading(func)
    }

    public async decreaseStake(value: number) {
        const func = this.stakingContract.rawWeb3Contract.methods.pullStake(value).send({from: this.userAddress})
        await this.useLoading(func)
    }

    public async fetchIsStakeLocked() {
        const func = this.stakingContract.stakeLocks(this.userAddress)
        await this.useLoading(func)
    }

    public async fetchBalance() {
        return await this.stakingContract.stakes(this.userAddress)
    }

    public async fetchContractHistory() {
        const filter = {
            fromBlock: 0,
            filter: {
                user: this.userAddress
            }
        }
        //return await this.stakingContract.rawWeb3Contract.getPastEvents('allEvents', {fromBlock: 0})
        const stakeAddedHistory = await this.stakingContract.rawWeb3Contract.getPastEvents('StakingContract_StakeAdded', filter)
        const stakeRemovedHistory = await this.stakingContract.rawWeb3Contract.getPastEvents('StakingContract_StakeRemoved', filter)

        const allEvents = [...stakeAddedHistory, ...stakeRemovedHistory]
        allEvents.sort((a, b) => {
            if (a.blockNumber == b.blockNumber) {
                return 0
            }
            return a.blockNumber >= b.blockNumber ? 1 : -1
        })

        return allEvents
    }

    public async fetchContractSanctionHistory() {

    }

    public watchNewEvents = async () => {
        const parameters = {
            //filter: {myIndexedParam: [20,23], myOtherIndexedParam: '0x123456789...'}, // Using an array means OR: e.g. 20 or 23
            //fromBlock: 0
            filter: {user: this.userAddress}
        }
        this.stakingContractEventWatchable.rawWeb3Contract.events.StakingContract_StakeAdded(parameters, async (error, event) => {
            const datetime = await this.getBlockDatetime(event.blockNumber)
            await this.stakeIncreased(datetime, event.args.valueAdded, event.args.totalValue)
        })

        this.stakingContractEventWatchable.rawWeb3Contract.events.StakingContract_StakeRemoved(parameters, async (error, event) => {
            const datetime = await this.getBlockDatetime(event.blockNumber)
            await this.stakeDecreased(datetime, event.args.valueRemoved, event.args.remainingValue)
        })
    }

    /////////////////// Events /////////////////////////////////////////////////
    private loadingStart() {
        const event = new CustomEvent(StakingEvents.loadingStart)
        this.rootElement.dispatchEvent(event)
    }

    private loadingEnd() {
        const event = new CustomEvent(StakingEvents.loadingEnd)
        this.rootElement.dispatchEvent(event)
    }

    private stakeLockStart() {
        const event = new CustomEvent(StakingEvents.stakeLockStart)
        this.rootElement.dispatchEvent(event)
    }

    private stakeLockEnd() {
        const event = new CustomEvent(StakingEvents.stakeLockEnd)
        this.rootElement.dispatchEvent(event)
    }

    private balanceChanged(value: number | BigNumber) {
        const event = new CustomEvent(StakingEvents.balanceChanged, {detail: value})
        this.rootElement.dispatchEvent(event)
    }

    private async contractHistoryLoaded(history: {[key: string]: any}[]) {
        const processRecord = async (data) => {
            const datetime = await this.getBlockDatetime(data.blockNumber)

            if (data.event == 'StakingContract_StakeAdded') {
                await this.stakeIncreased(datetime, data.returnValues.valueAdded, data.returnValues.totalValue)
                return
            }

            if (data.event == 'StakingContract_StakeRemoved') {
                await this.stakeDecreased(datetime, data.returnValues.valueRemoved, data.returnValues.remainingValue)
                return
            }
        }

        const max = history.length
        for (let i = 0; i < max; i++) {
            await processRecord(history[i])
        }

    }

    private async stakeIncreased(datetime: Date, valueAdded: number, totalValue: number) {
        const detail = {
            datetime,
            valueAdded,
            totalValue
        }

        const event = new CustomEvent(StakingEvents.stakeIncreased, {detail})
        this.rootElement.dispatchEvent(event)

        await this.balanceChanged(totalValue)
    }

    private async stakeDecreased(datetime: Date, valueRemoved: number, remainingValue: number) {
        const detail = {
            datetime,
            valueRemoved,
            remainingValue
        }

        const event = new CustomEvent(StakingEvents.stakeDecreased, {detail})
        this.rootElement.dispatchEvent(event)

        this.balanceChanged(remainingValue)
    }

    /////////////////// Debug //////////////////////////////////////////////////
    private sleep(ms): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    private async actionMock(): Promise<void> {
        const sleepTime = 1000
        return await this.useLoading(this.sleep(sleepTime))
    }
}
