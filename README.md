# vex2-safe-dialog

A dialog plugin for [vex2](https://github.com/bbatliner/vex2).  Replacement for the browser's `alert`, `confirm`, and `prompt.

## Usage

      <script src="./vex2.min.js"></script>
      <script src="./vex2.safe-dialog.min.js"></script>
      <script>
      vex.registerPlugin(vexSafeDialog);
      vex.dialog.alert('Hello no HTML!');
      vex.dialog.alert('<b>Hello with HTML!</b>');
      vex.dialog.alert({ unsafeMessage : '<b>Hello with unsafeMessage!</b>' });
      </script> 

## API

vex2-safe-dialog exposes three main methods:

 - `vex.dialog.alert(stringOrOptions)`
 - `vex.dialog.confirm(options)`
 - `vex.dialog.prompt(options)`

These all call the `vex.open` method with different combinations of options, [all the options](https://github.com/bbatliner/vex2/blob/master/docs/api/3-Advanced.md#api) that `vex.open` supports are also supported here.

### Incompatible change: safe-by-default message handling.

This library provides *safe by default* behavior by treating the `message` you provide as a regular string, not raw HTML.

If you need to pass through HTML to your dialog, use the`unsafeMessage` option.
The `unsafeMessage` method is safe to use as long as you either provide static HTML *or*
[HTML-escape](http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript)
any untrusted content passed through, such as user-supplied content.

### alert

Use alerts when you want to display a message to the user, but you don't want to give them any choice to proceed.

    vex.dialog.alert('Thanks for checking out Vex!');

When passing a string, the text is interpreted as a string and HTML-escaped for safety.  *This differs from the original vex which treated the input as HTML*.

If you want to pass HTML tags into the `alert()` method, you need to use the `unsafeMessage` option and handle any escaping of
potentially unsafe content you provide to this option:

		// This use of raw HTML is made safe because the HTML is static
    vex.dialog.alert({ unsafeMessage: '<b>Hello World!</b>' });

		// This use of raw HTML is made safe because the Underscore escape method is used to escape potentially unsafe content.
    vex.dialog.alert({ unsafeMessage: '<b>Hello '+_.escape(user.firstName)+'!</b>' });

### confirm

Use confirms when you want to present an yes-or-no option to the user.

    vex.dialog.confirm({
        message: 'Are you absolutely sure you want to destroy the alien planet?',
        callback: function(value) {
            $('.demo-result-confirm').html('Callback value: <b>' + value + '</b>').show();
        }
    });

`message`is interpreted as a string and HTML-escaped for safety.  *This differs from the original vex which treated the input as HTML*.

Explicitly use the `unsafeMessage` option instead when you need to pass raw HTML, making sure to HTML-escape any untrusted content in the HTML.

### prompt

Use a prompt when you need to collect a text value from the user.

    vex.dialog.prompt({
        message: 'What planet did the aliens come from?',
        placeholder: 'Planet name',
        callback: function(value) {
            $('.demo-result-prompt').html('Callback value: <b>' + value + '</b>').show();
        }
    });

`message`is interpreted as a string and HTML-escaped for safety.  *This differs from the original vex which treated the input as HTML*.

Explicitly use the `unsafeMessage` option instead when you need to pass raw HTML, making sure to HTML-escape any untrusted content in the HTML.


[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
