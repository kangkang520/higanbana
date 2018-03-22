//这个文件中定义了模板中会用到的函数
export const hi = {

	if: function (exp: any, obj: any, html: string): string {
		//成功返回html
		if (exp) {
			obj.e_if = true
			return html
		}
		//失败返回空
		else {
			obj.e_if = false
			return ''
		}
	},

	else: function (exp: any, obj: any, html: string): string {
		//之前已经成功
		if (obj.e_if) return ''
		//否则执行表达式
		return hi.if(exp, obj, html)
	},

	forIn: function (obj: any | { [i: string]: any }, cb: (item: any, key: string | number) => string): Array<string> {
		let buffer = []
		if (typeof obj == 'undefined' || typeof obj == 'boolean') return []
		//字符串
		else if (typeof obj === 'string') {
			for (let i = 0; i < obj.length; i++)  buffer.push(cb(obj[i], i))
		}
		//数字
		else if (typeof obj == 'number') {
			if (obj > 0) for (let i = 0; i < obj; i++)  buffer.push(cb(i, i))
			else for (let i = 0; i > obj; i--)  buffer.push(cb(i, i))
		}
		//数组
		else if (obj instanceof Array) {
			buffer = obj.map((item: number, N) => cb(item, N))
		}
		//其他
		else {
			buffer = Object.keys(obj).map(key => cb(obj[key], key))
		}
		return buffer
	},

	show: function (exp: any, html: string) {
		return hi.if(exp, {}, html)
	},

	hide: function (exp: any, html: string) {
		return hi.if(!exp, {}, html)
	},

	mkrange: function (from: number, to?: number) {
		//单个参数处理
		if (to === undefined) {
			to = from
			from = 0;
		}
		//转换成整数
		from = parseInt(from as any)
		to = parseInt(to as any)
		if (isNaN(from) || isNaN(to) || from == to) return []
		//自增还是自减
		let calc = (num: number) => (from < (to as number)) ? (num + 1) : (num - 1)
		//生成范围
		let buffer = []
		for (let i = from; i != to; i = calc(i)) {
			buffer.push(i)
		}
		return buffer
	},

	val: function (val: any) {
		return val
	},
}