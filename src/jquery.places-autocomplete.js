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
             * Default html classes are compatible with chosen plugin.
             * You can easily style both places-autocomplete and chosen with same selector
             */

            /**
             * containerClasses
             * @type [string]
             */
            containerClasses: 'chosen-container chosen-container-multi',
            /**
             * selectedListClasses
             * @type [string]
             */
            selectedListClasses: 'chosen-choices',
            /**
             * selectedItemClasses
             * @type [string]
             */
            selectedItemClasses: 'search-choice',
            /**
             * removeChoiseBtnClasses
             * @type [string]
             */
            removeChoiseBtnClasses: 'search-choises-close',
            /**
             * searchFieldClasses
             * @type [string]
             */
            searchFieldClasses: 'search-field',
            /**
             * dropContainerClasses
             * @type [string]
             */
            dropContainerClasses: 'chosen-drop',
            /**
             * dropListClasses
             * @type [string]
             */
            dropListClasses: 'chosen-result',
            /**
             * mapContainerClasses
             * @type [string]
             */
            mapContainerClasses: 'chosen-map-canvas',
            /*
             * useOwnMap
             * @type [boolean]
             */
            useOwnMap: true,
            /**
             * mapDefaults
             * just basic google maps setup
             * @type [object]
             */
            mapDefaults: {
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                center: new window.google.maps.LatLng(-34.397, 150.644),
                zoom: 8
            }
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

            // Wrap to grid guide container
            this._createWidget();

            // Create own Map if it's set
            if(this.options.useOwnMap) { this._createMap(); }

            // Prepare array for item collection
            this.itemCollection = [];

            // setup default selectedList and markers
            // depends on html
            this.setLocations();
         },
        /**
         * Create widget
         * @description deal with html
         * this also handle element caching
         */
        _createWidget: function() {
            var element = $(this.element),
                widget;

            // Create container
            widget = this._createElement('div', this.options.containerClasses);

            // Create selected items container
            var selectedList = this._createElement('ul', this.options.selectedListClasses);

            // Create search input
            var searchInputWrapper = this._createElement('li', this.options.searchFieldClasses),
                searchInput = $(searchInputWrapper).append('<input type="text"/>');
            $(selectedList).append(searchInputWrapper);

            // create drop container
            var dropContainer = this._createElement('div', this.options.dropContainerClasses),
                dropList = $(dropContainer).append(this._createElement('ul', this.options.dropListClasses));

            // add items list to widget
            $(widget).append(selectedList);

            // add drop to widget
            $(widget).append(dropContainer);

            // Hide original element
            element.hide();

            // Add widget
            element.after(widget);

            // Add cache
            this.cached = {};

            // Add elements to cashed
            this.cached.container = $(widget);
            this.cached.selectedList = $(selectedList);
            this.cached.searchField = $(searchInput);
            this.cached.dropContainer = $(dropContainer);
            this.cached.dropList = $(dropList);

            // cache childrens selectors
            this.cached.selectedItems = $(selectedList).children(':not(' + this.options.searchFieldClasses + ')');
            this.cached.dropItems = $(dropList).children();
        },
        /**
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
        /**
         * @private createOwnMap
         * @description create map elements
         */
        _createMap: function() {
            var mapContainer = this;

            mapContainer = this._createElement('div', this.options.mapContainerClasses);

            this.map = new window.google.maps.Map( mapContainer, this.options.mapDefaults );
            this.markersPositions = [];

            // add map next to widget
            this.cached.container.after(mapContainer);
        },
        /**
         * setLocations
         * @description set selectedList
         */
        setLocations: function() {
            var self = this,
                options = $(this.element).find('option:selected'),
                data,
                place,
                marker;

            $.each(options, function() {
                data = self._getOptionData(this);

                // add place
                place = self._addPlace(data);

                // Create new marker on map if is created
                if (self.options.useOwnMap) {
                    marker = self._createMarker(data);
                }

                // Create item object
                self._createItemObject(data, this, place, marker);
            });
        },
        /**
         * @private createItemObject
         * @description create whole item object to deal with relationship
         * @args data [object] option [object] item [object] marker [object]
         */
        _createItemObject: function(data, option, item, marker) {
            var self = this,
                itemObject = {
                    data: data,
                    option: option,
                    item: item,
                    marker: marker
                };

            // add event listeners to item object
            // remove event
            $(item).on('click', 'a.search-choice-close', function(event) {
                event.preventDefault();

                //remove all
                $(option).remove();
                $(item).remove();
                self._removeMarker(marker, data.address);
            });

            this.itemCollection.push(itemObject);

            return itemObject;
        },
        /**
         * @private addPlace
         * @args data [object]
         * @return added item
         */
        _addPlace: function(data) {
            // create new item
            var item = this._createElement('li', this.options.selectedItemClasses);

            // add item data and content
            $(item)
                .data('longitude', data.longitude)
                .data('latitude', data.latitude)
                .text(data.address)
                .wrapInner('<span>')
                .prepend('<a class="location-choice-target"/>')
                .append('<a class="search-choice-close"/>');

            // add item to list
            this.cached.searchField.before(item);

            // return item
            return item;
        },
        /**
         * @private getOptionData
         * @description get data from single option
         * @args option [object]
         * @retun data [object]
         */
        _getOptionData: function(option) {
            var $option = $(option),
                data = {
                    address: $option.data('address') || $option.text(),
                    longitude: $option.data('longitude'),
                    latitude: $option.data('latitude')
                };

            return data;
        },
        /**
         * @private createMarker
         * @description creating new marker on map and calling recenter method
         * @args data [object]
         */
        _createMarker: function(data) {
            var self = this,
                position = new window.google.maps.LatLng(data.latitude, data.longitude),
                marker = new window.google.maps.Marker({
                    position: position,
                    map: self.map
                });

            // add marker to markers array
            this.markersPositions[data.address] = position;

            // fit bounds
            this._fitBounds();

            // return marker object
            return marker;
        },
        /**
         * @private removeMarker
         * @description remove single marker from instance map
         * @args marker [google location object] name [string]
         */
        _removeMarker: function(marker, address) {
            window.google.maps.event.clearListeners(marker, 'click');
            marker.setMap(null);

            // remove marker postion from markersPositions
            this.markersPositions[address] = null;

            // reset bounds
            this._fitBounds();
        },
        /**
         * @private fitBounds
         * @description map viewport to bounds
         * @args positions [array of google bounds object]
         * if bounds not set => use instance global mapBounds object
         */
        _fitBounds: function(positions) {
            var bounds = new window.google.maps.LatLngBounds();

            // use global if not set
            if (!positions) {
                positions = this.markersPositions;
            }
            console.log(positions);

            // loop over positions and extend bounds
            for (var position in positions) {
                if (positions[position] !== null) {
                    bounds.extend(positions[position]);
                }
            }

            // fit bounds
            this.map.fitBounds(bounds);
        }
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
