import {StakingMicroController} from './stakingMicroController'

declare global {
    interface Window {
        fragmentsStacking: StakingMicroController
    }
}

window.fragmentsStacking = new StakingMicroController()
