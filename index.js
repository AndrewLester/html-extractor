import AlgoliaHTMLExtractor from './lib/algoliaHtmlExtractor.js';
export default AlgoliaHTMLExtractor;
const Extractor = new AlgoliaHTMLExtractor()
let htmlFragments =await Extractor
		// These are the top-level HTML elements that we keep - this results in a lot of fragments
		.run(`<h1>Test</h1><p>fewf wf wfw fewuf ew fwuhefhw euf</p>`, { cssSelector: `p,pre,td,li` });
console.log(htmlFragments);
