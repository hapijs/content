/** The parsed parts of a `Content-Type` header. */
export interface ContentType {
    /** The lowercased media type, e.g. `'application/json'`. */
    mime: string;

    /** The lowercased `charset` parameter, when the header carries one. */
    charset?: string;

    /**
     * The `boundary` parameter. Always present for a `multipart/*` mime — `type()` throws when a multipart header omits
     * it — and absent for every other mime.
     */
    boundary?: string;
}

/**
 * Parses a `Content-Type` header per RFC 7231 Section 3.1.1.1.
 *
 * @param header - The raw header value.
 * @returns The mime type, plus `charset` and `boundary` when present.
 * @throws A Boom `400` error when the header is missing, malformed, carries a duplicate `charset`/`boundary` parameter,
 *   or is a `multipart/*` type with no boundary.
 */
export function type(header: string): ContentType;

/** The parsed parameters of a `form-data` `Content-Disposition` header. */
export interface ContentDisposition {
    /** The `name` parameter. Always present — `disposition()` throws without it. */
    name: string;

    /** The `filename` parameter, percent-decoded when supplied as an RFC 5987 ext-value. */
    filename?: string;

    /** Any other parameter present on the header, keyed by its name. */
    [key: string]: string | undefined;
}

/**
 * Parses a `form-data` `Content-Disposition` header per RFC 6266 Section 4.1, including RFC 5987 ext-values
 * (`filename*=utf-8''…`).
 *
 * @param header - The raw header value.
 * @returns The header parameters, always including `name`.
 * @throws A Boom `400` error when the header is missing, is not `form-data`, has no parameters, repeats a parameter, or
 *   omits `name`.
 */
export function disposition(header: string): ContentDisposition;
