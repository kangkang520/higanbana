# higanbana 模板引擎

higanbana（彼岸花）express模板引擎

使用nodejs开发已久，期间使用了很多模板引擎，不过都不好用，心想，要是有一种模板引擎能够像angularJS或vue那样在标签上加上一些属性就能渲染该多好，所以呢，自己动手写一个吧！！！



## 安装

```
npm install --save higanbana
```

然后，你需要在express中配置higanbana模板引擎，具体的配制方法见express官网。

```js
app.engine('html', require('higanbana')())		//文件后缀可以是其他
```



## 使用 - 变量输出

使用 {{ $变量 }} 即可输出变量，如：
```html
<div>{{user.name.first}} {{user.name.last}}</div>
```
大括号中还支持一些js运算，如
```html
<div>{{num1}} + {{num2}} = {{num1 + num2}}</div>
```



## 使用 - 条件判断

在HTML标签上加上 hi-if、hi-else、hi-show、hi-hide 属性可以控制该标签是否渲染，不过这里更推荐用hi-show和hi-hide，如：
```html
<div>
	<!-- 只有if -->
	<div hi-if="a>0">a大于0</div>

	<!-- if和else -->
	<div hi-if="a>0">a大于0</div>
	<div hi-else="a==0">a等于0</div>  <!-- 给 hi-else 带上表达式表示 else if -->
	<div hi-else>a小于0</div>        <!-- 不带表达式表示else -->

	<!-- 显示、隐藏快捷写法 -->
	<div hi-show="a==40">a等于40</div>
	<div hi-hide="a==40">a不等于40</div>
<div>
```


## 使用 - 循环输出

在HTML标签上加上 hi-for 属性即可循环输出，可以用于数组和对象的输出，有两种循环方式（带索引和不带索引），参考例子：
```html
<!-- 不带索引的输出 -->
<table>
	<tr hi-for="user in users">
		<td>{{user.id}}</td>
		<td>{{user.name}}</td>
	</tr>
</table>

<!-- 带索引的输出 -->
<table>
	<tr hi-for="(user, index) in users">
		<td>{{index+1}}</td>
		<td>{{user.id}}</td>
		<td>{{user.name}}</td>
	</tr>
</table>

<!-- 不带键输出对象 -->
<div hi-for="item in userInfo">
	{{item}}
</div>

<!-- 不带键输出对象 -->
<div hi-for="(item, key) in userInfo">
	{{key}}:{{item}}
</div>

<!-- 带有简单运算(只显示性别为男的用户，使用es6语法) -->
<table>
	<tr hi-for="(item, key) in users.filter(u=>u.gender=='男')">
		<td>{{index+1}}</td>
		<td>{{user.id}}</td>
		<td>{{user.name}}</td>
	</tr>
</table>
```

## 使用 - 区间操作

使用mkrange(from:number, to?:number):Array<number>函数可以创建一个左闭右开区间，如：
```js
mkrange(1, 3)               // 1, 2
mkrange(3)                  // 0, 1, 2
mkrange(3, 0)               // 3, 2, 1
```

加入到HTML中如：
```html
<div hi-for="number in mkrange(10)">{{number}}</div>
```


## 特别注意

* 一个标签中只能出现一个判断标签（hi-if、hi-else、hi-show、hi-hide 之一）
* 如果在一个标签上同时又 hi-for 和 hi-if系列 属性，则会优先进行 hi-for