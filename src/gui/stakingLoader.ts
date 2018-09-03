import {StakingMicroController} from './stakingMicroController'
import {fragmentsStacking} from './staking'

declare global {
    interface Window {
        fragmentsStacking: StakingMicroController
    }
}

// append to window only when window is available
if (window) {
    window.fragmentsStacking = fragmentsStacking
}
