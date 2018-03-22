import { parse } from ".";

//此文件用于处理模板引擎

/**
 * 给express使用的模板引擎
 */
export function engine() {

	return function (filePath: string, options: any, callback: (err: any, html?: string | null) => any) {
		try {
			//获取网页生成函数并执行
			let func = parse(filePath)
			let html = func(options)
			//返回结果
			callback(null, html)
		} catch (e) {
			//重新构建错误栈
			let stack = (e.fileStack || []).map(([file, line]: any) => (line > 0) ? `${file}:${line}` : file)
			if (stack.length > 0) e.stack = e.message + '\n  ' + stack.join('\n  ')
			callback(e, null)
		}
	}

}