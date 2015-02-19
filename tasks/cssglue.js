'use strict';

var os = require('os');
var util = require('util');
var path = require('path');
var _ = require('lodash');

// waiting for lodash 3.0
var nativeMin = Math.min;
_.endsWith = function (string, target, position) {
    string = string == null ? '' : String(string);
    target = String(target);

    var length = string.length;
    position = (typeof position === 'undefined' ? length : nativeMin(position < 0 ? 0 : (+position || 0), length)) - target.length;
    return position >= 0 && string.indexOf(target, position) === position;
};

module.exports = function (grunt) {

    grunt.registerMultiTask('cssglue', 'Streamline configuration and execution of dist css related tasks.', function () {

        var opts = makeOptions(this);

        // used to queue other tasks with uniq targets
        var target = this.target;
        var uniqTarget;
        var queuedTasks = [];
        var srcList = [];
        var srcExtension;
        var taskConfig;
        var tmpDest;

        // -- LESS/SASS or passthrough --

        // individual src files are processed by less, sass or simply harvested for the next step
        this.files.forEach(function (file) {

            file.src.forEach(function (src) {

                // resolve path
                src = path.join(file.orig.cwd || '', src);

                srcExtension = path.extname(src);
                switch (srcExtension) {

                case '.css':
                    // next step uses the src file
                    srcList.push(src);
                    break;

                case '.less':
                    tmpDest = path.join(opts.tempDir, src) + '.css';

                    taskConfig = {
                        src: src,
                        dest: tmpDest,
                        options: opts.less
                    };

                    // queue the less task with a uniq target name
                    uniqTarget = makeUniqTarget(target);
                    queuedTasks.push(queueTask('less', uniqTarget, taskConfig));

                    grunt.verbose.writeln('+ less:' + uniqTarget + ':');
                    grunt.verbose.writeln('  + [' + taskConfig.src + ' -> ' + taskConfig.dest + ']');

                    // next step uses this tmp tmpDest
                    srcList.push(tmpDest);
                    break;

                case '.sass':
                case '.scss':
                    tmpDest = path.join(opts.tempDir, src) + '.css';

                    taskConfig = {
                        src: src,
                        dest: tmpDest,
                        options: opts.sass
                    };

                    // queue the less task with a uniq target name
                    uniqTarget = makeUniqTarget(target);
                    queuedTasks.push(queueTask('sass', uniqTarget, taskConfig));

                    grunt.verbose.writeln('+ sass:' + uniqTarget + '');
                    grunt.verbose.writeln('  + [' + taskConfig.src + ' -> ' + taskConfig.dest + ']');

                    // next step uses this tmp tmpDest
                    srcList.push(tmpDest);
                    break;

                default:
                    grunt.fail.warn('Cannot process source file "' + src + '". Only ".js", "less", "sass" and "scss" files are suported.');
                }
            });

            // -- CONCAT --

            // concatenate directly to destination if we are to keep the non-minified files, else concatenate to temp dir
            var concatDest = opts.keepNoMins ? addExtension(file.dest, '.css', '.min.css') : path.join(opts.tempDir, file.dest);

            taskConfig = {
                src: srcList,
                dest: concatDest,
                options: opts.concat
            };

            // queue the concat task with a uniq target name
            uniqTarget = makeUniqTarget(target);
            queuedTasks.push(queueTask('concat', uniqTarget, taskConfig));

            grunt.verbose.writeln('+ concat:' + uniqTarget + '');
            grunt.verbose.writeln('  + [' + srcList + ' -> ' + concatDest + ']');

            // -- UGLIFY --

            if (opts.minify) {
                var minDest = addExtension(file.dest, '.min.css', '.css');

                // task options, including specific concat options for this target
                taskConfig = {
                    src: concatDest,
                    dest: minDest,
                    options: opts.cssmin
                };

                // queue the concat task with a uniq target name
                uniqTarget = makeUniqTarget(target);
                queuedTasks.push(queueTask('cssmin', uniqTarget, taskConfig));

                grunt.verbose.writeln('+ cssmin:' + uniqTarget + '');
                grunt.verbose.writeln('  + [' + srcList + ' -> ' + minDest + ']');
            }
        });

        grunt.log.ok('queued tasks: ' + grunt.log.wordlist(queuedTasks));
    });

    /**
     * @param {object} task instance
     */
    var makeOptions = function (task) {

        // -- default options

        // make sure underlying task defaults are not applied
        var defaults = {
            concat: {
                separator: grunt.util.linefeed,
                footer: '',
                stripBanners: false,
                process: false,
                sourceMap: false,
                sourceMapName: undefined,
                sourceMapStyle: 'embed'
            },
            less: {
                // parse options
                paths: false,
                optimization: false,
                filename: false,
                strictImports: false,
                syncImport: false,
                dumpLineNumbers: false,
                relativeUrls: false,
                rootpath: false,
                // render options
                ieCompat: false,
                strictMath: true,
                strictUnits: true,
                outputSourceFiles: false,
                modifyVars: null
            },
            sass: {
                // Compass options
                precision: 5,
                quite: false,
                compass: false,
                debugInfo: false,
                lineNumbers: false,
                loadPath: null,
                require: null,
                cachePath: null,
                noCache: false,
                bundleExec: false
            },
            cssmin: {
                // CleanCss options
                advanced: false,
                aggressiveMerging: true,
                benchmark: false,
                compatibility: '',
                debug: false,
                inliner: null,
                keepBreaks: false,
                processImport: false,
                rebase: true,
                relativeTo: null,
                root: null,
                roundingPrecision: 2,
                target: null
            }
        };

        // -- get user options (with defaults applied)

        var opts = task.options({
            tempDir: os.tmpdir(),
            concat: defaults.concat,
            less: defaults.less,
            sass: defaults.sass,
            cssmin: defaults.cssmin,
            output: 'both',
            banner: '',
            bannerOn: 'both'
        });

        // -- validate options

        var validOutputs = ['clean', 'minified', 'both'];
        if (validOutputs.indexOf(opts.output) === -1) {
            grunt.fail.warn('Invalid output option: "' + opts.output + '". Valid options: ["' + validOutputs.join('", "') + '"].');
        }
        if (validOutputs.indexOf(opts.bannerOn) === -1) {
            grunt.fail.warn('Invalid bannerOn option: "' + opts.bannerOn + '". Valid options: ["' + validOutputs.join('", "') + '"].');
        }

        // useful shortcuts
        opts.minify = _.contains(['minified', 'both'], opts.output);
        opts.keepNoMins = _.contains(['clean', 'both'], opts.output);

        // -- override with hardcoded dist behaviour

        var bannerOnMins = _.contains(['minified', 'both'], opts.bannerOn);
        var bannerOnNoMins = _.contains(['clean', 'both'], opts.bannerOn);

        // - use a banner when concatenating if we want to keep the non-minified file
        // - and add the banner during cssmin
        var overrides = {
            concat: {
                banner: (opts.keepNoMins && bannerOnNoMins) ? opts.banner : ''
            },
            less: {
                sourceMap: false,
                banner: '',
                compress: false,
                cleancss: false
            },
            sass: {
                sourcemap: 'none',
                banner: false,
                style: 'expanded',
                update: false,
                check: false
            },
            cssmin: {
                banner: opts.bannerOnMins ? opts.banner : '',
                report: 'min',
                keepSpecialComments: 0
            }
        };

        // apply overrides (one by one because _.extend is shallow)
        _.extend(opts.concat, overrides.concat);
        _.extend(opts.less, overrides.less);
        _.extend(opts.sass, overrides.sass);
        _.extend(opts.cssmin, overrides.cssmin);

        return opts;
    };

    var randomHash = function (count) {
        if (count === 1) {
            return parseInt(16 * Math.random(), 10).toString(16);
        } else {
            var hash = '';
            for (var ix = 0; ix < count; ix++) {
                hash += randomHash(1);
            }
            return hash;
        }
    };

    var makeUniqTarget = function (target) {
        var uniqTarget = target + '_' + randomHash(6);
        return uniqTarget;
    };

    var queueTask = function (name, target, config) {
        var taskName = name + ':' + target;
        grunt.config.set(name + '.' + target, config);
        grunt.task.run(taskName);
        return taskName;
    };

    var addExtension = function (filename, extensionToAdd, extensionToReplace) {
        // remove extensionToReplace if present
        if (extensionToReplace && _.endsWith(filename, extensionToReplace)) {
            filename = filename.substr(0, filename.length - extensionToReplace.length);
        }
        if (!_.endsWith(filename, extensionToAdd)) {
            filename += extensionToAdd;
        }
        return filename;
    };

};

