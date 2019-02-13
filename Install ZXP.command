#!/usr/bin/env bash

set -e

function trashFile () {
  if [[ -d "$1" || -f "$1" ]]; then
    osascript \
      -e 'on run argv' \
      -e   'tell the application "Finder" to move ((item 1 of argv) as POSIX file as alias) to the trash' \
      -e 'end run' \
      "$1"
  fi
  [[ -d "$1" || -f "$1" ]] && return 1 || return 0
}

ExtensionName="ComponentLibraryPhotoshopPanel"

ExtensionZXP="$(dirname "$0")/$ExtensionName.zxp"

InstallationRoot="$HOME/Library/Application Support/Adobe/CEPServiceManager4/extensions"
InstallationExtensionPath="$InstallationRoot/$ExtensionName"

mkdir -p "$InstallationRoot"

[[ -h "$InstallationExtensionPath" ]] && rm "$InstallationExtensionPath"
[[ -a "$InstallationExtensionPath" ]] && trashFile "$InstallationExtensionPath"

unzip "$ExtensionZXP" -d "$InstallationExtensionPath"

osascript \
  -e 'tell application "System Events" to set PhotoshopIsRunning to the (count of (every process whose name contains "Adobe Photoshop CC")) is greater than 0' \
  -e 'if PhotoshopIsRunning then' \
  -e    'tell the application "Adobe Photoshop CC" to do javascript ¬' \
  -e       '"alert('\'"Installed $ExtensionName"'\\n" & ¬' \
  -e       '"Restart Photoshop to activate it\\n" & ¬' \
  -e       '"Open it from the Window→Extensions menu'\'', true)"' \
  -e 'end if' \
  -e '"Done!"'
