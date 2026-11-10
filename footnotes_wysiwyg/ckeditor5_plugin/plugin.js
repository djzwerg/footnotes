/**
 * @file
 * Footnote insertion for the CKEditor 5 library supplied by Backdrop core.
 *
 * No CKEditor distribution, npm package or CDN dependency is bundled.
 * Supports the core UMD exports and the older grouped export shape.
 * Runtime export compatibility must be tested with the installed core.
 */
(function (window) {
  'use strict';

  var roots = [window.CKEditor5, window.CKEDITOR];
  var Plugin;
  var Command;
  var ButtonView;
  roots.forEach(function (root) {
    if (!root) { return; }
    Plugin = Plugin || root.Plugin || (root.core && root.core.Plugin);
    Command = Command || root.Command || (root.core && root.core.Command);
    ButtonView = ButtonView || root.ButtonView || (root.ui && root.ui.ButtonView);
  });
  if (!Plugin || !Command || !ButtonView) {
    throw new Error('Footnotes: compatible CKEditor 5 core exports not found. ' +
      'Check core ckeditor5-prepare.js; do not load a second CKEditor library.');
  }

  var icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ' +
    'viewBox="0 0 24 24"><path d="M4 6h10v2H4zm0 5h10v2H4zm0 5h16v2H4z' +
    'm13-13h2v7h-2V5h-1V3z"/></svg>';

  class InsertFootnoteCommand extends Command {
    refresh() {
      var model = this.editor.model;
      var selection = model.document.selection;
      this.isEnabled = !this.editor.isReadOnly &&
        model.canEditAt(selection) &&
        model.schema.checkChild(selection.focus.parent, '$text');
    }

    execute(options) {
      var model = this.editor.model;
      if (!this.isEnabled) { return; }
      var markup = '[fn' + (options.value ? ' value="' + options.value + '"' : '') +
        ']' + options.text + '[/fn]';
      model.change(function (writer) {
        // The modal does not change the model selection. insertContent() uses
        // the current model selection and replaces selected content.
        model.insertContent(writer.createText(markup));
      });
    }
  }

  class Footnotes extends Plugin {
    static get pluginName() { return 'BackdropFootnotes'; }

    init() {
      var editor = this.editor;
      this.dialog = null;
      editor.commands.add('insertBackdropFootnote', new InsertFootnoteCommand(editor));
      editor.ui.componentFactory.add('footnotes', (locale) => {
        var button = new ButtonView(locale);
        var labels = this.labels();
        button.set({ label: labels.insertLabel, icon: icon, tooltip: true });
        button.bind('isEnabled').to(editor.commands.get('insertBackdropFootnote'), 'isEnabled');
        this.listenTo(button, 'execute', () => this.openDialog());
        return button;
      });
      this.listenTo(editor, 'change:isReadOnly', () => {
        if (editor.isReadOnly) { this.closeDialog(); }
      });
    }

    labels() {
      return Object.assign({
        insertLabel: 'Insert footnote',
        textLabel: 'Footnote text',
        valueLabel: 'Footnote value (optional)',
        saveLabel: 'Insert',
        cancelLabel: 'Cancel',
        emptyTextMessage: 'Enter a footnote text.',
        nestedFootnoteMessage: 'Footnote text must not contain footnote tags.',
        invalidValueMessage: 'The footnote value contains invalid characters.'
      }, this.editor.config.get('backdropFootnotes') || {});
    }

    openDialog() {
      var editor = this.editor;
      var command = editor.commands.get('insertBackdropFootnote');
      command.refresh();
      if (!command.isEnabled || this.dialog) { return; }
      var labels = this.labels();
      var dialog = document.createElement('dialog');
      if (typeof dialog.showModal !== 'function') {
        throw new Error('Footnotes requires native HTML dialog support.');
      }
      dialog.className = 'backdrop-footnotes-dialog';
      dialog.setAttribute('aria-label', labels.insertLabel);
      var form = document.createElement('form');
      var heading = document.createElement('h2');
      heading.textContent = labels.insertLabel;
      form.appendChild(heading);

      function field(labelText, tagName) {
        var label = document.createElement('label');
        var caption = document.createElement('span');
        caption.textContent = labelText;
        var input = document.createElement(tagName);
        if (tagName === 'input') { input.type = 'text'; }
        label.appendChild(caption);
        label.appendChild(input);
        form.appendChild(label);
        return input;
      }
      var text = field(labels.textLabel, 'textarea');
      text.rows = 5;
      var value = field(labels.valueLabel, 'input');
      var selected = [];
      for (var range of editor.model.document.selection.getRanges()) {
        for (var item of range.getItems()) {
          if (item.is('$textProxy') || item.is('$text')) { selected.push(item.data); }
        }
      }
      text.value = selected.join('');
      var error = document.createElement('p');
      error.className = 'backdrop-footnotes-error';
      error.setAttribute('role', 'alert');
      form.appendChild(error);
      var actions = document.createElement('div');
      actions.className = 'backdrop-footnotes-actions';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = labels.cancelLabel;
      cancel.addEventListener('click', () => dialog.close());
      var save = document.createElement('button');
      save.type = 'submit';
      save.textContent = labels.saveLabel;
      actions.appendChild(cancel);
      actions.appendChild(save);
      form.appendChild(actions);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        var content = text.value.trim().replace(/\r\n|\r|\n/g, ' ');
        var marker = value.value.trim();
        if (!content) { error.textContent = labels.emptyTextMessage; text.focus(); return; }
        if (/\[\/?fn\b/i.test(content)) {
          error.textContent = labels.nestedFootnoteMessage; text.focus(); return;
        }
        if (/["<>\[\]\r\n]/.test(marker)) {
          error.textContent = labels.invalidValueMessage; value.focus(); return;
        }
        command.refresh();
        if (!command.isEnabled) { dialog.close(); return; }
        editor.execute('insertBackdropFootnote', { text: content, value: marker });
        dialog.close();
      });
      dialog.appendChild(form);
      dialog.addEventListener('close', () => {
        dialog.remove();
        this.dialog = null;
        editor.editing.view.focus();
      }, { once: true });
      document.body.appendChild(dialog);
      this.dialog = dialog;
      dialog.showModal();
      text.focus();
    }

    closeDialog() {
      if (this.dialog) { this.dialog.close(); }
    }

    destroy() {
      this.closeDialog();
      return super.destroy();
    }
  }

  // Backdrop resolves names such as backdropFootnotes.Footnotes from its
  // CKEditor5 plugin namespace. Also expose the UMD root when present.
  window.CKEditor5 = window.CKEditor5 || {};
  window.CKEditor5.backdropFootnotes = { Footnotes: Footnotes };
  if (window.CKEDITOR) {
    window.CKEDITOR.backdropFootnotes = { Footnotes: Footnotes };
  }
})(window);
