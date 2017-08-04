#### DSS-Extended
This is a fork of [DSS](https://github.com/DSSWG/DSS) containing some extensions.

###### type
pass a type of the block eg.:
```css
/*
* @type group/element
*/
```
Groups can be used to group element definitions in the output.

###### selector
```css
/*
* @selector dss__button
*/
```
pass the classname of a element

###### dependencies
pass dependencies/tags that are needed for this element/component

###### markup
markup can now have a language eg.:
```css
/*
* @markup html
*   <button>This is a button</button>
* @markup javascript
*   console.log('button')
*/
```