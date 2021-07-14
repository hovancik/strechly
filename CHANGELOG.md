# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- new break ideas
- option for showing minutes remaining in app tray

### Changed
- improve tray status messages
- updated many translations
- increase new version check to 48 hours
- change font to Nato Sans for better support

### Fixed
- prevent empty break windows
- improve window positioning
- error on Windows and Linux systems when temporary directory is not executable

## [1.7.0] - 2021-05-04
### Added
- advanced preferences for Pause/Resume Breaks global shortcuts
- advanced preferences for picking monitor to show break on
- added initial support for the RTL languages for the UI

### Changed
- endBreakShortcut can be set to empty string, thus disabled
- updated many translations

### Fixed
- prevent memory leak after break has ended

## [1.6.99] - 2021-05-02 Patreon
### Added
- advanced preferences for Pause/Resume Breaks global shortcuts
- advanced preferences for picking monitor to show break on
- added initial support for the RTL languages for the UI

### Changed
- endBreakShortcut can be set to empty string, thus disabled

## [1.6.0] - 2021-04-16
### Fixed
- app exclusions on Windows OS
- fullscreen breaks on MacOS
- refreshing Preferences after Reset to defaults

### Added
- advanced option not to reset breaks on Suspend/Lock
- Stretchly doesn't need to restart after Restoring remote settings
- Updated many translations

### Changed
- new system for storing preferences
- improved logging
- allow user to disable update check rather then only notification

## [1.5.0] - 2021-04-07
### Added
- Punjabi translations
- Gujarati translations
- Persian translations
- Hebrew translations
- Finnish translations
- Indonesian translations
- Latvian translations
- Contributor preference option to make Stretchly act as a regular window (to make use of other apps during breaks easier)
- Advanced preferences for app exclusions (resume/pause when specific app is/not running)

### Changed
- Updated many translations

### Fixed
- Improved Welcome window
- tray menu not visible over break window on macOS
- tray status messages in specific situations

## [1.4.0] - 2020-12-25
### Added
- Better handling of app errors: error will ask user to report issue
- Esperanto translations
- Norwegian translations
- Snow white theme
- experimental Linux builds for arm

### Changed
- Updated many translations

### Fixed
- notification of new version being showed even disabled
- browser tab non-responsive after resuming
- don't show notification title for macOS Big Sur
- DND mode in macOS Big Sur

## [1.3.0] - 2020-11-08
### Added
- control a running instance from command line  
- advanced option to disable check for new version
- new break ideas

### Changed
- Updated Italian translations
- Updated Spanish translations
- Updated German translations
- prevent redundant title notification on Windows 10 (20H2 Update)

### Fixed
- problem with DoNotDisturb being ignored when resuming breaks
- taskbar visibility issue on Windows
- issue with idle time and breaks causing negative timers
- issue with Pause until morning in some timezones

## [1.2.0] - 2020-10-03
### Added
- new break ideas
- Contributors can sync preferences
- Nepali translations
- snap package

### Changed
- disallow "Reset breaks" when in break with Strick Mode
- break window size is now dynamic (relative to screen size)
- updated Korean translation

### Fixed
- fullscreen breaks (Windows)
- downgraded Electron and disabled macOS dock icon to fix fullscreen issues

## [1.1.99] - 2020-9-27 Patreon
### Added
- Nepali translations

### Fixed
- fullscreen breaks (Windows)
- downgraded Electron and disabled macOS dock icon to fix fullscreen issues

### Changed
- break window size is now dynamic (relative to screen size)
- updated Korean translation

## [1.1.0] - 2020-09-12

### Added
- show Contributor Settings in tray menu for Contributors
- breaks are paused if the Windows 10 Focus Assist mode is enabled
- added log file for debug
- users can choose between a transparent or a fully opaque theme in the Theme Preferences
- users can choose the opacity value for the transparent theme in the Contributor Preferences

### Changed
- updated German translation
- updated Polish translation
- updated Chinese translations
- bigger range for Mini Break duration
- preferences navigation menu visible when scrolling down

## [1.0.0] - 2020-07-18

### Added
- apk package format
- added Hungarian translation
- added ability to change the keyboard shortcuts for Skip/Postpone breaks via config.json
- show Paused icon when Breaks are paused in Natural breaks mode
- show Paused icon when Breaks are paused in Do Not Disturb mode
- Dark mode for interface
- new break ideas
- new Icon

### Changed
- changed app name from `stretchly` to `Stretchly`
  - this might change location of preferences file, so you might need to set up your preferences again or copy the file
- don't hide dock icon on macOS
- updated some translations
- rework UI in all windows and Tray menu
- synchronized tray status messages (tooltip, menu)
- better format remaining time
- default icon to colorful

### Fixed
- adds workaround for electron's Linux/Windows fullscreen issues
- notify of new version only if new version is higher then current

### Removed
- removed tutorial, now linking to Features webpage

## [0.99.5] - 2020-07-04 Patreon
### Added
- apk package format
- Added Hungarian translation
- Added ability to change the keyboard shortcuts for Skip/Postpone breaks via config.json

### Changed
- don't hide dock icon on macOS
- Updated translations

## Fixed
- adds workaround for electron's Linux/Windows fullscreen issues

## [0.99.4] - 2020-05-15 Patreon
### Fixed
- checkbox across macOS, Windows, Linux
- maximum window size of Preferences
- updated translation files
- translations for ranges
- small style issues

### Added
- snap package build

## [0.99.3] - 2020-05-05 Patreon
### Fixed
- multi-line status messages in Tray (Mac, Windows)

### Added
- show Paused icon when Breaks are paused in Natural breaks mode
- show Paused icon when Breaks are paused in Do Not Disturb mode
- Dark mode for interface
- Contributor settings to set Dark/Light/System mode for color mode

### Changed
- changed app name from `stretchly` to `Stretchly`
  - this will change location of preferences file, so you will need to set up your preferences again or copy the file

## [0.99.2] - 2020-04-27 Patreon
### Removed
- old About window

### Changed
- better style for progress
- rework Contributor preferences
- reworked tray menu
- synchronized tray status messages (tooltip, menu)
- better format remaining time

## [0.99.1] - 2020-04-09 Patreon
### Changed
- restyle Welcome window
- replace Build, Window and Tray icons and images
- better styling for Breaks and countdown

### Removed
- removed tutorial, now linking to Features webpage

### Fixed
- Adds missing Postpone preferences

## [0.99.0] - 2020-03-19 Patreon
### Changed
- default icon is colorful
- restyle break windows
- restyle Preferences window

### Added
- new break ideas

### Fixed
- notify of new version only if new version is higher then current

## [0.21.1] - 2020-01-16
### Changed
- Italian translations updated
- break window is shown on all Workspaces in macOS
- Improved readability of English text

### Added
- user can set volume for break sounds (set via Settings file or Contributor's settings)
- user can set time after which breaks are paused in Natural Break (set via Settings file or Contributor's settings)

### Fixed
- texts appearing on top of each other in Settings for Chinese

## [0.21.0] - 2019-10-13
### Changed
- checkbox labels are clickable as well
- tray menu link for update to website, instead of github
- Chinese (Taiwan) translations updated
- German translations updated
- no notification is shown after system resume/unlock
- no notification is shown after manual resume of pause from tray menu
- keep the focus on active window during breaks
- smaller font size for longer microbreak ideas
- Improved grammar of microbreak ideas
- display checkbox list vertically in settings screen 3
- Dutch translations updated

### Fixed
- Ctrl+X global shortcut not being released after `Reset breaks` and `Skip to`

### Added
- new break ideas
- pause breaks when screen is locked (Windows, macOS)
- change tray icon when stretchly is paused
- allow to use inverted (white) monochrome tray icon (Linux, Windows)
- Danish translations

## [0.20.1] - 2019-07-14
### Added
- clicking on settings file location will open it
- ability to copy debug info to clipboard
- Added Lithuanian language

### Fixed
- auto hide menu bar in app's windows
- break window not always shown on top of other windows (for Windows OS)

## [0.20.0] - 2019-07-02
### Fixed
- workaround multiple screens and fullscreen (macOS)
- tray icon size on Linux
- problem with Window missing when resetting settings to defaults

### Changed
- update icons and graphic materials
- Turkish translations updated
- Hindi translations updated

### Added
- Korean translations
- more break and microbreak ideas
- more settings in Contributor's settings
- Polish translation
- start a break/microbreak with a sound (set via config file or Contributor's settings)

## [0.19.1] - 2019-02-17
### Fixed
- fullscreen mode on Windows
- ability to hide break ideas from break windows

### Added
- more debug info (chrome, electron, nodejs versions)
- allow user to disable ability to postpone breaks

### Changed
- Simplified Chinese translations updated
- Czech translations updated
- Slovak translations updated

## [0.19.0] - 2019-02-10
### Changed
- upper limit of microbreak duration set to 900 seconds (15 minutes)
- Italian translations updated
- Russian translations updated
- Bulgarian translations updated

### Fixed
- disabled resizing for some windows

### Added
- Swedish translations
- Turkish translations
- silent notifications option
- Ability to postpone breaks/microbreaks in non-strict mode
- more data for debug information in About window
- user can disable monitoring of DND mode
- stretchly supporters can access extra settings

## [0.18.0] - 2018-10-21
### Added
- Italian translations for interface
- Dutch translations for interface
- Welcome and Tutorial windows on first run and in About window
- tray menu displays the time and type of next break
- Do Not Disturb functionality for Mac & Windows (breaks wont happen while in DND mode)
- ability can change the default monochrome tray icon to colorful

### Fixed
- User pause will no longer be removed upon suspend/resume
- User pause time will be corrected upon suspend/resume for the duration
  of system sleep
- better font visibility across platforms
- blocking of all workspaces on macOS

### Changed
- Czech translations updated
- Slovak translations updated
- default tray icon is now monochrome

## [0.17.0] - 2018-05-06
### Added
- Ukrainian translations for interface
- Spanish translations for interface
- Romanian translations for interface

### Changed
- upper limit of microbreak duration set to 300 seconds (5 minutes)

### Fixed
- closes running break window when skipping to the another one
- download link from github's releases to hovancik.net/stretchly/downloads

## [0.16.0] - 2018-03-17
### Added
- Russian translations for interface
- Ability to pause until morning

### Changed
- upper limit of microbreak duration set to 60 seconds
- download link from github's releases to hovancik.net/stretchly/downloads

### Fixed
- notifications not working on latest Windows 10

## [0.15.0] - 2018-02-18
### Added
- Bulgarian translations for interface
- Brazilian Portuguese translations for interface
- Chinese translations for interface, distinguish between two kinds of Chinese
- AppX and web installer for Windows
- ability to change install directory for Windows
- ability to install per user or per machine on Windows
- Multi-display support added and enabled by default
- ability to set break to less than 5 minutes
- Hindi Translations for interface

### Fixed
- style for long names of schemes
- app not starting when both break types are disabled
- missing "reset to defaults"

## [0.14.0] - 2018-01-07
### Fixed
- make sure windows offset is integer
- minor translations issues
- macOS fullscreen mode

### Added
- allows user to not show new version notification via config file
- Czech translations for interface
- Chinese translations for interface
- German translations for interface

### Changed
- texts in windows are not selectable (except debug info)

## [0.13.0] - 2017-12-20
### Added
- icons for app windows
- possibility to have interface translated
- Slovak translations for interface
- French translations for interface

## [0.12.0] - 2017-11-05
### Fixed
- error with second instance on Windows
- breaks wont resume with indefinite pause after system resume

### Added
- monitoring of system idle time for natural breaks (when user leaves and after return idle time is greater then break duration, *stretchly* will reset breaks)
- menu link to Patreon

### Changed
- microbreak notifications are 10 seconds before and can be disabled

## [0.11.0] - 2017-09-09
### Added
- option to not show break ideas
- option to show notification 30 seconds before break starts

## [0.10.0] - 2017-08-18
### Added
- `Ctrl/Cmd + d` shortcut in About window to show debug information
- monitoring suspend/resume (alfa, electron has bugs)
- link to my.stretchly.net in menu

### Fixed
- break is not skippable via shortcut in strict mode
- macOS tooltip works without dock icon (after packaging)
- close break windows on `Reset breaks`

### Changed
- rewrite break management using Events
- get active settings when changing Settings window pages

## [0.9.0] - 2017-05-17
### Added
- Tooltip shows information about:
  - time left till next (micro)break
  - time left in pause till breaks resume
  - number of microbreaks until next break

### Fixed
- version checker erroneous 'a new version is available' messages
- Run breaks after resetting breaks
- Scheduler timeLeft based on actual setTimeout start time

### Changed
- do not play sound on Pause when break is in progress
- cosmetic style changes
- do not hide macOS dock icon, so we can have tray tooltip

### Known issues
- tray tooltip does not work correctly on macOS

## [0.8.1] - 2017-04-15
### Fixed
- trying to close non-existing window
- after break ends, focus is brought on last window (macOS)

### Changed
- break windows are not focusable
- do not show break windows in taskbar

## [0.8.0] - 2017-04-09
### Added
- `Ctrl/Cmd + x` shortcut to finish break early (when not in strict mode)
- time remaining and progress bar in break window

### Fixed
- disallow drag and drop in windows to prevent errors

## [0.7.0] - 2017-03-07
### Changed
- app windows are shown on the monitor where the mouse is (Windows, macOS, some Linux DEs)
- reminders can be full screen
- About and Settings windows are not resizable and not always on top
- `Quit` -> `Quit stretchly` menu item text
- replaced `splash of cappuccino` with `graphite crystal` theme

### Added
- monochrome icon for macOS (also @2x)

### Removed
- Settings window notification
- Startup window

## [0.6.0] - 2017-01-21
### Added
- possibility to change break/microbreak ideas via editing config file

### Changed
- break window is shown when it's ready

## [0.5.1] - 2016-12-05
### Fixed
- some grammar

### Added
- more break ideas

## [0.5.0] - 2016-11-28
### Added
- strict mode - breaks/microbreaks can't be finished early
- build for ia32 and x64

### Fixed
- wrong window placement when on Linux and more displays

## [0.4.0] - 2016-11-05
### Fixed
- version check when offline

### Changed
- settings window split into 2

### Added
- longer breaks
- enable/disable microbreaks and breaks
- skip to next break/microbreak anytime from menu
- notification on breaks resume
- notification when entering Settings that settings are applied once changed
- reset settings to the defaults
- reset (restart) breaks from menu

## [0.3.0] - 2016-10-15
### Added
- possibility to pause reminders for different times
- autostart for Windows and macOS
- check for the latest version on About page, on app start
- remind new version via notification and tray menu

## [0.2.1] - 2016-10-10
### Fixed
- double init of event listeners on settings page

## [0.2.0] - 2016-10-08
### Added
- sounds at the end of microbreak
- settings for sounds

## [0.1.1] - 2016-10-04
### Fixed
- Linux builds and permissions

## [0.1.0] - 2016-09-26
### Added
- update npm packages
- rename strechly to stretchly (grammar, yay!)
- allows only one instance of app
- settings for microbreak (duration, interval)
- 5 color scheme

## [0.0.1] - 2016-09-06
### Added
- simple electron app with break reminder after 10 minutes
- randomized reminders (without repetition)
- startup window
- resume/pause functionality for reminder
- scripts for creating installers for OS X, Windows, Linux

[Unreleased]: https://github.com/hovancik/stretchly/compare/v1.7.0...HEAD
[1.7.0]: https://github.com/hovancik/stretchly/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/hovancik/stretchly/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/hovancik/stretchly/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/hovancik/stretchly/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/hovancik/stretchly/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/hovancik/stretchly/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/hovancik/stretchly/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/hovancik/stretchly/compare/v0.99.5...v1.0.0
[0.99.5]: https://github.com/hovancik/stretchly/compare/v0.99.4...v0.99.5
[0.99.4]: https://github.com/hovancik/stretchly/compare/v0.99.3...v0.99.4
[0.99.3]: https://github.com/hovancik/stretchly/compare/v0.99.2...v0.99.3
[0.99.2]: https://github.com/hovancik/stretchly/compare/v0.99.1...v0.99.2
[0.99.1]: https://github.com/hovancik/stretchly/compare/v0.99.0...v0.99.1
[0.99.0]: https://github.com/hovancik/stretchly/compare/v0.21.1...v0.99.0
[0.21.1]: https://github.com/hovancik/stretchly/compare/v0.21.0...v0.21.1
[0.21.0]: https://github.com/hovancik/stretchly/compare/v0.20.1...v0.21.0
[0.20.1]: https://github.com/hovancik/stretchly/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/hovancik/stretchly/compare/v0.19.1...v0.20.0
[0.19.1]: https://github.com/hovancik/stretchly/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/hovancik/stretchly/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/hovancik/stretchly/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/hovancik/stretchly/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/hovancik/stretchly/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/hovancik/stretchly/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/hovancik/stretchly/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/hovancik/stretchly/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/hovancik/stretchly/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/hovancik/stretchly/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/hovancik/stretchly/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/hovancik/stretchly/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/hovancik/stretchly/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/hovancik/stretchly/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/hovancik/stretchly/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/hovancik/stretchly/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/hovancik/stretchly/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/hovancik/stretchly/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/hovancik/stretchly/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/hovancik/stretchly/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/hovancik/stretchly/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/hovancik/stretchly/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/hovancik/stretchly/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/hovancik/stretchly/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/hovancik/stretchly/compare/1a4817679dc840716ae7694c1bbb1f357a571097...v0.0.1
