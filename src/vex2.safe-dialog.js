var domify = require('domify')
var serialize = require('form-serialize')

var buildDialogForm = function (options) {
  var form = document.createElement('form')
  form.classList.add('vex-dialog-form')

  var message = document.createElement('div')
  message.classList.add('vex-dialog-message')
  message.appendChild(options.message instanceof window.Node ? options.message : domify(options.message))

  var input = document.createElement('div')
  input.classList.add('vex-dialog-input')
  input.appendChild(options.input instanceof window.Node ? options.input : domify(options.input))

  form.appendChild(message)
  form.appendChild(input)

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

// Given a string, escape any special HTML characters in it and return the escaped string.
// Return empty string if the input is undefined
function escapeHtml(str) {
	if (typeof str !== 'undefined') {
		var div = document.createElement('div');
		div.appendChild(document.createTextNode(str));
		return div.innerHTML;
	}
  else {
		return ''
	}
}

var dialog = function (vex) {
  // dialog plugin
  return {
    // Open
    open: function (opts) {
      var options = Object.assign({}, dialog.defaultOptions, opts)

     // `message` is unsafe internally, so translate
      if (options.unsafeMessage) {
        options.message = options.unsafeMessage;
      }
      // safe default: HTML-escape the message before passing it throw
      else if (options.message) {
        options.message = escapeHtml(options.message);
      }

      // Build the form from the options
      var form = options.content = buildDialogForm(options)

      // Open the dialog
      var dialogInstance = vex.open(options)

      // Override the before close callback to also pass the value of the form
      var beforeClose = options.beforeClose
      dialogInstance.options.beforeClose = function () {
        options.callback(this.value || false)
        if (beforeClose) {
          beforeClose.call(this)
        }
      }.bind(dialogInstance)

      // Append buttons to form with correct context
      form.appendChild(buttonsToDOM.call(dialogInstance, options.buttons))

      // Attach form to instance
      dialogInstance.form = form

      // Add submit listener to form
      form.addEventListener('submit', options.onSubmit.bind(dialogInstance))

      // Optionally focus the first input in the form
      if (options.focusFirstInput) {
        var el = dialogInstance.contentEl.querySelector('button, input, textarea')
        if (el) {
          el.focus()
        }
      }

      // For chaining
      return dialogInstance
    },

    // Alert
    alert: function (options) {
      if (typeof options === 'string') {
        options = {
          message: options
        }
      }
      options = Object.assign({}, dialog.defaultOptions, dialog.defaultAlertOptions, options)
      return this.open(options)
    },

    // Confirm
    confirm: function (options) {
      if (typeof options === 'string') {
        throw new Error('dialog.confirm(options) requires options.callback.')
      }
      options = Object.assign({}, dialog.defaultOptions, dialog.defaultConfirmOptions, options)
      return this.open(options)
    },

    // Prompt
    prompt: function (options) {
      if (typeof options === 'string') {
        throw new Error('dialog.prompt(options) requires options.callback.')
      }

      defaultPromptOptions = {
        unsafeMessage: "<label for=\"vex\">" + (escapeHtml(options.label) || 'Prompt:') + "</label>",
        input: "<input name=\"vex\" type=\"text\" class=\"vex-dialog-prompt-input\" placeholder=\"" + (options.placeholder || '') + "\"  value=\"" + (options.value || '') + "\" />"
      };
      options = Object.assign({}, dialog.defaultOptions, defaultPromptOptions, options);

      var callback = options.callback
      options.callback = function (value) {
        value = value[Object.keys(value)[0]]
        callback(value)
      }
      return this.open(options)
    }
  }
}

dialog.buttons = {
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

dialog.defaultOptions = {
  callback: function () {},
  afterOpen: function () {},
  message: '',
  input: '',
  buttons: [
    dialog.buttons.YES,
    dialog.buttons.NO
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

dialog.defaultAlertOptions = {
  message: 'Alert',
  buttons: [
    dialog.buttons.YES
  ]
}

dialog.defaultConfirmOptions = {
  message: 'Confirm'
}

dialog.pluginName = 'dialog'

module.exports = dialog
