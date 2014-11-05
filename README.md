
# grunt-cssglue [![Build Status: Linux](https://travis-ci.org/andrezero/grunt-cssglue.png?branch=master)](https://travis-ci.org/andrezero/grunt-cssglue)

> Streamline configuration and execution of dist css related tasks.


## Getting Started

This plugin requires Grunt `~0.4.0`.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the
[Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a
[Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

Install the plugin with this command:

```shell
npm install grunt-cssglue --save-dev
```

Add this line to your project's `Gruntfile.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-cssglue');
```

## The "cssglue" task

_Run this task with the `grunt cssglue` command._

Task targets, files and options may be specified according to the grunt
[Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Examples for typical use cases are included below.


### Overview

This is a grunt multi-task to coordinate the tasks involved in generating javascript deliverables and streamlining the
configuration of several tasks in a single, consolidated, and _deliverables focused_ task.

Currently, it makes use of:
- [grunt-contrib-copy](https://github.com/gruntjs/grunt-contrib-copy),
- [grunt-contrib-concat](https://github.com/gruntjs/grunt-contrib-concat)
- [grunt-contrib-uglify](https://github.com/gruntjs/grunt-contrib-uglify)

See the roadmap below for what's planned for later.


### Configration

Inside your `Gruntfile.js` file, add a section called `cssglue`. This section specifies the targets for the `cssglue` task
and the options you want to pass to each target.

Here's an example configuration:

```javascript
config = {

  cssglue: {

    options: {
      concat: true,
      uglify: true,
      keepNoMins: false
    },

    main: {
      src: 'src/core/**/*.js',
      dest: 'dist/mylib',
      options: {
        keepNoMins: true
      }
    },

    foo: {
      src: 'src/plugins/foo/**/*.js',
      dest: 'dist/plugins/foo'
    },

    bar: {
      src: 'src/plugins/bar/**/*.js',
      dest: 'dist/plugins/bar'
    },

    baz: {
      cwd: 'src/modules/',
      src: 'src/modules/**/*.js',
      dest: 'dist/modules/',
      flatten: false,
      options: {
        concat: false
      }
    }
  }
}
```

In the `main` target we concatenate and uglify our main deliverables and we want to keep the non-minified version.

The `foo` and `bar` targets use all the defaults, take some part of our source-code and generate concatenated and
uglified files in the given destination.

The last target `baz` overrides the 'concat' option in order to copy over a bunch of files to `dist/modules/`, ignoring
the `src/modules` part of the original paths, but keeping the tree-structure under it. It then applies the defaults to
generate an uglified `.min.js` of each file and discard the non-minified versions.

Assuming all source files exist, and a deep directory tree exists in `src/modules`, then the above configuration will
generate the following deliverables:

```
./dist
    /mylib.js
    /mylib.min.js
    /plugins
        /foo.min.js
        /bar.min.js
    /modules
        /module1
            /subdir/
                /somefile.min.js
                /anotherfile.min.js
        /...
```


### Gotchas

The `dest` property must be a string. If it is an array, Grunt will fail when attempting to write the files.

When `concat` is turned off, the original filenames will be preserved and `dest` property works as a prefix for all
generated files. See `dest` below for details.


### Options

_Note: Options declared in a target will always _OVERRIDE_ the ones declared at the task level._


#### options.concat

Type: `Object|Boolean`

Default: `true`

Whether to concatenate the source files using [concat](https://github.com/gruntjs/grunt-contrib-concat).

If `options.concat` is not set to `false`, then matching files will be concatenated to the destination, using the
[concat](https://github.com/gruntjs/grunt-contrib-concat) task defaults.

If you want to set the concat options (separators, banners, footers, ect...) you can set `options.concat` to an object
with the copy specific parameters:

```javascript
config = {

  cssglue: {

    options: {
      concat: {
        banner: '/* HELLO! */',
      },
      uglify: true,
      keepNoMins: false
    },

    main: {
      src: 'src/core/**/*.js',
      dest: 'dist/mylib'
    }
  }
}
```


#### options.copy

Type: `Object`

Default: `{}`

If `options.concat` is set to false, then the matching source files will be copied over to destination using the
[copy](https://github.com/gruntjs/grunt-contrib-copy) task, optionally perserving all or part of the source directory
structure.

Set `options.copy` to an object to pass configuration to the copy task:

```javascript
config = {

  cssglue: {

    options: {
      uglify: true,
      keepNoMins: false
    },

    main: {
      src: 'src/core/**/*.js',
      dest: 'dist/mylib',
      options: {
        concat: false,
        copy: {
          timestamp: true
        }
      }
    }
  }
}
```


#### options.uglify

Type: `Object|Boolean`

Default: `{}`

Whether to uglify the result of the concat/copy step.

If you want to set the uglify options (compress, mangle, beautify, ect...) you can set `options.uglify` to an object
with the copy specific parameters:

```javascript
config = {

  cssglue: {

    options: {
      uglify: {
        compress: false,
        beautify: true
      }
      uglify: true,
      keepNoMins: false
    },

    main: {
      src: 'src/core/**/*.js',
      dest: 'dist/mylib'
    }
  }
}
```

#### options.keepNoMins

Type: `Boolean`

Default: `false`

Whether or not to not keep the non-minified version.


#### options.noMinsBanner

Type: `String`

Default: `nulll`

Whether or not to not add a banner to the non-minified files.


### About Grunt `src`, `dest`, `cwd` and `flatten`.

These are generic Grunt task parameters that influence _which_ source files are included in the task and _how_ their
original paths translate to the destination file strucuture.

You can read all about how to configure files in the [Configuring tasks](http://gruntjs.com/configuring-tasks) guide,
but, because the `cssglue` task orchestrates other Grunt tasks, it difers a little from the original tasks, so it's worth
going throught these in detail to demonstrate how you can configure this task to achieve the desired results.

#### dest

Type: `String`

Default: `null`

Filename _OR_ path of generated files.

If `concat` is not set to `false` then `dest` is used as single destination file name for the
[concat](https://github.com/gruntjs/grunt-contrib-concat) task(s). In this case, `dest` _SHOULD NOT_ end with a
trailing `/` or otherwise it will generate `./dist/destination-path/.js` and/or `/dist/destination-path/.min.js` files.

```
options.concat: true

  dest               > non-minified          minified
--------------------------------------------------------------------------------
  dist/foo           > dist/foo.js           dist/foo.min.js
  dist/plugins/foo   > dist/plugins/foo.js   dist/plugins/foo.min.js
                     > dist/.js              dist/.min.js
  dist/bar/          > dist/bar/.js          dist/bar/.min.js
```

File extension is optional but note that the task always assumes the end result to be `.js`. So if your `dest` ends with
something other than `.js`, it will still be appended to the generated file name.

```
options.concat: true

  dest               > non-minified           minified
--------------------------------------------------------------------------------
  dist/foo           > dist/foo.js            dist/foo.min.js
  dist/foo.js        > dist/foo.js            dist/foo.min.js
  dist/foo.bar       > dist/foo.bar.js        dist/foo.bar.min.js
```

If `concat` is set to `false` then one or more source files will be copied with
[copy](https://github.com/gruntjs/grunt-contrib-copy) instead of concat. In this case `dest` will be used as a prefix
applied to the original `path/to/file.name.js` being copied, therefore it _SHOULD_ typically end with a trailing '/'.

In the example below, assuming that `src` was set to `src/modules/**.*` and it matched 2 files (`.../foo.js` and
`.../bar.js`) and assuming we have `flatten` set to `true` to flatten the directory structure (see below)
then we can achieve the following results:

```
flatten: true
options.concat:  false

  dest            src            >  non-minified
--------------------------------------------------------------------------------
  dist/modules/   .../foo.js     >  dist/modules/foo.js
                  .../bar.js     >  dist/modules/foo.js
  dist/module-    .../foo.js     >  dist/module-bar.js
                  .../bar.js     >  dist/module-bar.js
```


#### src

Type: `String|Array`

Default: `null`

The is the list of files you wish to concat _OR_ copy _AND_ then uglify. Grunt provides powerful ways to list files
processed by tasks. Do read on [grunt files](http://gruntjs.com/configuring-tasks#files) here, about all the
possibilities, including use of glob patterns and template substitution.

```javascript
config = {

  cssglue: {

    main: {
      src: [
        '<%= html2js.main.dest %>',
        'src/**/*.js'
      ]
    }
  }
};
```

#### cwd

Type: `String`

Default: `.`

This is only relevant when `options.concat` is set to `false`. It influences the behaviour of the underlying
[copy](https://github.com/gruntjs/grunt-contrib-copy) task.

When copying files over to the your destination directory, you sometimes want to lay them out according to the original
file-structure, but you typically want to preserve only a part of the orginal path.

Imagine `options.src` was set to `src/modules/**/*.js` and it matches the 2 following files:

- `src/modules/foo/foo.js`
- `src/modules/bar/bar.js`

The below outcome is probably _NOT_ what you are after.

```
cwd:       . (default)
src:       src/modules/**/*.js
flatten:   false
concat:    false

  dest           src                     > non-minified
--------------------------------------------------------------------------------
  dist/modules/  src/modules/foo/foo.js  > dist/modules/src/modules/foo/foo.js
                 src/modules/bar/bar.js  > dist/modules/src/modules/bar/bar.js
```

The `cwd` option tells Grunt to look for `src` files _from within a certain directory_ therefore making all paths
relative to that directory, i.e., igoring that part of the original path.

This is what happens when we set `cwd` and update `src` accordingly, making it relative to the value of `cwd`:

```
cwd:       src/modules
src:       **/*.js
flatten:   false
concat:    false

  dest           src                     > non-minified
--------------------------------------------------------------------------------
  dist/modules/  src/modules/foo/foo.js  > dist/modules/foo/foo.js
                 src/modules/bar/bar.js  > dist/modules/bar/bar.js
```

##### flatten

Type: `Boolean`

Default: `true`

This is the Grunt [flatten](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically), also useful for
the underlying [copy](https://github.com/gruntjs/grunt-contrib-copy) task and also only relevant when `options.concat`
is set to `false`.

Following the above example, if `flatten` is set to true, then the all the matches files will be copied
into `path/dest` regardless of their original path. In this case, `cwd` is now only relevant in the sense that
it can restrict which files should be copied to a certain source directory.


```
cwd:     src/modules
src:     **/*.js
flatten: false
concat:  false

  dest           src                     > non-minified
--------------------------------------------------------------------------------
  dist/modules/  src/modules/foo/foo.js  > dist/modules/foo.js
                 src/modules/bar/bar.js  > dist/modules/bar.js
```


---

## Roadmap

- test coverage of all configuration options
- add examples of rename/process using contrib task options
- add noMinBanner option to add banner to non-minified files
- integrate task to base64 + embed assets, ideally whitelisting paths and/or URLs and/or file types (eg. fonts, images).

## [MIT License](LICENSE-MIT)

[Copyright (c) 2014 Andre Torgal](http://andrezero.mit-license.org/2014)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
