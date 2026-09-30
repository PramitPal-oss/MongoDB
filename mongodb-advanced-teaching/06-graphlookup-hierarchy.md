# 5. Hierarchy with `$graphLookup`

Your category model has:

```text
_id
parentId
ancestorIds[]
level
```

`$graphLookup` recursively follows references.

---

## Get ancestors from a child category

```javascript
db.categories.aggregate([
  { $match: { slug: "category-100" } },
  {
    $graphLookup: {
      from: "categories",
      startWith: "$parentId",
      connectFromField: "parentId",
      connectToField: "_id",
      as: "ancestors",
      depthField: "depth"
    }
  }
])
```

Read it carefully:
1. start with current document's `parentId`
2. find category where `_id` equals it
3. take that matched category's `parentId`
4. repeat

---

## Get descendants from a parent category

Direction reverses:

```javascript
db.categories.aggregate([
  { $match: { slug: "category-0" } },
  {
    $graphLookup: {
      from: "categories",
      startWith: "$_id",
      connectFromField: "_id",
      connectToField: "parentId",
      as: "descendants",
      depthField: "depth",
      maxDepth: 1
    }
  }
])
```

With `maxDepth: 1`, you get depth 0 and depth 1 relative traversal results.

---

## Restrict traversal

```javascript
restrictSearchWithMatch: { status: "ACTIVE" }
```

Useful when inactive/deleted nodes should not participate.

---

## Why store `ancestorIds` if `$graphLookup` exists?

Because precomputed ancestry can make common reads much cheaper.

Find all descendants of parent X:

```javascript
db.categories.find({ ancestorIds: parentId })
```

With an index on `ancestorIds`, that can be much simpler than recursive traversal.

Tradeoff:
- `ancestorIds` speeds reads
- moving a subtree requires updating descendant ancestry
- `$graphLookup` derives relationships dynamically

---

## Sales roll-up for a category tree

Given a parent category:
1. get descendant category IDs
2. include parent ID
3. match products where `categoryIds` overlaps
4. join/unwind order lines or start from orders and match product IDs
5. group revenue

For large-scale analytics, precomputed category ancestry is often preferable.

---

## Cycle danger

A bad hierarchy could accidentally contain a loop:

```text
A.parent = B
B.parent = C
C.parent = A
```

Production systems should validate hierarchy changes at application level because document validators cannot enforce graph acyclicity across multiple documents.

---

## Interview talking points

- adjacency list: each node stores `parentId`
- materialized path: store ancestors/path
- `$graphLookup`: recursive traversal at query time
- precomputed paths trade write complexity for read performance
- recursive analytics should be bounded where possible

# Practice

1. Get all ancestors for a selected category.
2. Get descendants up to two levels.
3. Compare returned ancestors to stored `ancestorIds`.
4. Detect a category whose stored ancestry is inconsistent.
5. Roll up product count or revenue across a subtree.
