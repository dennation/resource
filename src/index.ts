import Resource, { ResourceConfig } from "./Resource"

export default function createResource(config: ResourceConfig = {}) {
    return new Resource(config)
}