/// <reference types="node" />
import type { ParsedUrlQuery } from 'querystring';
import type { GetDynamicParamFromSegment } from '../../server/app-render/app-render';
import type { LoaderTree } from '../../server/lib/app-dir-module';
import React from 'react';
export declare function createMetadataComponents({ tree, pathname, trailingSlash, query, getDynamicParamFromSegment, appUsingSizeAdjustment, errorType, createDynamicallyTrackedSearchParams, }: {
    tree: LoaderTree;
    pathname: string;
    trailingSlash: boolean;
    query: ParsedUrlQuery;
    getDynamicParamFromSegment: GetDynamicParamFromSegment;
    appUsingSizeAdjustment: boolean;
    errorType?: 'not-found' | 'redirect';
    createDynamicallyTrackedSearchParams: (searchParams: ParsedUrlQuery) => ParsedUrlQuery;
}): [React.ComponentType, React.ComponentType];
