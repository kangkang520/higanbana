import { parse } from ".";

//此文件用于处理模板引擎

/**
 * 给express使用的模板引擎
 * @param cached 是否使用缓存
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
			callback(e, null)
		}
	}

}