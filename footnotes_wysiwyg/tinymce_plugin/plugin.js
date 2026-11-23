/**
 * @file
 * TinyMCE Footnotes insertion using the shared Backdrop dialog.
 */
(function () {
  'use strict';
  tinymce.PluginManager.add('backdropfootnotes', function (editor) {
    // Backdrop registers the local SVG through the external-plugin icons entry.
    var label = editor.options.get('footnotesButtonLabel');
    function openDialog() {
      if (editor.mode.isReadOnly()) { return; }
      var bookmark = editor.selection.getBookmark(2, true);
      var original = editor.getContent();
      var existingValues = {
        footnote_text: editor.selection.getContent({ format: 'text' }),
        footnote_value: ''
      };
      Backdrop.tinymce.openDialog(editor, editor.options.get('footnotesDialogUrl'), existingValues, function (result) {
        if (editor.removed || editor.mode.isReadOnly()) { return; }
        if (editor.getContent() !== original) {
          window.alert(editor.options.get('footnotesChangedMessage'));
          return;
        }
        var values = result.attributes;
        var markup = '[fn' + (values.footnote_value ? ' value="' + values.footnote_value + '"' : '') +
          ']' + values.footnote_text + '[/fn]';
        editor.undoManager.transact(function () {
          editor.focus();
          editor.selection.moveToBookmark(bookmark);
          editor.insertContent(editor.dom.encode(markup));
        });
        editor.focus();
      }, { dialogClass: 'editor-footnote-dialog' });
    }
    editor.addCommand('BackdropInsertFootnote', openDialog);
    editor.ui.registry.addButton('backdropfootnotes', {
      icon: 'backdropfootnotes', tooltip: label, onAction: openDialog
    });
    editor.ui.registry.addMenuItem('backdropfootnotes', {
      icon: 'backdropfootnotes', text: label, onAction: openDialog
    });
    return {
      getMetadata: function () {
        return { name: 'Backdrop Footnotes', url: 'https://github.com/backdrop-contrib/footnotes' };
      }
    };
  });
})();
