module.exports = function createTemplateFunction(__hi_require, __filepath, __hi, code) {
	let mkrange = __hi.mkrange
	return eval(`module.exports = function (___options){
		with(___options){
			return ${code}
		}
	}`)
}