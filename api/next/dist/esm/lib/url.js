const DUMMY_ORIGIN = "http://n";
function getUrlWithoutHost(url) {
    return new URL(url, DUMMY_ORIGIN);
}
export function getPathname(url) {
    return getUrlWithoutHost(url).pathname;
}
export function isFullStringUrl(url) {
    return /https?:\/\//.test(url);
}

//# sourceMappingURL=url.js.map