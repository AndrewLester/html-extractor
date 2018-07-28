const { expect } = require('chai');

const AlgoliaHtmlExtractor = require('../');

const AlgoliaHTMLExtractor = new AlgoliaHtmlExtractor();

let input;
let actual;

describe('AlgoliaHTMLExtractor', function() {
  describe('.run', function() {
    it('should load from an HTML string', function() {
      // Given
      input = '<p>foo</p>';

      // When
      actual = AlgoliaHTMLExtractor.run(input);

      // Then
      expect(actual.length).to.eq(1);
    });

    it('should allow overriding of the default css selector of nodes', function() {
      // Given
      input = '<div>foo</div>';

      // When
      actual = AlgoliaHTMLExtractor.run(input, {
        cssSelector: 'div',
      });

      // Then
      expect(actual.length).to.eq(1);
    });

    it('should export the jsdom node', function() {
      // # Given
      input = '<p>foo</p>';

      // # When
      actual = AlgoliaHTMLExtractor.run(input);

      // # Then
      expect(actual[0].node.tagName).to.equal('P');
    });

    it('should remove empty elements', function() {
      // Given
      input = '<p></p>';

      // When
      actual = AlgoliaHTMLExtractor.run(input);

      // Then
      expect(actual.length).to.eq(0);
    });

    it('should add the DOM position to each element', function() {
      // Given
      input = `<p>foo</p>
               <p>bar</p>
               <p>baz</p>`;

      // When
      actual = AlgoliaHTMLExtractor.run(input);

      // Then
      expect(actual[0].customRanking.position).to.eq(0);
      expect(actual[1].customRanking.position).to.eq(1);
      expect(actual[2].customRanking.position).to.eq(2);
    });
  });

  describe('extract_html', function() {
    it('should extract outer html', function() {
      // # Given
      input = '<p>foo</p>';

      // # When
      actual = AlgoliaHTMLExtractor.run(input);

      // # Then
      expect(actual[0].html).to.eq('<p>foo</p>');
    });

    it('should trim content', function() {
      // # Given
      input = `<p>foo</p>
               <blink>irrelevant</blink>`;

      // # When
      actual = AlgoliaHTMLExtractor.run(input);

      // # Then
      expect(actual[0].html).to.eq('<p>foo</p>');
    });

    it('should remove excluded tags', function() {
      // Given
      input = '<p>foo<script src="evil.com" /></p>';

      // When
      actual = AlgoliaHTMLExtractor.run(input, {
        tagsToExclude: 'script',
      });

      // Then
      expect(actual[0].html).to.eq('<p>foo</p>');
    });
  });

  describe('extract_text', function() {
    it('should extract inner text', function() {
      // Given
      input = '<p>foo</p>';

      // When
      actual = AlgoliaHTMLExtractor.run(input);

      // Then
      expect(actual[0].content).to.eq('foo');
    });

    it('should extract UTF8 correctly', function() {
      // Given
      input = '<p>UTF8‽✗✓</p>';

      // When
      actual = AlgoliaHTMLExtractor.run(input);

      // Then
      expect(actual[0].content).to.eq('UTF8‽✗✓');
    });
  });

  // TODO: re-implement this test
  // describe('extract_tag_name', function() {
  //   // subject { current.extract_tag_name(node) }
  //   // describe do
  //   //   let(:node) { double('Node', name: 'P') }
  //   //   it { should eq 'p' }
  //   // }
  // });

  describe('extract_headings', function() {
    it('should extract a simple hierarchy', function() {
      // # Given
      input = `<h1>Foo</h1>
               <p>First paragraph</p>
               <h2>Bar</h2>
               <p>Second paragraph</p>
               <h3>Baz</h3>
               <p>Third paragraph</p>`;

      // When
      actual = AlgoliaHTMLExtractor.run(input);

      // Then
      expect(actual[0].headings).to.have.members(['Foo']);

      expect(actual[1].headings).to.have.members(['Foo', 'Bar']);

      expect(actual[2].headings).to.have.members(['Foo', 'Bar', 'Baz']);
    });

    it('should have an empty array when no headings', function() {
      // Given
      input = '<p>First paragraph</p>';

      // When
      actual = AlgoliaHTMLExtractor.run(input);

      // Then
      expect(actual[0].headings).to.be.empty;
    });

    it('should use inner text of headings', function() {
      // # Given
      // input = '<h1><a href="#">Foo</a><span></span></h1>
      //          <p>First paragraph</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:headings]).to eq ['Foo']
    });

    it('should handle nodes not in any hierarchy', function() {
      // # Given
      // input = '<p>First paragraph</p>
      //          <h1>Foo</h1>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:headings]).to eq []
    });

    it('should handle any number of wrappers', function() {
      // # Given
      // input = '<header>
      //            <h1>Foo</h1>
      //            <p>First paragraph</p>
      //          </header>
      //          <div>
      //            <div>
      //              <div>
      //                <h2>Bar</h2>
      //                <p>Second paragraph</p>
      //                </div>
      //              </div>
      //            <div>
      //              <h3>Baz</h3>
      //              <p>Third paragraph</p>
      //            </div>
      //          </div>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:headings]).to eq ['Foo']
      //
      // expect(actual[1][:headings]).to eq %w[Foo Bar]
      //
      // expect(actual[2][:headings]).to eq %w[Foo Bar Baz]
    });
  });

  describe('extract_anchor', function() {
    it('should get the anchor of parent', function() {
      // # Given
      // input = '<h1 name="anchor">Foo</h1>
      //          <p>First paragraph</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:anchor]).to eq 'anchor'
    });

    it('should get no anchor if none found', function() {
      // # Given
      // input = '<h1>Foo</h1>
      //          <p>First paragraph</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:anchor]).to eq nil
    });

    it('should use the id as anchor if no name set', function() {
      // # Given
      // input = '<h1 id="anchor">Foo</h1>
      //          <p>First paragraph</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:anchor]).to eq 'anchor'
    });

    it('should be set to nil if no name nor id', function() {
      // # Given
      // input = '<h1>Foo</h1>
      //          <p>First paragraph</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:anchor]).to eq nil
    });

    it('should get the anchor of closest parent with an anchor', function() {
      // # Given
      // input = '<h1 name="anchor">Foo</h1>
      //          <p>First paragraph</p>
      //          <h2>Bar</h2>
      //          <p>Second paragraph</p>
      //          <h3 name="subanchor">Baz</h3>
      //          <p>Third paragraph</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:anchor]).to eq 'anchor'
      // expect(actual[1][:anchor]).to eq 'anchor'
      // expect(actual[2][:anchor]).to eq 'subanchor'
    });

    it('should get anchor even if heading not a direct parent', function() {
      // # Given
      // input = '<header>
      //            <h1 name="anchor">Foo</h1>
      //            <p>First paragraph</p>
      //          </header>
      //          <div>
      //            <div>
      //              <div>
      //                <h2>Bar</h2>
      //                <p>Second paragraph</p>
      //              </div>
      //            </div>
      //            <div>
      //              <h3 name="subanchor">Baz</h3>
      //              <p>Third paragraph</p>
      //            </div>
      //          </div>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:anchor]).to eq 'anchor'
      // expect(actual[1][:anchor]).to eq 'anchor'
      // expect(actual[2][:anchor]).to eq 'subanchor'
    });

    it('should get anchor if not directly on the header but inner element', function() {
      // # Given
      // input = '<h1><a name="anchor">Foo</a></h1>
      //          <p>First paragraph</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:anchor]).to eq 'anchor'
    });
  });

  describe('uuid', function() {
    it('should give different uuid if different content', function() {
      // # Given
      // input_a = { content: 'foo' }
      // input_b = { content: 'bar' }
      //
      // # When
      // actual_a = AlgoliaHTMLExtractor.uuid(input_a)
      // actual_b = AlgoliaHTMLExtractor.uuid(input_b)
      //
      // # Then
      // expect(actual_a).not_to eq(actual_b)
    });

    it('should ignore the objectID key', function() {
      // # Given
      // input_a = { content: 'foo', objectID: 'AAA' }
      // input_b = { content: 'foo', objectID: 'BBB' }
      //
      // # When
      // actual_a = AlgoliaHTMLExtractor.uuid(input_a)
      // actual_b = AlgoliaHTMLExtractor.uuid(input_b)
      //
      // # Then
      // expect(actual_a).to eq(actual_b)
    });

    it('should give different uuid if different HTML tag', function() {
      // # Given
      // input_a = '<p>foo</p>'
      // input_b = '<p class="bar">foo</p>'
      //
      // # When
      // actual_a = AlgoliaHTMLExtractor.run(input_a)[0]
      // actual_b = AlgoliaHTMLExtractor.run(input_b)[0]
      //
      // # Then
      // expect(actual_a[:objectID]).not_to eq(actual_b[:objectID])
    });

    it('should give different uuid if different position in page', function() {
      // # Given
      // input_a = '<p>foo</p><p>bar</p>'
      // input_b = '<p>foo</p><p>foo again</p><p>bar</p>'
      //
      // # When
      // actual_a = AlgoliaHTMLExtractor.run(input_a)[1]
      // actual_b = AlgoliaHTMLExtractor.run(input_b)[2]
      //
      // # Then
      // expect(actual_a[:objectID]).not_to eq(actual_b[:objectID])
    });

    it('should give different uuid if different parent header', function() {
      // # Given
      // input_a = '<h1 name="foo">foo</h1><p>bar</p>'
      // input_b = '<h1 name="bar">bar</h1><p>bar</p>'
      //
      // # When
      // actual_a = AlgoliaHTMLExtractor.run(input_a)[0]
      // actual_b = AlgoliaHTMLExtractor.run(input_b)[0]
      //
      // # Then
      // expect(actual_a[:objectID]).not_to eq(actual_b[:objectID])
    });

    it('should always give the same uuid for the same content', function() {
      // # Given
      // input_a = '<h1 name="foo">foo</h1><p>bar</p>'
      // input_b = '<h1 name="foo">foo</h1><p>bar</p>'
      //
      // # When
      // actual_a = AlgoliaHTMLExtractor.run(input_a)[0]
      // actual_b = AlgoliaHTMLExtractor.run(input_b)[0]
      //
      // # Then
      // expect(actual_a[:objectID]).to eq(actual_b[:objectID])
    });
  });

  describe('heading_weight', function() {
    it('should have 100 if no heading', function() {
      // # Given
      // input = '<p>foo</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:custom_ranking][:heading]).to eq 100
    });

    it('should have decreasing value under small headers', function() {
      // # Given
      // input = '<h1 name="one">bar</h1><p>foo</p>
      //          <h2 name="two">bar</h2><p>foo</p>
      //          <h3 name="three">bar</h3><p>foo</p>
      //          <h4 name="four">bar</h4><p>foo</p>
      //          <h5 name="five">bar</h5><p>foo</p>
      //          <h6 name="six">bar</h6><p>foo</p>'
      //
      // # When
      // actual = AlgoliaHTMLExtractor.run(input)
      //
      // # Then
      // expect(actual[0][:custom_ranking][:heading]).to eq 90
      // expect(actual[1][:custom_ranking][:heading]).to eq 80
      // expect(actual[2][:custom_ranking][:heading]).to eq 70
      // expect(actual[3][:custom_ranking][:heading]).to eq 60
      // expect(actual[4][:custom_ranking][:heading]).to eq 50
      // expect(actual[5][:custom_ranking][:heading]).to eq 40
    });
  });
});
