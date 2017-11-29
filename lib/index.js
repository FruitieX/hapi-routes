'use strict';

const Read = require('fs-readdir-recursive');
const Async = require('async');
const Path = require('path');

const testDefault = /\.(js)$/;

exports.register = (server, baseOptions, next) => {

    const list = Read(baseOptions.dir);

    return Async.each(list, (file, callback) => {

        // Skip files with unknown filename extension
        if (!file.match(baseOptions.test || testDefault)) {
            return callback();
        }

        const modulePath = Path.join(baseOptions.dir, file);
        const routeFile = require(modulePath);

        let routes = routeFile.default || routeFile;

        // Compatibility with old versions
        if (routeFile.routes) {
            console.warn('Warning: Deprecated `routes` export in ' + modulePath + '.');
            routes = routeFile.routes({ route: (_routes) => (routes = _routes) });
        }

        // Bind server to each handler function
        routes.forEach((route) => (route.handler = route.handler.bind(server)));
        server.route(routes);

        return callback();
    }, () => {

        server.log(['hapi-routes'], `Registered all routes in ${baseOptions.dir}`);

        return next();
    });
};

exports.register.attributes = {
    pkg: require('../package.json')
};
