/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, app, type, appshell, document, CodeMirror, markdown */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils     = app.getModule("utils/ExtensionUtils"),
        PanelManager       = app.getModule("utils/PanelManager"),
        Repository         = app.getModule("engine/Repository"),
        SelectionManager   = app.getModule("engine/SelectionManager"),
        CommandManager     = app.getModule("command/CommandManager"),
        Commands           = app.getModule("command/Commands"),
        MenuManager        = app.getModule("menu/MenuManager"),
        ContextMenuManager = app.getModule("menu/ContextMenuManager"),
        ModelExplorerView  = app.getModule("explorer/ModelExplorerView"),
        PreferenceManager  = app.getModule("preference/PreferenceManager");

    require("markdown.min");

    var markdownPanelTemplate = require("text!markdown-panel.html"),
        markdownPanel,
        markdownEditor,
        $markdownPanel,
        $markdownEditor,
        $markdownPreview,
        $title,
        $close,
        $markdownModeRadio,
        $content,
        $button = $("<a id='toolbar-markdown' href='#' title='Markdown Documentation'></a>");

    var CMD_MARKDOWN   = "view.markdown",
        PREFERENCE_KEY = "view.markdown.visibility";

    /**
     * Show Relationships Panel
     */
    function show() {
        markdownPanel.show();
        $button.addClass("selected");
        CommandManager.get(CMD_MARKDOWN).setChecked(true);
        PreferenceManager.set(PREFERENCE_KEY, true);
    }

    /**
     * Hide Relationships Panel
     */
    function hide() {
        markdownPanel.hide();
        $button.removeClass("selected");
        CommandManager.get(CMD_MARKDOWN).setChecked(false);
        PreferenceManager.set(PREFERENCE_KEY, false);
    }

    /**
     * Toggle Relationships Panel
     */
    function toggle() {
        if (markdownPanel.isVisible()) {
            hide();
        } else {
            show();
        }
    }

    function setMode(mode) {
        if (mode === "edit") {
            $markdownEditor.show();
            $markdownPreview.hide();
        } else if (mode === "preview") {
            $markdownEditor.hide();
            $markdownPreview.show();
        }
    }


    /**
     * Initialize Extension
     */
    function init() {
        // Load our stylesheet
        ExtensionUtils.loadStyleSheet(module, "codemirror-monokai.css");
        ExtensionUtils.loadStyleSheet(module, "styles.less");

        // Toolbar Button
        $("#toolbar .buttons").append($button);
        $button.click(function () {
            CommandManager.execute(CMD_MARKDOWN);
        });

        // Setup markdownPanel
        $markdownPanel = $(markdownPanelTemplate);
        $title = $markdownPanel.find(".title");
        $close = $markdownPanel.find(".close");
        $close.click(function () {
            hide();
        });
        $markdownModeRadio = $("input[name='markdown-mode']", $markdownPanel);
        $markdownModeRadio.change(function () {
            setMode(this.value);
        });

        $content = $markdownPanel.find(".panel-content");
        markdownPanel = PanelManager.createBottomPanel("?", $markdownPanel, 29);
        $markdownPanel.on("panelCollapsed panelExpanded panelResizeUpdate", function () {
            markdownEditor.setSize("100%", $content.height());
        });

        // Setup CodeMirror
        markdownEditor = CodeMirror.fromTextArea(document.getElementById("markdown-editor"), {
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
            theme: "monokai",
            mode: "markdown"
        });
        $markdownEditor = $(markdownEditor.getWrapperElement());
        $markdownPreview = $markdownPanel.find(".markdown-preview");
        $markdownPanel.trigger("panelResizeUpdate");

        // Register Commands
        CommandManager.register("Markdown Documentation", CMD_MARKDOWN, toggle);

        // Setup Menus
        var menu = MenuManager.getMenu(Commands.VIEW);
        menu.addMenuDivider();
        menu.addMenuItem(CMD_MARKDOWN, ["Ctrl-Alt-D"]);

        // Handler for selectionChanged event
        $(SelectionManager).on("selectionChanged", function (event, models, views) {
            try {
                if (models.length === 1) {
                    var model = models[0];
                    markdownEditor.setValue(model.documentation);
                    $markdownPreview.html("<div style='margin: 10px'>" + markdown.toHTML(model.documentation) + "</div>");
                }
            } catch (err) {
                console.error(err);
            }
        });

        // Load Preference
        var visible = PreferenceManager.get(PREFERENCE_KEY);
        if (visible === true) {
            show();
        } else {
            hide();
        }

        setMode("edit");

    }

    // Initialize Extension
    init();

});