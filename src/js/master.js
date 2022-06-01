function show() {
    window.api.send('toMain', 'show_*')

}

function hide() {
    window.api.send('toMain', 'hide_*')

}

function option() {
    window.api.send('toMain', 'option_*')

}

function update() {
    window.api.send('toMain', 'update_*')

}

function rend() {
    const select = document.getElementsByClassName('show_choice')[0]
    const option = Array.from(select).filter(
        (select) => select.selected 
    )[0].value

    window.api.rend(option)

}