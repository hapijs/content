'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Content = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('type()', () => {

    it('parses header', () => {

        const type = Content.type('application/json; some=property; and="another"');
        expect(type.mime).to.equal('application/json');
        expect(type.boundary).to.not.exist();
    });

    it('parses header (only type)', () => {

        const type = Content.type('application/json');
        expect(type.mime).to.equal('application/json');
        expect(type.boundary).to.not.exist();
    });

    it('parses header (boundary without multipart)', () => {

        const type = Content.type('application/json; boundary=abcdefghijklm');
        expect(type.mime).to.equal('application/json');
        expect(type.boundary).to.not.exist();
    });

    it('parses header (boundary)', () => {

        const type = Content.type('multipart/form-data; boundary=abcdefghijklm');
        expect(type.mime).to.equal('multipart/form-data');
        expect(type.boundary).to.equal('abcdefghijklm');
    });

    it('parses header (quoted boundary)', () => {

        const type = Content.type('multipart/form-data; boundary="abcdefghijklm"');
        expect(type.mime).to.equal('multipart/form-data');
        expect(type.boundary).to.equal('abcdefghijklm');
    });

    it('parses header (charset)', () => {

        const type = Content.type('application/json; charset=utf-8');
        expect(type.mime).to.equal('application/json');
        expect(type.charset).to.equal('utf-8');
    });

    it('parses header (quoted charset)', () => {

        const type = Content.type('application/json; charset="iso-8859-1"');
        expect(type.mime).to.equal('application/json');
        expect(type.charset).to.equal('iso-8859-1');
    });

    it('parses header (charset and boundary)', () => {

        const type = Content.type('multipart/form-data; charset=utf-8; boundary=abcdefghijklm');
        expect(type.mime).to.equal('multipart/form-data');
        expect(type.charset).to.equal('utf-8');
        expect(type.boundary).to.equal('abcdefghijklm');
    });

    it('parses header (boundary and charset)', () => {

        const type = Content.type('multipart/form-data; boundary=abcdefghijklm; charset=utf-8');
        expect(type.mime).to.equal('multipart/form-data');
        expect(type.charset).to.equal('utf-8');
        expect(type.boundary).to.equal('abcdefghijklm');
    });

    it('parses header (uppercase)', () => {

        const type = Content.type('TEXT/HTML; CHARSET=EUC-KR');
        expect(type.mime).to.equal('text/html');
        expect(type.charset).to.equal('euc-kr');
    });

    it('handles large number of OWS', () => {

        const now = Date.now();
        Content.type(`l/h ; ${new Array(80000).join(' ')}"`);
        expect(Date.now() - now).to.be.below(100);
    });

    it('errors on missing header', () => {

        expect(() => Content.type()).to.throw('Invalid content-type header');
    });

    it('errors on invalid header', () => {

        expect(() => Content.type('application; some')).to.throw('Invalid content-type header');
    });

    it('errors on multipart missing boundary', () => {

        expect(() => Content.type('multipart/form-data')).to.throw('Invalid content-type header: multipart missing boundary');
    });

    it('errors on multipart missing boundary (other params)', () => {

        expect(() => Content.type('multipart/form-data; some=thing')).to.throw('Invalid content-type header: multipart missing boundary');
    });

    it('handles multiple boundary params', () => {

        const header = `multipart/form-data ${new Array(80000).join(';boundary=#')}`;
        const now = Date.now();
        Content.type(header);
        expect(Date.now() - now).to.be.below(100);
    });

    it('handles multiple charset params', () => {

        const header = `text/plain ${new Array(80000).join(';charset=utf-8')}`;
        const now = Date.now();
        Content.type(header);
        expect(Date.now() - now).to.be.below(100);
    });

    it('handles trailing newline in content-type without backtracking', () => {

        const header = 'a/b' + 'c'.repeat(50000) + '\n';
        const now = Date.now();
        expect(() => Content.type(header)).to.throw('Invalid content-type header');
        expect(Date.now() - now).to.be.below(100);
    });

    it('errors on content-type with embedded newline', () => {

        expect(() => Content.type('application/json\n; charset=utf-8')).to.throw('Invalid content-type header');
    });
});

describe('disposition()', () => {

    it('parses header', () => {

        const header = 'form-data; name="file"; filename=file.jpg';

        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'file.jpg' });
    });

    it('parses header (empty filename)', () => {

        const header = 'form-data; name="file"; filename=""';

        expect(Content.disposition(header)).to.equal({ name: 'file', filename: '' });
    });

    it('parses header (filename with quotes)', () => {

        const header = 'form-data; name="file"; filename="fi\'l\'e.jpg"';

        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'fi\'l\'e.jpg' });
    });

    it('handles language filename', () => {

        const header = 'form-data; name="file"; filename*=utf-8\'en\'with%20space';

        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'with space' });
    });

    it('handles large number of OWS', () => {

        const now = Date.now();
        const header = `form-data; x; ${new Array(5000).join(' ')};`;
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header missing name parameter');
        expect(Date.now() - now).to.be.below(100);
    });

    it('handles trailing newline in content-disposition without backtracking', () => {

        const header = 'form-data;' + ' '.repeat(50000) + '\n';
        const now = Date.now();
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header format');
        expect(Date.now() - now).to.be.below(100);
    });

    it('errors on invalid language filename', () => {

        const header = 'form-data; name="file"; filename*=steve';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header format includes invalid parameters');
    });

    it('errors on invalid format', () => {

        const header = 'steve';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header format');
    });

    it('errors on missing header', () => {

        expect(() => Content.disposition('')).to.throw('Missing content-disposition header');
    });

    it('errors on missing parameters', () => {

        const header = 'form-data';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header missing parameters');
    });

    it('errors on missing language value', () => {

        const header = 'form-data; name="file"; filename*=';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header format includes invalid parameters');
    });

    it('errors on invalid percent encoded language value', () => {

        const header = 'form-data; name="file"; filename*=utf-8\'en\'with%vxspace';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header format includes invalid parameters');
    });

    it('errors on missing name', () => {

        const header = 'form-data; filename=x';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header missing name parameter');
    });

    it('errors on __proto__ param', () => {

        const header = 'form-data; name="file"; filename=file.jpg; __proto__=x';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header format includes invalid parameters');
    });

    it('errors on __proto__ name param value', () => {

        const header = 'form-data; name="__proto__"; filename=file.jpg';
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header format includes invalid parameters');
    });

    it('handles ReDoS exploit (polynomial backtracking via crafted commas and spaces)', () => {

        const N = 4000;
        const header = 'form-data;' + '=' + ','.repeat(N) + '"=' + ' '.repeat(N) + '= "';
        const now = Date.now();
        expect(() => Content.disposition(header)).to.throw('Invalid content-disposition header missing name parameter');
        expect(Date.now() - now).to.be.below(100);
    });

    it('handles large number of spaces around equals', () => {

        const now = Date.now();
        const header = `form-data; name${' '.repeat(10000)}=${' '.repeat(10000)}file`;
        Content.disposition(header);
        expect(Date.now() - now).to.be.below(100);
    });

    it('handles large number of parameters', () => {

        const params = Array.from({ length: 1000 }, (_, i) => `p${i}=v${i}`).join('; ');
        const header = `form-data; name="file"; ${params}`;
        const now = Date.now();
        Content.disposition(header);
        expect(Date.now() - now).to.be.below(100);
    });

    it('parses header with spaces around equals', () => {

        const header = 'form-data; name = "file" ; filename = file.jpg';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'file.jpg' });
    });

    it('parses header with empty token value', () => {

        const header = 'form-data; name="file"; filename=';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: '' });
    });

    it('parses header with multiple parameters', () => {

        const header = 'form-data; name="file"; filename="test.jpg"; size=1234';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg', size: '1234' });
    });

    it('parses header with ext-value and regular params', () => {

        const header = 'form-data; name="file"; filename*=utf-8\'en\'my%20file.jpg; size=999';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'my file.jpg', size: '999' });
    });

    it('parses header with no trailing semicolon', () => {

        const header = 'form-data; name="file"; filename=test.jpg';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg' });
    });

    it('parses header with trailing semicolon', () => {

        const header = 'form-data; name="file"; filename=test.jpg;';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg' });
    });

    it('parses header with extra whitespace between params', () => {

        const header = 'form-data;   name="file"  ;   filename=test.jpg  ;  size=100';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg', size: '100' });
    });

    it('parses header with hyphenated parameter name', () => {

        const header = 'form-data; name="file"; file-name=test.jpg';
        expect(Content.disposition(header)).to.equal({ name: 'file', 'file-name': 'test.jpg' });
    });

    it('parses header with dotted parameter name', () => {

        const header = 'form-data; name="file"; file.name=test.jpg';
        expect(Content.disposition(header)).to.equal({ name: 'file', 'file.name': 'test.jpg' });
    });

    it('parses header with ext-value without language tag', () => {

        const header = 'form-data; name="file"; filename*=utf-8\'\'my%20file.jpg';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'my file.jpg' });
    });

    it('parses params even when followed by non-param garbage', () => {

        const header = 'form-data; name="file"; filename=test.jpg GARBAGE';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg' });
    });

    it('parses params when a key without value follows', () => {

        const header = 'form-data; name="file"; filename=test.jpg; notaparam';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg' });
    });

    it('parses header with trailing whitespace after last param', () => {

        const header = 'form-data; name="file"; filename=test.jpg  ';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg' });
    });

    it('parses header with trailing whitespace after last quoted param', () => {

        const header = 'form-data; name="file"; filename="test.jpg"  ';
        expect(Content.disposition(header)).to.equal({ name: 'file', filename: 'test.jpg' });
    });
});
