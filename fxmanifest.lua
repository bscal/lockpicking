fx_version 'cerulean'
game 'gta5'

author 'bscal'
description 'Lockpicking nui game'
version '1.0.0'

resource_type 'gametype' { name = 'lockpicking' }

ui_page 'ui/main.html'

client_script 'client/*.lua'
server_script 'server/*.lua'
files {
    'ui/*.html',
    'ui/*.css',
    'ui/*.js',
    'ui/assets/lockpick.jpg'
}