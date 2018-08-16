export type Address = string

export const htmlClassAttribute = 'data-stake-id'
export const htmlModifierAttribute = 'data-stake-modifiers'

export const StakingEvents = {
    loadingStart: 'loadingStart',
    loadingEnd: 'loadingEnd',
    stakeLockStart: 'stakeLockStart',
    stakeLockEnd: 'stakeLockEnd',
    balanceChanged: 'balanceChanged',
    stakeIncreased: 'stakeIncreased',
    stakeDecreased: 'stakeDecreased'
}

export interface IFormatters {
    historyRecord: (typeName: string, time: Date, value: number) => string
}

export const cssSelectors = {
    confirmIncreaseStake: '[data-stake-id="confirmIncreaseStake"]',
    confirmDecreaseStake: '[data-stake-id="confirmDecreaseStake"]',
    increaseStakeInvalidInput: '[data-stake-id="stakeIncreaseInvalidInput"]',
    decreaseStakeInvalidInput: '[data-stake-id="stakeDecreaseInvalidInput"]',
    stakeDecreaseInsufficientStake: '[data-stake-id="stakeDecreaseInsufficientStake"]',
    loading: '[data-stake-id="loading"]',
    stakeBalance: '[data-stake-id="currentStake"]',
    lockableContainer: '[data-stake-id="lockableContainer"]',
    stakeHistoryContainer: '[data-stake-id="stakeHistoryContainer"]',
    stakeValueIncrease: '[data-stake-id="stakeValueIncrease"]',
    stakeValueDecrease: '[data-stake-id="stakeValueDecrease"]',
}

export const cssClasses = {
    hideMe: 'hideMe',
    disabled: 'disabled',
}
