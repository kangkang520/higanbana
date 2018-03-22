//此文件用于将模板文件转换成js
import * as md5 from 'md5-file'
import * as fs from 'fs'
import * as path from 'path'
import * as parse5 from 'parse5'
import { hi } from './hi-func'
const createTemplateFunction = require('./../js-utils/utils')

//代码缓存，文件路径=>具体细节
let cache: { [i: string]: { md5: string, func: (data: any) => string } } = {}

//节点定义
const NODE_DOCUMENT = 'directive'
const NODE_TEXT = 'text'
const NODE_ROOT = 'root'
const NODE_COMMENT = 'comment'

//自动关闭的标签
const AUTO_CLOSE_TAGS = [
	'area', 'base', 'br', 'col', 'command', 'embed', 'img', 'hr', 'keygen',
	'link', 'meta', 'param', 'source', 'track', 'input', 'wbr'
]

//可用的标签
const HI_ATTRS = ['hi-if', 'hi-else', 'hi-for', 'hi-show', 'hi-hide']


//处理文件导入，在filepath中导入了linkpath文件
function hiRequire(filepath: string, linkpath: string, data: any) {
	let destFullPath = path.join(path.dirname(filepath), linkpath)
	//取得函数
	return parse(destFullPath)(data)
}


//将模板内容转换成js代码
function template2js(html: string): string {

	//获取行号
	function getLine(location: any, attrName?: string): number {
		if (!location) return 0
		if (location.startTag) location = location.startTag
		if (attrName && location.attrs && location.attrs[attrName]) location = location.attrs[attrName]
		return location ? location.line : 0
	}

	//添加行标记录HTML代码
	function lineHtml(line?: any) {
		return '${(()=>{$$_error_line = ' + line + '; return "";})()}'
	}

	//替换值输出（{{xxx}}）数据并计算行标
	function replaceValuePut(str: string, line: number): string {
		return str.replace(/\{\{([\s\S]+?)\}\}/g, (substr: string, matchstr: string, pos: number) => {
			//处理位置（需要向后推移一定字符位置）
			for (let i = 0; line > 0 && i < Math.min(str.length, pos); i++) if (str[i] == '\n') line++
			return lineHtml(line) + '${' + matchstr + '}'
		})
	}

	//转换标签的属性，得到标签字符串以及特殊标签
	function parseAttr(attrs: { [i: string]: string }, node: any): { tags: { [i: string]: string }, string: string } {
		let sysAttrs: { [i: string]: string } = {}
		//生成属性字符串，同时处理特殊标记
		let attrString = ''
		if (attrs) attrString = Object.keys(attrs).map(key => {
			let value = attrs[key]
			let result = ''
			//有特殊意义的属性
			if (HI_ATTRS.indexOf(key) >= 0) sysAttrs[key] = value
			//其他属性
			else result = `${key}="${replaceValuePut(value, getLine(node.__location, key))}"`
			//插入位置错误并返回结果
			return result
		}).filter(s => !!s).join(' ')
		//返回结果
		return {
			tags: sysAttrs,
			string: attrString
		}
	}

	//通过函数的形式得到html，以更好的控制变量空间
	function funcHtml(html: string): string {
		return '(()=>{let ifResult={}; return `' + html + '`})()'
	}

	//转换hi-for属性中的内容
	function parseFor(forVal: string): { varName: string, dataName: string } {
		//注释中问号有说明
		let varName = ''			//....map(??=>...)
		let dataName = ''			//??.map(...)
		let _;		//占位
		// (xx, xx) in xxx
		if (/^\s*\(\s*\S+\s*,\s*\S+\s*\)/.test(forVal)) {
			[_, varName, dataName] = forVal.match(/^\s*(\(\s*\S+\s*,\s*\S+\s*\))\s+in\s+([\s\S]+)$/) || [] as Array<string>
		}
		// xx in xxx
		else {
			[_, varName, dataName] = forVal.match(/^\s*(\S+)\s+in\s+([\s\S]+)$/) || [] as Array<string>
		}
		//返回结果
		return {
			varName,		//xx
			dataName,		//xxx
		}
	}

	//用于转换某个节点
	function parseNode(node: any, depth: number = 0): string {
		//取出节点名称
		let nodeName = node.name || ''
		let result = ''
		//处理文档节点
		if (node.type == NODE_DOCUMENT) result = '<' + node.data + '>\n'
		//处理注释
		else if (node.type == NODE_COMMENT) result = '<!--' + node.data + '-->'
		//处理文本节点
		else if (node.type == NODE_TEXT) result = replaceValuePut(node.data, getLine(node.__location))
		//处理引用
		else if (nodeName == 'require') result = '${$$_hi_require($$_filepath, "' + node.attribs.path + '", $$_options)}'
		//处理标签
		else {
			//处理attr
			let { string: attrString, tags } = parseAttr(node.attribs, node)
			//如果允许自动关闭
			if (AUTO_CLOSE_TAGS.indexOf(nodeName) >= 0 && node.children.length <= 0) {
				result = `<${nodeName}${attrString ? ' ' : ''}${attrString}>`
			}
			//否则获取子内容
			else {
				result = node.children.map((node: any) => parseNode(node, depth + 1)).join('')
				if (node.type != NODE_ROOT) result = `<${nodeName}${attrString ? ' ' : ''}${attrString}>${result}</${nodeName}>`
			}
			//处理特殊标记
			if (Object.keys(tags).length > 0) {
				//判断语句只能有一个
				if (tags['hi-if'] !== undefined) {
					result = '${$$_hi.if(' + (tags['hi-if'] || 'true') + ', ifResult, ' + funcHtml(result) + ')}'
				}
				else if (tags['hi-else'] !== undefined) {
					result = '${$$_hi.else(' + (tags['hi-else'] || 'true') + ', ifResult, ' + funcHtml(result) + ')}'
				}
				else if (tags['hi-show'] !== undefined) {
					result = '${$$_hi.show(' + (tags['hi-show'] || 'null') + ', ' + funcHtml(result) + ')}'
				}
				else if (tags['hi-hide'] !== undefined) {
					result = '${$$_hi.hide(' + (tags['hi-hide'] || 'null') + ', ' + funcHtml(result) + ')}'
				}
				//hi-for="item in items"或hi-for="(item, index) in items.map(i=>({...i, name:'Hello'}))"
				if (tags['hi-for'] !== undefined) {
					let { varName, dataName } = parseFor(tags['hi-for'])
					if (!varName || !dataName) console.log('[hi-for]循环体有问题，已忽略')
					else {
						result = '${$$_hi.forIn(' + dataName + ', ' + varName + ' => ' + funcHtml(result) + ' ).join("")}'
					}
				}
			}
		}
		//记录位置
		return lineHtml(getLine(node.__location)) + result
	}

	//处理require
	html = html.replace(/<require ([\s\S]+?)\/>/g, '<require $1></require>')
	//解析HTML文档
	let document = parse5[(/^\s*<!DOCTYPE/.test(html)) ? 'parse' : 'parseFragment'](html, {
		treeAdapter: parse5.treeAdapters.htmlparser2,
		locationInfo: true
	})
	let parseResult = parseNode(document)
	// console.log(parseResult)
	return funcHtml(parseResult)
}


/**
 * 转换模板为js代码
 * @param template 模板文件
 */
export function parse(template: string): (data: any) => string {
	let md5str = md5.sync(template)
	//查找缓存
	if (cache[template] && cache[template].md5 == md5str) return cache[template].func
	//否则创建新的内容
	//读取文件内容
	let html = fs.readFileSync(template) + ''
	//转换成代码
	let code = template2js(html)
	//生成函数(使用with处理)
	let func = createTemplateFunction(hiRequire, template, hi, code)
	//缓存函数
	cache[template] = { md5: md5str, func }
	//返回函数
	return func
}