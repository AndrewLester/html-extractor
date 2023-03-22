// @ts-check
// require 'nokogiri'
// require 'digest/md5'
//
import * as htmlparser2 from "htmlparser2";
import { find, removeElement, getAttributeValue, findOne, hasAttrib, getOuterHTML, textContent } from 'domutils';
import { isTag } from 'domelementtype';

// Extract content from an HTML page in the form of items with associated
// headings data
export default class AlgoliaHTMLExtractor {
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
        const tags = new Set(selector.split(','));
        const dom = htmlparser2.parseDocument(input);
				const nodes = find((elem) => isTag(elem) && tags.has(elem.name), dom.children, true, Infinity);
        return nodes;
    }

    run(input, options = {}) {
        const runOptions = this.defaultOptions(options);
        const { headingSelector, cssSelector, tagsToExclude } = runOptions;
        //
        const items = [];
        const currentHierarchy = {
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
        this.css(input, `${headingSelector},${cssSelector}`).forEach(
            async (node) => {
                // If it's a heading, we update our current hierarchy
                if (new Set(headingSelector.split(',')).has(node.name)) {
                    // Which level heading is it?
                    currentLvl =
                        parseInt(
                            this.extractTagName(node).replace(/^h/, ''),
                            10
                        ) - 1;
                    // Update this level, and set all the following ones to nil
                    currentHierarchy[`lvl${currentLvl}`] =
                        this.extractText(node);

                    for (let i = currentLvl + 1; i < 6; i += 1) {
                        currentHierarchy[`lvl${i}`] = null;
                    }

                    // Update the anchor, if the new heading has one
                    const newAnchor = this.extractAnchor(node);

                    if (newAnchor) {
                        currentAnchor = newAnchor;
                    }
                }

                // Stop if node is not to be extracted
                if (!new Set(cssSelector.split(',')).has(node.name)) {
                    return;
                }

                // Removing excluded child from the node
                if (tagsToExclude && tagsToExclude.length) {
									find((elem) => isTag(elem) && new Set(tagsToExclude.split(',')).has(elem.name), [node], true, Infinity).forEach((element) => removeElement(element));
                }

                const content = this.extractText(node);

                // Stop if node is empty
                if (content.length === 0) {
                    return;
                }

                const item = {
                    html: this.extractHtml(node),
                    content,
                    headings: Object.values(currentHierarchy).filter((h) => h),
                    anchor: currentAnchor,
                    node,
                    customRanking: {
                        position: currentPosition,
                        heading: this.headingWeight(currentLvl),
                    },
                };

                item.objectID = await this.uuid(item);
                items.push(item);

                currentPosition += 1;
            }
        );

        return items;
    }

    // Returns the outer HTML of a given node
    //
    // eg.
    // <p>foo</p> => <p>foo</p>
    extractHtml(node) {
        return getOuterHTML(node).toString().trim();
    }

    // Returns the inner HTML of a given node
    //
    // eg.
    // <p>foo</p> => foo
    extractText(node) {
        return textContent(node);
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
    extractAnchor(node) {
        const anchor = getAttributeValue(node, 'name') || getAttributeValue(node, 'id') || null;

        if (anchor) {
            return anchor;
        }

        // No anchor found directly in the header, search on children
				const subelement = findOne((elem) => isTag(elem) && (hasAttrib(elem, 'name') || hasAttrib(elem, 'id')), [node], true);

        if (subelement) {
            return this.extractAnchor(subelement);
        }

        return null;
    }

    // Generate a unique identifier for the item
    async uuid(inputItem) {
        // We don't use the objectID as part of the hash algorithm
        const item = { ...inputItem, objectID: undefined };

        // We first get all the keys of the object, sorted alphabetically...
        const keys = Object.keys(item);
        keys.sort();

        // ...then we build a huge array of "key=value" pairs...
        const orderedArray = await Promise.all(
            keys.map(async (key) => {
                let value = item[key];
                // We apply the method recursively on other hashes
                if (typeof value === 'object') {
                    value = await this.uuid(value);
                }

                return `${key}=${value}`;
            })
        );

        const encoder = new TextEncoder();
        const data = encoder.encode(orderedArray.join(','));
        const hash = await crypto.subtle.digest('SHA-1', data);
        return Array.from(new Uint8Array(hash))
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    // Get a relative numeric value of the importance of the heading
    // 100 for top level, then -10 per heading
    headingWeight(headingLevel) {
        const maxWeight = 100;

        if (headingLevel === null || headingLevel === undefined) {
            return maxWeight;
        }

        return maxWeight - (headingLevel + 1) * 10;
    }
}



