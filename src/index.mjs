import * as Boom from '@hapi/boom';

/*
    RFC 7231 Section 3.1.1.1

    media-type = type "/" subtype *( OWS ";" OWS parameter )
    type       = token
    subtype    = token
    parameter  = token "=" ( token / quoted-string )
*/

//                         1: type/subtype                                           2: params
const contentTypeRegex = /^([A-Za-z0-9!#$%&'*+.^_`|~-]+\/[A-Za-z0-9!#$%&'*+.^_`|~-]+)([ \t;][^\r\n]*)?$/;

//                                         1: "b"   2: b
const charsetParamRegex = /;\s*charset=(?:"([^"]+)"|([^;"\s]+))/i;

//                                           1: "b"   2: b
const boundaryParamRegex = /;\s*boundary=(?:"([^"]+)"|([^;"\s]+))/i;

export function type(header) {
    if (!header) {
        throw Boom.badRequest('Invalid content-type header');
    }

    const match = header.match(contentTypeRegex);
    if (!match) {
        throw Boom.badRequest('Invalid content-type header');
    }

    const result = {
        mime: match[1].toLowerCase(),
    };

    const params = match[2];
    if (params) {
        const param = params.match(charsetParamRegex);
        if (param) {
            result.charset = (param[1] || param[2]).toLowerCase();

            if (charsetParamRegex.test(params.slice(param.index + param[0].length))) {
                throw Boom.badRequest('Invalid content-type header: duplicate parameter');
            }
        }
    }

    if (result.mime.indexOf('multipart/') === 0) {
        if (params) {
            const param = params.match(boundaryParamRegex);
            if (param) {
                result.boundary = param[1] || param[2];

                if (boundaryParamRegex.test(params.slice(param.index + param[0].length))) {
                    throw Boom.badRequest('Invalid content-type header: duplicate parameter');
                }
            }
        }

        if (!result.boundary) {
            throw Boom.badRequest('Invalid content-type header: multipart missing boundary');
        }
    }

    return result;
}

/*
    RFC 6266 Section 4.1 (http://tools.ietf.org/html/rfc6266#section-4.1)

    content-disposition = "Content-Disposition" ":" disposition-type *( ";" disposition-parm )
    disposition-type    = "inline" | "attachment" | token                                           ; case-insensitive
    disposition-parm    = filename-parm | token [ "*" ] "=" ( token | quoted-string | ext-value)    ; ext-value defined in [RFC5987], Section 3.2

    Content-Disposition header field values with multiple instances of the same parameter name are invalid.

    Note that due to the rules for implied linear whitespace (Section 2.1 of [RFC2616]), OPTIONAL whitespace
    can appear between words (token or quoted-string) and separator characters.

    Furthermore, note that the format used for ext-value allows specifying a natural language (e.g., "en"); this is of limited use
    for filenames and is likely to be ignored by recipients.
*/

const contentDispositionRegex = /^\s*form-data\s*(?:;\s*(\S.*))?$/i;

//                                    1: name     2: *            3: ext-value                      4: quoted  5: token
const contentDispositionParamRegex =
    /([^\=\*\s]+)(\*)?\s*\=\s*(?:([^;'"\s]+\'[\w-]*\'[^;\s]+)|(?:\"([^"]*)\")|([^;\s]*))/g;

export function disposition(header) {
    if (!header) {
        throw Boom.badRequest('Missing content-disposition header');
    }

    const match = header.match(contentDispositionRegex);
    if (!match) {
        throw Boom.badRequest('Invalid content-disposition header format');
    }

    const parameters = match[1];
    if (!parameters) {
        throw Boom.badRequest('Invalid content-disposition header missing parameters');
    }

    const result = {};
    const extKeys = new Set();
    parameters.replace(contentDispositionParamRegex, ($0, $1, $2, $3, $4, $5) => {
        if ($1 === '__proto__') {
            throw Boom.badRequest('Invalid content-disposition header format includes invalid parameters');
        }

        if (result[$1] !== undefined) {
            if ($2 && !extKeys.has($1)) {
                // ext-value overriding regular value - allowed per RFC 6266 Section 4.3
            } else if (!$2 && extKeys.has($1)) {
                // Regular value after ext-value - ignore (keep ext-value)
                return;
            } else {
                throw Boom.badRequest('Invalid content-disposition header format includes invalid parameters');
            }
        }

        if ($2) {
            extKeys.add($1);
        }

        let value;

        if ($2) {
            if (!$3) {
                throw Boom.badRequest('Invalid content-disposition header format includes invalid parameters');
            }

            try {
                value = decodeURIComponent($3.slice($3.indexOf("'", $3.indexOf("'") + 1) + 1));
            } catch {
                throw Boom.badRequest('Invalid content-disposition header format includes invalid parameters');
            }
        } else {
            value = $4 || $5 || '';
        }

        if ($1 === 'name' && value === '__proto__') {
            throw Boom.badRequest('Invalid content-disposition header format includes invalid parameters');
        }

        result[$1] = value;
    });

    if (!result.name) {
        throw Boom.badRequest('Invalid content-disposition header missing name parameter');
    }

    return result;
}
