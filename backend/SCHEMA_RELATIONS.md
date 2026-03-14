# Suraksha Setu Schema Relations

This document describes the current persisted MongoDB schema as implemented in `backend/models/*.js` and how those collections are related in the backend code today.

It is intentionally based on the live model files and controller behavior, not the older high-level documentation.

## Collections At A Glance

The application currently persists 4 main collections:

1. `users`
2. `sos`
3. `alerts`
4. `resources`

High-level relationship map:

```text
User
├─< SOS.userId
├─< Alert.createdBy
├─< Alert.readBy[]
└─< Resource.createdBy

Alert
└─ no child collections, but is filtered by user role and optionally by user location

Resource
└─ no child collections, but is queried geospatially by its own location

SOS
└─ no child collections, but is populated with User data for admin and detail views
```

## 1. User

Model source: `backend/models/User.js`

### Shape

```js
{
  name: String,
  email: String,
  password: String,
  phone: String,
  role: 'citizen' | 'admin',
  location: {
    type: 'Point',
    coordinates: [lng, lat],
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  createdAt: Date,
  isActive: Boolean
}
```

### Important field behavior

- `email` is unique.
- `password` is stored hashed via a `pre('save')` hook using `bcrypt`.
- `role` is a simple enum with only two values: `citizen` and `admin`.
- `location` is the canonical GeoJSON location object.
- If `location.coordinates` is malformed, validation drops the location instead of persisting invalid GeoJSON.

### Indexes

- `location`: `2dsphere`

### Outbound relationships

`User` is the parent entity for several references:

- One `User` can create many `SOS` documents through `SOS.userId`.
- One `User` can create many `Alert` documents through `Alert.createdBy`.
- One `User` can be present in many `Alert.readBy` arrays.
- One `User` can create many `Resource` documents through `Resource.createdBy`.

### Authentication role in the domain model

This collection is also the authorization anchor:

- `role === 'admin'` unlocks admin-only routes.
- `role === 'citizen'` is the default for normal users.

There is no separate permissions collection or RBAC join table. Authorization is role-flag based.

## 2. SOS

Model source: `backend/models/SOS.js`

### Shape

```js
{
  userId: ObjectId -> User,
  type: 'flood' | 'fire' | 'earthquake' | 'medical' | 'accident' | 'other',
  severity: 'low' | 'medium' | 'high' | 'critical',
  status: 'pending' | 'acknowledged' | 'in-progress' | 'resolved',
  description: String,
  location: {
    type: 'Point',
    coordinates: [lng, lat],
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  contactNumber: String,
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date,
  adminNotes: String
}
```

### Relationship to User

- `SOS.userId` is a required `ObjectId` reference to `User`.
- Cardinality: one `User` to many `SOS`.
- This is the main ownership link for emergency reports.

### Runtime usage of that relationship

The relation is used in three ways:

1. Ownership scoping
   - Citizens only list their own SOS records.
   - Admins can list all SOS records.

2. Detail authorization
   - Citizens can view an SOS only if they own it.
   - Admins can view any SOS.

3. Population for UI display
   - Admin dashboard and admin list views populate `userId` with `name`, `email`, and `phone`.

### Lifecycle behavior

- `updatedAt` is refreshed on every save via `pre('save')`.
- When `status` becomes `resolved`, `resolvedAt` is auto-set if not already present.

### Notes about denormalization

The SOS record does not snapshot reporter name/email/phone.

That means UI screens depend on `populate('userId')` to render reporter info. If the user is later deleted, the reference becomes orphaned and `populate()` returns `null`.

This is already a real behavior in the app and is the reason the frontend needed null-safe guards.

## 3. Alert

Model source: `backend/models/Alert.js`

### Shape

```js
{
  title: String,
  message: String,
  severity: 'info' | 'warning' | 'danger' | 'critical',
  type: 'weather' | 'disaster' | 'health' | 'security' | 'general',
  targetAudience: 'all' | 'location-based' | 'admin-only',
  location: {
    type: 'Point',
    coordinates: [lng, lat],
    radius: Number,
    city: String,
    state: String
  },
  isActive: Boolean,
  createdBy: ObjectId -> User,
  createdAt: Date,
  expiresAt: Date,
  readBy: [ObjectId -> User]
}
```

### Relationships to User

`Alert` has two separate relations to `User`:

1. `createdBy`
   - Required single reference to the admin user who created the alert.
   - Cardinality: one `User` to many created `Alert` records.

2. `readBy`
   - Array of `User` references.
   - Cardinality: many-to-many in effect.
   - One alert can be read by many users, and one user can read many alerts.

### Runtime usage of those relationships

- `createdBy` is populated in alert listing and history queries for display.
- `readBy` is appended to when a user marks an alert as read.
- The `markAsRead(userId)` model method avoids duplicate entries by comparing stringified IDs.

### Geospatial behavior

`Alert.location` is optional and only meaningful for `targetAudience === 'location-based'`.

When location is present:

- It is stored as GeoJSON `Point`.
- The schema has a `2dsphere` index on `location`.
- `getAlerts` uses `$near` against the logged-in user's `location.coordinates`.
- The current query uses a fixed 50 km distance in the controller, not the stored `location.radius` for retrieval filtering.

### Expiry behavior

- `expiresAt` defaults to 24 hours from creation time.
- There is an index on `expiresAt`.
- The code filters alerts with `expiresAt > now`.
- This is not a TTL delete setup; expired alerts are filtered out, not automatically removed.

## 4. Resource

Model source: `backend/models/Resource.js`

### Shape

```js
{
  name: String,
  type: 'hospital' | 'shelter' | 'fire-station' | 'police-station' | 'community-center' | 'relief-camp',
  location: {
    type: 'Point',
    coordinates: [lng, lat],
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  services: [String],
  capacity: Number,
  currentOccupancy: Number,
  operatingHours: String,
  isActive: Boolean,
  createdBy: ObjectId -> User,
  createdAt: Date,
  updatedAt: Date
}
```

### Relationship to User

- `Resource.createdBy` is an optional `ObjectId` reference to `User`.
- In practice, resources are created only from admin-protected routes, so `createdBy` is typically the current admin.
- Cardinality: one `User` to many `Resource` documents.

### Runtime usage of that relationship

- `createdBy` is populated with `name` in resource list/detail queries.
- The field is informational; there is no ownership enforcement for resources after creation.

### Geospatial and search behavior

`Resource.location` is a first-class GeoJSON object.

Indexes:

- `location`: `2dsphere`
- text index on:
  - `name`
  - `location.address`
  - `services`

Runtime query patterns:

- resources can be found near a GeoJSON coordinate pair using `$near`
- resources can be searched textually using Mongo text search
- resources are soft-deleted by setting `isActive = false`

### Capacity semantics

- `capacity` is optional
- `currentOccupancy` defaults to `0`
- `getAvailableCapacity()` is a convenience model method returning `capacity - currentOccupancy`

This is computed at runtime; it is not stored as its own field.

## Relationship Summary Table

| Parent | Child Field | Relationship | Required | Notes |
|---|---|---:|---:|---|
| `User` | `SOS.userId` | 1 -> many | Yes | Ownership of emergency reports |
| `User` | `Alert.createdBy` | 1 -> many | Yes | Alert creator, effectively admin-authored |
| `User` | `Alert.readBy[]` | many <-> many | No | User read state for alerts |
| `User` | `Resource.createdBy` | 1 -> many | No | Informational creator link |

## Query-Level Relation Behavior

The main relation-aware query patterns in the backend are:

### SOS

- `listSOS`
  - admin sees all
  - citizen sees only rows with `userId = req.user._id`
- `viewSOS`
  - populates `userId`
  - authorizes owner-or-admin access
- admin dashboard
  - populates pending SOS with reporter data

### Alerts

- `getAlerts`
  - admins can fetch broader alert data
  - non-admin users are limited to `all` and `location-based`
  - location-based matching depends on the current user's stored `location`
- `markAsRead`
  - mutates the `readBy` relation

### Resources

- `listResources`
  - can use geospatial proximity against resource `location`
  - can populate `createdBy`

## Referential Integrity: Current Reality

MongoDB is not enforcing relational integrity across these references, and the app does not implement cascading deletes.

### What happens today if a user is deleted

- `SOS.userId` may point to a non-existent user
- `Alert.createdBy` may point to a non-existent user
- `Alert.readBy[]` may contain dead user IDs
- `Resource.createdBy` may point to a non-existent user

When the backend later calls `populate()` on those fields, missing refs become `null`.

This is not theoretical; the frontend already hit this with orphaned `SOS.userId` after user deletion.

### There is currently no:

- cascade delete
- reference cleanup job
- snapshotting of related user display data
- schema-level validation that the referenced user still exists on updates

## Soft Delete vs Hard Delete

Not all entities use the same deletion semantics.

### Users

- effectively hard-deleted when removed from the collection
- references remain in child collections unless cleaned manually

### Resources

- soft delete via `isActive = false`
- inactive resources are hidden from normal list/detail responses

### Alerts

- soft deactivate via `isActive = false`
- also time-filtered by `expiresAt`

### SOS

- not soft-deleted in current implementation
- status is used for workflow, not deletion

## Geo Fields And Their Purpose

There are 3 GeoJSON location fields in the current schema:

### `User.location`

- GeoJSON `Point`
- supports geospatial indexing and location-aware user queries

### `SOS.location`

- GeoJSON `Point`
- indexed geospatially
- stored as part of the report payload

### `Alert.location`

- GeoJSON `Point`
- optional
- used for location-based alert delivery queries

### `Resource.location`

- GeoJSON `Point`
- used for nearby resource lookup

## Current Schema Caveats

These are important if you are planning migrations or additional features.

1. Existing `backend/DOCUMENTATION.md` model descriptions are partially outdated and do not exactly match the live models.
2. Alert delivery currently mixes schema radius storage with controller-side fixed-distance filtering.
3. Deleting users can orphan references in multiple collections.
4. `Resource.createdBy` is optional in the schema even though admin-created flows usually fill it.

## Recommended Next Documentation/Schema Work

If you want to tighten this data model, the next practical improvements would be:

1. add cascade/cleanup handling for user deletions
2. decide whether `SOS` should snapshot reporter details
3. unify user location storage around one canonical representation
4. make alert location filtering semantics match the stored `radius`
5. update the older `backend/DOCUMENTATION.md` model section to match this file
