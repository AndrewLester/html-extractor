/* eslint-disable class-methods-use-this */
// require 'nokogiri'
// require 'digest/md5'
//
const { JSDOM } = require('jsdom');

// Extract content from an HTML page in the form of items with associated
// headings data
module.exports = class AlgoliaHTMLExtractor {

  defaultOptions(options) {
    return {
      cssSelector: 'p',
      headingSelector: 'h1,h2,h3,h4,h5,h6',
      tagsToExclude: '',
      ...options,
    };
  }

  // Getting a list of HTML nodes from an input and a CSS selector
  css(input, selector) {
    return (new JSDOM(input)).window.document.querySelectorAll(selector);
  }

  run(input, options = {}) {
    const runOptions = this.defaultOptions(options);
    const { headingSelector, cssSelector } = runOptions;
    // tags_to_exclude = options[:tags_to_exclude]
    //
    const items = [];
    let currentHierarchy = {
      lvl0: null,
      lvl1: null,
      lvl2: null,
      lvl3: null,
      lvl4: null,
      lvl5: null,
    };
    let currentPosition = 0; // Position of the DOM node in the tree
    let currentLvl = null; // Current closest headings level
    let currentAnchor = null; // Current closest anchor
    //
    // We select all nodes that match either the headings or the elements to
    // extract. This will allow us to loop over it in order it appears in the DOM
    this.css(input, `${headingSelector},${cssSelector}`).forEach((node) => {

      // If it's a heading, we update our current hierarchy
      if (node.matches(headingSelector)) {
        // Which level heading is it?
        // let currentLvl = this.extract_tag_name(node).gsub(/^h/, '').to_i - 1
        // // Update this level, and set all the following ones to nil
        // current_hierarchy["lvl#{current_lvl}".to_sym] = extract_text(node)
        // (current_lvl + 1..6).each do |lvl|
        //   current_hierarchy["lvl#{lvl}".to_sym] = nil
        // end
        // # Update the anchor, if the new heading has one
        // new_anchor = extract_anchor(node)
        // current_anchor = new_anchor if new_anchor
      }

      // Stop if node is not to be extracted
      if (!node.matches(cssSelector)) {
        return;
      }

      // Removing excluded child from the node
      // node.search(tags_to_exclude).each(&:remove) unless tags_to_exclude.empty?

      const content = this.extractText(node);

      // Stop if node is empty
      if (content.length === 0) {
        return;
      }

      const item = {
        html: this.extractHtml(node),
        content,
        // headings: Object.values(currentHierarchy).compact, // TODO: fix this
        anchor: currentAnchor,
        node,
        customRanking: {
          position: currentPosition,
          heading: this.heading_weight(currentLvl),
        },
      };

      item.objectID = this.uuid(item);
      items.push(item);

      currentPosition += 1;
    });

    return items;
  }

  // Returns the outer HTML of a given node
  //
  // eg.
  // <p>foo</p> => <p>foo</p>
  extractHtml(node) {
    return node.toString().trim();
  }

  // Returns the inner HTML of a given node
  //
  // eg.
  // <p>foo</p> => foo
  extractText(node) {
    return node.innerHTML;
  }

  // Returns the tag name of a given node
  //
  // eg
  // <p>foo</p> => p
  extractTagName(node) {
    return node.name.toLowerCase();
  }

  // Returns the anchor to the node
  //
  // eg.
  // <h1 name="anchor">Foo</h1> => anchor
  // <h1 id="anchor">Foo</h1> => anchor
  // <h1><a name="anchor">Foo</a></h1> => anchor
  extract_anchor(node) {
    // anchor = node.attr('name') || node.attr('id') || nil
    // return anchor unless anchor.nil?
    //
    // # No anchor found directly in the header, search on children
    // subelement = node.css('[name],[id]')
    // return extract_anchor(subelement[0]) unless subelement.empty?
    //
    // nil
  }

  // Generate a unique identifier for the item
  uuid(item) {
    // # We don't use the objectID as part of the hash algorithm
    //
    // item.delete(:objectID)
    // # We first get all the keys of the object, sorted alphabetically...
    // ordered_keys = item.keys.sort
    //
    // # ...then we build a huge array of "key=value" pairs...
    // ordered_array = ordered_keys.map do |key|
    //   value = item[key]
    //   # We apply the method recursively on other hashes
    //   value = uuid(value) if value.is_a?(Hash)
    //   "#{key}=#{value}"
    // end
    //
    // # ...then we build a unique md5 hash of it
    // Digest::MD5.hexdigest(ordered_array.join(','))
  }

  // # Get a relative numeric value of the importance of the heading
  // # 100 for top level, then -10 per heading
  heading_weight(heading_level) {
    // weight = 100
    // return weight if heading_level.nil?
    // weight - ((heading_level + 1) * 10)
  }
}
