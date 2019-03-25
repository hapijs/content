# content

HTTP Content-* headers parsing.

[![Build Status](https://travis-ci.org/hapijs/content.svg?branch=v3-commercial)](https://travis-ci.org/hapijs/content)

## License

This version of the package requires a commercial license. You may not use, copy, or distribute it without first acquiring a commercial license from Sideway Inc. Using this software without a license is a violation of US and international law. To obtain a license, please contact [sales@sideway.com](mailto:sales@sideway.com). The open source version of this package can be found [here](https://github.com/hapijs/content).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [`type(header)`](#typeheader)
    - [`disposition(header)`](#dispositionheader)

## Installation

Install via [NPM](https://www.npmjs.org).

```
$ npm install content
```

## Usage

**content** allows to parse HTTP `Content-*` headers, currently based on the rules established in both [RFC 7231 Section 3.1.1.1](https://tools.ietf.org/html/rfc7231#section-3.1.1.1) and [RFC 6266 Section 4.1](http://tools.ietf.org/html/rfc6266#section-4.1).

### `type(header)`

Generates an object containing the associated mime-type and the boundary (if specified).

```js
Content.type('application/json; some=property; and="another"');
// { mime: 'application/json' }

Content.type('application/json; boundary=asdf');
// { mime: 'application/json', boundary: 'asdf' }
```

If the header is invalid (malformed) or missing required data, such as a `multipart/form-data` header missing its `boundary`, it returns an HTTP `Bad Request` error.

### `disposition(header)`

Generates an object containing the details related to the `Content-Disposition` header for the `form-data` content type with support for `utf8` encoding.

```js
Content.disposition('form-data; name="file"; filename=file.jpg');
// { name: 'file', filename: 'file.jpg' }

Content.disposition('form-data; name="file"; filename*=utf-8\'en\'with%20space');
// { name: 'file', filename: 'with space' }
```

If the header is invalid (malformed, invalid or missing properties) or is empty/missing, it returns an explanatory error.

