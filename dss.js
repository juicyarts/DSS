var dss = (function () {
  var _dss = function () {}

  _dss.parsers = {}

  _dss.detect = function () {
    return true
  }

  _dss.detector = function (callback) {
    _dss.detect = callback
  }

  _dss.parser = function (name, callback) {
    _dss.parsers[ name ] = callback
  }

  _dss.trim = function (str, arr) {
    var defaults = [ /^\s\s*/, /\s\s*$/ ]
    arr = (_dss.isArray(arr)) ? arr.concat(defaults) : defaults
    arr.forEach(function (regEx) {
      str = str.replace(regEx, '')
    })
    return str
  }

  _dss.isArray = function (obj) {
    return toString.call(obj) == '[object Array]'
  }

  _dss.size = function (obj) {
    var size = Object.keys(obj).length
    return size
  }

  _dss.extend = function (obj) {
    _dss.each(Array.prototype.slice.call(arguments, 1), function (source) {
      if (source) {
        for ( var prop in source) {
          obj[ prop ] = source[ prop ]
        }
      }
    })
    return obj
  }

  _dss.each = function (obj, iterator, context) {
    if (!obj || obj === null) return

    if (obj.length === +obj.length) {
      for ( var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[ i ], i, obj) === {}) {
          return
        }
      }
    } else {
      for ( var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[ key ], key, obj) === {}) {
            return
          }
        }
      }
    }
  }

  _dss.squeeze = function (str, def) {
    return str.replace(/\s{2,}/g, def)
  }

  /*
   * Normalizes the comment block to ignore any consistent preceding
   * whitespace. Consistent means the same amount of whitespace on every line
   * of the comment block. Also strips any whitespace at the start and end of
   * the whole block.
   */
  _dss.normalize = function (text_block) {

    // Strip out any preceding [whitespace]* that occurs on every line
    text_block = text_block.replace(/^(\s*\*+)/, '')

    // Strip consistent indenting by measuring first line's whitespace
    var indent_size = false
    var unindented = (function (lines) {
      return lines.map(function (line) {
        var preceding_whitespace = line.match(/^\s*/)[ 0 ].length
        if (!indent_size) {
          indent_size = preceding_whitespace
        }
        if (line == '') {
          return ''
        } else if (indent_size <= preceding_whitespace && indent_size > 0) {
          return line.slice(indent_size, (line.length - 1))
        } else {
          return line
        }
      }).join('\n')
    })(text_block.split('\n'))

    return _dss.trim(text_block)
  }

  /*
   * Takes a file and extracts comments from it.
   *
   * @param (Object) options
   * @param (Function) callback
   */
  _dss.parse = function (lines, options, callback) {

    // Options
    options = (options) ? options : {}
    options.preserve_whitespace = !!(options.preserve_whitespace)

    // Setup
    var current_block = ''
    var inside_single_line_block = false
    var inside_multi_line_block = false
    var last_line = ''
    var start = '{start}'
    var end = '{/end}'
    var _parsed = false
    var _blocks = []
    var parsed = ''
    var blocks = []
    var groups = {}
    var temp = {}
    var lineNum = 0
    var from = 0
    var to = 0

    lines = lines + ''
    lines.split(/\n/).forEach(function (line) {

      // Iterate line number and ensure line is treaty as a string
      lineNum = lineNum + 1
      line = line + ''

      // Store starting line number
      if (single_line_comment(line) || start_multi_line_comment(line)) {
        from = lineNum
      }

      // Parse Single line comment
      if (single_line_comment(line)) {
        parsed = parse_single_line(line)
        if (inside_single_line_block) {
          current_block += '\n' + parsed
        } else {
          current_block = parsed
          inside_single_line_block = true
        }
      }

      // Parse multi-line comments
      if (start_multi_line_comment(line) || inside_multi_line_block) {
        parsed = parse_multi_line(line)
        if (inside_multi_line_block) {
          current_block += '\n' + parsed
        } else {
          current_block += parsed
          inside_multi_line_block = true
        }
      }

      // End a multi-line block
      if (end_multi_line_comment(line)) {
        inside_multi_line_block = false
      }

      // Store current block if done
      if (!single_line_comment(line) && !inside_multi_line_block) {
        if (current_block) {
          _blocks.push({ text: _dss.normalize(current_block), from: from, to: lineNum })
        }
        inside_single_line_block = false
        current_block = ''
        last_line = ''
      }
    })

    // Done first pass
    _parsed = true

    // Create new blocks with custom parsing
    _blocks.forEach(function (block) {

      // Store line numbers
      var from = block.from
      var to = block.to

      // Remove extra whitespace
      block = block.text.split('\n').filter(function (line) {
        return (_dss.trim(_dss.normalize(line)))
      }).join('\n')

      // Split block into lines
      block.split('\n').forEach(function (line) {
        if (_dss.detect(line)) {
          temp = parser(temp, _dss.normalize(line), block, lines, from, to, options)
        }
      })

      // Push to blocks if object isn't empty
      if (_dss.size(temp) && !temp.memberOf && temp.type !== 'group') {
        blocks.push(temp)
      } else if (temp.type === 'group') {
        groups[temp.name] = groups[temp.name] ? Object.assign(groups[temp.name], temp) : temp
      } else if (temp.type === 'element' && temp.memberOf) {
        if (!groups[temp.memberOf]) {
          groups[temp.memberOf] = {name: temp.memberOf}
        }
        groups[temp.memberOf].members = groups[temp.memberOf].members || []
        groups[temp.memberOf].members.push(temp)
      }

      temp = {}
    })

    // Execute callback with filename and blocks
    callback({ blocks, groups})
  }

  /*
   * Parses line
   *
   * @param (Num) the line number
   * @param (Num) number of lines
   * @param (String) line to parse/check
   * @return (Boolean) result of parsing
   */
  function parser (temp, line, block, file, from, to, options) {
    var parts = line.replace(/.*@/, '')
    var index = indexer(parts, ' ') || indexer(parts, '\n') || indexer(parts, '\r') || parts.length
    var name = _dss.trim(parts.substr(0, index))
    var output = {
      options: options,
      file: file,
      name: name,
      line: {
        contents: _dss.trim(parts.substr(index)),
        from: block.indexOf(line),
        to: block.indexOf(line)
      },
      block: {
        contents: block,
        from: from,
        to: to
      }
    }

    // find the next instance of a parser (if there is one based on the @ symbol)
    // in order to isolate the current multi-line parser
    var nextParserIndex = block.indexOf('* @', output.line.from + 1)
    var markupLength = (nextParserIndex > -1) ? nextParserIndex - output.line.from : block.length
    var contents = block.split('').splice(output.line.from , markupLength).join('')
    var parserMarker = '@' + name
    contents = contents.replace(parserMarker, '')

    // Redefine output contents to support multiline contents
    output.line.contents = (function (contents) {
      var ret = []
      var lines = contents.split('\n')

      lines.forEach(function (line, i) {
        var pattern = '*'
        var index = line.indexOf(pattern)

        if (index >= 0 && index < 10) {
          line = line.split('').splice((index + pattern.length), line.length).join('')
        }

        // Trim whitespace from the the first line in multiline contents
        if (i === 0) {
          line = _dss.trim(line)
        }

        if (line && line.indexOf(parserMarker) == -1) {
          ret.push(line)
        }
      })

      return ret.join('\n')
    })(contents)

    line = {}
    line[ name ] = (_dss.parsers[ name ]) ? _dss.parsers[ name ].call(output) : ''

    if (temp[ name ]) {
      if (!_dss.isArray(temp[ name ])) {
        temp[name] = [ temp[ name ]]
      }
      if (!_dss.isArray(line[ name ])) {
        temp[ name ].push(line[ name ])
      } else {
        temp[ name ].push(line[ name ][ 0 ])
      }
    } else {
      temp = _dss.extend(temp, line)
    }
    return temp
  }

  function indexer (str, find) {
    return (str.indexOf(find) > 0) ? str.indexOf(find) : false
  }

  function block () {
    this._raw = (comment_text) ? comment_text : ''
    this._filename = filename
  }
  function single_line_comment (line) {
    return !!line.match(/^\s*\/\//)
  }

  function start_multi_line_comment (line) {
    return !!line.match(/^\s*\/\*/)
  }

  function end_multi_line_comment (line) {
    if (single_line_comment(line)) {
      return false
    }
    return !!line.match(/.*\*\//)
  }

  function parse_single_line (line) {
    return line.replace(/\s*\/\//, '')
  }

  function parse_multi_line (line) {
    var cleaned = line.replace(/\s*\/\*/, '')
    return cleaned.replace(/\*\//, '')
  }

  return _dss
})()

// Describe default detection pattern
dss.detector(function (line) {
  if (typeof line !== 'string') {
    return false
  }
  var reference = line.split('\n\n').pop()
  return !!reference.match(/.*@/)
})

// Parsers

dss.parser('name', function () {
  return this.line.contents
})

dss.parser('description', function () {
  return this.line.contents
})

dss.parser('dependencies', function () {
  var deps = this.line.contents.replace(/\s*\-\s*/g, '-').split('-')
  var retDeps = []
  for (var i = 0, len = deps.length; i < len; i++) {
    if (deps[i] !== '') {
      retDeps.push(deps[i])
    }
  }
  return retDeps
})

dss.parser('state', function () {
  var state = this.line.contents.split(' - ')
  return [{
    name: (state[ 0 ]) ? dss.trim(state[ 0 ]) : '',
    escaped: (state[ 0 ]) ? dss.trim(state[ 0 ].replace('.', ' ').replace(':', ' pseudo-class-')) : '',
    description: (state[ 1 ]) ? dss.trim(state[ 1 ]) : ''
  }]
})

dss.parser('markup', function () {
  const regEx = /^.+?(?=\n)/
  let retObject = {}

  if (regEx.exec(this.line.contents).length > 0) {
    retObject.lang = regEx.exec(this.line.contents)[0]
    retObject.example = this.line.contents.replace(/^.+?(\n)(\s*)/, '')
  } else {
    retObject.example = this.line.contents
  }

  retObject.escaped = retObject.example.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return [retObject]
})

dss.parser('type', function () {
  return this.line.contents
})

dss.parser('selector', function () {
  return this.line.contents
})

dss.parser('memberOf', function () {
  return this.line.contents
})

// Module exports
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = dss
  }
  exports.dss = dss
} else {
  root[ 'dss' ] = dss
}

// AMD definition
if (typeof define === 'function' && define.amd) {
  define(function (require) {
    return dss
  })
}
