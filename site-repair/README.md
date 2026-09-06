# Local-to-hosted HTML repair

An original, fictional demonstration by Pierce O'Donnell. It is not a client repair, an actual Excel export, or a diagnosis of anyone's website. Three deliberately introduced reference problems illustrate issues that can surface when a folder is uploaded to a host.

## What changed

Only three references in `index.html` change between `before/` and `fixed/`:

| Before | Fixed | Reason |
| --- | --- | --- |
| `Assets/site.css` | `assets/site.css` | Matches the exact folder case. A case-insensitive local environment can hide this mismatch. |
| `file:///C:/sample/mark.svg` | `assets/mark.svg` | Packages the image with the website rather than depending on a computer-local file. The before path is illustrative, not a real workstation path. |
| `details.htm#delivery` | `details.html#delivery` | Uses the file that actually exists and keeps the correct section anchor. |

The words, page structure, styling, SVG and details page remain unchanged. There is no redesign, tracking, form submission, external service, or payment collection.

## Run the evidence

Requires Python 3.10 or later, standard library only. From this extracted folder:

```text
python audit.py before
python audit.py fixed
python -m unittest -v
```

The first command intentionally exits 1 because it finds the three planted problems. The second exits 0. Both print JSON. The regression suite also serves the fixed sample through a temporary, case-sensitive, loopback-only HTTP server at both `/` and `/client-preview/`, requests the HTML-linked files, and checks their content types. It does not access the internet and closes the server afterward. A case-sensitive fixture matters because a Windows filesystem could otherwise hide the incorrect case.

`verification.json`, `before-audit.json` and `fixed-audit.json` contain the recorded results from the included sample. Rerun the tests to verify them yourself.

## Try or upload the corrected site

To serve the corrected example locally:

```text
python -m http.server 8000 --bind 127.0.0.1 --directory fixed
```

Open `http://127.0.0.1:8000/`. Stop the server when finished. For a host, upload the **contents** of `fixed/` together to a new preview directory, preserving exact filenames and the `assets/` folder. Its document-relative paths also work when that preview directory is nested. No dependencies or build step are required. This sample has not been tested against a particular customer's hosting or cPanel account.

## Audit scope and limits

The read-only auditor inspects HTML `href`/`src` attributes on anchors, stylesheet links, images, scripts, iframes and source tags, plus HTML `id` anchors. It uses exact case for included filenames, reports missing paths and computer-local references, flags domain-root paths for subfolder review, and refuses folders containing symlinks. The small-sample limits are 1,000 files and 2 MB per HTML file. HTML must use UTF-8.

It **does not** execute JavaScript, render a browser, validate HTML conformance, test forms, inspect CSS imports or `url()`, evaluate `srcset`, follow external URLs, validate server-side routes, or prove security/accessibility/performance. Non-file URL schemes are reported as not checked. A `<base>` element is flagged for manual review. `ok` means the included reference resolved under these rules, not that the whole website has passed a complete audit.

For a real repair, the first step is to inspect the supplied HTML plus its supporting folder and compare the local and hosted behavior. The necessary fix depends on those files and the host configuration.
