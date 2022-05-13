function show() {
    window.api.send('toMain', 'show_*')
}

function hide() {
    window.api.send('toMain', 'hide_*')
}

function work() {
    window.api.send('toMain','work')
}

function resume() {
    window.api.send('toMain','resume')
}