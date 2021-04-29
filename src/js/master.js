function download(){
    let value = window.api.check()
    window.api.send('toMain',value)
}

function add_to_fav(){
    let value = window.api.check()
    window.api.send('toMain','fav_*'+value)
}

function check_new(){
    window.api.send('toMain','check_new_*volume_*')
}