
interface EngineFunc {
	(filePath: string, options: any, callback: (err: any, html?: string | null) => any): any
}

declare namespace higanbana {
	export const engine: () => EngineFunc
}

declare function higanbana(): EngineFunc

export = higanbana