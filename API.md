
## Usage

**content** allows to parse HTTP `Content-*` headers, currently based on the rules established in both [RFC 7231 Section 3.1.1.1](https://tools.ietf.org/html/rfc7231#section-3.1.1.1) and [RFC 6266 Section 4.1](http://tools.ietf.org/html/rfc6266#section-4.1).

### `type(header)`

Generates an object containing the associated mime-type, charset and the boundary (if specified).

```js
Content.type('application/json; some=property; and="another"');
// { mime: 'application/json' }

Content.type('text/html; charset=utf-8')
// { mime: 'text/html', charset: 'utf-8' }

Content.type('multipart/form-data; boundary=asdf');
// { mime: 'multipart/form-data', boundary: 'asdf' }
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