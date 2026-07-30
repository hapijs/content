import { describe, expect, it } from 'vitest';

import * as Content from '../src/index.mjs';

describe('import()', () => {
    it('exposes all methods as named imports', () => {
        // 'default' is gone: it was the CJS-interop synthetic default, which a native
        // ESM module namespace does not have. Asserting the exact key set (rather than
        // 'includes') is what catches an accidentally-added or dropped export. Order is
        // export-declaration order, not alphabetical.
        expect(Object.keys(Content)).toEqual(['type', 'disposition']);
    });
});
