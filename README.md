# Higanbana Template Engine

A template engine of express framework

You cand add properties to html tags to render templates, like :

```html
<a href="{{urls.home}}">Home</a>
<a href="{{urls.login}}" hi-if="session.user">Login</a>
```

[中文文档](./README_CN.md)

## Install

```
npm install --save higanbana
```

And then, you can configure your template engine in express like :

```js
app.engine('html', require('higanbana')())		//not only "html", others are ok
```
For more information, see http://expressjs.com


## Usage - Print

Using {{ $val }} to print a value to html，like：
```html
<div>{{user.name.first}} {{user.name.last}}</div>
```

And you can write expressions into {{}}, such as:

```html
<div>{{num1}} + {{num2}} = {{num1 + num2}}</div>
```



## Usage - Conditions

Add hi-if、hi-else、hi-show、hi-hide properties on html tag to set if the tag will be rendered, Examples:

```html
<div>
	<!-- ony if -->
	<div hi-if="a>0">a is great than 0</div>

	<!-- if and else -->
	<div hi-if="a>0">a is great than 0</div>
	<div hi-else="a==0">a is equals to 0</div>  <!-- hi-else="xxxx" means else if -->
	<div hi-else>a is little than 0</div>        <!-- hi-else means else -->

	<!-- show and hide -->
	<div hi-show="a==40">a is equals to 40</div>
	<div hi-hide="a==40">a is not equals to 40</div>
<div>
```


## Usage - Loop

Using hi-for property to print a array, a object, a string, a range.

if a number is given, that means a range of [0~n).

Examples:

```html
<!-- print array without index -->
<table>
	<tr hi-for="user in users">
		<td>{{user.id}}</td>
		<td>{{user.name}}</td>
	</tr>
</table>

<!-- print array with index -->
<table>
	<tr hi-for="(user, index) in users">
		<td>{{index+1}}</td>
		<td>{{user.id}}</td>
		<td>{{user.name}}</td>
	</tr>
</table>

<!-- print object without keys -->
<div hi-for="item in userInfo">
	{{item}}
</div>

<!-- print object with keys -->
<div hi-for="(item, key) in userInfo">
	{{key}}:{{item}}
</div>

<!-- and more -->
<table>
	<tr hi-for="(item, key) in users.filter(u=>u.gender=='男')">
		<td>{{index+1}}</td>
		<td>{{user.id}}</td>
		<td>{{user.name}}</td>
	</tr>
</table>

<!-- using range -->
<div hi-for="num1 in 4">  <!-- 0, 1, 2, 3 -->
	<div hi-for="num2 in -4" style="display:inline-block; width:100px"> 	<!-- 0, -1, -2, -3 -->
		<span>{{ num1 }}</span>
		<span>{{ (num2>=0) ? '+' : '-' }}</span>
		<span>{{ Math.abs(num2) }}</span>
		<span>=</span>
		<span>{{ num1+num2 }}</span>
	</div>
</div>

<!-- characters of string -->
<span hi-for="ch in 'ABCDE'" style="padding:0 5px;">{{ch}}</span>
```

## Usage - Range

Using mkrange(from:number, to?:number):Array<number> function to create a range, like：
```ts
mkrange(1, 3)               // 1, 2
mkrange(3)                  // 0, 1, 2
mkrange(3, 0)               // 3, 2, 1
```

Example：
```html
<div hi-for="number in mkrange(10)">{{number}}</div>
```

## Usage - Value

Using val(v:any):any function, you can create any value, but it is not a good idea, so, stop! stop! stop!：
```html
<!-- loop A-G -->
<div hi-for="(ch, N) in val('ABCDEFG')">
	{{N+1}}:{{ch}}
</div>
```


## Usage - import other templates

If you have other templates, you can use require tag to import them, such as:
```html
<require path="./../lib/header.html"/>
```


## Attentions

* A html tag only has a condition property ( one of hi-if、hi-else、hi-show、hi-hide)
* If you use hi-for and hi-if (or other condition property), hi-for will be done before hi-if
* require tag must be closed (&lt;require path="..." /&gt; or &lt;require path="..."&gt;&lt;/require&gt;”)