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
                zoom: 8,
                disableDefaultUI: true
            },
            /**
             * singleMarkerZoom
             * @type [string]
             */
            singleMarkerZoom: 7,
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

            // Create own Map if it's set
            if(this.options.useOwnMap) { this._createMap(); }

            // set google autocomplte
            this._googleAutocomplete();

            // Prepare array for item collection
            this.itemCollection = [];

            // add keydown listener on searchField
            $(this.cached.searchInput).on('keydown', function(event) {
                self._keyEvent(event);
            });

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
            var element = this.element,
                $element = $(element),
                widget;

            // Create container
            widget = this._createElement('div', this.options.containerClasses);

            // Create selected items container
            var selectedList = this._createElement('ul', this.options.selectedListClasses);

            // Create search input
            var searchInputWrapper = this._createElement('li', this.options.searchFieldClasses),
                searchInput = $(searchInputWrapper).append('<input value="" type="text"/>');
            $(selectedList).append(searchInputWrapper);

            // create drop container
            var dropContainer = this._createElement('div', this.options.dropContainerClasses),
                dropList = $(dropContainer).append(this._createElement('ul', this.options.dropListClasses));

            // add items list to widget
            $(widget).append(selectedList);

            // add drop to widget
            $(widget).append(dropContainer);

            // Hide original element
            $element.hide();

            // Add widget
            $element.after(widget);

            // Add cache
            this.cached = {};

            // Add elements to cashed
            this.cached.select = $element;
            this.cached.container = $(widget);
            this.cached.selectedList = $(selectedList);
            this.cached.searchField = $(searchInput);
            this.cached.dropContainer = $(dropContainer);
            this.cached.dropList = $(dropList);
            // cache search input !! not jQuery
            this.cached.searchInput = widget.getElementsByTagName('input')[0];
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
         * @private createMap
         * @description create map elements
         */
        _createMap: function() {
            var mapContainer = this;

            mapContainer = this._createElement('div', this.options.mapContainerClasses);

            this.map = new window.google.maps.Map( mapContainer, this.options.mapDefaults );

            // define markersPositions object
            this.markersPositions = {};

            // create InfoWindow
            this.infowindow = new window.google.maps.InfoWindow();

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
         * @description create item object which is dealing with relationship and events
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

                // trigger remove event
                $(option).trigger('remove');
            });
            $(option).on('remove', function(){
                 //remove all
                $(option).remove();
                $(item).remove();
                self._removeMarker(marker, data.address);
            });

            this.itemCollection[data.address] = itemObject;

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
         * @private create new option
         * @description create new option in select element
         * @args data [object] openInfoWindo [boolean]
         */
        _createOption: function(data, openInfoWindow) {
            var self = this,
                select = this.cached.select,
                option,
                place,
                marker;

            // create new option
            option = this._createElement('option');
            // set option value
            $(option).val('testing-value');

            // add place
            place = this._addPlace(data);

            // create marker if map is set
            if (this.options.useOwnMap) {
                marker = this._createMarker(data);
                // open info window if it's set
                if (openInfoWindow) {
                    this._openInfoWindow(marker, data.address, 'hhh');
                }
            }

            // Create item object
            self._createItemObject(data, option, place, marker);
        },
        /**
         * @private createMarker
         * @description creating new marker on map and calling recenter method
         * @args data [object]
         */
        _createMarker: function(data, openInfoWindow) {
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
            delete this.markersPositions[address];

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

            // close infoWindow
            this.infowindow.close();

            // use global if not set
            if (!positions) {
                positions = this.markersPositions;
            }

            // loop over positions and extend bounds
            for (var position in positions) {
                if (positions[position] !== null) {
                    bounds.extend(positions[position]);
                }
            }

            // Little bit of functional like code to check object size
            var size = $.map(positions, function(n, i) { return i; }).length;

            // fit bounds
            if (bounds) {
                // if multiple positions are set, use bounds
                if (size > 1) {
                    this.map.fitBounds(bounds);
                } else {
                    // if single position is set...
                    // loop over positions object
                    for (position in positions) {
                        this.map.setCenter(positions[position]);
                    }

                    // set map center
                    this.map.setZoom(this.options.singleMarkerZoom);
                }
            }
        },
        /**
         * @private keyEvent
         * @description handle keyEvents
         * @args event [object]
         */
        _keyEvent: function (event) {
            var keyCode = event.keyCode;

            if (keyCode === 8) {
                this._keyRemove();
            }
        },
        /**
         * @private keyRemove
         * @description handle backspace item removing
         */
        _keyRemove: function() {
            var fieldVal = this.cached.searchField.children('input').val(),
                lastOption = $(this.element).children('option').last();

            // remove last marker if is not deleting value
            if (!fieldVal) {
                lastOption.trigger('remove');
            }
        },
        /**
         *  @private googleAutocomplete
         *  @description using google places autocomplte
         *  @documentation https://developers.google.com/places/documentation/autocomplete
         */
        _googleAutocomplete: function() {
            var self = this,
                input = this.cached.searchInput,
                $input = $(input),
                options = {};

            this.autocomplete = new window.google.maps.places.Autocomplete(input);

            // add autocomplte select listener
            window.google.maps.event.addListener(this.autocomplete, 'place_changed', function() {
                // close infowindow
                self.infowindow.close();

                // clear input
                $input.one('blur', function() {
                    $input.val('');
                });

                var place = self.autocomplete.getPlace();

                // check if place can be displayed
                if (!place.geometry) {
                    return false;
                }

                // build address string
                var address = '';
                if (place.address_components) {
                    address = [
                        (place.address_components[0] && place.address_components[0].short_name || ''),
                        (place.address_components[2] && place.address_components[2].short_name || '')
                    ].join(', ');
                }

                // create new marker
                var data = {
                    address: address,
                    longitude: place.geometry.location.lng(),
                    latitude: place.geometry.location.lat()
                };

                self._createOption(data, true);

                // if place has viewport, use it for rezoome map
                if (place.geometry.viewport) {
                    self.map.fitBounds(place.geometry.viewport);
                } else {
                    // else use fitBounds method with location arg
                    self._fitBounds([place.geometry.location]);
                }

                // hard clear input
                setTimeout(function() {
                    $input.val('');
                }, 10);
            });
        },
        /**
         * @private openInfoWindow
         * @description open google info window
         * @args maker [google marker object] title [string]
         */
        _openInfoWindow: function(marker, title) {
            var infowindow = this.infowindow;

            // set infowindow content
            infowindow.setContent('<div><strong>' + title + '</strong></div>');

            // open infowindow
            infowindow.open(this.map, marker);
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
