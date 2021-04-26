
function download(){
    let value = window.api.check()
    window.api.send('toMain',value)
}