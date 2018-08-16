import {StakingEvents, IFormatters, cssSelectors, cssClasses, htmlClassAttribute, htmlModifierAttribute} from './customTypes'
import {BigNumber} from 'bignumber.js'
import {getWeb3} from './web3Loader'

BigNumber.config({ERRORS: false})

export class InterfaceMicroController {

    private listeners = []

    constructor(private stakingMicroController, private rootElement: HTMLElement, private formatters: IFormatters) {
        this.listeners = [
            [cssSelectors.confirmIncreaseStake, 'click', this.increaseStakeListener],
            [cssSelectors.confirmDecreaseStake, 'click', this.decreaseStakeListener],
            [this.rootElement, StakingEvents.loadingStart, this.loadingStart],
            [this.rootElement, StakingEvents.loadingEnd, this.loadingEnd],
            [this.rootElement, StakingEvents.balanceChanged, this.refreshBalance],
            [this.rootElement, StakingEvents.stakeIncreased, this.stakeIncreased],
            [this.rootElement, StakingEvents.stakeDecreased, this.stakeDecreased],
            [this.rootElement, StakingEvents.stakeLockStart, this.stakeLockStart],
        ]
    }

    public async init() {
        this.listeners.map((item) => this.addListener(item[0], item[1], item[2]))
    }

    public async removeListeners() {
        this.listeners.map((item) => this.removeListener(item[0], item[1], item[2]))
    }


    /////////////////// Utils //////////////////////////////////////////////////
    private getElement = (selector: string | HTMLElement): HTMLElement => {
        if (selector instanceof HTMLElement) {
            return selector
        }

        return this.rootElement.querySelector(selector)
    }

    private addListener = (selector: string | HTMLElement, eventName: string, listener: EventListenerOrEventListenerObject) => this.getElement(selector).addEventListener(eventName, listener)

    private removeListener = (selector: string | HTMLElement, eventName: string, listener: EventListenerOrEventListenerObject) => this.getElement(selector).removeEventListener(eventName, listener)

    private addModifier = (selector: string | HTMLElement, className) => {
        const element = this.getElement(selector)
        const oldClass = element.getAttribute(htmlModifierAttribute)
        element.setAttribute(htmlModifierAttribute, (oldClass + ' ' + className).replace(/ +/, ' ').trim())
    }

    private removeModifier = (selector: string | HTMLElement, className) => {
        const element = this.getElement(selector)
        const oldClass = element.getAttribute(htmlModifierAttribute)
        element.setAttribute(htmlModifierAttribute, oldClass.replace(className, '').replace(/ +/, ' ').trim())
    }

    private addStakeHistoryRecord = (historyContainer: HTMLElement, typeName: string, time: Date, value: number) => {
        historyContainer.innerHTML += this.formatters.historyRecord(typeName, time, value)
    }

    private addStakeIncreaseRecord = async (time: Date, valueChange: number, resultTotal: number) => {
        const historyContainer = this.getElement(cssSelectors.stakeHistoryContainer)
        const resultValue = await this.stakingMicroController.weiToDesiredUnit(valueChange)
        this.addStakeHistoryRecord(historyContainer, 'Increase', time, resultValue)
    }

    private addStakeDecreaseRecord = async (time: Date, valueChange: number, resultTotal: number) => {
        const historyContainer = this.getElement(cssSelectors.stakeHistoryContainer)
        const resultValue = await this.stakingMicroController.weiToDesiredUnit(valueChange)
        this.addStakeHistoryRecord(historyContainer, 'Decrease', time, resultValue)
    }

    /////////////////// Listeners //////////////////////////////////////////////

    private increaseStakeListener = async (e) => {
        const element = <HTMLInputElement> this.getElement(cssSelectors.stakeValueIncrease)
        const valueEth = parseInt(element.value)

        if (isNaN(valueEth) || valueEth <= 0) {
            this.invalidInput(cssSelectors.increaseStakeInvalidInput)
            return
        }

        const valueWei = await this.stakingMicroController.desiredUnitToWei(valueEth)

        this.validInput(cssSelectors.increaseStakeInvalidInput)

        await this.stakingMicroController.increaseStake(valueWei)
    }

    private decreaseStakeListener = async (e) => {
        const element = <HTMLInputElement> this.getElement(cssSelectors.stakeValueDecrease)
        const valueEth = new BigNumber(element.value)

        if (valueEth.isNaN() || valueEth.lt(new BigNumber(0))) {
            this.invalidInput(cssSelectors.decreaseStakeInvalidInput)
            return
        }

        const valueWei = await this.stakingMicroController.desiredUnitToWei(valueEth.toString())

        const balance = await this.stakingMicroController.fetchBalance()
        if (new BigNumber(valueWei.toString()).gt(new BigNumber(balance.toString()))) {
            this.invalidInput(cssSelectors.stakeDecreaseInsufficientStake)
            return
        }

        this.validInput(cssSelectors.decreaseStakeInvalidInput)
        this.validInput(cssSelectors.stakeDecreaseInsufficientStake)

        await this.stakingMicroController.decreaseStake(valueWei)
    }

    private stakeIncreased = (event) => {
        const {datetime, valueAdded, totalValue} = event.detail
        this.addStakeIncreaseRecord(datetime, valueAdded, totalValue)
    }

    private stakeDecreased = (event) => {
        const {datetime, valueRemoved, remainingValue} = event.detail
        this.addStakeDecreaseRecord(datetime, valueRemoved, remainingValue)
    }

    private loadingStart = () => {
        this.removeModifier(cssSelectors.loading, cssClasses.hideMe)
    }

    private loadingEnd = () => {
        this.addModifier(cssSelectors.loading, cssClasses.hideMe)
    }

    private refreshBalance = async (event) => {
        const balance = event.detail
        this.getElement(cssSelectors.stakeBalance).innerHTML = await this.stakingMicroController.weiToDesiredUnit(balance)
    }

    private stakeLockStart = async () => {
        this.addModifier(cssSelectors.lockableContainer, cssClasses.disabled)
    }

    /////////////////// Actions ////////////////////////////////////////////////


    private invalidInput = async (errorContainerSelector) => {
        this.removeModifier(errorContainerSelector, cssClasses.hideMe)
    }

    private validInput = async (errorContainerSelector) => {
        this.addModifier(errorContainerSelector, cssClasses.hideMe)
    }
}
