var serialize = require('form-serialize')

// Basic string to DOM function
var stringToDom = function (str) {
  var testEl = document.createElement('div')
  testEl.innerHTML = str
  if (testEl.childElementCount === 0) {
    return document.createTextNode(str)
  }
  if (testEl.childElementCount === 1) {
    return testEl.firstElementChild
  }
  var frag = document.createDocumentFragment()
  // Appending the element from testEl will remove it from testEl.children,
  // so we store the initial length of children and then always append the first child
  for (var i = 0, len = testEl.children.length; i < len; i++) {
    frag.appendChild(testEl.children[0])
  }
  return frag
}

var buildDialogForm = function (options) {
  var form = document.createElement('form')
  form.classList.add('vex-dialog-form')

  var message = document.createElement('div')
  message.classList.add('vex-dialog-message')
  message.appendChild(options.message instanceof window.Node ? options.message : stringToDom(options.message))

  var input = document.createElement('div')
  input.classList.add('vex-dialog-input')
  input.appendChild(options.input instanceof window.Node ? options.input : stringToDom(options.input))

  form.appendChild(message)
  form.appendChild(input)
  form.appendChild(buttonsToDOM.call(this, options.buttons))
  form.addEventListener('submit', options.onSubmit.bind(this))

  return form
}

var buttonsToDOM = function (buttons) {
  var domButtons = document.createElement('div')
  domButtons.classList.add('vex-dialog-buttons')

  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i]
    var domButton = document.createElement('button')
    domButton.type = button.type
    domButton.textContent = button.text
    domButton.classList.add(button.className)
    domButton.classList.add('vex-dialog-button')
    if (i === 0) {
      domButton.classList.add('vex-first')
    } else if (i === buttons.length - 1) {
      domButton.classList.add('vex-last')
    }
    // Attach click listener to button with closure
    (function (button) {
      domButton.addEventListener('click', function (e) {
        if (button.click) {
          button.click.call(this, e)
        }
      }.bind(this))
    }.bind(this)(button))

    domButtons.appendChild(domButton)
  }

  return domButtons
}

var Dialog = function (vex) {
  // Dialog plugin
  return {
    // Open
    open: function (opts) {
      var options = Object.assign({}, Dialog.defaultOptions, opts)

      // Build the form from the options
      this.form = options.content = buildDialogForm.call(this, options)

      // Override the before close callback to also pass the value of the form
      var beforeClose = options.beforeClose
      options.beforeClose = function () {
        options.callback(this.value || false)
        if (beforeClose) {
          beforeClose.call(this)
        }
      }.bind(this)

      // Open the dialog
      var dialog = vex.open(options)

      // Optionally focus the first input in the form
      if (options.focusFirstInput) {
        dialog.contentEl.querySelector('button, input, textarea').focus()
      }

      // For chaining
      return dialog
    },

    // Alert
    alert: function (options) {
      if (typeof options === 'string') {
        options = {
          message: options
        }
      }
      options = Object.assign({}, Dialog.defaultOptions, Dialog.defaultAlertOptions, options)
      return this.open(options)
    },

    // Confirm
    confirm: function (options) {
      if (typeof options === 'string') {
        throw new Error('Dialog.confirm(options) requires options.callback.')
      }
      options = Object.assign({}, Dialog.defaultOptions, Dialog.defaultConfirmOptions, options)
      return this.open(options)
    },

    // Prompt
    prompt: function (options) {
      if (typeof options === 'string') {
        throw new Error('Dialog.prompt(options) requires options.callback.')
      }
      options = Object.assign({}, Dialog.defaultOptions, Dialog.defaultPromptOptions, options)
      options.message = '<label for="vex">' + options.label + '</label>'
      options.input = '<input name="vex" type="text" class="vex-dialog-prompt-input" placeholder="' + options.placeholder + '" value="' + options.value + '" />'
      var callback = options.callback
      options.callback = function (value) {
        value = value[Object.keys(value)[0]]
        callback(value)
      }
      return this.open(options)
    }
  }
}

Dialog.buttons = {
  YES: {
    text: 'OK',
    type: 'submit',
    className: 'vex-dialog-button-primary',
    click: function () {
      this.value = true
    }
  },

  NO: {
    text: 'Cancel',
    type: 'button',
    className: 'vex-dialog-button-secondary',
    click: function () {
      this.value = false
      this.close()
    }
  }
}

Dialog.defaultOptions = {
  callback: function () {},
  afterOpen: function () {},
  message: '',
  input: '',
  buttons: [
    Dialog.buttons.YES,
    Dialog.buttons.NO
  ],
  showCloseButton: false,
  onSubmit: function (e) {
    e.preventDefault()
    if (this.options.input) {
      this.value = serialize(this.form, { hash: true })
    }
    return this.close()
  },
  focusFirstInput: true
}

Dialog.defaultAlertOptions = {
  message: 'Alert',
  buttons: [
    Dialog.buttons.YES
  ]
}

Dialog.defaultPromptOptions = {
  label: 'Prompt:',
  placeholder: '',
  value: ''
}

Dialog.defaultConfirmOptions = {
  message: 'Confirm'
}

Dialog.name = 'Dialog'

module.exports = Dialog
