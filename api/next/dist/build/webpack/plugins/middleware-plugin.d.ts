import type { AssetBinding } from '../loaders/get-module-build-info';
import type { MiddlewareMatcher } from '../../analysis/get-page-static-info';
import { webpack } from 'next/dist/compiled/webpack/webpack';
import type { CustomRoutes } from '../../../lib/load-custom-routes';
export interface EdgeFunctionDefinition {
    files: string[];
    name: string;
    page: string;
    matchers: MiddlewareMatcher[];
    wasm?: AssetBinding[];
    assets?: AssetBinding[];
    regions?: string[] | string;
    environments?: Record<string, string>;
}
export interface MiddlewareManifest {
    version: 3;
    sortedMiddleware: string[];
    middleware: {
        [page: string]: EdgeFunctionDefinition;
    };
    functions: {
        [page: string]: EdgeFunctionDefinition;
    };
}
interface Options {
    dev: boolean;
    sriEnabled: boolean;
    rewrites: CustomRoutes['rewrites'];
    edgeEnvironments: Record<string, string>;
}
export default class MiddlewarePlugin {
    private readonly dev;
    private readonly sriEnabled;
    private readonly rewrites;
    private readonly edgeEnvironments;
    constructor({ dev, sriEnabled, rewrites, edgeEnvironments }: Options);
    apply(compiler: webpack.Compiler): void;
}
export declare const SUPPORTED_NATIVE_MODULES: readonly ["buffer", "events", "assert", "util", "async_hooks"];
export declare function getEdgePolyfilledModules(): Record<string, string>;
export declare function handleWebpackExternalForEdgeRuntime({ request, context, contextInfo, getResolve, }: {
    request: string;
    context: string;
    contextInfo: any;
    getResolve: () => any;
}): Promise<string | undefined>;
export {};
