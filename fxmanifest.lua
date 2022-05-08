fx_version 'cerulean'
game 'gta5'

author 'bscal'
description 'Lockpicking nui game'
version '1.0.0'

ui_page 'ui/main.html'

client_script 'client/*.lua'
server_script 'server/*.lua'
files {
    'ui/**',
    'ui/assets/**'
}

export 'StartLockpicking'