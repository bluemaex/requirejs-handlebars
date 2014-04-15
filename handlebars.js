/**
 * RequireJS Handlebars Plugin
 *
 * Loads Handlebars Template via HTTP and compiles the Template on demand
 * using the full Handlebars in development. If you build a production version
 * with the r.js then only the compiled template will be returned as a module
 * for use with the handlebars runtime.
 *
 * @author: Max Stockner <mail@bluemaex.de>
 * @license: MIT License
 */

define(function(require) {
    var _ = require('underscore'),
        text = require('text'),
        Handlebars = require('handlebars'),
        _buildMap = {}

    // check for AMD version of Handlebars
    if(!Handlebars.VERSION && Handlebars.default) {
        Handlebars = Handlebars.default
    }

    // a template for generating templates, this is so meta.
    var _buildTemplate = Handlebars.compile(
        [
            'define("{{pluginName}}!{{moduleName}}", ["handlebars"], function(Handlebars) {',
            '   var t = Handlebars.template({{{fn}}})',
            '   var partialFunction = {{{partialFunction}}}',
            '   partialFunction("{{moduleName}}", t)',
            '   return t',
            '})\n'
        ].join('\n'))

    function registerPartial(filePath, template) {
        var fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
        if (fileName.charAt(0) === '_') {
            var partialName = filePath.replace(/templates\/|partials\//g, '').replace(/\//g, '.')
            Handlebars.registerPartial(partialName, template)
        }
    }

    function load(filePath, req, onLoad, config) {
        var fileName = filePath
        var hbConfig = _.defaults(config.hb || {}, {
            templateExtension: '.tpl'
        })

        if (hbConfig.templateExtension !== null) {
            fileName += hbConfig.templateExtension
        }

        text.get(req.toUrl(fileName), function(data) {
            if (config.isBuild) {
                _buildMap[filePath] = Handlebars.precompile(data)
            }

            var template = Handlebars.compile(data)
            registerPartial(filePath, template)

            onLoad(template)
        })
    }

    function write(pluginName, moduleName, writeModule) {
        if (moduleName in _buildMap) {
            writeModule(_buildTemplate({
                pluginName: pluginName,
                moduleName: moduleName,
                partialFunction: registerPartial.toString(),
                fn: _buildMap[moduleName]
            }))
        }
    }

    return {
        load: load,
        write: write
    }
})
