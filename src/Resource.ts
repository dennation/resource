import { castArray, cloneDeep, omit, pick } from "lodash"

export type ResourceConfig = {
    pick?: string | string[]
    omit?: string | string[]
    compute?: Record<string, (data: any, options?: any) => any>
    relations?: Record<string, (data: any) => any>
    dataField?: string
}

export default class Resource {
    #config: ResourceConfig & { dataField: string } = {
        dataField: 'data'
    }

    public constructor(config: ResourceConfig) {
        if (config.pick !== undefined) {
            config.pick = castArray(config.pick)
        }

        if (config.omit !== undefined) {
            config.omit = castArray(config.omit)
        }

        Object.assign(this.#config, config)
    }

    async encode(data: any, options?: any, meta?: any) {
        if (Array.isArray(data)) {
            const response: any = await Promise.all(data.map(el => this.encode(el, options, meta)))

            if (meta !== undefined) {
                return {
                    [this.#config.dataField]: response,
                    ...meta
                }
            }
            else {
                return response
            }
        }

        let output = this.#config.pick !== undefined ? pick(data, this.#config.pick) : cloneDeep(data)

        if (this.#config.omit !== undefined) {
            output = omit(output, this.#config.omit)
        }

        if (this.#config.compute !== undefined) {
            await Promise.all(Object.entries(this.#config.compute).map(async ([key, handler]) => {
                output[key] = await handler(data, options)
            }))
        }

        if (this.#config.relations !== undefined) {
            await Promise.all(Object.entries(this.#config.relations).map(async ([key, encode]) => {
                output[key] = await encode(data[key])
            }))
        }

        return output
    }
}