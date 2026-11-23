/**
 * @file
 * CKEditor 4 Footnotes insertion using the shared Backdrop dialog.
 */
(function ($, Backdrop, CKEDITOR) {
  'use strict';
  CKEDITOR.plugins.add('footnotes', {
    init: function (editor) {
      var settings = editor.config.backdrop;
      editor.addCommand('footnotes', {
        canUndo: true,
        exec: function () {
          var selection = editor.getSelection();
          var bookmarks = selection.createBookmarks2(true);
          var original = editor.getData();
          var existingValues = {
            footnote_text: selection.getSelectedText(),
            footnote_value: ''
          };
          Backdrop.ckeditor.openDialog(editor, settings.footnotesDialogUrl, existingValues, function (result) {
            if (editor.status === 'destroyed' || editor.readOnly) { return; }
            if (editor.getData() !== original) {
              window.alert(settings.footnotesChangedMessage);
              return;
            }
            var values = result.attributes;
            var markup = '[fn' + (values.footnote_value ? ' value="' + values.footnote_value + '"' : '') +
              ']' + values.footnote_text + '[/fn]';
            editor.fire('saveSnapshot');
            editor.focus();
            editor.getSelection().selectBookmarks(bookmarks);
            editor.insertText(markup);
            editor.fire('saveSnapshot');
          }, { dialogClass: 'editor-footnote-dialog' });
        }
      });
      editor.ui.addButton('footnotes', {
        label: settings.footnotesButtonLabel,
        command: 'footnotes',
        icon: settings.footnotesIconUrl
      });
    }
  });
})(jQuery, Backdrop, CKEDITOR);
