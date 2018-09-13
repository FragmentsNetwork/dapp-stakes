<a href="https://fragments.network/">
  <img src="https://i.imgur.com/7PUcgAN.png" alt="" width="560">
</a>

# Fragment.Network Staking

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

This repository contains prototype smart contract for staking crypto on Fragments platform.

# Install
This project requires nodejs environment with installed yarn.
```
yarn # install all dependencies
```

# Use
```
yarn build # builds whole project
yarn guiServer # serves testing gui

# development
yarn watch # watch for changes in files and rebuilds project everytime
```

When running `guiServer` you should be able to access demo at http://localhost:8080/src/gui/userStaking.html .


# Package dependency notes
To minimize size of builded files compiled version of `web3` library is used right now.
`web3-event-compatibility` package is used to allow web3 events to work. Current upstream `web3`
doesn't work properly for events.
Once next stable version of `web3` is released this setup can be reduced to single `web3` dependency.

```
"web3": "^1.0.0-beta.35", // this is currently excluded from package.json
```
