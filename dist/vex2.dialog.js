(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Dialog = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// get successful control from form and assemble into object
// http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2

// types which indicate a submit action and are not successful controls
// these will be ignored
var k_r_submitter = /^(?:submit|button|image|reset|file)$/i;

// node names which could be successful controls
var k_r_success_contrls = /^(?:input|select|textarea|keygen)/i;

// Matches bracket notation.
var brackets = /(\[[^\[\]]*\])/g;

// serializes form fields
// @param form MUST be an HTMLForm element
// @param options is an optional argument to configure the serialization. Default output
// with no options specified is a url encoded string
//    - hash: [true | false] Configure the output type. If true, the output will
//    be a js object.
//    - serializer: [function] Optional serializer function to override the default one.
//    The function takes 3 arguments (result, key, value) and should return new result
//    hash and url encoded str serializers are provided with this module
//    - disabled: [true | false]. If true serialize disabled fields.
//    - empty: [true | false]. If true serialize empty fields
function serialize(form, options) {
    if (typeof options != 'object') {
        options = { hash: !!options };
    }
    else if (options.hash === undefined) {
        options.hash = true;
    }

    var result = (options.hash) ? {} : '';
    var serializer = options.serializer || ((options.hash) ? hash_serializer : str_serialize);

    var elements = form && form.elements ? form.elements : [];

    //Object store each radio and set if it's empty or not
    var radio_store = Object.create(null);

    for (var i=0 ; i<elements.length ; ++i) {
        var element = elements[i];

        // ingore disabled fields
        if ((!options.disabled && element.disabled) || !element.name) {
            continue;
        }
        // ignore anyhting that is not considered a success field
        if (!k_r_success_contrls.test(element.nodeName) ||
            k_r_submitter.test(element.type)) {
            continue;
        }

        var key = element.name;
        var val = element.value;

        // we can't just use element.value for checkboxes cause some browsers lie to us
        // they say "on" for value when the box isn't checked
        if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
            val = undefined;
        }

        // If we want empty elements
        if (options.empty) {
            // for checkbox
            if (element.type === 'checkbox' && !element.checked) {
                val = '';
            }

            // for radio
            if (element.type === 'radio') {
                if (!radio_store[element.name] && !element.checked) {
                    radio_store[element.name] = false;
                }
                else if (element.checked) {
                    radio_store[element.name] = true;
                }
            }

            // if options empty is true, continue only if its radio
            if (!val && element.type == 'radio') {
                continue;
            }
        }
        else {
            // value-less fields are ignored unless options.empty is true
            if (!val) {
                continue;
            }
        }

        // multi select boxes
        if (element.type === 'select-multiple') {
            val = [];

            var selectOptions = element.options;
            var isSelectedOptions = false;
            for (var j=0 ; j<selectOptions.length ; ++j) {
                var option = selectOptions[j];
                var allowedEmpty = options.empty && !option.value;
                var hasValue = (option.value || allowedEmpty);
                if (option.selected && hasValue) {
                    isSelectedOptions = true;

                    // If using a hash serializer be sure to add the
                    // correct notation for an array in the multi-select
                    // context. Here the name attribute on the select element
                    // might be missing the trailing bracket pair. Both names
                    // "foo" and "foo[]" should be arrays.
                    if (options.hash && key.slice(key.length - 2) !== '[]') {
                        result = serializer(result, key + '[]', option.value);
                    }
                    else {
                        result = serializer(result, key, option.value);
                    }
                }
            }

            // Serialize if no selected options and options.empty is true
            if (!isSelectedOptions && options.empty) {
                result = serializer(result, key, '');
            }

            continue;
        }

        result = serializer(result, key, val);
    }

    // Check for all empty radio buttons and serialize them with key=""
    if (options.empty) {
        for (var key in radio_store) {
            if (!radio_store[key]) {
                result = serializer(result, key, '');
            }
        }
    }

    return result;
}

function parse_keys(string) {
    var keys = [];
    var prefix = /^([^\[\]]*)/;
    var children = new RegExp(brackets);
    var match = prefix.exec(string);

    if (match[1]) {
        keys.push(match[1]);
    }

    while ((match = children.exec(string)) !== null) {
        keys.push(match[1]);
    }

    return keys;
}

function hash_assign(result, keys, value) {
    if (keys.length === 0) {
        result = value;
        return result;
    }

    var key = keys.shift();
    var between = key.match(/^\[(.+?)\]$/);

    if (key === '[]') {
        result = result || [];

        if (Array.isArray(result)) {
            result.push(hash_assign(null, keys, value));
        }
        else {
            // This might be the result of bad name attributes like "[][foo]",
            // in this case the original `result` object will already be
            // assigned to an object literal. Rather than coerce the object to
            // an array, or cause an exception the attribute "_values" is
            // assigned as an array.
            result._values = result._values || [];
            result._values.push(hash_assign(null, keys, value));
        }

        return result;
    }

    // Key is an attribute name and can be assigned directly.
    if (!between) {
        result[key] = hash_assign(result[key], keys, value);
    }
    else {
        var string = between[1];
        // +var converts the variable into a number
        // better than parseInt because it doesn't truncate away trailing
        // letters and actually fails if whole thing is not a number
        var index = +string;

        // If the characters between the brackets is not a number it is an
        // attribute name and can be assigned directly.
        if (isNaN(index)) {
            result = result || {};
            result[string] = hash_assign(result[string], keys, value);
        }
        else {
            result = result || [];
            result[index] = hash_assign(result[index], keys, value);
        }
    }

    return result;
}

// Object/hash encoding serializer.
function hash_serializer(result, key, value) {
    var matches = key.match(brackets);

    // Has brackets? Use the recursive assignment function to walk the keys,
    // construct any missing objects in the result tree and make the assignment
    // at the end of the chain.
    if (matches) {
        var keys = parse_keys(key);
        hash_assign(result, keys, value);
    }
    else {
        // Non bracket notation can make assignments directly.
        var existing = result[key];

        // If the value has been assigned already (for instance when a radio and
        // a checkbox have the same name attribute) convert the previous value
        // into an array before pushing into it.
        //
        // NOTE: If this requirement were removed all hash creation and
        // assignment could go through `hash_assign`.
        if (existing) {
            if (!Array.isArray(existing)) {
                result[key] = [ existing ];
            }

            result[key].push(value);
        }
        else {
            result[key] = value;
        }
    }

    return result;
}

// urlform encoding serializer
function str_serialize(result, key, value) {
    // encode newlines as \r\n cause the html spec says so
    value = value.replace(/(\r)?\n/g, '\r\n');
    value = encodeURIComponent(value);

    // spaces should be '+' rather than '%20'.
    value = value.replace(/%20/g, '+');
    return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + value;
}

module.exports = serialize;

},{}],2:[function(require,module,exports){
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

},{"form-serialize":1}]},{},[2])(2)
});