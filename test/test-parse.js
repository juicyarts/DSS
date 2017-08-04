var dss = require('../dss')
var fs = require('fs')
var path = require('path')

exports.testParseOnElementNotAssignedToGroup = function (test) {
  test.expect(7)
  const result = [{
    type: 'element',
    name: 'Primary Button',
    selector: 'sms__button',
    description: 'The Primary Buttons is awesome',
    dependencies: [
      'angular',
      'material',
      'bootstrap'
    ],
    state: [
      { name: '--primary', escaped: '--primary', description: 'primary state' },
      { name: '--secondary', escaped: '--secondary', description: 'secondary state' },
      { name: '--success', escaped: '--success', description: 'success state' },
      { name: '--info', escaped: '--info', description: 'info state' },
      { name: '--danger', escaped: '--danger', description: 'danger state' },
      { name: '--warning', escaped: '--warning', description: 'warning state' }
    ],
    markup: [{
      lang: 'html',
      example: '<button>This is a button</button>',
      escaped: '&lt;button&gt;This is a button&lt;/button&gt;'
    }, {
      lang: 'javascript',
      example: "console.log('button')",
      escaped: "console.log('button')"
    }]
  }]

  var fileContents = fs.readFileSync(path.join(__dirname, 'data/button.styl'), 'utf8')
  dss.parse(fileContents, {}, function (parsed) {
    var block = parsed.blocks[0]
    test.equal(block.type, result[0].type)
    test.equal(block.name, result[0].name)
    test.equal(block.selector, result[0].selector)
    test.equal(block.description, result[0].description)
    test.deepEqual(block.state, result[0].state)
    test.deepEqual(block.markup, result[0].markup)
    test.deepEqual(block.dependencies, result[0].dependencies)
    console.dir(parsed, {depth: null, colors: true})
    test.done()
  })
}

exports.testParseOnElementAssignedToGroup = function (test) {
  // test.expect(7)
  const result = [{
    type: 'group',
    members: [{
      type: 'element',
      name: 'Primary Button',
      selector: 'sms__button',
      memberOf: 'Buttons',
      description: 'The Primary Buttons is awesome',
      dependencies: [
        'angular',
        'material',
        'bootstrap'
      ],
      state: [
        { name: '--primary', escaped: '--primary', description: 'primary state' },
        { name: '--secondary', escaped: '--secondary', description: 'secondary state' },
        { name: '--success', escaped: '--success', description: 'success state' },
        { name: '--info', escaped: '--info', description: 'info state' },
        { name: '--danger', escaped: '--danger', description: 'danger state' },
        { name: '--warning', escaped: '--warning', description: 'warning state' }
      ],
      markup: [{
        lang: 'html',
        example: '<button>This is a button</button>',
        escaped: '&lt;button&gt;This is a button&lt;/button&gt;'
      }, {
        lang: 'javascript',
        example: "console.log('button')",
        escaped: "console.log('button')"
      }]
    }]
  }]

  var fileContents = fs.readFileSync(path.join(__dirname, 'data/buttons.styl'), 'utf8')
  dss.parse(fileContents, {}, function (parsed) {
    var block = parsed.groups[0]

    console.dir(parsed, {depth: null, colors: true})
    test.done()
  })
}
