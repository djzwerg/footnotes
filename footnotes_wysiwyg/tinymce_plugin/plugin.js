/**
 * @file
 * Inserts plain-text Footnotes markup in TinyMCE.
 */
(function () {
  'use strict';

  tinymce.PluginManager.add('backdropfootnotes', function (editor) {
    editor.ui.registry.addIcon('backdropfootnotes',
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
      '<path fill="currentColor" d="M4 6h10v2H4zm0 5h10v2H4zm0 5h16v2H4zm13-13h2v7h-2V5h-1V3z"/></svg>');

    function alertMessage(message) {
      editor.windowManager.alert(editor.translate(message));
    }

    function openDialog() {
      if (editor.mode.isReadOnly()) {
        return;
      }
      var selected = editor.selection.getContent({ format: 'text' });
      var bookmark = editor.selection.getBookmark(2, true);

      editor.windowManager.open({
        title: 'Insert footnote',
        body: {
          type: 'panel',
          items: [
            { type: 'textarea', name: 'footnoteText', label: 'Footnote text' },
            { type: 'input', name: 'footnoteValue', label: 'Footnote value (optional)' },
            { type: 'checkbox', name: 'confirmValue',
              label: 'I understand that an existing value reuses the same footnote.' }
          ]
        },
        initialData: {
          footnoteText: selected,
          footnoteValue: '',
          confirmValue: false
        },
        buttons: [
          { type: 'cancel', text: 'Cancel' },
          { type: 'submit', text: 'Insert', buttonType: 'primary' }
        ],
        onSubmit: function (api) {
          if (editor.mode.isReadOnly()) {
            api.close();
            return;
          }
          var data = api.getData();
          var text = String(data.footnoteText || '').trim();
          var value = String(data.footnoteValue || '').trim();

          if (!text) {
            alertMessage('Enter a footnote text.');
            return;
          }
          if (/\[\/?fn\b/i.test(text)) {
            alertMessage('Footnote text must not contain footnote tags.');
            return;
          }
          if (value && !/^[1-9][0-9]*$/.test(value) && !/^[*†‡§¶]+$/.test(value)) {
            alertMessage('Use a positive integer or a footnote symbol: *, †, ‡, §, ¶.');
            return;
          }
          if (value && !data.confirmValue) {
            alertMessage('Confirm the meaning of the optional footnote value, or leave it empty for automatic numbering.');
            return;
          }

          text = text.replace(/\r\n|\r|\n/g, ' ');
          var markup = '[fn' + (value ? ' value="' + value + '"' : '') +
            ']' + text + '[/fn]';
          editor.undoManager.transact(function () {
            editor.focus();
            editor.selection.moveToBookmark(bookmark);
            editor.insertContent(editor.dom.encode(markup));
          });
          api.close();
          editor.focus();
        }
      });
    }

    editor.addCommand('BackdropInsertFootnote', openDialog);
    editor.ui.registry.addButton('backdropfootnotes', {
      icon: 'backdropfootnotes', tooltip: 'Insert footnote', onAction: openDialog
    });
    editor.ui.registry.addMenuItem('backdropfootnotes', {
      icon: 'backdropfootnotes', text: 'Insert footnote', onAction: openDialog
    });
    return {
      getMetadata: function () {
        return {
          name: 'Backdrop Footnotes',
          url: 'https://github.com/backdrop-contrib/footnotes'
        };
      }
    };
  });
  tinymce.PluginManager.requireLangPack('backdropfootnotes', 'de');
})();
