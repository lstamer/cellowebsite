# Blog Inline Image Audit

Use this audit whenever a post image behaves unexpectedly or before a bulk publish in Sanity.

## Goal

Find blog posts that contain Portable Text inline image blocks without a usable `asset._ref`.

## Run In Sanity Vision

```groq
*[
  _type == "post" &&
  count(body[_type == "image" && !defined(asset._ref)]) > 0
] | order(_updatedAt desc) {
  _id,
  title,
  "slug": slug.current,
  "invalidInlineImageCount": count(body[_type == "image" && !defined(asset._ref)]),
  "invalidInlineImages": body[_type == "image" && !defined(asset._ref)]{
    _key,
    alt
  }
}
```

## What To Do With Results

1. Open each returned post in Sanity Studio.
2. Find the inline image block by `_key` or nearby content.
3. Re-upload the missing image asset or remove the broken block.
4. Republish the post after the validation warning clears.

## Notes

- The site now degrades gracefully if one of these blocks slips through.
- The schema also prevents publishing new inline image blocks without an uploaded asset.
