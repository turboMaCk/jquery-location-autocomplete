/*
 * @name jQuery Places Autocomplete
 * @author Marek Fajkus
 * @licence MIT
 */

;(function ( $, window, undefined ) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variables rather than globals
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = 'placesAutocomplte',
        defaults = {
            /*
             * containerClasses
             * @type [string]
             */
            containerClasses: 'chosen-container chosen-container-multi',
            /*
             * selectedListClasses
             * @type [string]
             */
            selectedListClasses: 'chosen-choices',
            /*
             * selectedItemClasses
             * @type [string]
             */
            selectedItemClasses: 'search-choise',
            /*
             * removeChoiseBtnClasses
             * @type [string]
             */
            removeChoiseBtnClasses: 'search-choises-close',
            /*
             * searchFieldClasses
             * @type [string]
             */
            searchFieldClasses: 'search-field',
            /*
             * dropContainerClasses
             * @type [string]
             */
            dropContainerClasses: 'chosen-drop',
            /*
             * dropListClasses
             * @type [string]
             */
            dropListClasses: 'chosen-result'

        };

    // The actual plugin constructor
    var Plugin = function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    };

    Plugin.prototype = {
        init: function () {
            // Place initialization logic here
            // You already have access to the DOM element and the options via the instance,
            // e.g., this.element and this.options
            var self = this;

            // Wrap to grid guide container
            this._createWidget();

            // Cashe Elements
            //this.casheElements();
        },
        /*
         * Create widget
         * @description deal with html
         */
        _createWidget: function() {
            var self = this,
                element = $(this.element),
                widget;

            // define widget structure
            // this is compatible with jquery chosen structure

            // Create container
            widget = this._createElement('div', this.options.containerClasses);

            // Create selected items container
            var selectedUl = this._createElement('ul', this.options.selectedListClasses);

            // Create search input
            var searchInput = this._createElement('li', this.options.searchFieldClasses);
            $(searchInput).append('<input type="text"/>');
            $(selectedUl).append(searchInput);

            // create drop container
            var dropContainer = this._createElement('div', this.options.dropContainerClasses);
            $(dropContainer).append(this._createElement('ul', this.options.dropListClasses));

            // add items list to widget
            $(widget).append(selectedUl);

            // add drop to widget
            $(widget).append(dropContainer);

            // Hide original element
            element.hide();

            // Add widget
            element.after(widget);
        },
        /*
         * @private createElement
         * @description helper generate element with classes
         * @args element [string] classes[string/array]
         * @return element [object]
         */
        _createElement: function(element, classes) {
            var el = document.createElement(element);

            // set classes
            $(el).addClass(classes);

            // return element
            return el;
        },
        /*
        Cash elements
        */
        casheElements: function() {
            var $element = $(this.element),
                $container = $element.children('.gridguide-container'),
                $articles = $container.children();

            this.cashed = {
                'element': $element,
                'container': $container,
                'articles': $articles
            };
        },
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    };

}(jQuery, window));
