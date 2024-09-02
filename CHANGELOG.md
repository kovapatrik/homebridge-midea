# Changelog

# v1.2.0
## 2024-08-29
- feat: added support for `Front Load Washers` (fixes #87)
- feat: added support for `Dishwashers` (fixes #104)
- feat: added possibility to add custom humidity offset for `Dehumidifiers` (fixes #98)
- feat: added possibility to toggle boost/turbo mode switch creation for `Air Conditioners` (fixes #102)
- feat: possibilty to download Lua files using the config UI (fixes #69)
- fix: explicitly set the power when changing the mode for `Air Conditioners` (fixes #99)
- fix: handling of sending out messages to devices, excluding existing state commands (fixes #99, #101)
- fix: QoL improvements and bug fixes (TCP key error, etc.)

# v1.1.0
## 2024-07-13
- BREAKING CHANGE: `Air Conditioner` configuration changed: there is now a possibility to create an accessory which can be used to control the slats on the unit. THe configuration structure has changed. Please check [AC docs](/docs/ac.md) for more information (or just save the configuration again in the plugin settings to get the new structure).
- feat: added support for `Fans` (fixes #74)
- feat: added feature to turn off the display by default on power on for `Air Conditioners`
- feat: ability to change the temperature display unit from the Home app for `Air Conditioners`
- fix: default temperature unit display for `Air Conditioners` (previously the `fahrenheit` setting didn't work)
- fix: added option to add a seperate humidity sensor to `Dehumidifiers` (fixes #88)
- fix: added option to add a fan accessory to `Dehumidifiers` (fixes #89)
- fix: wait for device response before adding it to Homebridge

# v1.0.6
## 2024-06-15
- BREAKING CHANGE: there is a new conifguration option `fanOnlyModeSwitch` which will only turn on fan only mode. There is a possiblity to create an accessory to manage fan only mode using option `fanAccessory`. Setting fan to auto mode can be done from the fan accessory
- fix: NetHome Plus login
- minor quality of life improvements
