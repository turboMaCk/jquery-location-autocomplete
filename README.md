# jQuery Places autocomplete widget

jQuery widget for multiple places selection using Google maps API with structure compatible with [chosen](http://harvesthq.github.io/chosen/ "chosen by harvester") plugin.

## Features

+ generating from HTML select multiple
+ google places autocomplete
+ creating markers on map
+ editing address
+ removing places on marker double click
+ removing markers from list
+ removing markers with backspace when search value is empty
+ selecting markers on map
+ selecting markers from list
+ deselecting markers from map
+ google info window
+ fit map bounds to all markers when none is selected
+ almoust fully customizable html classes

## Getting Started

Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/turboMaCk/jquery-jquery-places-autocomplete/master/dist/jquery.places-autocomplete.min.js
[max]: https://raw.github.com/turboMaCk/jquery-jquery-places-autocomplete/master/dist/jquery.places-autocomplete.js

In your web page:

```html
<select multiple id="places-autocomplete">
    <option selected data-address="default address" data-latitude="10" data-longitude="10"></option>
</select>
<script src="jquery.js"></script>
<script src="dist/jquery.places-autocomplete.min.js"></script>
<script>
jQuery(function($) {
    $('#places-autocomplete').placesAutocomplere();
});
</script>
```

##TO DO

+ styles
+ value serializer config

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
