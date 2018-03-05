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

	//转换标签的属性，得到标签字符串以及特殊标签
	function parseAttr(attrs: { [i: string]: string }): { tags: { [i: string]: string }, string: string } {
		let sysAttrs: { [i: string]: string } = {}
		//生成属性字符串，同时处理特殊标记
		let attrString = ''
		if (attrs) attrString = Object.keys(attrs).map(key => {
			let value = attrs[key]
			//有特殊意义的属性
			if (HI_ATTRS.indexOf(key) >= 0) {
				sysAttrs[key] = value
				return ''
			}
			//其他属性
			else {
				value = value.replace(/\{\{([\s\S]+?)\}\}/g, '${$1}')
				return `${key}="${value}"`
			}
		}).filter(s => !!s).join(' ')

		//返回结果
		return {
			tags: sysAttrs,
			string: attrString
		}
	}

	//通过函数的形式得到html，以更好的控制变量空间
	function funcHtml(html: string) {
		return '(()=>{let ifResult={}; return `' + html + '`})()'
	}

	//转换hi-for属性中的内容
	function parseFor(forVal: string) {
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
			dataName		//xxx
		}
	}

	//用于转换某个节点
	function parseNode(node: any, depth: number = 0): string {
		//处理文档节点
		if (node.type == NODE_DOCUMENT) {
			return '<' + node.data + '>\n'
		}
		//处理注释
		else if (node.type == NODE_COMMENT) {
			return '<!--' + node.data + '-->'
		}
		//处理文本节点
		else if (node.type == NODE_TEXT) {
			return node.data.replace(/\{\{([\s\S]+?)\}\}/g, '${$1}')
		}
		//处理引用
		else if (node.name == 'require') {
			return '${__hi_require(__filepath, "' + node.attribs.path + '", ___options)}'
		}
		//处理标签
		else {
			//处理attr
			let { string: attrString, tags } = parseAttr(node.attribs)
			//获取内容
			let content = ''
			//如果允许自动关闭
			if (AUTO_CLOSE_TAGS.indexOf(node.name) >= 0 && node.children.length <= 0) {
				content = `<${node.name}${attrString ? ' ' : ''}${attrString}>`
			}
			//否则获取子内容
			else {
				content = node.children.map((node: any) => {
					return parseNode(node, depth + 1)
				}).join('')
				if (node.type != NODE_ROOT) content = `<${node.name}${attrString ? ' ' : ''}${attrString}>${content}</${node.name}>`
			}
			//处理特殊标记
			if (Object.keys(tags).length > 0) {
				//判断语句只能有一个
				if (tags['hi-if'] !== undefined) {
					content = '${__hi.if(' + (tags['hi-if'] || 'true') + ', ifResult, ' + funcHtml(content) + ')}'
				}
				else if (tags['hi-else'] !== undefined) {
					content = '${__hi.else(' + (tags['hi-else'] || 'true') + ', ifResult, ' + funcHtml(content) + ')}'
				}
				else if (tags['hi-show'] !== undefined) {
					content = '${__hi.show(' + (tags['hi-show'] || 'null') + ', ' + funcHtml(content) + ')}'
				}
				else if (tags['hi-hide'] !== undefined) {
					content = '${__hi.hide(' + (tags['hi-hide'] || 'null') + ', ' + funcHtml(content) + ')}'
				}
				//hi-for="item in items"或hi-for="(item, index) in items.map(i=>({...i, name:'Hello'}))"
				if (tags['hi-for'] !== undefined) {
					let { varName, dataName } = parseFor(tags['hi-for'])
					if (!varName || !dataName) console.log('[hi-for]循环体有问题，已忽略')
					else {
						content = '${__hi.forIn(' + dataName + ', ' + varName + ' => ' + funcHtml(content) + ' ).join("")}'
					}
				}
			}
			return content;
		}
	}


	//解析HTML文档
	let document = parse5[(/^\s*<!DOCTYPE/.test(html)) ? 'parse' : 'parseFragment'](html, {
		treeAdapter: parse5.treeAdapters.htmlparser2,
		// locationInfo: true				//当前版本暂时不使用
	})
	return funcHtml(parseNode(document))
}


/**
 * 转换模板为js代码
 * @param template 模板文件
 * @param cached 是否使用缓存
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