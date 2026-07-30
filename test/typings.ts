import { describe, expectTypeOf, it } from 'vitest';

import * as Content from '../src/index.mjs';

import type { ContentDisposition, ContentType } from '../src/index.d.mts';

describe('typings', () => {
    it('type() surface compiles', () => {
        const parsed = Content.type('multipart/form-data; charset=utf-8; boundary=abc');

        expectTypeOf(parsed).toEqualTypeOf<ContentType>();
        expectTypeOf(parsed.mime).toBeString();
        expectTypeOf(parsed.charset).toEqualTypeOf<string | undefined>();
        expectTypeOf(parsed.boundary).toEqualTypeOf<string | undefined>();
    });

    it('disposition() surface compiles', () => {
        const parsed = Content.disposition('form-data; name="file"; filename=file.jpg');

        expectTypeOf(parsed).toEqualTypeOf<ContentDisposition>();
        expectTypeOf(parsed.name).toBeString();
        expectTypeOf(parsed.filename).toEqualTypeOf<string | undefined>();

        // Arbitrary parameters come back off the index signature.
        expectTypeOf(parsed.size).toEqualTypeOf<string | undefined>();
    });

    it('invalid calls rejected', () => {
        // The @ts-expect-error directives are the assertion; vitest still executes these
        // files, so wrap the calls — a missing/invalid header throws at runtime.
        try {
            // @ts-expect-error header is required
            Content.type();
            // @ts-expect-error header must be a string
            Content.disposition(42);
        } catch {}
    });
});
