/**
 * @file
 * CKEditor 5 Footnotes insertion using the shared Backdrop dialog.
 */
(function (window, Backdrop) {
  'use strict';
  var Plugin, Command, ButtonView;
  [window.CKEditor5, window.CKEDITOR].forEach(function (root) {
    if (!root) { return; }
    Plugin = Plugin || root.Plugin || (root.core && root.core.Plugin);
    Command = Command || root.Command || (root.core && root.core.Command);
    ButtonView = ButtonView || root.ButtonView || (root.ui && root.ui.ButtonView);
  });
  if (!Plugin || !Command || !ButtonView) {
    throw new Error('Footnotes: compatible CKEditor 5 exports not found.');
  }
  class InsertFootnoteCommand extends Command {
    refresh() {
      var model = this.editor.model;
      var selection = model.document.selection;
      this.isEnabled = !!selection.focus && !this.editor.isReadOnly &&
        model.canEditAt(selection) && model.schema.checkChild(selection.focus.parent, '$text');
    }
    execute(options) {
      var model = this.editor.model;
      if (!this.isEnabled || model.document.version !== options.version || !model.canEditAt(options.selection)) { return; }
      var markup = '[fn' + (options.value ? ' value="' + options.value + '"' : '') +
        ']' + options.text + '[/fn]';
      model.change(function (writer) {
        model.insertContent(writer.createText(markup), options.selection);
      });
    }
  }
  class Footnotes extends Plugin {
    static get pluginName() { return 'BackdropFootnotes'; }
    init() {
      var editor = this.editor;
      editor.commands.add('insertBackdropFootnote', new InsertFootnoteCommand(editor));
      editor.ui.componentFactory.add('footnotes', locale => {
        var button = new ButtonView(locale);
        var settings = editor.config.get('backdropFootnotes');
        button.set({ label: settings.insertLabel, icon: settings.icon, tooltip: true });
        button.bind('isEnabled').to(editor.commands.get('insertBackdropFootnote'), 'isEnabled');
        this.listenTo(button, 'execute', () => this.openDialog());
        return button;
      });
    }
    openDialog() {
      var editor = this.editor;
      var command = editor.commands.get('insertBackdropFootnote');
      command.refresh();
      if (!command.isEnabled) { return; }
      var model = editor.model;
      var selection = model.createSelection(model.document.selection);
      var version = model.document.version;
      var settings = editor.config.get('backdropFootnotes');
      var selected = [];
      for (var range of selection.getRanges()) {
        for (var item of range.getItems()) {
          if (item.is('$textProxy') || item.is('$text')) { selected.push(item.data); }
        }
      }
      Backdrop.ckeditor5.openDialog(editor, settings.dialogUrl, {
        footnote_text: selected.join(''), footnote_value: ''
      }, function (result) {
        if (editor.state === 'destroyed' || editor.isReadOnly) { return; }
        if (model.document.version !== version) {
          window.alert(settings.changedMessage);
          return;
        }
        command.refresh();
        if (!command.isEnabled || !model.canEditAt(selection)) { return; }
        editor.execute('insertBackdropFootnote', {
          text: result.attributes.footnote_text,
          value: result.attributes.footnote_value,
          selection: selection,
          version: version
        });
        editor.editing.view.focus();
      }, { classes: { 'ui-dialog': 'editor-footnote-dialog' } });
    }
  }
  window.CKEditor5 = window.CKEditor5 || {};
  window.CKEditor5.backdropFootnotes = { Footnotes: Footnotes };
  if (window.CKEDITOR) { window.CKEDITOR.backdropFootnotes = { Footnotes: Footnotes }; }
})(window, Backdrop);
