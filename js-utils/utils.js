module.exports = function createTemplateFunction($$_hi_require, $$_filepath, $$_hi, code) {
	//导出一些全局的变量方便使用
	let mkrange = $$_hi.mkrange
	let val = $$_hi.val
	//错误记录
	let $$_error_line = 0			//错误行号，从1开始
	return eval(`module.exports = function ($$_options){
		try {
			with($$_options){
				return ${code}
			}
		} catch (e) { 
			//记录错误位置并抛出
			e.fileStack = [...(e.fileStack||[]), [$$_filepath, $$_error_line]]
			throw e
		}
	}`)
}
